const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Health check for hardware gateway
router.get('/status', (req, res) => {
    res.json({ success: true, status: 'operational', devicesConnected: 0 });
});

module.exports = router;
