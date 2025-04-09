import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';

const CompetitionResults = ({ results, competitionData, onClose }) => {
  const { user } = useAuth();
  const { balance } = useWallet();
  const navigate = useNavigate();

  const currentPlayer = results.find(r => r.playerId === user._id);
  const opponent = results.find(r => r.playerId !== user._id);

  console.log('Results data:', {
    currentPlayerId: user._id,
    winner: competitionData.winner,
    currentPlayer,
    opponent,
    allResults: results
  });

  const getWinnerDisplay = () => {
    // Check if current player is the winner
    const isWinner = currentPlayer?.isWinner;
    
    console.log('Winner check:', {
      currentPlayerId: user._id,
      winnerId: competitionData.winner,
      isWinner
    });

    return isWinner ? 'You Won!' : 'Opponent Won';
  };

  const getPrizeDisplay = () => {
    const totalPool = competitionData.entryFee * 2;
    return currentPlayer?.isWinner ? `${totalPool * 0.9} MC` : '0 MC';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-xl max-w-2xl w-full mx-4 border border-gray-700">
        <h2 className="text-3xl font-bold text-center mb-6 text-white">
          Match Results
        </h2>

        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-neon-blue">
            Winner: <span className="text-neon-purple">{getWinnerDisplay()}</span>
          </h3>
          <p className="text-xl text-neon-green mt-2">
            Prize: {getPrizeDisplay()}
          </p>
        </div>

        {/* Player Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[currentPlayer, opponent].map((result, index) => (
            result && (
              <div key={index} 
                   className={`bg-gray-900 p-4 rounded-lg ${
                       result.isWinner ? 'border-2 border-neon-green' : ''
                   }`}>
                <h3 className="text-xl font-bold mb-4">
                  <span className="text-white">
                    {result.isCurrentUser ? 'You' : result.username || 'Opponent'}
                  </span>
                  {result.isWinner && (
                    <span className="ml-2 text-neon-green">👑</span>
                  )}
                </h3>
                
                <div className="space-y-3">
                  <p className="text-gray-300">
                    Tab Switches: <span className={result.tabSwitches > 0 ? 'text-red-400' : 'text-green-400'}>
                      {result.tabSwitches}
                    </span>
                  </p>
                  <p className="text-gray-300">
                    Hidden Tests: <span className={result.hiddenTestsPassed ? 'text-green-400' : 'text-red-400'}>
                      {result.hiddenTestsPassed ? 'Passed' : 'Failed'}
                    </span>
                  </p>
                  <p className="text-gray-300">
                    Time: <span className="text-blue-400">{result.time}s</span>
                  </p>
                  <p className="text-gray-300">
                    Memory: <span className="text-blue-400">{result.memory} KB</span>
                  </p>
                  <p className="text-gray-300">
                    Coding Time: <span className="text-blue-400">{result.codingTime}s</span>
                  </p>
                </div>
              </div>
            )
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              onClose();
              navigate('/');
            }}
            className="px-6 py-2 bg-neon-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Exit to Home
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default CompetitionResults;