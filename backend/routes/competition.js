const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { Competition, Challenge, User, Transaction } = require('../models');
const mongoose = require('mongoose');
const axios = require('axios');
const socketService = require('../services/socket');
const judge0Service = require('../services/judge0Service');
const rewardService = require('../services/rewardService');

// Get random challenge
const getRandomChallenge = async () => {
    const count = await Challenge.countDocuments();
    const random = Math.floor(Math.random() * count);
    return Challenge.findOne().skip(random);
};
// Define the updateBalance function
const updateBalance = async (userId, amount, type) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        if (type === 'credit') {
            user.MockCoinsBalance += amount;
        } else if (type === 'debit') {
            if (user.MockCoinsBalance < amount) {
                throw new Error('Insufficient balance');
            }
            user.MockCoinsBalance -= amount;
        } else {
            throw new Error('Invalid transaction type');
        }

        await user.save();
        return user.MockCoinsBalance;
    } catch (error) {
        console.error('Error updating balance:', error);
        throw error;
    }
};

// Add a helper function to map language IDs to language identifiers
const getLanguageIdentifier = (languageId) => {
    const languageMap = {
        63: "javascript",
        71: "python",
        68: "php",
        52: "cpp"
    };
    return languageMap[languageId] || "javascript"; // Default to javascript
};

// Start competition
router.post('/start', authMiddleware, async (req, res) => {
    try {
        const { entryFee } = req.body;
        
        // Validate entry fee
        if (!entryFee || entryFee < 0) {
            return res.status(400).json({ message: 'Invalid entry fee' });
        }

        // Check user balance
        const user = await User.findById(req.userId);
        if (!user || user.MockCoinsBalance < entryFee) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Deduct entry fee
        user.MockCoinsBalance -= entryFee;
        await user.save();

        res.json({ message: 'Successfully entered matchmaking' });
    } catch (error) {
        console.error('Error starting competition:', error);
        res.status(500).json({ message: error.message });
    }
});

// Add a new route for running code without submitting
router.post('/run', authMiddleware, async (req, res) => {
    try {
        const { code, language: languageId, problemId } = req.body;
        
        // Map language ID to language identifier
        const language = getLanguageIdentifier(languageId);
        
        // Get problem to determine the input type
        const challenge = await Challenge.findById(problemId);
        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }
        
        // Get the problem type from the challenge or default to "string"
        const problemType = challenge.inputType || "string";
        
        // Prepare code with boilerplate
        const preparedCode = judge0Service.prepareCode(code, language, problemType);
        
        // Execute code with Judge0 (using a sample test case)
        const sampleTestCase = challenge.testCases.find(tc => !tc.isHidden) || { input: '', expectedOutput: '' };
        
        const result = await judge0Service.submitToJudge0(
            preparedCode,
            language,
            sampleTestCase.input,
            sampleTestCase.expectedOutput
        );
        
        res.json({
            status: result.status,
            stdout: result.stdout,
            stderr: result.stderr,
            compile_output: result.compile_output
        });

    } catch (error) {
        console.error('Code execution error:', error);
        res.status(500).json({ 
            message: 'Error executing code', 
            error: error.message 
        });
    }
});

// Update the winner determination logic
const determineWinner = (players) => {
    if (players.some(p => !p.submissionTime)) {
        return null;
    }

    const [player1, player2] = players;
    
    // First Priority: Test case pass/fail
    const player1Passed = player1.status?.id === 3;
    const player2Passed = player2.status?.id === 3;

    console.log('Comparing solutions:', {
        player1: {
            id: player1.userId._id.toString(),
            passed: player1Passed,
            time: player1.time,
            memory: player1.memory,
            codingTime: player1.codingTime,
            tabSwitches: player1.tabSwitches
        },
        player2: {
            id: player2.userId._id.toString(),
            passed: player2Passed,
            time: player2.time,
            memory: player2.memory,
            codingTime: player2.codingTime,
            tabSwitches: player2.tabSwitches
        }
    });

    // First Priority: Test Cases
    if (player1Passed !== player2Passed) {
        console.log('Winner determined by test case pass/fail');
        return player1Passed ? player1.userId._id : player2.userId._id;
    }

    // If both passed or both failed, continue with other criteria
    const getMetricWinner = (metric1, metric2, player1Id, player2Id, metricName) => {
        if (metric1 !== metric2) {
            console.log(`Winner determined by ${metricName}`);
            return metric1 < metric2 ? player1Id : player2Id;
        }
        return null;
    };

    // // Second Priority: Execution Time
    // const timeWinner = getMetricWinner(
    //     player1.time || 0,
    //     player2.time || 0,
    //     player1.userId._id,
    //     player2.userId._id,
    //     'execution time'
    // );
    // if (timeWinner) return timeWinner;

    // // Third Priority: Memory Usage
    // const memoryWinner = getMetricWinner(
    //     player1.memory || 0,
    //     player2.memory || 0,
    //     player1.userId._id,
    //     player2.userId._id,
    //     'memory usage'
    // );
    // if (memoryWinner) return memoryWinner;

    // Fourth Priority: Coding Time
    const codingTimeWinner = getMetricWinner(
        player1.codingTime || 0,
        player2.codingTime || 0,
        player1.userId._id,
        player2.userId._id,
        'coding time'
    );
    if (codingTimeWinner) return codingTimeWinner;

    // Fifth Priority: Tab Switches
    const tabSwitchesWinner = getMetricWinner(
        player1.tabSwitches || 0,
        player2.tabSwitches || 0,
        player1.userId._id,
        player2.userId._id,
        'tab switches'
    );
    if (tabSwitchesWinner) return tabSwitchesWinner;

    // If everything is equal (very unlikely), return player with better overall score
    const player1Score = calculateScore(player1);
    const player2Score = calculateScore(player2);
    
    console.log('Determining winner by overall score:', {
        player1Score,
        player2Score
    });
    
    return player1Score >= player2Score ? player1.userId._id : player2.userId._id;
};

