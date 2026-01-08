import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import CodeAnalysisChatBot from './CodeAnalysisChatBot';

const CompetitionResults = ({ results, competitionData, onClose }) => {
  const { user } = useAuth();
  const { balance, refreshBalance } = useWallet();
  const navigate = useNavigate();
  const [initialBalance, setInitialBalance] = useState(balance);
  const [expectedNewBalance, setExpectedNewBalance] = useState(0);
  const [showBalanceUpdate, setShowBalanceUpdate] = useState(false);
  const [balanceRefreshed, setBalanceRefreshed] = useState(false);

  // Helper function to safely get user ID
  const getUserId = () => {
    // User ID could be in either id or _id property
    return user?.id || user?._id || '';
  };
  
  // Helper function to safely convert any ID to string
  const safeToString = (id) => {
    if (!id) return '';
    return typeof id.toString === 'function' ? id.toString() : String(id);
  };

  // Determine if current user is the winner
  const isCurrentUserWinner = () => {
    const currentUserId = safeToString(getUserId());
    const winnerId = competitionData.winner ? safeToString(competitionData.winner) : null;
    
    // Also check player in results
    const currentPlayerUserId = currentPlayer?.userId 
      ? safeToString(currentPlayer.userId)
      : null;
      
    return winnerId && (
      winnerId === currentUserId || 
      winnerId === currentPlayerUserId
    );
  };

  // Find the current player's result by looking for isCurrentUser flag or matching ID
  const currentPlayer = results.find(r => {
    const userId = getUserId();
    return r.isCurrentUser || 
      r.playerId === userId || 
      r.userId === userId ||
      (r.userId && safeToString(r.userId) === safeToString(userId));
  });
  
  // Find the opponent's result
  const opponent = results.find(r => {
    const userId = getUserId();
    return !r.isCurrentUser && 
      r.playerId !== userId && 
      r.userId !== userId &&
      (!r.userId || safeToString(r.userId) !== safeToString(userId));
  });

  // Convert IDs to strings for reliable comparison
  const currentUserId = safeToString(getUserId());
  const winnerId = competitionData.winner ? safeToString(competitionData.winner) : null;
  
  console.log('Results data:', {
    currentUser: currentUserId,
    winner: winnerId,
    currentPlayer,
    opponent,
    allResults: results,
    isWinner: isCurrentUserWinner()
  });

  // Effect to handle balance updates for winners
  useEffect(() => {
    // Only run this once when the component mounts and if the user is the winner
    if (isCurrentUserWinner() && competitionData.prize > 0 && !balanceRefreshed) {
      // Calculate balances correctly
      const entryFee = competitionData.entryFee || 0;
      const prize = competitionData.prize || 0;
      
      // Calculate previous balance (current balance minus prize)
      // The current balance already includes the reward but has the entry fee deducted
      const calculatedPrevious = Math.max(0, balance - entryFee);
      setInitialBalance(calculatedPrevious);
      console.log(`Calculated previous balance: ${calculatedPrevious} = ${balance} - ${entryFee}`);
      setExpectedNewBalance(balance);

      console.log('Competition values:', {
        entryFee,
        prize,
        currentBalance: balance,
        calculatedPrevious
      });
      
      // Make sure we have the latest balance
      const fetchUpdatedBalance = async () => {
        // Mark as refreshed immediately to show the balance update UI
        setShowBalanceUpdate(true);
        setBalanceRefreshed(true);
        
        // Still refresh the balance to ensure we have the most up-to-date value
        setTimeout(async () => {
          console.log('Refreshing balance');
          await refreshBalance();
        }, 1000);
      };
      
      fetchUpdatedBalance();
    }
  }, [refreshBalance, balance, competitionData.prize, competitionData.entryFee, balanceRefreshed]);

  const getWinnerDisplay = () => {
    return isCurrentUserWinner() ? 'You Won!' : (winnerId ? 'Opponent Won' : 'No Winner');
  };

  const getPrizeDisplay = () => {
    const prize = competitionData.prize || 0;
    return isCurrentUserWinner() ? `${prize} MC` : '0 MC';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-xl shadow-neon-blue max-w-2xl w-full">
        <h2 className="text-3xl text-white font-bold mb-6 text-center bg-gradient-to-r from-neon-blue to-neon-purple text-transparent bg-clip-text">
          Competition Results
        </h2>
        
        <div className="mb-6 text-center">
          <div className={`text-2xl font-bold ${isCurrentUserWinner() ? "text-neon-pink animate-pulse" : "text-gray-300"} mb-2`}>
            {getWinnerDisplay()}
          </div>
          
          {competitionData.entryFee > 0 && (
            <div className={`text-xl ${isCurrentUserWinner() ? "text-neon-green mb-2 flex items-center justify-center" : "text-gray-400 mb-2"}`}>
              {isCurrentUserWinner() ? (
                <>
                  <span className="mr-2">Prize:</span>
                  <span className="text-2xl font-bold animate-pulse">{getPrizeDisplay()}</span>
                  <span className="ml-3 bg-green-600 text-white text-sm px-2 py-1 rounded-full animate-bounce">
                    +{competitionData.prize} Coins Added
                  </span>
                </>
              ) : (
                <>Prize: {getPrizeDisplay()}</>
              )}
            </div>
          )}
          
          {isCurrentUserWinner() && competitionData.prize > 0 && (
            <div className="mt-4 p-3 bg-gray-700 rounded-lg">
              {balanceRefreshed ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="text-white mb-2">
                    Your balance has been updated!
                  </div>
                  <div className="text-sm text-gray-300 mb-2">
                    Entry fee: {competitionData.entryFee} MC • Reward: +{competitionData.prize} MC
                  </div>
                  <div className="text-lg">
                    {/* <span className="text-gray-400">Previous: </span>
                    <span className="text-white">{calculatedPrevious} MC</span>
                    <span className="text-neon-green mx-2">→</span> */}
                    <span className="text-gray-400">New Balance: </span>
                    <span className="text-neon-green font-bold animate-pulse">
                      {balance} MC
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-white text-center animate-pulse">
                  Updating your balance...
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* You */}
          <div className={`bg-gray-700 p-4 rounded-lg ${isCurrentUserWinner() ? "border-2 border-neon-green" : ""}`}>
            <h3 className="text-xl text-neon-cyan font-bold mb-2">Your Results</h3>
            <div className="space-y-2 text-white">
              <p>Status: <span className={currentPlayer?.allTestsPassed ? "text-green-400" : "text-red-400"}>
                {currentPlayer?.status?.description || currentPlayer?.status || "Unknown"}
              </span></p>
              <p>Memory: {currentPlayer?.memory || 0} KB</p>
              <p>Time: {currentPlayer?.time || 0} s</p>
              <p>Coding Time: {currentPlayer?.codingTime || 0} s</p>
              <p>Tab Switches: {currentPlayer?.tabSwitches || 0}</p>
              <p>Score: {currentPlayer?.score || 0}</p>
            </div>
          </div>
          
          {/* Opponent */}
          <div className={`bg-gray-700 p-4 rounded-lg ${!isCurrentUserWinner() && winnerId ? "border-2 border-neon-pink" : ""}`}>
            <h3 className="text-xl text-neon-purple font-bold mb-2">Opponent Results</h3>
            <div className="space-y-2 text-white">
              <p>Status: <span className={opponent?.allTestsPassed ? "text-green-400" : "text-red-400"}>
                {opponent?.status?.description || opponent?.status || "Unknown"}
              </span></p>
              <p>Memory: {opponent?.memory || 0} KB</p>
              <p>Time: {opponent?.time || 0} s</p>
              <p>Coding Time: {opponent?.codingTime || 0} s</p>
              <p>Tab Switches: {opponent?.tabSwitches || 0}</p>
              <p>Score: {opponent?.score || 0}</p>
            </div>
          </div>
        </div>
        
        {/* Code Analysis Chatbot Section */}
        {/* <div className="mt-6 mb-6">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-xl text-neon-cyan font-bold mb-4">Want to Improve?</h3>
            <CodeAnalysisChatBot 
              userCode={competitionData.userCode || currentPlayer?.code} 
              challenge={competitionData.challenge}
              results={currentPlayer}
            />
          </div>
        </div> */}
        
        <div className="flex justify-center">
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-bold rounded-lg hover:shadow-neon-blue transition-all duration-300"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompetitionResults;