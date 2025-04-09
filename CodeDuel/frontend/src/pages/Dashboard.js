import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { balance, updateBalance } = useWallet();
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserData();
  }, [user?.token]);

  const fetchUserData = async () => {
    if (!user?.token) return;
    
    try {
      console.log('Fetching user stats...');
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

      console.log('Fetching transactions...');
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
      setTransactions(txData.transactions);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoins = async () => {
    try {
      console.log('Adding coins...');
      await updateBalance(100, 'credit');
      console.log('Coins added successfully');
      await fetchUserData(); // Refresh data after adding coins
    } catch (error) {
      console.error('Error adding coins:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
          

          {/* Wallet Card */}
          <div className="card p-6 rounded-lg">
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
    </div>
  );
};

export default Dashboard;