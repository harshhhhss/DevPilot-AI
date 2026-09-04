import { createContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('devpilot_token');
    if (!isAuthenticated || !token) {
      setSocket(null);
      return undefined;
    }

    const instance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    instance.on('notification:new', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      toast(notification.message, { icon: '🔔' });
    });

    setSocket(instance);

    return () => {
      instance.disconnect();
    };
  }, [isAuthenticated]);

  const value = useMemo(() => ({ socket, notifications, setNotifications }), [socket, notifications]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
