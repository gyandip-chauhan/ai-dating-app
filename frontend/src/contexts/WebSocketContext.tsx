// frontend/src/contexts/WebSocketContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: any) => void;
  messages: WebSocketMessage[];
  addMessage: (message: WebSocketMessage) => void;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: ((message: WebSocketMessage) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionStatusHandlers: ((status: WebSocketContextType['connectionStatus']) => void)[] = [];

  connect(token: string, onStatusChange?: (status: WebSocketContextType['connectionStatus']) => void) {
    if (onStatusChange) {
      this.connectionStatusHandlers.push(onStatusChange);
    }
    
    this.updateStatus('connecting');
    
    try {
      this.ws = new WebSocket(`${process.env.REACT_APP_WS_URL || 'ws://localhost:8000'}/ws?token=${token}`);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.updateStatus('connected');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.messageHandlers.forEach(handler => handler(message));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        this.updateStatus('disconnected');
        this.attemptReconnect(token);
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.updateStatus('error');
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.updateStatus('error');
    }
  }

  private updateStatus(status: WebSocketContextType['connectionStatus']) {
    this.connectionStatusHandlers.forEach(handler => handler(status));
  }

  private attemptReconnect(token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect(token);
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.connectionStatusHandlers = [];
  }

  sendMessage(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  setOnMessageHandler(handler: (message: WebSocketMessage) => void) {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: (message: WebSocketMessage) => void) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  setOnStatusChangeHandler(handler: (status: WebSocketContextType['connectionStatus']) => void) {
    this.connectionStatusHandlers.push(handler);
  }

  removeStatusChangeHandler(handler: (status: WebSocketContextType['connectionStatus']) => void) {
    this.connectionStatusHandlers = this.connectionStatusHandlers.filter(h => h !== handler);
  }
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<WebSocketContextType['connectionStatus']>('disconnected');
  const [webSocketService] = useState(() => new WebSocketService());
  const { user, token } = useAuth();

  const addMessage = (message: WebSocketMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const reconnect = () => {
    if (token) {
      webSocketService.connect(token, setConnectionStatus);
    }
  };

  useEffect(() => {
    const handleWebSocketMessage = (message: WebSocketMessage) => {
      console.log('Received WebSocket message:', message);
      addMessage(message);
      
      // Handle different message types
      switch (message.type) {
        case 'chat_message':
          // Handle chat messages
          break;
        case 'match_update':
          // Handle match updates
          break;
        case 'typing_indicator':
          // Handle typing indicators
          break;
        case 'message_read':
          // Handle read receipts
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    };

    webSocketService.setOnStatusChangeHandler(setConnectionStatus);
    webSocketService.setOnMessageHandler(handleWebSocketMessage);

    return () => {
      webSocketService.removeMessageHandler(handleWebSocketMessage);
      webSocketService.removeStatusChangeHandler(setConnectionStatus);
      webSocketService.disconnect();
    };
  }, [webSocketService]);

  useEffect(() => {
    if (token) {
      webSocketService.connect(token, setConnectionStatus);
      setIsConnected(true);
    } else {
      webSocketService.disconnect();
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  }, [token, webSocketService]);

  const sendMessage = (message: WebSocketMessage) => {
    return webSocketService.sendMessage(message);
  };

  const contextValue: WebSocketContextType = {
    isConnected: connectionStatus === 'connected',
    sendMessage,
    messages,
    addMessage,
    connectionStatus,
    reconnect
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};