/**
 * EduCode Editor Component
 * Split-pane Blockly + CodeMirror editor with real-time sync
 * File: frontend/src/components/Editor/CodeEditor.jsx
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { useProject } from '../../hooks/useProject';
import { useAI } from '../../hooks/useAI';
import BlocklyEditor from './BlocklyEditor';
import CodeMirrorEditor from './CodeMirrorEditor';
import ExecutionPanel from './ExecutionPanel';
import AIPanel from './AIPanel';
import HardwarePanel from './HardwarePanel';
import Toolbar from './Toolbar';
import { debounce } from '../../utils/helpers';
import toast from 'react-hot-toast';

const SYNC_MODES = {
  BLOCKS_PRIMARY: 'blocks_primary',
  CODE_PRIMARY: 'code_primary',
  BIDIRECTIONAL: 'bidirectional',
};

const LANGUAGES = {
  python: { label: 'Python', ext: '.py', blocklyGen: 'Python' },
  micropython: { label: 'MicroPython', ext: '.py', blocklyGen: 'Python' },
  arduino: { label: 'Arduino (C++)', ext: '.ino', blocklyGen: 'Arduino' },
  c: { label: 'C', ext: '.c', blocklyGen: 'C' },
  cpp: { label: 'C++', ext: '.cpp', blocklyGen: 'C' },
};

export default function CodeEditor() {
  const { projectId } = useParams();
  const socket = useSocket();
  const { project, saveProject, updateProject } = useProject(projectId);
  const { getHint, getDebugHelp } = useAI();

  // ── State ────────────────────────────────────────────────────────────────
  const [blockXml, setBlockXml] = useState('<xml xmlns="https://developers.google.com/blockly/xml"></xml>');
  const [code, setCode] = useState('# Start coding here!\n');
  const [language, setLanguage] = useState('python');
  const [syncMode, setSyncMode] = useState(SYNC_MODES.BLOCKS_PRIMARY);
  const [layout, setLayout] = useState('split'); // 'split' | 'blocks' | 'code'
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [highlightedBlock, setHighlightedBlock] = useState(null);
  const [highlightedLine, setHighlightedLine] = useState(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [hardwarePanelOpen, setHardwarePanelOpen] = useState(false);
  const [blockToLineMappings, setBlockToLineMappings] = useState([]);

  const blocklyRef = useRef(null);
  const codeRef = useRef(null);
  const isSyncingRef = useRef(false);

  // ── Load Project ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (project) {
      setBlockXml(project.blockXml || '<xml xmlns="https://developers.google.com/blockly/xml"></xml>');
      setCode(project.generatedCode || project.files?.find(f => f.isMain)?.content || '');
      setLanguage(project.primaryLanguage || 'python');
      setSyncMode(project.syncMode || SYNC_MODES.BLOCKS_PRIMARY);
    }
  }, [project]);

  // ── Socket.IO Setup ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !projectId) return;

    socket.emit('project:join', { projectId });

    socket.on('project:state', ({ state, activeUsers }) => {
      if (state?.blockXml) setBlockXml(state.blockXml);
      if (state?.code) setCode(state.code);
      setCollaborators(activeUsers || []);
    });

    socket.on('project:blocks_update', ({ blockXml: newXml, changedBy }) => {
      if (changedBy === socket.id) return;
      isSyncingRef.current = true;
      setBlockXml(newXml);
      // Trigger code sync if blocks are primary
      if (syncMode === SYNC_MODES.BLOCKS_PRIMARY) {
        generateCodeFromBlocks(newXml);
      }
      setTimeout(() => { isSyncingRef.current = false; }, 100);
    });

    socket.on('project:code_update', ({ language: lang, fullCode, changedBy }) => {
      if (changedBy === socket.id) return;
      isSyncingRef.current = true;
      setCode(fullCode);
      setTimeout(() => { isSyncingRef.current = false; }, 100);
    });

    socket.on('project:user_joined', ({ displayName }) => {
      toast.success(`${displayName} joined the project`);
    });

    socket.on('execution:started', () => {
      setIsRunning(true);
      setOutput([]);
      setErrors([]);
    });

    socket.on('execution:complete', ({ output: out, errors: errs, exitCode, executionTime }) => {
      setIsRunning(false);
      if (out) setOutput([{ type: 'output', text: out, timestamp: Date.now() }]);
      if (errs) setErrors([{ type: 'error', text: errs }]);
      if (exitCode === 0) {
        toast.success(`✅ Ran in ${executionTime}ms`);
      }
    });

    socket.on('execution:error', ({ errors: errs }) => {
      setIsRunning(false);
      setErrors([{ type: 'error', text: errs }]);
      toast.error('Execution failed');
    });

    socket.on('classroom:screens_locked', ({ locked, message }) => {
      if (locked) {
        toast.error(`🔒 ${message}`, { duration: 0, id: 'screen-lock' });
      } else {
        toast.dismiss('screen-lock');
      }
    });

    return () => {
      socket.emit('project:leave', { projectId });
      socket.off('project:state');
      socket.off('project:blocks_update');
      socket.off('project:code_update');
      socket.off('execution:started');
      socket.off('execution:complete');
      socket.off('execution:error');
    };
  }, [socket, projectId, syncMode]);

  // ── Block Change Handler ───────────────────────────────────────────────────
  const handleBlockChange = useCallback((newXml) => {
    if (isSyncingRef.current) return;
    setBlockXml(newXml);

    // Generate code from blocks (client-side via Blockly)
    if (syncMode !== SYNC_MODES.CODE_PRIMARY && blocklyRef.current) {
      const generatedCode = generateCodeFromBlocks(newXml);
      if (generatedCode) {
        setCode(generatedCode.code);
        setBlockToLineMappings(generatedCode.mappings || []);
      }
    }

    // Broadcast to collaborators
    if (socket && !isSyncingRef.current) {
      socket.emit('project:blocks_change', {
        projectId,
        blockXml: newXml,
        operation: 'change',
      });
    }

    // Debounced auto-save
    debouncedSave({ blockXml: newXml });
  }, [syncMode, socket, projectId]);

  // ── Code Change Handler ───────────────────────────────────────────────────
  const handleCodeChange = useCallback((newCode) => {
    if (isSyncingRef.current) return;
    setCode(newCode);

    // In bidirectional mode, try to parse code back to blocks
    if (syncMode === SYNC_MODES.BIDIRECTIONAL || syncMode === SYNC_MODES.CODE_PRIMARY) {
      debouncedCodeToBlocks(newCode);
    }

    // Broadcast
    if (socket) {
      socket.emit('project:code_change', {
        projectId,
        language,
        fullCode: newCode,
        delta: null, // Could use Monaco/CM delta here
      });
    }

    debouncedSave({ code: newCode });
  }, [syncMode, socket, projectId, language]);

  // ── Code Generation ───────────────────────────────────────────────────────
  const generateCodeFromBlocks = useCallback((xml) => {
    if (!blocklyRef.current?.workspace) return null;

    try {
      const workspace = blocklyRef.current.workspace;
      const langConfig = LANGUAGES[language];

      let generatedCode = '';

      if (language === 'python' || language === 'micropython') {
        // Use Blockly's Python generator
        const { pythonGenerator } = window.Blockly || {};
        if (pythonGenerator) {
          generatedCode = pythonGenerator.workspaceToCode(workspace);
        }
      } else if (language === 'arduino' || language === 'cpp') {
        // Use Blockly's Arduino/C generator
        generatedCode = `// Generated by EduCode\n// Connect to device and run!\n\nvoid setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  // Your blocks go here\n  delay(100);\n}\n`;
      }

      return {
        code: generatedCode || code,
        mappings: [],
      };
    } catch (e) {
      console.error('Code generation error:', e);
      return null;
    }
  }, [language, code]);

  const debouncedCodeToBlocks = useCallback(
    debounce(async (newCode) => {
      try {
        const response = await fetch(`/api/v1/code/code-to-blocks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({ code: newCode, language }),
        });

        if (response.ok) {
          const { xml, unmappedLines } = await response.json();
          isSyncingRef.current = true;
          setBlockXml(xml);
          setTimeout(() => { isSyncingRef.current = false; }, 200);

          if (unmappedLines?.length > 0) {
            console.info('Some lines could not be represented as blocks:', unmappedLines);
          }
        }
      } catch (e) {
        // Non-critical: sync failure just means blocks don't update
      }
    }, 1500),
    [language]
  );

  // ── Auto-save ─────────────────────────────────────────────────────────────
  const debouncedSave = useCallback(
    debounce(async (updates) => {
      setIsSaving(true);
      try {
        await updateProject({ ...updates, lastAutoSaveAt: new Date() });
      } catch (e) {
        toast.error('Auto-save failed');
      } finally {
        setIsSaving(false);
      }
    }, 2000),
    [updateProject]
  );

  // ── Run Code ──────────────────────────────────────────────────────────────
  const handleRun = useCallback(() => {
    if (!socket) return;
    socket.emit('project:run', { projectId, code, language, stdin: '' });

    // Send progress to classroom
    socket.emit('classroom:progress_update', {
      classroomId: project?.classroomId,
      projectId,
      linesOfCode: code.split('\n').length,
      blockCount: blocklyRef.current?.workspace?.getAllBlocks?.()?.length || 0,
    });
  }, [socket, projectId, code, language, project]);

  // ── Block Click → Highlight Code Line ─────────────────────────────────────
  const handleBlockClick = useCallback((blockId) => {
    setHighlightedBlock(blockId);
    const mapping = blockToLineMappings.find(m => m.blockId === blockId);
    if (mapping) {
      setHighlightedLine(mapping.codeRange);
      codeRef.current?.scrollToLine?.(mapping.codeRange.start);
    }
  }, [blockToLineMappings]);

  // ── Code Line Click → Highlight Block ────────────────────────────────────
  const handleCodeLineClick = useCallback((lineNumber) => {
    setHighlightedLine({ start: lineNumber, end: lineNumber });
    const mapping = blockToLineMappings.find(m =>
      lineNumber >= m.codeRange.start && lineNumber <= m.codeRange.end
    );
    if (mapping) {
      setHighlightedBlock(mapping.blockId);
      blocklyRef.current?.highlightBlock?.(mapping.blockId);
    }
  }, [blockToLineMappings]);

  // ── AI Help ───────────────────────────────────────────────────────────────
  const handleAskAI = useCallback(async (type) => {
    if (!socket) return;
    setAiPanelOpen(true);

    socket.emit('ai:ask', {
      type,
      code,
      language,
      question: type === 'debug' ? 'Help me find the bug in my code' : null,
      context: { gradeLevel: project?.gradeLevel?.[0] || '6-8' },
    });
  }, [socket, code, language, project]);

  return (
    <div className="editor-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Toolbar */}
      <Toolbar
        language={language}
        languages={LANGUAGES}
        syncMode={syncMode}
        layout={layout}
        isRunning={isRunning}
        isSaving={isSaving}
        collaborators={collaborators}
        onLanguageChange={setLanguage}
        onSyncModeChange={setSyncMode}
        onLayoutChange={setLayout}
        onRun={handleRun}
        onSave={() => saveProject({ blockXml, code })}
        onAIHelp={handleAskAI}
        onHardwareOpen={() => setHardwarePanelOpen(true)}
      />

      {/* Editor Split Pane */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Blockly Block Editor */}
        {(layout === 'split' || layout === 'blocks') && (
          <div style={{ flex: layout === 'blocks' ? 1 : 0.5, borderRight: '1px solid #1e2d45', overflow: 'hidden' }}>
            <BlocklyEditor
              ref={blocklyRef}
              xml={blockXml}
              language={language}
              highlightedBlock={highlightedBlock}
              onChange={handleBlockChange}
              onBlockClick={handleBlockClick}
            />
          </div>
        )}

        {/* Code Text Editor */}
        {(layout === 'split' || layout === 'code') && (
          <div style={{ flex: layout === 'code' ? 1 : 0.5, overflow: 'hidden' }}>
            <CodeMirrorEditor
              ref={codeRef}
              code={code}
              language={language}
              highlightedLine={highlightedLine}
              readOnly={syncMode === SYNC_MODES.BLOCKS_PRIMARY}
              onChange={handleCodeChange}
              onLineClick={handleCodeLineClick}
              collaborators={collaborators}
            />
          </div>
        )}
      </div>

      {/* Output / Execution Panel */}
      <ExecutionPanel
        output={output}
        errors={errors}
        isRunning={isRunning}
        onClear={() => { setOutput([]); setErrors([]); }}
        onStop={() => { /* TODO: Kill execution */ setIsRunning(false); }}
      />

      {/* AI Panel (slide-over) */}
      {aiPanelOpen && (
        <AIPanel
          socket={socket}
          code={code}
          language={language}
          onClose={() => setAiPanelOpen(false)}
        />
      )}

      {/* Hardware Panel (slide-over) */}
      {hardwarePanelOpen && (
        <HardwarePanel
          socket={socket}
          code={code}
          language={language}
          projectId={projectId}
          onClose={() => setHardwarePanelOpen(false)}
        />
      )}
    </div>
  );
}