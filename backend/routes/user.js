const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

// Get user statistics
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        console.log('Fetching stats for user:', req.userId);
        
        // First, verify the user exists and populate opponent usernames
        const user = await User.findById(req.userId)
            .populate({
                path: 'matchHistory.opponent',
                select: 'username'
            });

        if (!user) {
            console.error('User not found:', req.userId);
            return res.status(404).json({ message: 'User not found' });
        }

        // Calculate win ratio
        const winRatio = user.stats.totalMatches > 0 
            ? (user.stats.wins / user.stats.totalMatches) * 100 
            : 0;

        // Get recent matches with opponent usernames
        const recentMatches = user.matchHistory
            .sort((a, b) => b.date - a.date)
            .slice(0, 5)
            .map(match => {
                const matchObj = match.toObject();
                console.log('Match object:', matchObj); // Debug log
                return {
                    ...matchObj,
                    opponentName: matchObj.opponent?.username || 'Unknown Opponent'
                };
            });

        // Prepare response
        const response = {
            stats: {
                ...user.stats,
                winRatio
            },
            achievements: user.achievements,
            MockCoinsBalance: user.MockCoinsBalance,
            recentMatches,
            matchHistory: user.matchHistory.map(match => {
                const matchObj = match.toObject();
                return {
                    ...matchObj,
                    opponentName: matchObj.opponent?.username || 'Unknown Opponent'
                };
            })
        };

        console.log('Stats retrieved:', JSON.stringify(response, null, 2)); // Debug log
        res.json(response);
    } catch (error) {
        console.error('Error in /stats endpoint:', error);
        res.status(500).json({ 
            message: 'Error fetching user statistics',
            error: error.message 
        });
    }
});

// Update match statistics
router.post('/match-complete', authMiddleware, async (req, res) => {
    try {
        const matchData = {
            isWin: req.body.isWin,
            timeSpent: req.body.timeSpent,
            language: req.body.language,
            opponent: req.body.opponent,
            coinsEarned: req.body.coinsEarned || (req.body.isWin ? 50 : 10)
        };

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.updateMatchStats(matchData);
        res.json({
            message: 'Match statistics updated successfully',
            user: {
                stats: user.stats,
                achievements: user.achievements,
                MockCoinsBalance: user.MockCoinsBalance
            }
        });
    } catch (error) {
        console.error('Error updating match statistics:', error);
        res.status(500).json({ message: 'Error updating match statistics' });
    }
});

// Update preferred language
router.put('/preferred-language', authMiddleware, async (req, res) => {
    try {
        const { language } = req.body;
        if (!['javascript', 'python', 'php', 'c++'].includes(language)) {
            return res.status(400).json({ message: 'Invalid programming language' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user has used multiple languages successfully
        const uniqueLanguages = new Set(user.matchHistory
            .filter(match => match.result === 'win')
            .map(match => match.language)
        );

        user.stats.preferredLanguage = language;
        
        // Award language master achievement if applicable
        if (uniqueLanguages.size >= 3 && !user.achievements.includes('language_master')) {
            user.achievements.push('language_master');
        }

        await user.save();
        res.json({
            stats: user.stats,
            achievements: user.achievements
        });
    } catch (error) {
        console.error('Error updating preferred language:', error);
        res.status(500).json({ message: 'Error updating preferred language' });
    }
});

// Get match history
router.get('/match-history', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const matchHistory = user.matchHistory
            .sort((a, b) => b.date - a.date)
            .map(match => ({
                ...match.toObject(),
                date: match.date.toISOString()
            }));

        res.json({ matchHistory });
    } catch (error) {
        console.error('Error fetching match history:', error);
        res.status(500).json({ message: 'Error fetching match history' });
    }
});

module.exports = router; 