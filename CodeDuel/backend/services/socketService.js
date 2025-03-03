const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { Competition, Challenge } = require('../models');

class SocketService {
  constructor(server) {
    console.log('Initializing Socket Service...');
    this.io = socketIO(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.waitingPlayers = [];
    this.activeMatches = new Map();
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    console.log('Setting up socket handlers...');
    
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          throw new Error('No token provided');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.userId} (Socket ID: ${socket.id})`);

      socket.on('findMatch', (data) => {
        console.log(`User ${socket.userId} looking for match with entry fee: ${data.entryFee}`);
        this.handleFindMatch(socket, data);
      });

      socket.on('codeSubmission', (data) => {
        console.log(`Code submission from user ${socket.userId}`);
        this.handleCodeSubmission(socket, data);
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
        this.handleDisconnect(socket);
      });

      socket.on('rematchRequest', (data) => {
        const match = this.activeMatches.get(data.matchId);
        if (match) {
          const opponent = match.players.find(p => p.socketId !== socket.id);
          if (opponent) {
            // Store the rematch request
            match.rematchRequest = {
              requesterId: socket.id,
              requesterUsername: data.username
            };
            
            // Notify opponent
            this.io.to(opponent.socketId).emit('rematchRequested', {
              matchId: data.matchId,
              requesterId: socket.userId,
              requesterUsername: data.username
            });
          }
        }
      });

      socket.on('rematchResponse', async (data) => {
        const match = this.activeMatches.get(data.matchId);
        if (!match || !match.rematchRequest) return;

        if (data.accepted) {
          // Create new match with same players but new challenge
          const player1 = match.players[0];
          const player2 = match.players[1];
          const challenge = await this.getNewChallenge(match.challengeId);
          
          if (!challenge) {
            this.io.to(player1.socketId).emit('matchError', { message: 'Failed to create rematch' });
            this.io.to(player2.socketId).emit('matchError', { message: 'Failed to create rematch' });
            return;
          }

          const newMatchId = await this.createNewMatch(player1, player2, challenge._id);
          if (newMatchId) {
            // Remove old match
            this.activeMatches.delete(data.matchId);

            // Create new match in memory
            this.activeMatches.set(newMatchId.toString(), {
              players: [player1, player2],
              challengeId: challenge._id,
              startTime: Date.now(),
              submissions: new Map()
            });

            // Notify players
            this.io.to(player1.socketId).emit('matchStart', {
              matchId: newMatchId,
              playerNumber: 1,
              opponent: player2.userId
            });

            this.io.to(player2.socketId).emit('matchStart', {
              matchId: newMatchId,
              playerNumber: 2,
              opponent: player1.userId
            });
          }
        } else {
          // Notify requester of decline
          this.io.to(match.rematchRequest.requesterId).emit('rematchDeclined');
        }

        // Clear rematch request
        delete match.rematchRequest;
      });
    });
  }

  async getRandomChallenge() {
    try {
      const Challenge = require('../models/Challenge');
      // Get all challenges first
      const challenges = await Challenge.find({});
      
      if (challenges.length === 0) {
        console.error('No challenges found in database');
        return null;
      }

      // Pick a random challenge
      const randomIndex = Math.floor(Math.random() * challenges.length);
      const challenge = challenges[randomIndex];

      // Log for debugging
      console.log(`Selected challenge: ${challenge.title} from ${challenges.length} challenges`);
      
      return challenge;
    } catch (error) {
      console.error('Error getting random challenge:', error);
      return null;
    }
  }

  handleFindMatch(socket, { entryFee }) {
    console.log('Finding match for socket:', socket.id);
    
    // Remove any existing entry for this socket
    this.waitingPlayers = this.waitingPlayers.filter(p => p.socketId !== socket.id);
    
    // Add to waiting players
    this.waitingPlayers.push({
      socketId: socket.id,
      userId: socket.userId,
      entryFee
    });

    // Check for matches
    if (this.waitingPlayers.length >= 2) {
      const player1 = this.waitingPlayers[0];
      const player2 = this.waitingPlayers[1];

      // Remove matched players from waiting list
      this.waitingPlayers = this.waitingPlayers.slice(2);

      // Create a new competition in the database
      const createCompetition = async () => {
        try {
          // Get a random challenge first
          const challenge = await this.getRandomChallenge();
          if (!challenge) {
            console.error('No challenges found in database');
            return null;
          }

          const competition = new Competition({
            players: [
              { userId: player1.userId },
              { userId: player2.userId }
            ],
            challenge: challenge._id, // Add the challenge ID
            entryFee,
            status: 'active',
            startTime: new Date()
          });
          await competition.save();
          return competition._id;
        } catch (error) {
          console.error('Error creating competition:', error);
          return null;
        }
      };

      createCompetition().then(competitionId => {
        if (!competitionId) {
          // Handle error - notify players that match creation failed
          this.io.to(player1.socketId).emit('matchError', { message: 'Failed to create match' });
          this.io.to(player2.socketId).emit('matchError', { message: 'Failed to create match' });
          return;
        }

        // Create a match in memory
        const matchId = competitionId.toString();
        this.activeMatches.set(matchId, {
          players: [player1, player2],
          startTime: Date.now(),
          submissions: new Map()
        });

        // Notify both players
        this.io.to(player1.socketId).emit('matchStart', {
          matchId,
          playerNumber: 1,
          opponent: player2.userId
        });

        this.io.to(player2.socketId).emit('matchStart', {
          matchId,
          playerNumber: 2,
          opponent: player1.userId
        });

        console.log(`Match created: ${matchId} between ${player1.userId} and ${player2.userId}`);
      });
    }
  }

  handleCodeSubmission(socket, data) {
    const match = Array.from(this.activeMatches.entries())
      .find(([_, match]) => 
        match.players.some(p => p.socketId === socket.id)
      );

    if (!match) {
      console.log('No active match found for socket:', socket.id);
      return;
    }

    const [matchId, matchData] = match;
    matchData.submissions.set(socket.id, data);

    // If both players have submitted
    if (matchData.submissions.size === 2) {
      const results = Array.from(matchData.submissions.values());
      this.io.to(matchData.players.map(p => p.socketId)).emit('opponentResults', results);
      this.activeMatches.delete(matchId);
    }
  }

  handleDisconnect(socket) {
    // Remove from waiting players
    this.waitingPlayers = this.waitingPlayers.filter(p => p.socketId !== socket.id);

    // Handle active matches
    for (const [matchId, match] of this.activeMatches) {
      if (match.players.some(p => p.socketId === socket.id)) {
        const opponent = match.players.find(p => p.socketId !== socket.id);
        if (opponent) {
          this.io.to(opponent.socketId).emit('opponentDisconnected');
        }
        this.activeMatches.delete(matchId);
      }
    }
  }

  generateMatchId() {
    return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async createNewMatch(player1, player2, challengeId) {
    try {
      const Competition = require('../models/Competition');
      const competition = new Competition({
        players: [
          { userId: player1.userId },
          { userId: player2.userId }
        ],
        challenge: challengeId,
        status: 'active',
        startTime: new Date()
      });
      await competition.save();
      return competition._id;
    } catch (error) {
      console.error('Error creating new match:', error);
      return null;
    }
  }

  async getNewChallenge(lastChallengeId) {
    try {
      const Challenge = require('../models/Challenge');
      const challenges = await Challenge.find({ _id: { $ne: lastChallengeId } });
      if (challenges.length === 0) return null;
      const random = Math.floor(Math.random() * challenges.length);
      return challenges[random];
    } catch (error) {
      console.error('Error getting new challenge:', error);
      return null;
    }
  }
}

module.exports = SocketService; 