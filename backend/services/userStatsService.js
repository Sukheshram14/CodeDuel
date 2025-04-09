const User = require('../models/User');

class UserStatsService {
    // Update match statistics
    static async updateMatchStats(userId, isWin) {
        const update = {
            $inc: {
                'stats.totalMatches': 1,
                'stats.wins': isWin ? 1 : 0,
                'stats.losses': isWin ? 0 : 1
            }
        };

        // Update ELO rating
        const user = await User.findById(userId);
        const currentElo = user.stats.rank;
        const eloChange = isWin ? 25 : -25; // Simple ELO calculation
        update.$inc['stats.rank'] = eloChange;

        // Check for achievements
        const achievements = [];
        if (isWin && user.stats.wins === 0) {
            achievements.push('first_win');
        }
        if (user.stats.wins >= 10) {
            achievements.push('code_master');
        }
        if (user.stats.wins >= 5 && user.stats.losses === 0) {
            achievements.push('winning_streak');
        }

        if (achievements.length > 0) {
            update.$addToSet = {
                achievements: { $each: achievements }
            };
        }

        return User.findByIdAndUpdate(userId, update, { new: true });
    }

    // Update preferred language
    static async updatePreferredLanguage(userId, language) {
        return User.findByIdAndUpdate(
            userId,
            { 'stats.preferredLanguage': language },
            { new: true }
        );
    }

    // Get user statistics
    static async getUserStats(userId) {
        return User.findById(userId)
            .select('stats achievements MockCoinsBalance')
            .lean();
    }

    // Calculate win ratio
    static calculateWinRatio(stats) {
        if (stats.totalMatches === 0) return 0;
        return (stats.wins / stats.totalMatches) * 100;
    }
}

module.exports = UserStatsService; 