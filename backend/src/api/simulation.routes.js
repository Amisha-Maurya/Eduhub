const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date(),
        version: '2.0.0-premium'
    });
});

module.exports = router;
