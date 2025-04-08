import { io } from 'socket.io-client';
import { getStoredUser } from '../utils/auth';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: {
    token: getStoredUser()?.token
  }
});

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

export const connectSocket = () => {
  if (!socket.connected) {
    const user = getStoredUser();
    if (user?.token) {
      socket.auth = { token: user.token };
      socket.connect();
    }
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export { socket }; 