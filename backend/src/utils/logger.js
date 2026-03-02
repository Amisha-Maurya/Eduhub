const path = require('path');
const fs = require('fs');

// Simple logger implementation
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const formatMessage = (level, message) => {
    const timestamp = new Date().toISOString();
    const meta = typeof message === 'object' ? JSON.stringify(message) : message;
    return `[${timestamp}] ${level.toUpperCase()}: ${meta}`;
};

const logger = {
    info: (message) => {
        const formatted = formatMessage('info', message);
        console.log(formatted);
        fs.appendFileSync(path.join(logDir, 'combined.log'), formatted + '\n');
    },
    error: (message, error) => {
        const formatted = formatMessage('error', message) + (error ? ` - ${error.stack || error}` : '');
        console.error(formatted);
        fs.appendFileSync(path.join(logDir, 'error.log'), formatted + '\n');
        fs.appendFileSync(path.join(logDir, 'combined.log'), formatted + '\n');
    },
    warn: (message) => {
        const formatted = formatMessage('warn', message);
        console.warn(formatted);
        fs.appendFileSync(path.join(logDir, 'combined.log'), formatted + '\n');
    },
    debug: (message) => {
        if (process.env.NODE_ENV === 'development') {
            const formatted = formatMessage('debug', message);
            console.log(formatted);
        }
    }
};

module.exports = logger;