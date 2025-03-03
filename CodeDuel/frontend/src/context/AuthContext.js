import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredUser, setStoredUser, removeStoredUser } from '../utils/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      // Verify the stored user data has all required fields
      if (storedUser.token && storedUser.username) {
        setUser(storedUser);
      } else {
        // If stored user data is incomplete, remove it
        removeStoredUser();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Ensure we have all required user data
      if (!data.token || !data.user || !data.user.username) {
        throw new Error('Invalid response from server');
      }

      const userData = {
        token: data.token,
        _id: data.user._id,
        username: data.user.username,
        email: data.user.email,
        MockCoinsBalance: data.user.MockCoinsBalance || 0,
        stats: data.user.stats || {
          totalMatches: 0,
          wins: 0,
          losses: 0,
          rank: 1000,
          preferredLanguage: 'javascript'
        }
      };

      setUser(userData);
      setStoredUser(userData);
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email, password) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signup failed');
      }

      const data = await response.json();
      setUser(data);
      setStoredUser(data);
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    removeStoredUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 