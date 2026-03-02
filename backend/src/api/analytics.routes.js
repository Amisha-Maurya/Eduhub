const express = require('express');
const router = express.Router();
const Classroom = require('../models/Classroom');

router.get('/class-performance/:id', async (req, res, next) => {
    try {
        res.json({ success: true, metrics: { avgXp: 1200, completionRate: 64 } });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
