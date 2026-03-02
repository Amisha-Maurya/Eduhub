/**
 * Classroom Model
 * Manages clusters of students, assignments, and teacher oversight
 */

const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            maxlength: 500,
        },
        code: {
            type: String,
            unique: true,
            required: true,
            uppercase: true,
            trim: true,
        },
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        students: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        subject: {
            type: String,
            enum: ['cs', 'robotics', 'iot', 'ai', 'general'],
            default: 'cs',
        },
        gradeLevel: {
            type: String,
            enum: ['K-2', '3-5', '6-8', '9-12'],
        },
        status: {
            type: String,
            enum: ['active', 'archived'],
            default: 'active',
        },
        settings: {
            allowStudentChat: { type: Boolean, default: true },
            allowPublicProjects: { type: Boolean, default: false },
            requireApproval: { type: Boolean, default: false },
        },
    },
    {
        timestamps: true,
    }
);

// Generate unique join code before saving
classroomSchema.pre('validate', async function (next) {
    if (!this.code) {
        this.code = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    next();
});

const Classroom = mongoose.model('Classroom', classroomSchema);
module.exports = Classroom;
