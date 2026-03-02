/**
 * Analytics Service
 * Handles XP calculation, badge awarding, and student progress tracking
 */

const User = require('../models/User');
const logger = require('../utils/logger');

class AnalyticsService {
    /**
     * Award XP and check for level-ups/badges
     */
    async awardXP(userId, amount, reason) {
        try {
            const user = await User.findById(userId);
            if (!user) return;

            const oldXP = user.learningProfile.xpPoints || 0;
            const newXP = oldXP + amount;

            user.learningProfile.xpPoints = newXP;

            // Check for milestones/badges
            const newBadges = [];

            if (newXP >= 100 && !user.learningProfile.badges.includes('coding_novice')) {
                newBadges.push('coding_novice');
            }
            if (newXP >= 1000 && !user.learningProfile.badges.includes('logic_master')) {
                newBadges.push('logic_master');
            }

            if (newBadges.length > 0) {
                user.learningProfile.badges.push(...newBadges);
            }

            await user.save();

            logger.info(`Awarded ${amount} XP to ${userId} for ${reason}`);

            return {
                xpGained: amount,
                totalXP: newXP,
                newBadges
            };
        } catch (error) {
            logger.error('Error awarding XP:', error);
        }
    }

    /**
     * Aggregate daily metrics for classroom overview
     */
    async aggregateDailyMetrics() {
        // This would be run by a cron job
        logger.info('Aggregating daily metrics...');
    }
}

module.exports = new AnalyticsService();
