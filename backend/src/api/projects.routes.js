const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const logger = require('../utils/logger');

// Get all projects for a user
router.get('/', async (req, res, next) => {
    try {
        const userId = req.query.userId; // In real app, get from auth middleware
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID required' });
        }

        const projects = await Project.find({ authorId: userId, isDeleted: false })
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        next(error);
    }
});

// Create a new project
router.post('/', async (req, res, next) => {
    try {
        const { title, description, projectType, primaryLanguage, authorId } = req.body;

        const project = await Project.create({
            title,
            description,
            projectType,
            primaryLanguage,
            authorId
        });

        res.status(201).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
});

// Get single project
router.get('/:id', async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project || project.isDeleted) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
});

// Update project
router.put('/:id', async (req, res, next) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