// Update the score calculation to be more precise
const calculateScore = (player) => {
//     let score = 1000;

//     // Execution time has highest weight (40%)
//    // score -= (player.time / 0.1) * 40;
    
//     // // Memory usage (30%)
//     // score -= (player.memory / 1000) * 30;
    
//     // // Coding time (20%)
//      score -= (player.codingTime / 60) * 40;
    
//     // Tab switches (10%)
//     score -= player.tabSwitches * 60;

//     return Math.max(0, Math.round(score));

let score = 1000;
score -= (player.codingTime / 60) * 60;
score -= player.tabSwitches * 40;
return Math.max(0, Math.round(score));

};

// Update the submit route with better error handling
router.post('/submit', authMiddleware, async (req, res) => {
    try {
        const { code, language: languageId, competitionId, codingTime, tabSwitches } = req.body;
        
        // Map language ID to language identifier
        const language = getLanguageIdentifier(languageId);

        // Find competition
        const competition = await Competition.findById(competitionId).populate('challenge');
        if (!competition) {
            return res.status(404).json({ message: 'Competition not found' });
        }

        // Find player index
        const playerIndex = competition.players.findIndex(
            p => p.userId.toString() === req.userId
        );

        if (playerIndex === -1) {
            return res.status(403).json({ message: 'You are not part of this competition' });
        }

        // Check if user has already submitted
        if (competition.players[playerIndex].submissionTime) {
            return res.status(400).json({ message: 'You have already submitted your solution' });
        }
        
        // Get problem type from challenge
        const problemType = competition.challenge.inputType || "string";
        
        // Get a non-hidden test case to use for judging
        const testCase = competition.challenge.testCases.find(tc => !tc.isHidden);
        if (!testCase) {
            return res.status(500).json({ message: 'No test cases available for this challenge' });
        }

        try {
            // Prepare the code with boilerplate
            const preparedCode = judge0Service.prepareCode(code, language, problemType);
            
            // Submit to Judge0
            const result = await judge0Service.submitToJudge0(
                preparedCode,
                language,
                testCase.input,
                testCase.expectedOutput
            );

            // Update player submission - ensure status is always an object
            competition.players[playerIndex].code = code;
            // Make sure status is always an object with id and description
            competition.players[playerIndex].status = {
                id: result.status?.id || 0,
                description: result.status?.description || "Unknown"
            };
            competition.players[playerIndex].memory = result.memory || 0;
            competition.players[playerIndex].time = result.time || 0;
            competition.players[playerIndex].codingTime = codingTime || 0;
            competition.players[playerIndex].tabSwitches = tabSwitches || 0;
            competition.players[playerIndex].language = languageId; // Store the language ID
            competition.players[playerIndex].submissionTime = new Date();

            await competition.save();

            // Check if both players have submitted
            const bothSubmitted = competition.players.every(p => p.submissionTime);
            
            if (bothSubmitted) {
                // Calculate scores
                const player1 = {
                    userId: competition.players[0].userId,
                    time: competition.players[0].time || 0,
                    memory: competition.players[0].memory || 0,
                    codingTime: competition.players[0].codingTime || 0,
                    tabSwitches: competition.players[0].tabSwitches || 0,
                    score: 0,
                    status: competition.players[0].status
                };
                
                const player2 = {
                    userId: competition.players[1].userId,
                    time: competition.players[1].time || 0,
                    memory: competition.players[1].memory || 0,
                    codingTime: competition.players[1].codingTime || 0,
                    tabSwitches: competition.players[1].tabSwitches || 0,
                    score: 0,
                    status: competition.players[1].status
                };
                
                // Calculate scores
                player1.score = calculateScore(player1);
                player2.score = calculateScore(player2);
                
                console.log('Competition complete - both players submitted:', {
                    player1: {
                        userId: player1.userId.toString(),
                        statusId: player1.status?.id,
                        score: player1.score
                    },
                    player2: {
                        userId: player2.userId.toString(),
                        statusId: player2.status?.id,
                        score: player2.score
                    }
                });
                
                // Determine winner
                let winnerId = null;
                if (player1.status?.id === 3 && player2.status?.id !== 3) {
                    winnerId = player1.userId;
                    console.log(`Winner is player1 (${player1.userId}) because only they passed all tests`);
                } else if (player2.status?.id === 3 && player1.status?.id !== 3) {
                    winnerId = player2.userId;
                    console.log(`Winner is player2 (${player2.userId}) because only they passed all tests`);
                } else if (player1.status?.id === 3 && player2.status?.id === 3) {
                    // Both solved, compare scores
                    if (player1.score > player2.score) {
                        winnerId = player1.userId;
                        console.log(`Winner is player1 (${player1.userId}) with score ${player1.score} vs ${player2.score}`);
                    } else if (player2.score > player1.score) {
                        winnerId = player2.userId;
                        console.log(`Winner is player2 (${player2.userId}) with score ${player2.score} vs ${player1.score}`);
                    } else {
                        // Tie - choose player1 as winner
                        winnerId = player1.userId;
                        console.log(`Tie with score ${player1.score}, choosing player1 (${player1.userId}) as winner`);
                    }
                } else {
                    console.log('No winner determined - neither player passed all tests');
                }
                
                // Update competition with results
                competition.status = 'completed';
                competition.endTime = new Date();
                competition.winner = winnerId;
                await competition.save();

                // Emit results to all players with stringified user IDs for consistent comparison
                const io = socketService.getIO();
                io.in(competitionId).emit('competitionEnd', {
                    competitionId,
                    players: [
                        {
                            ...player1,
                            userId: player1.userId.toString() // Ensure userId is sent as string
                        },
                        {
                            ...player2,
                            userId: player2.userId.toString() // Ensure userId is sent as string
                        }
                    ],
                    winner: winnerId ? winnerId.toString() : null // Ensure winner ID is sent as string
                });
                
                // Process rewards
                if (winnerId) {
                    try {
                        // Get the loser ID - comparing ObjectIds correctly
                        const loserId = player1.userId.toString() === winnerId.toString() 
                            ? player2.userId 
                            : player1.userId;
                        
                        // Update match stats for both players
                        const winner = await User.findById(winnerId);
                        const loser = await User.findById(loserId);
                        
                        // Get the winner and loser's submission details
                        const winnerSubmission = competition.players.find(p => p.userId.toString() === winnerId.toString());
                        const loserSubmission = competition.players.find(p => p.userId.toString() === loserId.toString());
                        
                        if (winner && winnerSubmission) {
                            console.log('Winner language:', winnerSubmission.language, getLanguageIdentifier(winnerSubmission.language));
                            await winner.updateMatchStats({
                                isWin: true,
                                timeSpent: winnerSubmission.codingTime || 0,
                                language: getLanguageIdentifier(winnerSubmission.language),
                                opponent: loserId,
                                coinsEarned: Math.round(competition.entryFee * 1.8)
                            });
                        }
                        
                        if (loser && loserSubmission) {
                            console.log('Loser language:', loserSubmission.language, getLanguageIdentifier(loserSubmission.language));
                            await loser.updateMatchStats({
                                isWin: false,
                                timeSpent: loserSubmission.codingTime || 0,
                                language: getLanguageIdentifier(loserSubmission.language),
                                opponent: winnerId,
                                coinsEarned: 10
                            });
                        }
                        
                        // Log the current balances before reward distribution
                        try {
                            const winnerBefore = await User.findById(winnerId);
                            const loserBefore = await User.findById(loserId);
                            console.log(`PRE-REWARD BALANCES - Winner: ${winnerBefore.MockCoinsBalance} MC, Loser: ${loserBefore.MockCoinsBalance} MC`);
                        } catch (err) {
                            console.log('Could not fetch pre-reward balances:', err.message);
                        }
                        
                        // Calculate reward amount for logging
                        const rewardAmount = Math.round(competition.entryFee * 1.8);
                        console.log(`Processing rewards - Competition: ${competitionId}, Winner: ${winnerId}, Loser: ${loserId}, EntryFee: ${competition.entryFee}, RewardAmount: ${rewardAmount} MC`);
                        
                        // Distribute rewards using the service
                        const rewardResult = await rewardService.distributeRewards(
                            competitionId, 
                            winnerId, 
                            loserId
                        );
                        
                        console.log(`Reward processed successfully via service - Amount: ${rewardResult.reward} MC, New balance: ${rewardResult.newBalance} MC`);
                        
                        // Verify the balance was updated by querying the database directly
                        try {
                            const winnerAfter = await User.findById(winnerId);
                            console.log(`POST-REWARD BALANCE CHECK - Winner: ${winnerAfter.MockCoinsBalance} MC (direct DB query)`);
                        } catch (err) {
                            console.log('Could not fetch post-reward balance:', err.message);
                        }
                    } catch (serviceError) {
                        console.error('Error processing rewards through service:', serviceError);
                        
                        // Attempt to update the winner's balance directly as a fallback
                        try {
                            const winner = await User.findById(winnerId);
                            if (!winner) {
                                throw new Error(`Winner user (${winnerId}) not found`);
                            }
                            
                            const rewardAmount = Math.round(competition.entryFee * 1.8);
                            const currentBalance = Number(winner.MockCoinsBalance) || 0;
                            
                            console.log(`FALLBACK: Updating winner ${winnerId} balance directly`);
                            console.log(`Current balance: ${currentBalance} MC`);
                            console.log(`Adding reward: ${rewardAmount} MC`);
                            
                            winner.MockCoinsBalance = currentBalance + rewardAmount;
                            await winner.save();
                            
                            console.log(`FALLBACK successful: New balance is ${winner.MockCoinsBalance} MC`);
                            
                            // Also create a transaction record
                            const transaction = new Transaction({
                                userId: winnerId,
                                type: 'credit',
                                amount: rewardAmount,
                                description: `Competition reward (fallback) for winning match ${competitionId}`
                            });
                            await transaction.save();
                            console.log(`FALLBACK: Created transaction record: ${transaction._id}`);
                            
                        } catch (fallbackError) {
                            console.error('FALLBACK reward update also failed:', fallbackError);
                        }
                    }
                }
            } else {
                // Emit individual update
                const io = socketService.getIO();
                io.in(competitionId).emit('submissionUpdate', {
                    competitionId,
                    playerId: req.userId,
                    status: result.status?.description || "Unknown",
                    statusId: result.status?.id || 0,
                    memory: result.memory || 0,
                    time: result.time || 0,
                    hiddenTestsPassed: result.passed,
                    allTestsPassed: result.passed,
                    tabSwitches,
                    codingTime
                });
            }

            // Send response
            return res.json({
                status: result.status,
                memory: result.memory || 0,
                time: result.time || 0,
                stdout: result.stdout || '',
                stderr: result.stderr || '',
                compile_output: result.compile_output || '',
                hiddenTestsPassed: result.passed,
                allTestsPassed: result.passed
            });

        } catch (error) {
            console.error('Judge0 error:', error);
            return res.status(500).json({
                message: 'Error running code',
                error: error.message,
                details: error.response?.data
            });
        }

    } catch (error) {
        console.error('Submission error:', error);
        return res.status(500).json({
            message: 'Error processing code submission', 
            error: error.message 
        });
    }
});

