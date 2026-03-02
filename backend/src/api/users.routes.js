const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Update user profile
router.put('/:id', async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, data: user.toSafeJSON() });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
