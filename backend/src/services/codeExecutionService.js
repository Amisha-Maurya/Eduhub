/**
 * Code Execution Service
 * Supports: Python, MicroPython, C/C++, Arduino
 * Uses Docker sandboxing for safe server-side execution
 * Also handles real hardware flashing via WebSerial/SerialPort
 */

'use strict';

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Execution limits
const LIMITS = {
  python: { timeout: 10000, maxOutput: 50000, memory: '128m' },
  micropython: { timeout: 5000, maxOutput: 10000, memory: '32m' },
  c: { timeout: 15000, maxOutput: 50000, memory: '256m' },
  cpp: { timeout: 15000, maxOutput: 50000, memory: '256m' },
  arduino: { timeout: 30000, maxOutput: 10000, memory: '256m' }, // Compile only
};

// Language → Docker image mapping
const DOCKER_IMAGES = {
  python: 'educode/python-sandbox:3.11',
  micropython: 'educode/micropython-sandbox:1.21',
  c: 'educode/gcc-sandbox:13',
  cpp: 'educode/gcc-sandbox:13',
  arduino: 'educode/arduino-cli:latest',
};

class CodeExecutionService {
  /**
   * Execute code in a sandboxed Docker container
   * @param {string} code - Source code to execute
   * @param {string} language - Programming language
   * @param {Object} options - Execution options
   * @returns {Promise<ExecutionResult>}
   */
  async execute(code, language, options = {}) {
    const execId = uuidv4();
    const tempDir = path.join(os.tmpdir(), 'educode', execId);

    logger.info(`[Execute] ${language} code, execId: ${execId}`);

    try {
      await fs.mkdir(tempDir, { recursive: true });

      const filename = this.getFilename(language);
      const filePath = path.join(tempDir, filename);
      await fs.writeFile(filePath, code, 'utf8');

      const limits = { ...LIMITS[language], ...options.limits };

      let result;
      if (process.env.USE_DOCKER_SANDBOX === 'true') {
        result = await this.executeInDocker(language, tempDir, filename, limits, options);
      } else {
        result = await this.executeLocally(code, language, limits, options);
      }

      return {
        success: result.exitCode === 0,
        output: this.sanitizeOutput(result.stdout),
        errors: this.sanitizeOutput(result.stderr),
        exitCode: result.exitCode,
        executionTime: result.executionTime,
        execId,
        language,
      };

    } catch (error) {
      logger.error(`[Execute] Error for execId ${execId}:`, error);
      return {
        success: false,
        output: '',
        errors: error.message,
        exitCode: -1,
        executionTime: 0,
        execId,
        language,
      };
    } finally {
      // Cleanup temp files
      fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  /**
   * Execute in Docker sandbox (production)
   */
  async executeInDocker(language, tempDir, filename, limits, options) {
    const image = DOCKER_IMAGES[language];
    if (!image) throw new Error(`No Docker image for language: ${language}`);

    const cmd = this.buildDockerCommand(language, image, tempDir, filename, limits);

    return new Promise((resolve) => {
      const start = Date.now();
      let stdout = '';
      let stderr = '';

      const proc = spawn('docker', cmd, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
        if (stdout.length > limits.maxOutput) {
          proc.kill('SIGKILL');
          stderr += '\n[Output limit exceeded]';
        }
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      const timeout = setTimeout(() => {
        proc.kill('SIGKILL');
        stderr += '\n[Execution timeout exceeded]';
      }, limits.timeout);

      proc.on('close', (exitCode) => {
        clearTimeout(timeout);
        resolve({
          stdout,
          stderr,
          exitCode: exitCode || 0,
          executionTime: Date.now() - start,
        });
      });

      // Send stdin if provided
      if (options.stdin) {
        proc.stdin.write(options.stdin);
        proc.stdin.end();
      }
    });
  }

  /**
   * Execute locally (development/testing)
   */
  async executeLocally(code, language, limits, options) {
    const start = Date.now();

    if (language === 'python') {
      return this.runPython(code, limits, options, start);
    } else if (language === 'c' || language === 'cpp') {
      return this.runC(code, language, limits, start);
    }

    throw new Error(`Local execution not supported for ${language}`);
  }

  async runPython(code, limits, options, start) {
    const execId = uuidv4();
    const tmpFile = path.join(os.tmpdir(), `educode_${execId}.py`);

    try {
      await fs.writeFile(tmpFile, code, 'utf8');

      return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';

        const proc = spawn('python3', ['-u', tmpFile], {
          env: {
            ...process.env,
            PYTHONDONTWRITEBYTECODE: '1',
            PYTHONUNBUFFERED: '1',
          },
          timeout: limits.timeout,
        });

        proc.stdout.on('data', d => { stdout += d.toString(); });
        proc.stderr.on('data', d => { stderr += d.toString(); });

        const timer = setTimeout(() => {
          proc.kill('SIGKILL');
          stderr += '\n[Timeout: program ran too long]';
        }, limits.timeout);

        proc.on('close', (exitCode) => {
          clearTimeout(timer);
          resolve({
            stdout,
            stderr,
            exitCode: exitCode || 0,
            executionTime: Date.now() - start,
          });
          fs.unlink(tmpFile).catch(() => {});
        });
      });
    } catch (e) {
      return { stdout: '', stderr: e.message, exitCode: 1, executionTime: Date.now() - start };
    }
  }

  async runC(code, language, limits, start) {
    const execId = uuidv4();
    const srcFile = path.join(os.tmpdir(), `educode_${execId}.${language === 'cpp' ? 'cpp' : 'c'}`);
    const binFile = path.join(os.tmpdir(), `educode_${execId}`);

    try {
      await fs.writeFile(srcFile, code, 'utf8');

      // Compile
      const compiler = language === 'cpp' ? 'g++' : 'gcc';
      await new Promise((resolve, reject) => {
        exec(`${compiler} -o ${binFile} ${srcFile} -lm`, { timeout: 30000 }, (err, stdout, stderr) => {
          if (err) reject(new Error(`Compilation error:\n${stderr}`));
          else resolve(stdout);
        });
      });

      // Run
      return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';

        const proc = spawn(binFile, [], { timeout: limits.timeout });
        proc.stdout.on('data', d => { stdout += d.toString(); });
        proc.stderr.on('data', d => { stderr += d.toString(); });

        const timer = setTimeout(() => {
          proc.kill('SIGKILL');
          stderr += '\n[Timeout]';
        }, limits.timeout);

        proc.on('close', (exitCode) => {
          clearTimeout(timer);
          resolve({ stdout, stderr, exitCode: exitCode || 0, executionTime: Date.now() - start });
          fs.unlink(srcFile).catch(() => {});
          fs.unlink(binFile).catch(() => {});
        });
      });

    } catch (error) {
      return { stdout: '', stderr: error.message, exitCode: 1, executionTime: Date.now() - start };
    }
  }

  /**
   * Flash firmware to hardware device (ESP32, Arduino)
   * Used server-side when device is connected to cloud gateway
   */
  async flashToDevice(code, deviceConfig) {
    const { deviceType, port, baudRate = 115200 } = deviceConfig;
    const execId = uuidv4();

    logger.info(`[Flash] Device: ${deviceType}, Port: ${port}, execId: ${execId}`);

    if (deviceType === 'esp32' || deviceType === 'esp8266') {
      return this.flashMicroPython(code, port, baudRate, execId);
    } else if (deviceType.startsWith('arduino')) {
      return this.flashArduino(code, deviceType, port, execId);
    }

    throw new Error(`Unsupported device type: ${deviceType}`);
  }

  async flashMicroPython(code, port, baudRate, execId) {
    const tmpFile = path.join(os.tmpdir(), `educode_flash_${execId}.py`);
    await fs.writeFile(tmpFile, code, 'utf8');

    return new Promise((resolve, reject) => {
      // Using ampy or mpremote to upload to MicroPython device
      const proc = spawn('mpremote', ['connect', port, 'run', tmpFile], {
        timeout: 30000,
      });

      let output = '';
      let errors = '';

      proc.stdout.on('data', d => { output += d.toString(); });
      proc.stderr.on('data', d => { errors += d.toString(); });

      proc.on('close', (exitCode) => {
        fs.unlink(tmpFile).catch(() => {});
        if (exitCode === 0) {
          resolve({ success: true, output, errors, execId });
        } else {
          resolve({ success: false, output, errors, execId });
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Flash error: ${err.message}`));
      });
    });
  }

  async flashArduino(code, boardType, port, execId) {
    const tmpDir = path.join(os.tmpdir(), `arduino_${execId}`);
    await fs.mkdir(tmpDir, { recursive: true });

    const sketchFile = path.join(tmpDir, `sketch_${execId}.ino`);
    await fs.writeFile(sketchFile, code, 'utf8');

    const boardFQBN = this.getArduinoFQBN(boardType);

    return new Promise((resolve) => {
      const proc = spawn('arduino-cli', [
        'compile', '--upload',
        '--fqbn', boardFQBN,
        '--port', port,
        sketchFile,
      ], { timeout: 120000 });

      let output = '';
      let errors = '';

      proc.stdout.on('data', d => { output += d.toString(); });
      proc.stderr.on('data', d => { errors += d.toString(); });

      proc.on('close', (exitCode) => {
        fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        resolve({
          success: exitCode === 0,
          output,
          errors,
          execId,
        });
      });
    });
  }

  /**
   * Validate code for safety before execution
   * Prevents dangerous system calls in student code
   */
  validateCode(code, language) {
    const blockedPatterns = {
      python: [
        /import\s+os\s*;?\s*(system|popen|exec|fork)/,
        /subprocess\.(call|Popen|run)/,
        /__import__\s*\(\s*['"]os['"]\s*\)/,
        /open\s*\([^)]*['"][wa]/,  // File writes
        /socket\s*\./,
        /requests\s*\./,
        /urllib\s*\./,
        /eval\s*\(/,
        /exec\s*\(/,
      ],
      c: [
        /system\s*\(/,
        /popen\s*\(/,
        /fork\s*\(/,
        /exec[lpve]*\s*\(/,
        /#include\s*<network\.h>/,
      ],
    };

    const patterns = blockedPatterns[language] || [];
    const violations = [];

    for (const pattern of patterns) {
      if (pattern.test(code)) {
        violations.push(pattern.toString());
      }
    }

    return {
      safe: violations.length === 0,
      violations,
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  getFilename(language) {
    const map = {
      python: 'main.py',
      micropython: 'main.py',
      c: 'main.c',
      cpp: 'main.cpp',
      arduino: 'sketch.ino',
      javascript: 'main.js',
    };
    return map[language] || 'main.py';
  }

  buildDockerCommand(language, image, tempDir, filename, limits) {
    return [
      'run', '--rm',
      '--network=none',          // No network access
      `--memory=${limits.memory}`,
      '--memory-swap', limits.memory,
      '--cpus=0.5',
      '--read-only',
      '--tmpfs', '/tmp:noexec,size=10m',
      '-v', `${tempDir}:/code:ro`,
      '--workdir', '/code',
      '--user', '65534:65534',  // nobody user
      image,
      ...this.getRunCommand(language, filename),
    ];
  }

  getRunCommand(language, filename) {
    const map = {
      python: ['python3', '-u', filename],
      micropython: ['micropython', filename],
      c: ['sh', '-c', `gcc -o /tmp/out ${filename} -lm && /tmp/out`],
      cpp: ['sh', '-c', `g++ -o /tmp/out ${filename} -lm && /tmp/out`],
      arduino: ['arduino-cli', 'compile', '--fqbn', 'arduino:avr:uno', filename],
    };
    return map[language] || ['python3', '-u', filename];
  }

  getArduinoFQBN(boardType) {
    const map = {
      arduino_uno: 'arduino:avr:uno',
      arduino_mega: 'arduino:avr:mega',
      arduino_nano: 'arduino:avr:nano',
      esp32: 'esp32:esp32:esp32',
      esp8266: 'esp8266:esp8266:generic',
    };
    return map[boardType] || 'arduino:avr:uno';
  }

  sanitizeOutput(output) {
    if (!output) return '';
    // Limit output size and remove ANSI codes
    return output
      .replace(/\x1B\[[0-9;]*[mGKF]/g, '')
      .substring(0, 50000);
  }
}

module.exports = new CodeExecutionService();