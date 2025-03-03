import React, { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import { socket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

const Matchmaking = ({ onMatchFound }) => {
  const { balance, updateBalance } = useWallet();
  const { user } = useAuth();
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const ENTRY_FEE = 50; // Fixed entry fee

  useEffect(() => {
    if (user?.token) {
      socket.auth = { token: user.token };
      if (!socket.connected) {
        socket.connect();
      }
    }

    const handleMatchStart = (data) => {
      console.log('Match start received:', data);
      setSearching(false);
      onMatchFound(data);
    };

    const handleMatchError = (error) => {
      console.error('Match error:', error);
      setSearching(false);
      setError(error.message || 'Failed to find match');
    };

    const handleSocketError = (error) => {
      console.error('Socket error:', error);
      setSearching(false);
      setError('Connection error. Please try again.');
    };

    socket.on('matchStart', handleMatchStart);
    socket.on('matchError', handleMatchError);
    socket.on('connect_error', handleSocketError);
    socket.on('error', handleSocketError);

    return () => {
      socket.off('matchStart', handleMatchStart);
      socket.off('matchError', handleMatchError);
      socket.off('connect_error', handleSocketError);
      socket.off('error', handleSocketError);
    };
  }, [user, onMatchFound]);

  const handleStartSearch = async () => {
    if (balance < ENTRY_FEE) {
      setError('Insufficient balance. You need 50 MC to enter a competition.');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/competition/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ entryFee: ENTRY_FEE })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to start competition');
      }

      setSearching(true);
      setError(null);
      
      console.log('Emitting findMatch event:', { entryFee: ENTRY_FEE });
      socket.emit('findMatch', { entryFee: ENTRY_FEE });
      
    } catch (error) {
      console.error('Error starting search:', error);
      setError(error.message);
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-md w-full p-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
        <h2 className="text-3xl font-bold text-center mb-8 text-neon-blue">
          Finding Opponent
        </h2>

        <div className="text-center mb-6 text-gray-300">
          <p className="mb-2">Entry Fee: 50 MC</p>
          <p>Your Balance: {balance} MC</p>
        </div>

        {error && (
          <div className="mb-6 text-red-500 text-center bg-red-900/30 p-3 rounded-lg border border-red-500/50">
            {error}
          </div>
        )}

        <button
          onClick={handleStartSearch}
          disabled={searching || balance < ENTRY_FEE}
          className={`w-full py-4 rounded-lg text-white font-medium transition-all duration-300 ${
            searching
              ? 'bg-gray-600 cursor-not-allowed'
              : balance < ENTRY_FEE
              ? 'bg-red-600/50 cursor-not-allowed'
              : 'bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 transform hover:scale-[1.02]'
          }`}
        >
          {searching ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Finding Opponent...</span>
            </div>
          ) : (
            'Start Competition'
          )}
        </button>

        {searching && (
          <div className="mt-6 text-center text-gray-400">
            <p>Searching for an opponent...</p>
            <p className="text-sm mt-2">This usually takes less than a minute</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Matchmaking; 