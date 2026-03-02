/**
 * Project Model
 * Stores student/teacher coding projects across all supported languages
 */

const mongoose = require('mongoose');

const blockDefinitionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  x: Number,
  y: Number,
  fields: mongoose.Schema.Types.Mixed,
  inputs: mongoose.Schema.Types.Mixed,
  next: mongoose.Schema.Types.Mixed,
  collapsed: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  comment: String,
}, { _id: false });

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  language: {
    type: String,
    enum: ['python', 'micropython', 'c', 'cpp', 'arduino', 'javascript', 'blocks', 'xml'],
    required: true,
  },
  content: { type: String, default: '' },
  isMain: { type: Boolean, default: false },
  mimeType: { type: String },
  encoding: { type: String, default: 'utf-8' },
  size: { type: Number, default: 0 },
}, { _id: false, timestamps: true });

const versionSchema = new mongoose.Schema({
  version: { type: Number, required: true },
  files: [fileSchema],
  blockXml: { type: String }, // Blockly XML state
  generatedCode: { type: String }, // Auto-generated from blocks
  commitMessage: { type: String },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  snapshot: { type: String }, // Screenshot/thumbnail
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const runResultSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  output: { type: String },
  errors: { type: String },
  executionTime: { type: Number }, // milliseconds
  exitCode: { type: Number },
  memoryUsed: { type: Number }, // bytes
  language: { type: String },
  hardware: {
    deviceType: String,
    deviceId: String,
    port: String,
  },
}, { _id: false });

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    thumbnail: { type: String },

    // ── Authorship ──────────────────────────────────────────────────────────
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collaborators: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['viewer', 'editor'], default: 'viewer' },
      addedAt: { type: Date, default: Date.now },
    }],

    // ── Classification ─────────────────────────────────────────────────────
    projectType: {
      type: String,
      enum: [
        'scratch_like',    // Block-based general
        'python_script',   // Text-based Python
        'micropython',     // MicroPython for ESP32/Pico
        'arduino',         // Arduino sketch
        'embedded_c',      // Embedded C
        'embedded_cpp',    // Embedded C++
        'iot_project',     // IoT with hardware
        'ai_ml',           // AI/ML experiments
        'simulation',      // Simulation only
        'web',             // Web project
      ],
      required: true,
      default: 'scratch_like',
    },
    primaryLanguage: {
      type: String,
      enum: ['blocks', 'python', 'micropython', 'c', 'cpp', 'arduino', 'javascript'],
      default: 'blocks',
    },
    tags: [{ type: String, maxlength: 30 }],
    difficulty: {
      type: String,
      enum: ['starter', 'easy', 'medium', 'hard', 'expert'],
      default: 'starter',
    },
    gradeLevel: {
      type: [String],
      enum: ['K-2', '3-5', '6-8', '9-12'],
    },
    subject: {
      type: String,
      enum: ['cs', 'math', 'science', 'art', 'music', 'language_arts', 'stem', 'robotics', 'iot', 'ai'],
    },

    // ── Code & Files ──────────────────────────────────────────────────────
    files: [fileSchema],
    blockXml: {
      type: String,
      default: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
    },
    generatedCode: { type: String }, // Code generated from blocks
    syncMode: {
      type: String,
      enum: ['blocks_primary', 'code_primary', 'bidirectional'],
      default: 'blocks_primary',
    },
    blockToCodeMappings: [{ // Maps block IDs to code line numbers
      blockId: String,
      codeRange: { start: Number, end: Number },
    }],

    // ── Version Control ───────────────────────────────────────────────────
    versions: [versionSchema],
    currentVersion: { type: Number, default: 1 },
    autoSaveEnabled: { type: Boolean, default: true },
    lastAutoSaveAt: { type: Date },

    // ── Hardware Configuration ─────────────────────────────────────────────
    hardware: {
      targetDevice: {
        type: String,
        enum: ['none', 'esp32', 'esp8266', 'arduino_uno', 'arduino_mega', 'raspberry_pi', 'micro_bit', 'makey_makey'],
        default: 'none',
      },
      pinMapping: mongoose.Schema.Types.Mixed,
      libraries: [{ name: String, version: String }],
      flashSettings: {
        baudRate: { type: Number, default: 115200 },
        port: String,
      },
      sensors: [{
        type: { type: String },
        pin: Number,
        name: String,
      }],
    },

    // ── Execution History ─────────────────────────────────────────────────
    runHistory: {
      type: [runResultSchema],
      default: [],
      select: false,
    },
    lastRunAt: { type: Date },
    totalRuns: { type: Number, default: 0 },

    // ── Classroom / Assignment ─────────────────────────────────────────────
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
    isSubmitted: { type: Boolean, default: false },
    submittedAt: { type: Date },
    grade: {
      score: Number,
      maxScore: Number,
      feedback: String,
      gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      gradedAt: Date,
    },

    // ── AI Assistance Tracking ─────────────────────────────────────────────
    aiAssistance: {
      suggestionsAccepted: { type: Number, default: 0 },
      hintsUsed: { type: Number, default: 0 },
      debugHelpUsed: { type: Number, default: 0 },
      aiGeneratedLines: { type: Number, default: 0 },
      totalLines: { type: Number, default: 0 },
    },

    // ── Visibility & Sharing ──────────────────────────────────────────────
    visibility: {
      type: String,
      enum: ['private', 'classroom', 'school', 'public'],
      default: 'private',
    },
    isTemplate: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    forkOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    forksCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },

    // ── Simulation Config ─────────────────────────────────────────────────
    simulation: {
      enabled: { type: Boolean, default: false },
      environment: {
        type: String,
        enum: ['none', 'wokwi', 'custom', 'physics2d', 'turtle'],
        default: 'none',
      },
      config: mongoose.Schema.Types.Mixed,
    },

    // ── Status ────────────────────────────────────────────────────────────
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    isModerationFlagged: { type: Boolean, default: false },
    moderationNote: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
projectSchema.index({ authorId: 1, isDeleted: 1 });
projectSchema.index({ classroomId: 1, assignmentId: 1 });
projectSchema.index({ visibility: 1, isActive: 1, isFeatured: 1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ primaryLanguage: 1, gradeLevel: 1 });
projectSchema.index({ 'collaborators.userId': 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ title: 'text', description: 'text', tags: 'text' });

// ── Virtuals ──────────────────────────────────────────────────────────────────
projectSchema.virtual('totalLines').get(function () {
  return this.files.reduce((sum, f) => sum + (f.content?.split('\n').length || 0), 0);
});

projectSchema.virtual('mainFile').get(function () {
  return this.files.find(f => f.isMain) || this.files[0];
});

// ── Methods ───────────────────────────────────────────────────────────────────
projectSchema.methods.createVersion = async function (authorId, message) {
  this.versions.push({
    version: this.currentVersion + 1,
    files: this.files,
    blockXml: this.blockXml,
    generatedCode: this.generatedCode,
    commitMessage: message || `Auto-save v${this.currentVersion + 1}`,
    authorId,
    createdAt: new Date(),
  });
  this.currentVersion += 1;

  // Keep only last 50 versions
  if (this.versions.length > 50) {
    this.versions = this.versions.slice(-50);
  }

  return this.save();
};

projectSchema.methods.addRunResult = async function (result) {
  this.runHistory.unshift(result);
  if (this.runHistory.length > 100) {
    this.runHistory = this.runHistory.slice(0, 100);
  }
  this.totalRuns += 1;
  this.lastRunAt = new Date();
  return this.save();
};

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;