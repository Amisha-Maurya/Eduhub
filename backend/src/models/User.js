/**
 * User Model
 * COPPA & FERPA compliant data model for K-12 students, teachers, parents, admins
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    // ── Core Identity ──────────────────────────────────────────────────────
    email: {
      type: String,
      required: function () { return this.role !== 'student' || this.age >= 13; },
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-zA-Z0-9_-]+$/, 'Username may only contain alphanumeric characters, underscores, and hyphens'],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    avatar: {
      type: String,
      default: null,
    },
    avatarStyle: {
      type: String,
      enum: ['pixel', 'cartoon', 'robot', 'animal'],
      default: 'robot', // Non-photo avatars for child safety
    },

    // ── Role & Permissions ────────────────────────────────────────────────
    role: {
      type: String,
      enum: ['student', 'teacher', 'parent', 'school_admin', 'platform_admin'],
      required: true,
      default: 'student',
    },
    permissions: {
      canCreateCourse: { type: Boolean, default: false },
      canManageClassroom: { type: Boolean, default: false },
      canViewReports: { type: Boolean, default: false },
      canAccessHardware: { type: Boolean, default: false },
      canUseAI: { type: Boolean, default: true },
      maxProjectsPerMonth: { type: Number, default: 50 },
    },

    // ── COPPA Compliance (Children's Online Privacy Protection Act) ────────
    dateOfBirth: {
      type: Date,
      required: function () { return this.role === 'student'; },
    },
    age: {
      type: Number,
    },
    isCoppaMinor: {
      type: Boolean,
      default: false,
    },
    parentalConsent: {
      given: { type: Boolean, default: false },
      parentEmail: { type: String },
      consentDate: { type: Date },
      consentMethod: {
        type: String,
        enum: ['email_verified', 'teacher_enrolled', 'form_signed'],
      },
      consentToken: { type: String, select: false },
    },

    // ── School & Organization ─────────────────────────────────────────────
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
    },
    gradeLevel: {
      type: String,
      enum: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    },
    classrooms: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
    }],
    teacherOf: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
    }],
    parentOf: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],

    // ── Learning Profile ──────────────────────────────────────────────────
    learningProfile: {
      preferredLanguage: {
        type: String,
        enum: ['blocks', 'python', 'micropython', 'c', 'cpp', 'arduino', 'javascript'],
        default: 'blocks',
      },
      currentLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'beginner',
      },
      xpPoints: { type: Number, default: 0 },
      badges: [{ type: String }],
      streak: { type: Number, default: 0 },
      lastActiveDate: { type: Date },
      totalCodingMinutes: { type: Number, default: 0 },
      completedProjects: { type: Number, default: 0 },
      aiInteractions: { type: Number, default: 0 },
    },

    // ── Accessibility & Preferences ───────────────────────────────────────
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'high_contrast'], default: 'light' },
      fontSize: { type: String, enum: ['small', 'medium', 'large', 'xlarge'], default: 'medium' },
      language: { type: String, default: 'en' },
      notifications: {
        email: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
        parentDigest: { type: Boolean, default: false },
      },
      accessibility: {
        screenReader: { type: Boolean, default: false },
        colorBlindMode: { type: String, enum: ['none', 'deuteranopia', 'protanopia', 'tritanopia'], default: 'none' },
        reducedMotion: { type: Boolean, default: false },
        highContrast: { type: Boolean, default: false },
      },
    },

    // ── Security & Auth ───────────────────────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpiry: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },
    passwordChangedAt: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    lastLoginAt: { type: Date },
    lastLoginIP: { type: String },
    activeSessions: [{
      sessionId: String,
      deviceInfo: String,
      ipAddress: String,
      createdAt: Date,
      expiresAt: Date,
    }],

    // ── Account Status ────────────────────────────────────────────────────
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    suspendedUntil: { type: Date },
    suspensionReason: { type: String },

    // ── Data Privacy ──────────────────────────────────────────────────────
    dataRetentionPolicy: {
      type: String,
      enum: ['standard', 'coppa_restricted', 'gdpr_restricted'],
      default: 'standard',
    },
    dataExportRequested: { type: Boolean, default: false },
    deletionRequested: { type: Boolean, default: false },
    deletionRequestedAt: { type: Date },
    privacyPolicyAccepted: { type: Boolean, default: false },
    privacyPolicyVersion: { type: String },
    termsAccepted: { type: Boolean, default: false },
    termsVersion: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ username: 1 });
userSchema.index({ schoolId: 1, role: 1 });
userSchema.index({ 'learningProfile.xpPoints': -1 });
userSchema.index({ isActive: 1, role: 1 });

// ── Virtuals ──────────────────────────────────────────────────────────────────
userSchema.virtual('isLocked').get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

userSchema.virtual('projects', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'authorId',
});

// ── Pre-save Hooks ────────────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000;
    }
  }

  // Calculate age and COPPA status
  if (this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    this.age = today.getFullYear() - birthDate.getFullYear();
    this.isCoppaMinor = this.age < 13;

    if (this.isCoppaMinor) {
      this.dataRetentionPolicy = 'coppa_restricted';
      // COPPA: no direct email collection for under-13
      if (this.email && this.role === 'student') {
        this.email = undefined;
      }
    }
  }

  // Set permissions based on role
  if (this.isModified('role')) {
    this.permissions = getPermissionsByRole(this.role);
  }

  next();
});

function getPermissionsByRole(role) {
  const permissionMap = {
    student: {
      canCreateCourse: false,
      canManageClassroom: false,
      canViewReports: false,
      canAccessHardware: true,
      canUseAI: true,
      maxProjectsPerMonth: 50,
    },
    teacher: {
      canCreateCourse: true,
      canManageClassroom: true,
      canViewReports: true,
      canAccessHardware: true,
      canUseAI: true,
      maxProjectsPerMonth: 500,
    },
    parent: {
      canCreateCourse: false,
      canManageClassroom: false,
      canViewReports: true,
      canAccessHardware: false,
      canUseAI: false,
      maxProjectsPerMonth: 0,
    },
    school_admin: {
      canCreateCourse: true,
      canManageClassroom: true,
      canViewReports: true,
      canAccessHardware: true,
      canUseAI: true,
      maxProjectsPerMonth: 1000,
    },
    platform_admin: {
      canCreateCourse: true,
      canManageClassroom: true,
      canViewReports: true,
      canAccessHardware: true,
      canUseAI: true,
      maxProjectsPerMonth: -1,
    },
  };
  return permissionMap[role] || permissionMap.student;
}

// ── Instance Methods ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

userSchema.methods.createEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $unset: { lockUntil: 1 }, $set: { loginAttempts: 1 } });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 60 * 60 * 1000 }; // Lock 1 hour
  }
  return this.updateOne(updates);
};

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.emailVerificationToken;
  delete obj.twoFactorSecret;
  delete obj.parentalConsent?.consentToken;
  return obj;
};

// ── Static Methods ────────────────────────────────────────────────────────────
userSchema.statics.findByEmailOrUsername = function (identifier) {
  return this.findOne({
    $or: [{ email: identifier }, { username: identifier }],
    isActive: true,
    isDeleted: false,
  }).select('+password');
};

const User = mongoose.model('User', userSchema);
module.exports = User;