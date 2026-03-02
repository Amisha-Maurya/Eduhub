const express = require('express');
const router = express.Router();
const Classroom = require('../models/Classroom');
const User = require('../models/User');
const logger = require('../utils/logger');

// Create a new classroom (Teacher only)
router.post('/', async (req, res, next) => {
    try {
        const { name, description, subject, gradeLevel, teacherId } = req.body;

        const classroom = await Classroom.create({
            name,
            description,
            subject,
            gradeLevel,
            teacherId
        });

        // Update teacher's record
        await User.findByIdAndUpdate(teacherId, {
            $push: { teacherOf: classroom._id }
        });

        res.status(201).json({
            success: true,
            data: classroom
        });
    } catch (error) {
        next(error);
    }
});

// Join a classroom using code (Student)
router.post('/join', async (req, res, next) => {
    try {
        const { code, userId } = req.body;

        const classroom = await Classroom.findOne({ code, status: 'active' });
        if (!classroom) {
            return res.status(404).json({ success: false, message: 'Classroom not found or inactive' });
        }

        // Check if already in class
        if (classroom.students.includes(userId)) {
            return res.status(400).json({ success: false, message: 'Already a member of this classroom' });
        }

        classroom.students.push(userId);
        await classroom.save();

        // Update student's record
        await User.findByIdAndUpdate(userId, {
            $push: { classrooms: classroom._id }
        });

        res.status(200).json({
            success: true,
            data: classroom
        });
    } catch (error) {
        next(error);
    }
});

// Get all classrooms for a user
router.get('/', async (req, res, next) => {
    try {
        const { userId, role } = req.query;

        let query = {};
        if (role === 'teacher') {
            query = { teacherId: userId };
        } else {
            query = { students: userId };
        }

        const classrooms = await Classroom.find(query).populate('teacherId', 'displayName avatar');

        res.status(200).json({
            success: true,
            data: classrooms
        });
    } catch (error) {
        next(error);
    }
});

// Get single classroom with students
router.get('/:id', async (req, res, next) => {
    try {
        const classroom = await Classroom.findById(req.params.id)
            .populate('students', 'displayName avatar username learningProfile')
            .populate('teacherId', 'displayName avatar');

        if (!classroom) {
            return res.status(404).json({ success: false, message: 'Classroom not found' });
        }

        res.status(200).json({
            success: true,
            data: classroom
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
