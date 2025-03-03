let io;
const waitingPlayers = new Map(); // Store waiting players with their entry fees
const jwt = require('jsonwebtoken');

module.exports = {
    init: (httpServer) => {
        io = require('socket.io')(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        // Socket authentication middleware
        io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    console.log('No token provided for socket connection');
                    return next(new Error('Authentication required'));
                }
                
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    socket.userId = decoded.userId;
                    console.log('Socket authenticated for user:', socket.userId);
                    next();
                } catch (err) {
                    console.log('Invalid token:', err.message);
                    next(new Error('Invalid token'));
                }
            } catch (error) {
                console.error('Socket auth error:', error);
                next(new Error('Authentication error'));
            }
        });

        // Handle socket connections
        io.on('connection', (socket) => {
            console.log('User connected:', socket.userId);

            socket.on('joinCompetition', ({ competitionId, userId }) => {
                console.log(`User ${userId} joining competition ${competitionId}`);
                socket.join(competitionId);
            });

            socket.on('leaveCompetition', ({ competitionId }) => {
                console.log(`User ${socket.userId} leaving competition ${competitionId}`);
                socket.leave(competitionId);
            });

            // Handle find match request
            socket.on('findMatch', async (data) => {
                console.log(`User ${socket.userId} looking for match with entry fee: ${data.entryFee}`);
                
                try {
                    // Remove any existing entry for this user
                    for (let [key, value] of waitingPlayers.entries()) {
                        if (value.userId === socket.userId) {
                            console.log(`Removing existing entry for user ${socket.userId}`);
                            waitingPlayers.delete(key);
                        }
                    }

                    // Add to waiting players
                    waitingPlayers.set(socket.id, {
                        socketId: socket.id,
                        userId: socket.userId,
                        entryFee: data.entryFee
                    });

                    console.log('Current waiting players:', Array.from(waitingPlayers.values()));

                    // Try to find a match
                    await tryMatchPlayers(socket);
                } catch (error) {
                    console.error('Error in findMatch handler:', error);
                    socket.emit('matchError', { message: 'Error finding match' });
                }
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.userId}`);
                waitingPlayers.delete(socket.id);
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};

// Helper function to match players
async function tryMatchPlayers(socket) {
    console.log('Trying to match players...');
    const waitingPlayersArray = Array.from(waitingPlayers.values());
    console.log('Waiting players:', waitingPlayersArray);

    if (waitingPlayersArray.length >= 2) {
        const player1 = waitingPlayersArray[0];
        const player2 = waitingPlayersArray[1];

        console.log('Found potential match:', {
            player1: player1.userId,
            player2: player2.userId
        });

        // Remove matched players from waiting list
        waitingPlayers.delete(player1.socketId);
        waitingPlayers.delete(player2.socketId);

        try {
            // Create a new competition
            const { Competition, Challenge } = require('../models');
            
            // Get a random challenge
            const count = await Challenge.countDocuments();
            if (count === 0) {
                throw new Error('No challenges available in the database');
            }

            const random = Math.floor(Math.random() * count);
            const challenge = await Challenge.findOne().skip(random);

            if (!challenge) {
                throw new Error('Failed to fetch challenge');
            }

            const competition = new Competition({
                players: [
                    { userId: player1.userId },
                    { userId: player2.userId }
                ],
                challenge: challenge._id,
                entryFee: player1.entryFee,
                status: 'active',
                startTime: new Date()
            });

            await competition.save();
            console.log('Created competition:', competition._id);

            // Notify both players
            const matchData = {
                matchId: competition._id.toString(),
                entryFee: player1.entryFee
            };

            io.to(player1.socketId).emit('matchStart', {
                ...matchData,
                playerNumber: 1,
                opponent: player2.userId
            });

            io.to(player2.socketId).emit('matchStart', {
                ...matchData,
                playerNumber: 2,
                opponent: player1.userId
            });

            console.log('Match notifications sent to both players');
        } catch (error) {
            console.error('Error creating match:', error);
            // Return players to waiting list if match creation fails
            waitingPlayers.set(player1.socketId, player1);
            waitingPlayers.set(player2.socketId, player2);
            
            io.to(player1.socketId).emit('matchError', { 
                message: 'Failed to create match: ' + error.message 
            });
            io.to(player2.socketId).emit('matchError', { 
                message: 'Failed to create match: ' + error.message 
            });
        }
    } else {
        console.log('Not enough players to make a match yet');
    }
} 