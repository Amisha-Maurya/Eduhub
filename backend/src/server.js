/**
 * EduCode Platform - Main Server Entry Point
 * K-12 Educational Coding Platform Backend
 * Supports: Block-based, Python, MicroPython, Embedded C/C++, Arduino
 */

'use strict';

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { Server } = require('socket.io');
const cron = require('node-cron');
require('dotenv').config();

// Internal modules
const database = require('./config/database');
const redis = require('./config/redis');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const socketManager = require('./services/socketManager');

// Route imports
const authRoutes = require('./api/auth.routes');
const userRoutes = require('./api/users.routes');
const courseRoutes = require('./api/courses.routes');
const projectRoutes = require('./api/projects.routes');
const classroomRoutes = require('./api/classroom.routes');
const codeRoutes = require('./api/code.routes');
const hardwareRoutes = require('./api/hardware.routes');
const aiRoutes = require('./api/ai.routes');
const analyticsRoutes = require('./api/analytics.routes');
const simulationRoutes = require('./api/simulation.routes');
const adminRoutes = require('./api/admin.routes');
const progressRoutes = require('./api/progress.routes');

const app = express();
const server = http.createServer(app);

// ─── Socket.IO Setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 1e7, // 10MB for code/file transfers
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'"], // Required for code execution sandbox
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', '*.amazonaws.com'],
      connectSrc: ["'self'", 'wss:', 'ws:'],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(hpp()); // Prevent HTTP Parameter Pollution

// ─── General Middleware ───────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP. Please try again later.',
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts.',
});

const codeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Code execution rate limit exceeded.',
});

app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/code/execute', codeLimiter);

// ─── Request Logging ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
      ip: req.ip,
      userId: req.user?.id,
    });
  });
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const dbStatus = database.isConnected() ? 'healthy' : 'unhealthy';
  const redisStatus = await redis.ping().then(() => 'healthy').catch(() => 'unhealthy');

  res.status(200).json({
    status: 'operational',
    version: process.env.APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      cache: redisStatus,
      platform: 'EduCode K-12',
    },
    uptime: process.uptime(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const API_BASE = '/api/v1';

app.use(`${API_BASE}/auth`, authRoutes);
app.use(`${API_BASE}/users`, userRoutes);
app.use(`${API_BASE}/courses`, courseRoutes);
app.use(`${API_BASE}/projects`, projectRoutes);
app.use(`${API_BASE}/classrooms`, classroomRoutes);
app.use(`${API_BASE}/code`, codeRoutes);
app.use(`${API_BASE}/hardware`, hardwareRoutes);
app.use(`${API_BASE}/ai`, aiRoutes);
app.use(`${API_BASE}/analytics`, analyticsRoutes);
app.use(`${API_BASE}/simulation`, simulationRoutes);
app.use(`${API_BASE}/admin`, adminRoutes);
app.use(`${API_BASE}/progress`, progressRoutes);

// ─── Socket Handlers ──────────────────────────────────────────────────────────
socketManager.initialize(io);

// ─── Scheduled Jobs ───────────────────────────────────────────────────────────
cron.schedule('0 2 * * *', async () => {
  logger.info('Running daily analytics aggregation...');
  const AnalyticsService = require('./services/analyticsService');
  await AnalyticsService.aggregateDailyMetrics();
});

cron.schedule('*/15 * * * *', async () => {
  const SessionService = require('./services/sessionService');
  await SessionService.cleanExpiredSessions();
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Server Startup ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await database.connect();
    logger.info('✅ MongoDB connected successfully');

    await redis.connect();
    logger.info('✅ Redis connected successfully');

    server.listen(PORT, () => {
      logger.info(`🚀 EduCode Platform Server running on port ${PORT}`);
      logger.info(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API Base: ${API_BASE}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    await database.disconnect();
    await redis.quit();
    logger.info('Server closed.');
    process.exit(0);
  });
});

startServer();

module.exports = { app, server, io };