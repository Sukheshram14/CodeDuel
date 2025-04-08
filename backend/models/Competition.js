const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema({
    players: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        code: String,
        status: {
            id: Number,
            description: String
        },
        memory: Number,
        time: Number,
        timeComplexity: String,
        spaceComplexity: String,
        codingTime: Number,
        score: Number,
        tabSwitches: Number,
        hiddenTestsPassed: Boolean,
        submissionTime: Date
    }],
    challenge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
        required: true
    },
    entryFee: {
        type: Number,
        required: true
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    startTime: Date,
    endTime: Date,
    status: {
        type: String,
        enum: ['pending', 'active', 'completed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Competition', competitionSchema); 