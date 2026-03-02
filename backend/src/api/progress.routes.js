const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');

// Award XP to a user
router.post('/award-xp', async (req, res, next) => {
    try {
        const { userId, amount, reason } = req.body;
        const result = await analyticsService.awardXP(userId, amount, reason);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
