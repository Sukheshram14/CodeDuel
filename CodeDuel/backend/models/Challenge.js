const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['easy', 'medium', 'hard']
    },
    testCases: [{
        input: String,
        expectedOutput: String,
        isHidden: Boolean
    }],
    defaultCode: {
        javascript: String,
        python: String
    }
});

module.exports = mongoose.model('Challenge', challengeSchema); 