const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    },
    MockCoinsBalance: {
        type: Number,
        default: 100 // Starting balance
    },
    stats: {
        totalMatches: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        rank: { type: Number, default: 1000 }, // ELO rating
        preferredLanguage: { type: String, default: 'javascript' },
        lastMatchDate: { type: Date },
        winStreak: { type: Number, default: 0 },
        highestWinStreak: { type: Number, default: 0 },
        averageTimePerMatch: { type: Number, default: 0 }, // in seconds
        totalMatchTime: { type: Number, default: 0 } // in seconds
    },
    achievements: [{
        type: String,
        enum: ['first_win', 'first_deposit', 'code_master', 'winning_streak', 'speed_coder', 'language_master']
    }],
    matchHistory: [{
        matchId: { type: mongoose.Schema.Types.ObjectId },
        opponent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        result: { type: String, enum: ['win', 'loss'] },
        language: { type: String },
        date: { type: Date, default: Date.now },
        timeSpent: { type: Number }, // in seconds
        coinsEarned: { type: Number }
    }]
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to update stats after a match
userSchema.methods.updateMatchStats = async function(matchData) {
    const { isWin, timeSpent, language, opponent, coinsEarned } = matchData;
    
    // Update basic stats
    this.stats.totalMatches += 1;
    if (isWin) {
        this.stats.wins += 1;
        this.stats.winStreak += 1;
        if (this.stats.winStreak > this.stats.highestWinStreak) {
            this.stats.highestWinStreak = this.stats.winStreak;
        }
    } else {
        this.stats.losses += 1;
        this.stats.winStreak = 0;
    }
    
    // Update ELO rating
    const eloChange = isWin ? 25 : -25;
    this.stats.rank = Math.max(0, this.stats.rank + eloChange);
    
    // Update time stats
    this.stats.totalMatchTime += timeSpent;
    this.stats.averageTimePerMatch = this.stats.totalMatchTime / this.stats.totalMatches;
    this.stats.lastMatchDate = new Date();
    
    // Convert opponent to ObjectId if it's a string
    const opponentId = typeof opponent === 'string' ? mongoose.Types.ObjectId(opponent) : opponent;
    
    // Add to match history
    this.matchHistory.push({
        opponent: opponentId,
        result: isWin ? 'win' : 'loss',
        language,
        timeSpent,
        coinsEarned
    });
    
    // Update achievements
    if (isWin && this.stats.wins === 1) {
        this.achievements.push('first_win');
    }
    if (this.stats.wins >= 10 && !this.achievements.includes('code_master')) {
        this.achievements.push('code_master');
    }
    if (this.stats.winStreak >= 5 && !this.achievements.includes('winning_streak')) {
        this.achievements.push('winning_streak');
    }
    if (this.stats.averageTimePerMatch <= 300 && this.stats.totalMatches >= 5 && !this.achievements.includes('speed_coder')) {
        this.achievements.push('speed_coder');
    }
    
    // Update MockCoinsBalance
    if (coinsEarned) {
        this.MockCoinsBalance += coinsEarned;
    }
    
    await this.save();
    return this;
};

module.exports = mongoose.model("User", userSchema); 