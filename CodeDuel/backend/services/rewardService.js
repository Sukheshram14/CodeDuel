const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

const calculateReward = (winner, loser, entryFee) => {
  const baseReward = entryFee * 1.8; // 90% of total pool (2 * entryFee)
 // const rankDiff = Math.abs(winner.stats.rank - loser.stats.rank);
  //const rankMultiplier = 1 + (rankDiff / 1000); // Adjust reward based on rank difference
  
  return Math.round(baseReward );
};

const updatePlayerStats = async (winner, loser, session) => {
  // Update winner stats
  winner.stats.wins += 1;
  winner.stats.totalMatches += 1;
  winner.stats.rank += 25;

  // Update loser stats
  loser.stats.losses += 1;
  loser.stats.totalMatches += 1;
  loser.stats.rank = Math.max(1, loser.stats.rank - 15);

  // Save changes
  await winner.save({ session });
  await loser.save({ session });
};

const distributeRewards = async (competitionId, winnerId, loserId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [winner, loser, competition] = await Promise.all([
      User.findById(winnerId),
      User.findById(loserId),
      Competition.findById(competitionId)
    ]);

    const reward = calculateReward(winner, loser, competition.entryFee);

    // Update winner's balance
    winner.MockCoinsBalance += reward;

    // Create reward transaction
    await new Transaction({
      userId: winnerId,
      type: 'credit',
      amount: reward,
      description: 'Competition reward'
    }).save({ session });

    // Update player stats
    await updatePlayerStats(winner, loser, session);

    // Check for achievements
    if (winner.stats.wins === 1) {
      winner.achievements.push('first_win');
    }
    if (winner.stats.wins >= 10) {
      winner.achievements.push('code_master');
    }

    await winner.save({ session });
    await session.commitTransaction();

    return { reward, newBalance: winner.MockCoinsBalance };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  distributeRewards
}; 