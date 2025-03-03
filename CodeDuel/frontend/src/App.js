import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Competition from './components/Competition/Competition';
import { connectSocket, disconnectSocket } from './services/socket';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.token) {
      connectSocket();
    } else {
      disconnectSocket();
    }
    
    return () => {
      disconnectSocket();
    };
  }, [user?.token]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/competition"
          element={
            <PrivateRoute>
              <Competition />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App; 