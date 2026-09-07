import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
}

interface WebSocketContextType {
  isConnected: boolean;
  lastEvent: any | null;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<any | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const addToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type, timestamp: new Date() }]);
    setTimeout(() => {
      dismissToast(id);
    }, 6000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const connectWs = () => {
    try {
      const socket = new WebSocket('ws://localhost:8000/ws/slots');
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        console.log('[WebSocket] Connected to live campus booking hub.');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastEvent(data);

          if (data.type === 'SLOT_BOOKED') {
            addToast('Slot Reserved', `A slot was just reserved: ${data.booked_by}`, 'info');
          } else if (data.type === 'BOOKING_REVIEWED') {
            const isApproved = data.status === 'approved';
            addToast(
              `Requisition ${data.status.toUpperCase()}`,
              `Booking #${data.booking_id} was ${data.status}.`,
              isApproved ? 'success' : 'warning'
            );
          } else if (data.type === 'EQUIPMENT_CHECKED_OUT') {
            addToast('Equipment Handed Out', `Equipment #${data.equipment_id} has been issued.`, 'info');
          } else if (data.type === 'EQUIPMENT_RETURNED') {
            addToast('Equipment Return Logged', `Equipment #${data.equipment_id} is now ${data.equipment_status}.`, 'success');
          } else if (data.type === 'EQUIPMENT_STATUS_CHANGED') {
            addToast('Equipment Status Update', `Equipment #${data.equipment_id} status changed to ${data.status}`, 'warning');
          } else if (data.type === 'NOTIFICATION_ALERT') {
            addToast(data.title, data.message, 'warning');
          }
        } catch (e) {
          console.warn('[WebSocket] Non-JSON payload received:', event.data);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        console.log('[WebSocket] Connection closed. Retrying in 4s...');
        reconnectTimeoutRef.current = setTimeout(connectWs, 4000);
      };

      socket.onerror = () => {
        socket.close();
      };
    } catch (err) {
      console.error('[WebSocket] Setup exception:', err);
      reconnectTimeoutRef.current = setTimeout(connectWs, 4000);
    }
  };

  useEffect(() => {
    connectWs();

    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping');
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastEvent, toasts, dismissToast }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
