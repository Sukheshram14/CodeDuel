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
    inputType: {
        type: String,
        enum: ['string', 'number', 'array-number', 'array-string'],
        default: 'string'
    },
    testCases: [{
        input: String,
        expectedOutput: String,
        isHidden: Boolean
    }],
    defaultCode: {
        javascript: String,
        python: String,
        php: String,
        cpp: String
    }
});

module.exports = mongoose.model('Challenge', challengeSchema); 