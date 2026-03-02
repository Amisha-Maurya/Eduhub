/**
 * Socket Manager - Real-time Collaboration, Live Code Sync, Hardware Streaming
 * Handles: Code collaboration, block sync, hardware I/O streaming, classroom management
 */

'use strict';

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const redis = require('../config/redis');

class SocketManager {
  constructor() {
    this.io = null;
    this.activeRooms = new Map();
    this.hardwareConnections = new Map();
    this.userSockets = new Map(); // userId → socketId[]
  }

  initialize(io) {
    this.io = io;

    // Auth middleware for socket connections
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token ||
                      socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.displayName = decoded.displayName;
        next();
      } catch (err) {
        next(new Error('Invalid authentication token'));
      }
    });

    io.on('connection', (socket) => {
      logger.info(`[Socket] User connected: ${socket.userId}, socket: ${socket.id}`);

      // Track user sockets
      if (!this.userSockets.has(socket.userId)) {
        this.userSockets.set(socket.userId, []);
      }
      this.userSockets.get(socket.userId).push(socket.id);

      // Register all event handlers
      this.registerProjectHandlers(socket);
      this.registerClassroomHandlers(socket);
      this.registerHardwareHandlers(socket);
      this.registerAIHandlers(socket);
      this.registerCollabHandlers(socket);
      this.registerPresenceHandlers(socket);

      socket.on('disconnect', (reason) => {
        this.handleDisconnect(socket, reason);
      });
    });

    logger.info('[Socket] Socket.IO initialized');
  }

  // ── Project / Code Collaboration ──────────────────────────────────────────
  registerProjectHandlers(socket) {
    // Join project room for real-time collaboration
    socket.on('project:join', async ({ projectId }) => {
      const room = `project:${projectId}`;
      await socket.join(room);

      // Get current state from Redis
      const state = await redis.get(`project:state:${projectId}`);

      socket.emit('project:state', {
        projectId,
        state: state ? JSON.parse(state) : null,
        activeUsers: await this.getRoomUsers(room),
      });

      socket.to(room).emit('project:user_joined', {
        userId: socket.userId,
        displayName: socket.displayName,
        timestamp: Date.now(),
      });

      logger.info(`[Socket] User ${socket.userId} joined project ${projectId}`);
    });

    // Block changes (from drag-and-drop in Blockly editor)
    socket.on('project:blocks_change', async ({ projectId, blockXml, operation, blockId }) => {
      const room = `project:${projectId}`;

      // Cache in Redis for fast access
      await redis.setEx(`project:blocks:${projectId}`, 300, blockXml);

      // Broadcast to all OTHER users in the room (not sender)
      socket.to(room).emit('project:blocks_update', {
        blockXml,
        operation, // 'add', 'delete', 'move', 'change'
        blockId,
        changedBy: socket.userId,
        timestamp: Date.now(),
      });
    });

    // Code changes (from text editor)
    socket.on('project:code_change', async ({ projectId, language, delta, fullCode }) => {
      const room = `project:${projectId}`;

      // Cache for sync
      await redis.setEx(`project:code:${projectId}:${language}`, 300, fullCode);

      socket.to(room).emit('project:code_update', {
        language,
        delta,    // Incremental change (for efficiency)
        fullCode, // Full code for initial sync
        changedBy: socket.userId,
        timestamp: Date.now(),
      });
    });

    // Auto-save trigger
    socket.on('project:auto_save', async ({ projectId, data }) => {
      const Project = require('../models/Project');
      try {
        await Project.findByIdAndUpdate(projectId, {
          ...data,
          lastAutoSaveAt: new Date(),
        });
        socket.emit('project:saved', { projectId, timestamp: Date.now() });
      } catch (err) {
        socket.emit('project:save_error', { error: err.message });
      }
    });

    // Code execution (real-time output streaming)
    socket.on('project:run', async ({ projectId, code, language, stdin }) => {
      const CodeExecutionService = require('./codeExecutionService');

      socket.emit('execution:started', { projectId, timestamp: Date.now() });

      try {
        // Validate safety
        const { safe, violations } = CodeExecutionService.validateCode(code, language);
        if (!safe) {
          socket.emit('execution:error', {
            projectId,
            errors: `Security violation: Blocked operations detected (${violations.join(', ')})`,
          });
          return;
        }

        const result = await CodeExecutionService.execute(code, language, { stdin });

        socket.emit('execution:complete', {
          projectId,
          ...result,
          timestamp: Date.now(),
        });

      } catch (error) {
        socket.emit('execution:error', {
          projectId,
          errors: error.message,
        });
      }
    });

    socket.on('project:leave', ({ projectId }) => {
      const room = `project:${projectId}`;
      socket.leave(room);
      socket.to(room).emit('project:user_left', {
        userId: socket.userId,
        timestamp: Date.now(),
      });
    });
  }

  // ── Classroom Management ───────────────────────────────────────────────────
  registerClassroomHandlers(socket) {
    socket.on('classroom:join', async ({ classroomId }) => {
      const room = `classroom:${classroomId}`;
      await socket.join(room);

      // Announce presence
      socket.to(room).emit('classroom:user_joined', {
        userId: socket.userId,
        displayName: socket.displayName,
        role: socket.userRole,
      });

      const students = await this.getClassroomStudents(classroomId);
      socket.emit('classroom:state', { students, classroomId });
    });

    // Teacher sends announcement/instruction to all students
    socket.on('classroom:announce', ({ classroomId, message, type }) => {
      if (socket.userRole !== 'teacher' && socket.userRole !== 'school_admin') return;

      this.io.to(`classroom:${classroomId}`).emit('classroom:announcement', {
        message,
        type: type || 'info', // 'info', 'warning', 'success', 'task'
        from: socket.displayName,
        timestamp: Date.now(),
      });
    });

    // Teacher can view/shadow student's screen
    socket.on('classroom:view_student', ({ classroomId, studentId }) => {
      if (socket.userRole !== 'teacher') return;

      const studentSockets = this.userSockets.get(studentId) || [];
      for (const sockId of studentSockets) {
        this.io.to(sockId).emit('classroom:teacher_viewing', {
          teacherName: socket.displayName,
          teacherUserId: socket.userId,
        });
      }

      // Request student's current project state
      socket.emit('classroom:student_view_requested', { studentId });
    });

    // Student shares screen/project with class
    socket.on('classroom:share_screen', ({ classroomId, projectId, enabled }) => {
      this.io.to(`classroom:${classroomId}`).emit('classroom:student_sharing', {
        studentId: socket.userId,
        displayName: socket.displayName,
        projectId,
        enabled,
      });
    });

    // Teacher locks all student screens
    socket.on('classroom:lock_screens', ({ classroomId, locked, message }) => {
      if (socket.userRole !== 'teacher') return;

      this.io.to(`classroom:${classroomId}`).emit('classroom:screens_locked', {
        locked,
        message: message || 'Your screen has been locked by your teacher.',
        timestamp: Date.now(),
      });
    });

    // Submit assignment
    socket.on('classroom:submit_assignment', async ({ classroomId, assignmentId, projectId }) => {
      const room = `classroom:${classroomId}`;
      const Project = require('../models/Project');

      try {
        await Project.findByIdAndUpdate(projectId, {
          isSubmitted: true,
          submittedAt: new Date(),
        });

        socket.emit('classroom:submission_confirmed', { assignmentId, projectId });

        // Notify teacher
        socket.to(room).emit('classroom:student_submitted', {
          studentId: socket.userId,
          displayName: socket.displayName,
          assignmentId,
          projectId,
          timestamp: Date.now(),
        });

      } catch (err) {
        socket.emit('classroom:submit_error', { error: err.message });
      }
    });

    // Live progress tracking: student updates progress
    socket.on('classroom:progress_update', ({ classroomId, lessonId, progress, blockCount, linesOfCode }) => {
      const teacherRooms = [`classroom:${classroomId}`];

      teacherRooms.forEach(room => {
        socket.to(room).emit('classroom:student_progress', {
          studentId: socket.userId,
          displayName: socket.displayName,
          lessonId,
          progress,
          blockCount,
          linesOfCode,
          timestamp: Date.now(),
        });
      });
    });
  }

  // ── Hardware / IoT Streaming ───────────────────────────────────────────────
  registerHardwareHandlers(socket) {
    // Connect to hardware device (browser → server → device)
    socket.on('hardware:connect', async ({ deviceType, deviceId, port }) => {
      const connKey = `${socket.userId}:${deviceId}`;
      this.hardwareConnections.set(connKey, { deviceType, port, socketId: socket.id });

      socket.emit('hardware:connected', {
        deviceId,
        deviceType,
        status: 'connected',
        timestamp: Date.now(),
      });
    });

    // Stream sensor data FROM device TO client
    socket.on('hardware:subscribe_sensors', ({ deviceId, sensors }) => {
      // In production: establishes WebSocket connection to hardware gateway
      // Then streams real-time sensor data back to client
      socket.emit('hardware:sensor_data', {
        deviceId,
        sensors: sensors.map(s => ({
          name: s,
          value: Math.random() * 100, // Simulated
          unit: 'units',
          timestamp: Date.now(),
        })),
      });
    });

    // Flash firmware to device
    socket.on('hardware:flash', async ({ deviceId, code, language, deviceConfig }) => {
      const CodeExecutionService = require('./codeExecutionService');

      socket.emit('hardware:flash_started', { deviceId, timestamp: Date.now() });

      try {
        const result = await CodeExecutionService.flashToDevice(code, deviceConfig);

        socket.emit('hardware:flash_complete', {
          deviceId,
          success: result.success,
          output: result.output,
          errors: result.errors,
        });

      } catch (err) {
        socket.emit('hardware:flash_error', { deviceId, error: err.message });
      }
    });

    // Serial monitor (REPL for MicroPython devices)
    socket.on('hardware:serial_send', ({ deviceId, data }) => {
      // Send data to device via hardware gateway
      logger.info(`[Hardware] Serial send to ${deviceId}: ${data}`);

      // Simulate REPL response
      socket.emit('hardware:serial_receive', {
        deviceId,
        data: `>>> ${data}\n`,
        timestamp: Date.now(),
      });
    });

    socket.on('hardware:disconnect', ({ deviceId }) => {
      const connKey = `${socket.userId}:${deviceId}`;
      this.hardwareConnections.delete(connKey);
      socket.emit('hardware:disconnected', { deviceId });
    });
  }

  // ── AI Assistant Streaming ─────────────────────────────────────────────────
  registerAIHandlers(socket) {
    socket.on('ai:ask', async ({ question, code, language, context, type }) => {
      const AIService = require('./aiService');

      socket.emit('ai:thinking', { timestamp: Date.now() });

      try {
        const stream = await AIService.streamResponse({
          question,
          code,
          language,
          context,
          type, // 'hint', 'debug', 'explain', 'generate', 'review'
          userId: socket.userId,
          userRole: socket.userRole,
        });

        let fullResponse = '';

        for await (const chunk of stream) {
          fullResponse += chunk;
          socket.emit('ai:chunk', { chunk });
        }

        socket.emit('ai:complete', {
          response: fullResponse,
          type,
          timestamp: Date.now(),
        });

      } catch (err) {
        socket.emit('ai:error', { error: err.message });
      }
    });
  }

  // ── Collaborative Features ─────────────────────────────────────────────────
  registerCollabHandlers(socket) {
    // Cursor tracking for multi-user editing
    socket.on('collab:cursor_move', ({ projectId, position, selection }) => {
      socket.to(`project:${projectId}`).emit('collab:cursor_update', {
        userId: socket.userId,
        displayName: socket.displayName,
        position,
        selection,
        color: this.getUserColor(socket.userId),
      });
    });

    // Chat within project/classroom
    socket.on('collab:chat', ({ roomType, roomId, message, attachments }) => {
      const room = `${roomType}:${roomId}`;

      // Content moderation for minors
      const cleanMessage = this.moderateContent(message);

      this.io.to(room).emit('collab:message', {
        userId: socket.userId,
        displayName: socket.displayName,
        message: cleanMessage,
        attachments,
        timestamp: Date.now(),
      });
    });

    // Peer code review
    socket.on('collab:review_comment', ({ projectId, lineNumber, comment }) => {
      socket.to(`project:${projectId}`).emit('collab:review_update', {
        userId: socket.userId,
        displayName: socket.displayName,
        lineNumber,
        comment: this.moderateContent(comment),
        timestamp: Date.now(),
      });
    });
  }

  // ── Presence & Status ──────────────────────────────────────────────────────
  registerPresenceHandlers(socket) {
    socket.on('presence:update', async ({ status, activity }) => {
      await redis.setEx(`presence:${socket.userId}`, 300, JSON.stringify({ status, activity, timestamp: Date.now() }));
    });

    socket.on('presence:heartbeat', () => {
      // Keep connection alive, update last seen
      redis.setEx(`online:${socket.userId}`, 120, '1');
    });
  }

  // ── Disconnect Handler ─────────────────────────────────────────────────────
  handleDisconnect(socket, reason) {
    logger.info(`[Socket] User disconnected: ${socket.userId}, reason: ${reason}`);

    // Remove socket from user's socket list
    const sockets = this.userSockets.get(socket.userId) || [];
    const filtered = sockets.filter(id => id !== socket.id);
    if (filtered.length > 0) {
      this.userSockets.set(socket.userId, filtered);
    } else {
      this.userSockets.delete(socket.userId);
      // User is fully offline
      this.io.emit('presence:offline', { userId: socket.userId });
    }

    // Clean up hardware connections
    for (const [key, conn] of this.hardwareConnections.entries()) {
      if (conn.socketId === socket.id) {
        this.hardwareConnections.delete(key);
      }
    }
  }

  // ── Utilities ──────────────────────────────────────────────────────────────
  async getRoomUsers(room) {
    const sockets = await this.io.in(room).fetchSockets();
    return sockets.map(s => ({ userId: s.userId, displayName: s.displayName }));
  }

  async getClassroomStudents(classroomId) {
    const room = `classroom:${classroomId}`;
    return this.getRoomUsers(room);
  }

  getUserColor(userId) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const hash = userId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  moderateContent(message) {
    // Basic profanity filter for child safety
    const blocked = ['damn', 'hell']; // Expand with proper list
    let clean = message;
    for (const word of blocked) {
      clean = clean.replace(new RegExp(word, 'gi'), '*'.repeat(word.length));
    }
    return clean;
  }

  // ── Broadcast Helpers ──────────────────────────────────────────────────────
  broadcastToUser(userId, event, data) {
    const sockets = this.userSockets.get(userId) || [];
    for (const sockId of sockets) {
      this.io.to(sockId).emit(event, data);
    }
  }

  broadcastToClassroom(classroomId, event, data) {
    this.io.to(`classroom:${classroomId}`).emit(event, data);
  }

  broadcastToProject(projectId, event, data) {
    this.io.to(`project:${projectId}`).emit(event, data);
  }
}

module.exports = new SocketManager();