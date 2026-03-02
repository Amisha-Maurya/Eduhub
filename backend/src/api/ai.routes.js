const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

// Ask AI for help (non-streaming endpoint)
router.post('/ask', async (req, res, next) => {
    try {
        const { question, code, language, type, context, userId } = req.body;

        const response = await aiService.getResponse({
            question,
            code,
            language,
            type, // 'hint', 'debug', 'explain'
            context,
            userId
        });

        res.status(200).json({
            success: true,
            data: response
        });
    } catch (error) {
        next(error);
    }
});

// Auto-grade submission
router.post('/grade', async (req, res, next) => {
    try {
        const { code, language, requirements, rubric, gradeLevel } = req.body;

        const feedback = await aiService.gradeSubmission({
            code,
            language,
            requirements,
            rubric,
            gradeLevel
        });

        res.status(200).json({
            success: true,
            data: feedback
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
