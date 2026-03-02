const express = require('express');
const router = express.Router();
const User = require('../models/User');

// System stats for admin
router.get('/stats', async (req, res, next) => {
    try {
        const userCount = await User.countDocuments();
        res.json({ success: true, stats: { totalUsers: userCount } });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
