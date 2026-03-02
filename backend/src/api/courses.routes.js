const express = require('express');
const router = express.Router();
const Classroom = require('../models/Classroom');
const Assignment = require('../models/Assignment');

router.get('/my-courses', async (req, res, next) => {
    try {
        const classrooms = await Classroom.find({ status: 'active' }).limit(10);
        res.json({ success: true, data: classrooms });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
