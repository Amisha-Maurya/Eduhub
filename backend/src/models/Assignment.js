/**
 * Assignment Model
 * Represents tasks or homework issued to a classroom
 */

const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String
        },
        classroomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Classroom',
            required: true
        },
        dueDate: {
            type: Date
        },
        points: {
            type: Number,
            default: 100
        },
        starterCode: {
            type: String
        },
        language: {
            type: String,
            enum: ['blocks', 'python', 'arduino', 'cpp'],
            default: 'blocks'
        },
        status: {
            type: String,
            enum: ['draft', 'published', 'closed'],
            default: 'published'
        }
    },
    {
        timestamps: true
    }
);

const Assignment = mongoose.model('Assignment', assignmentSchema);
module.exports = Assignment;
