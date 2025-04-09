const mongoose = require('mongoose');
const Competition = require('./Competition');
const Challenge = require('./Challenge');
const User = require('./User');
const Transaction = require('./Transaction');

// Add this to debug model loading
console.log('Loading models...');
console.log('Competition model:', !!mongoose.models.Competition);
console.log('Challenge model:', !!mongoose.models.Challenge);
console.log('User model:', !!mongoose.models.User);
console.log('Transaction model:', !!mongoose.models.Transaction);

module.exports = {
    Competition,
    Challenge,
    User,
    Transaction
}; 