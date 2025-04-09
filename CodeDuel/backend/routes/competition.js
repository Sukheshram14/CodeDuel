const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { Competition, Challenge, User } = require('../models');
const axios = require('axios');
const socketService = require('../services/socket');

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
        const { code, language } = req.body;
        
        // Execute code with Judge0
        const options = {
            method: 'POST',
            url: `${process.env.RAPID_API_URL}`,
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Host': process.env.RAPID_API_HOST,
                'X-RapidAPI-Key': process.env.RAPID_API_KEY
            },
            data: {
                source_code: code,
                language_id: language,
                stdin: '',
                base64_encoded: false
            }
        };

        const createResponse = await axios.request(options);
        const token = createResponse.data.token;

        if (!token) {
            throw new Error('No token received from Judge0');
        }

        // Get results
        const result = await getSubmissionResult(token);
        
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
        const { code, language, competitionId, codingTime, tabSwitches, copyPasteCount } = req.body;

        console.log('Submission received:', { competitionId, userId: req.userId, language, copyPasteCount });

        // If player has copy-pasted, they are eliminated
        if (copyPasteCount > 0) {
            
            return res.status(400).json({ message: 'You are eliminated for copy-pasting!' });
        }

        // Find competition
        const competition = await Competition.findById(competitionId)
            .populate('challenge')
            .populate('players.userId');

        if (!competition) {
            return res.status(404).json({ message: 'Competition not found' });
        }

        // Validate player
        const playerIndex = competition.players.findIndex(
            p => p.userId._id.toString() === req.userId
        );

        if (playerIndex === -1) {
            return res.status(403).json({ message: 'Not authorized for this competition' });
        }

        if (competition.players[playerIndex].submissionTime) {
            return res.status(400).json({ message: 'Already submitted solution' });
        }

        // Get test case
        const testCase = competition.challenge.testCases[0];
        if (!testCase) {
            return res.status(400).json({ message: 'No test cases found' });
        }

        try {
            // Submit to Judge0
            const judgeResponse = await axios.post(process.env.RAPID_API_URL, {
                source_code: code,
                language_id: language,
                stdin: testCase.input || '',
                expected_output: testCase.expectedOutput || '',
                cpu_time_limit: 5,
                memory_limit: 512000
            }, {
                headers: {
                    'content-type': 'application/json',
                    'X-RapidAPI-Host': process.env.RAPID_API_HOST,
                    'X-RapidAPI-Key': process.env.RAPID_API_KEY
                }
            });

            if (!judgeResponse.data?.token) {
                throw new Error('No token received from Judge0');
            }

            // Get submission result
            const result = await getSubmissionResult(judgeResponse.data.token);
            console.log('Judge0 result:', result);

            // Update player submission
            competition.players[playerIndex].code = code;
            competition.players[playerIndex].status = result.status;
            competition.players[playerIndex].memory = result.memory || 0;
            competition.players[playerIndex].time = result.time || 0;
            competition.players[playerIndex].codingTime = codingTime || 0;
            competition.players[playerIndex].tabSwitches = tabSwitches || 0;
            competition.players[playerIndex].submissionTime = new Date();

            await competition.save();

            // Check if both players have submitted
            const bothSubmitted = competition.players.every(p => p.submissionTime);
            
            if (bothSubmitted) {
                const winner = determineWinner(competition.players);
                competition.status = 'completed';
                competition.winner = winner;
                await competition.save();

                const entryFee = Number(competition.entryFee) || 0;
                const totalPrize = entryFee * 2;
                const winnerPrize = Math.floor(totalPrize * 0.9); // Ensure integer value

                console.log('Prize calculation:', {
                    entryFee,
                    totalPrize,
                    winnerPrize,
                    winner: winner.toString()
                });

                // Emit final results
                const io = socketService.getIO();
                const results = {
                    competitionId,
                    winner: winner.toString(),
                    prize: winnerPrize,
                    players: competition.players.map(p => ({
                        playerId: p.userId._id.toString(),
                        username: p.userId.username,
                        status: p.status,
                        memory: p.memory,
                        time: p.time,
                        hiddenTestsPassed: true,
                        allTestsPassed: p.status?.id === 3,
                        tabSwitches: p.tabSwitches,
                        codingTime: p.codingTime,
                        score: calculateScore(p),
                        isWinner: winner.toString() === p.userId._id.toString()
                    }))
                };

                console.log('Emitting competition results:', results);
                io.in(competitionId).emit('competitionComplete', results);

                // Update winner's balance
                try {
                    await updateBalance(winner, totalPrize * 0.9, 'credit');
                } catch (error) {
                    console.error('Error updating winner balance:', error);
                }
            } else {
                // Emit individual update
                const io = socketService.getIO();
                io.in(competitionId).emit('submissionUpdate', {
                    competitionId,
                    playerId: req.userId,
                    status: result.status,
                    memory: result.memory || 0,
                    time: result.time || 0,
                    hiddenTestsPassed: true,
                    allTestsPassed: result.status.id === 3,
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
                hiddenTestsPassed: true,
                allTestsPassed: result.status.id === 3
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