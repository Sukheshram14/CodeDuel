import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { Link, useNavigate } from 'react-router-dom';
import ChatBot from '../components/Dashboard/ChatBot';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { balance, updateBalance } = useWallet();
  const [stats, setStats] = useState({
    stats: {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      rank: 1000,
      preferredLanguage: 'javascript',
      winStreak: 0,
      highestWinStreak: 0,
      averageTimePerMatch: 0,
      totalMatchTime: 0,
      lastMatchDate: null
    },
    achievements: [],
    MockCoinsBalance: 100,
    winRatio: 0,
    recentMatches: [],
    matchHistory: []
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user?.token) return;
    
    try {
      setError(null);
      // Fetch user stats
      const statsResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/user/stats`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const statsData = await statsResponse.json();
      console.log('Stats received:', statsData);
      setStats(statsData);

      // Fetch transactions
      const txResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/wallet/transactions`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!txResponse.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const txData = await txResponse.json();
      console.log('Transactions received:', txData);
      setTransactions(txData.transactions || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoins = async () => {
    try {
      setError(null);
      await updateBalance(100, 'credit');
      await fetchUserData(); // Refresh all data after adding coins
    } catch (error) {
      console.error('Error adding coins:', error);
      setError('Failed to add coins. Please try again.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0m 0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg py-8">
      <div className="container mx-auto px-4">
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {/* Header with User Info and Logout */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold">
                <span className="text-gray-300">Welcome,</span>
                <span className="text-neon-blue ml-2">{user?.username || 'Coder'}</span>
              </h1>
              <p className="text-gray-400 mt-1">Ready to code and compete!</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-neon-purple">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Stats Card */}
          <div className="card p-6 rounded-lg bg-gray-800">
            <h2 className="text-2xl font-bold mb-4 text-neon-blue">Statistics</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="stat-item flex flex-col">
                <span className="text-gray-400">Total Matches</span>
                <span className="text-2xl font-bold text-neon-purple">{stats.stats.totalMatches}</span>
              </div>
              <div className="stat-item flex flex-col">
                <span className="text-gray-400">Wins</span>
                <span className="text-2xl font-bold text-green-500">{stats.stats.wins}</span>
              </div>
              <div className="stat-item flex flex-col">
                <span className="text-gray-400">Losses</span>
                <span className="text-2xl font-bold text-red-500">{stats.stats.losses}</span>
              </div>
              <div className="stat-item flex flex-col">
                <span className="text-gray-400">Win Ratio</span>
                <span className="text-2xl font-bold text-neon-blue">{stats.stats.winRatio?.toFixed(1) || '0.0'}%</span>
              </div>
              <div className="stat-item flex flex-col">
                <span className="text-gray-400">Current Rank</span>
                <span className="text-2xl font-bold text-yellow-500">{stats.stats.rank}</span>
              </div>
              <div className="stat-item flex flex-col">
                <span className="text-gray-400">Win Streak</span>
                <span className="text-2xl font-bold text-neon-purple">{stats.stats.winStreak}</span>
              </div>
              <div className="stat-item flex flex-col">
                <span className="text-gray-400">Highest Streak</span>
                <span className="text-2xl font-bold text-yellow-500">{stats.stats.highestWinStreak}</span>
              </div>
              <div className="stat-item flex flex-col">
                <span className="text-gray-400">Avg. Match Time</span>
                <span className="text-2xl font-bold text-neon-blue">{formatTime(stats.stats.averageTimePerMatch)}</span>
              </div>
              <div className="stat-item flex flex-col">
                <span className="text-gray-400">Preferred Language</span>
                <span className="text-2xl font-bold text-neon-purple capitalize">{stats.stats.preferredLanguage}</span>
              </div>
              <div className="stat-item flex flex-col">
                <span className="text-gray-400">Last Match</span>
                <span className="text-2xl font-bold text-gray-300">{formatDate(stats.stats.lastMatchDate)}</span>
              </div>
            </div>

            {/* Achievements */}
            {stats.achievements && stats.achievements.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-bold mb-2 text-neon-blue">Achievements</h3>
                <div className="flex flex-wrap gap-2">
                  {stats.achievements.map((achievement, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full text-white text-sm"
                    >
                      {achievement.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Matches */}
            <div className="mt-6">
              <h3 className="text-xl font-bold mb-4 text-neon-blue">Recent Matches</h3>
              <div className="space-y-2">
                {stats.recentMatches && stats.recentMatches.map((match, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                    <div className="flex items-center space-x-4">
                      {/* <span className="text-gray-400">vs</span>
                      <span className="text-white font-medium">{match.opponent?.username || match.opponentName || 'Unknown Opponent'}</span> */}
                      <span className={`text-sm px-2 py-1 rounded ${match.result === 'win' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {match.result.toUpperCase()}
                      </span>
                      <span className="text-gray-400">{match.language}</span>
                    </div>
                    <span className="text-gray-400">{formatDate(match.date)}</span>
                  </div>
                ))}
                {(!stats.recentMatches || stats.recentMatches.length === 0) && (
                  <div className="text-gray-400 text-center py-4">
                    No matches played yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Wallet Card */}
          <div className="card p-6 rounded-lg bg-gray-800">
            <h2 className="text-2xl font-bold mb-4 text-neon-blue">Wallet</h2>
            <div className="text-4xl font-bold text-neon-purple mb-6">
              {balance} MC
            </div>
            <button
              onClick={handleAddCoins}
              className="mb-6 w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white py-3 rounded-lg hover:opacity-90 transition-opacity neon-border"
            >
              Add 100 MC (Test)
            </button>
            
            {/* Transaction History */}
            <div className="mt-4">
              <h3 className="text-xl font-bold mb-2 text-neon-blue">Recent Transactions</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {transactions.length > 0 ? (
                  transactions.map((tx, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-900 rounded">
                      <span className="text-gray-300">{tx.type}</span>
                      <span className={`font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount} MC
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-center py-4">
                    No transactions yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Link
            to="/competition"
            className="block w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white p-4 rounded-lg text-center hover:opacity-90 transition-opacity neon-border text-lg font-bold"
          >
            Start New Competition
          </Link>
        </div>
      </div>
      
      {/* Add ChatBot to the dashboard */}
      <ChatBot />
    </div>
  );
};

export default Dashboard;