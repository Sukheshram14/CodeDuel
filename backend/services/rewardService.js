const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Competition = require('../models/Competition');
const mongoose = require('mongoose');

const calculateReward = (winner, loser, entryFee) => {
  console.log(`Calculating reward - Entry fee: ${entryFee}, type: ${typeof entryFee}`);
  
  // Handle various types of input with robust conversion
  let numericEntryFee;
  
  if (entryFee === null || entryFee === undefined) {
    console.error(`Entry fee is null or undefined`);
    numericEntryFee = 0;
  } else if (typeof entryFee === 'object' && entryFee.valueOf) {
    // Handle MongoDB Number objects
    numericEntryFee = Number(entryFee.valueOf());
  } else {
    numericEntryFee = Number(entryFee);
  }
  
  if (isNaN(numericEntryFee) || numericEntryFee <= 0) {
    console.error(`Invalid entry fee after conversion: ${entryFee} (${typeof entryFee}) -> ${numericEntryFee}`);
    return 0;
  }
  
  // Calculate 90% of total pool (2 * entryFee)
  const baseReward = numericEntryFee * 1.8;
  
  // Ensure the reward is a whole number
  const roundedReward = Math.floor(baseReward);
  console.log(`Calculated reward: ${roundedReward} MC (90% of ${numericEntryFee * 2} MC pool)`);
  
  return roundedReward;
};

const updatePlayerStats = async (winner, loser, session) => {
  try {
    console.log('Updating player stats');
    
    // Initialize stats objects if they don't exist
    if (!winner.stats) {
      winner.stats = {
        wins: 0,
        losses: 0,
        totalMatches: 0,
        rank: 1000
      };
    }
    
    if (!loser.stats) {
      loser.stats = {
        wins: 0,
        losses: 0,
        totalMatches: 0,
        rank: 1000
      };
    }
    
    // Update winner stats
    winner.stats.wins = (winner.stats.wins || 0) + 1;
    winner.stats.totalMatches = (winner.stats.totalMatches || 0) + 1;
    winner.stats.rank = (winner.stats.rank || 1000) + 25;

    // Update loser stats
    loser.stats.losses = (loser.stats.losses || 0) + 1;
    loser.stats.totalMatches = (loser.stats.totalMatches || 0) + 1;
    loser.stats.rank = Math.max(1, (loser.stats.rank || 1000) - 15);

    // Save changes
    await winner.save({ session });
    await loser.save({ session });
    
    console.log('Player stats updated successfully');
  } catch (error) {
    console.error('Error updating player stats:', error);
    throw error;
  }
};

const distributeRewards = async (competitionId, winnerId, loserId) => {
  console.log(`Starting reward distribution - Competition: ${competitionId}, Winner: ${winnerId}, Loser: ${loserId}`);
  
  // Validate IDs first
  if (!competitionId || !winnerId || !loserId) {
    console.error('Missing required IDs for reward distribution', { competitionId, winnerId, loserId });
    throw new Error('Missing required IDs for reward distribution');
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log('Finding users and competition documents');
    
    // Convert IDs to ObjectId format if they are strings
    const winnerObjectId = typeof winnerId === 'string' ? mongoose.Types.ObjectId(winnerId) : winnerId;
    const loserObjectId = typeof loserId === 'string' ? mongoose.Types.ObjectId(loserId) : loserId;
    const competitionObjectId = typeof competitionId === 'string' ? mongoose.Types.ObjectId(competitionId) : competitionId;
    
    // Find all required documents
    const [winner, loser, competition] = await Promise.all([
      User.findById(winnerObjectId),
      User.findById(loserObjectId),
      Competition.findById(competitionObjectId)
    ]);

    // Validate that all required documents exist
    if (!winner) {
      throw new Error(`Winner user (${winnerId}) not found`);
    }
    
    if (!loser) {
      throw new Error(`Loser user (${loserId}) not found`);
    }
    
    if (!competition) {
      throw new Error(`Competition (${competitionId}) not found`);
    }
    
    console.log(`Documents found - Winner: ${winner.username}, Loser: ${loser.username}, Entry fee: ${competition.entryFee}`);
    
    // Calculate reward amount
    const reward = calculateReward(winner, loser, competition.entryFee);
    
    if (reward <= 0) {
      console.error('Invalid reward amount calculated', { 
        entryFee: competition.entryFee, 
        entryFeeType: typeof competition.entryFee,
        calculatedReward: reward 
      });
      throw new Error('Invalid reward amount calculated');
    }
    
    // Log balances before update
    console.log(`Current balances - Winner: ${winner.MockCoinsBalance} MC, Loser: ${loser.MockCoinsBalance} MC`);

    // Update winner's balance - ensure it's a number
    let currentBalance = 0;
    try {
      currentBalance = Number(winner.MockCoinsBalance) || 0;
      if (isNaN(currentBalance)) {
        console.warn(`Winner balance is NaN, resetting to 0. Original value: ${winner.MockCoinsBalance}`);
        currentBalance = 0;
      }
    } catch (err) {
      console.error('Error converting winner balance to number:', err);
      currentBalance = 0;
    }
    
    winner.MockCoinsBalance = currentBalance + reward;
    
    console.log(`Updating winner's balance: ${currentBalance} + ${reward} = ${winner.MockCoinsBalance}`);

    // Create reward transaction
    const transaction = new Transaction({
      userId: winnerId,
      type: 'credit',
      amount: reward,
      description: `Competition reward for winning match ${competitionId}`
    });
    
    await transaction.save({ session });
    console.log(`Created transaction record: ${transaction._id}`);

    // Update player stats
    try {
      await updatePlayerStats(winner, loser, session);
    } catch (statsError) {
      console.error('Error updating player stats (continuing process):', statsError);
      // Continue with the reward process even if stats update fails
    }

    // Check for achievements
    let newAchievements = [];
    
    try {
      if (!winner.achievements) {
        winner.achievements = [];
      }
      
      // First win achievement
      if ((winner.stats?.wins === 1 || !winner.stats) && !winner.achievements.includes('first_win')) {
        winner.achievements.push('first_win');
        newAchievements.push('first_win');
      }
      
      // Code master achievement (10+ wins)
      if ((winner.stats?.wins >= 10 || false) && !winner.achievements.includes('code_master')) {
        winner.achievements.push('code_master');
        newAchievements.push('code_master');
      }

      if (newAchievements.length > 0) {
        console.log(`New achievements unlocked: ${newAchievements.join(', ')}`);
      }
    } catch (achievementError) {
      console.error('Error processing achievements (continuing process):', achievementError);
      // Continue with the reward process even if achievement processing fails
    }

    // Save winner with updated balance and achievements
    await winner.save({ session });
    
    // Commit the transaction
    await session.commitTransaction();
    console.log('Transaction committed successfully');
    
    return { 
      reward, 
      newBalance: winner.MockCoinsBalance,
      achievements: newAchievements
    };
  } catch (error) {
    console.error('Error distributing rewards:', error);
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  distributeRewards
}; 