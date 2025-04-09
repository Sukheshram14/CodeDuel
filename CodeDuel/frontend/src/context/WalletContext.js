import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.token) {
      fetchBalance();
      fetchTransactions();
    }
  }, [user]);

  const fetchBalance = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/wallet/balance`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await response.json();
      setBalance(data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/wallet/transactions`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await response.json();
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBalance = async (amount, type) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/wallet/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ amount, type })
      });
      const data = await response.json();
      setBalance(data.balance);
      await fetchTransactions();
      return data;
    } catch (error) {
      console.error('Error updating balance:', error);
      throw error;
    }
  };

  return (
    <WalletContext.Provider value={{
      balance,
      transactions,
      loading,
      updateBalance,
      refreshBalance: fetchBalance,
      refreshTransactions: fetchTransactions
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}; 