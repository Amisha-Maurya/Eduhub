const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Register a new user
router.post('/register', async (req, res, next) => {
    try {
        const { email, username, password, displayName, role, dateOfBirth } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const user = await User.create({
            email,
            username,
            password,
            displayName,
            role,
            dateOfBirth
        });

        const token = jwt.sign({ id: user._id, role: user.role, displayName: user.displayName }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        });

        res.status(201).json({
            success: true,
            token,
            data: user.toSafeJSON()
        });
    } catch (error) {
        next(error);
    }
});

// Login user
router.post('/login', async (req, res, next) => {
    try {
        const { identifier, password } = req.body;

        const user = await User.findByEmailOrUsername(identifier);
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, role: user.role, displayName: user.displayName }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        });

        user.lastLoginAt = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            token,
            data: user.toSafeJSON()
        });
    } catch (error) {
        next(error);
    }
});

// Get current user profile
router.get('/me', async (req, res, next) => {
    try {
        // This would normally use an auth middleware
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: user.toSafeJSON()
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