// Helper function to get submission result
async function getSubmissionResult(token) {
    const maxRetries = 10;
    const retryDelay = 1000;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await axios.get(`${process.env.RAPID_API_URL}/${token}`, {
        headers: {
            'X-RapidAPI-Host': process.env.RAPID_API_HOST,
            'X-RapidAPI-Key': process.env.RAPID_API_KEY
                }
            });

        if (response.data.status?.id !== 1 && response.data.status?.id !== 2) {
                return response.data;
            }

            await new Promise(resolve => setTimeout(resolve, retryDelay));
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }

        throw new Error('Timed out waiting for submission result');
    }

// Get challenge details
router.get('/challenge/:matchId', authMiddleware, async (req, res) => {
    try {
        const match = await Competition.findOne({
            _id: req.params.matchId,
            'players.userId': req.userId,
            status: 'active'
        }).populate('challenge');

        if (!match) {
            console.log('Match not found:', req.params.matchId);
            return res.status(404).json({ message: 'Match not found' });
        }

        console.log('Found match:', match._id);
        console.log('Challenge:', match.challenge ? match.challenge.title : 'No challenge');

        if (!match.challenge) {
            console.log('No challenge found for match');
            return res.status(404).json({ message: 'Challenge not found' });
        }

        // Filter out hidden test cases
        const challengeData = match.challenge.toObject();
        challengeData.testCases = challengeData.testCases.filter(test => !test.isHidden);
        
        res.json(challengeData);
    } catch (error) {
        console.error('Error fetching challenge:', error);
        res.status(500).json({ message: 'Error fetching challenge details' });
    }
});

module.exports = router; 