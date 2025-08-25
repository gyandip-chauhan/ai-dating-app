// frontend/src/components/Chat/Chat.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { chatAPI } from '../../services/api';
import './Chat.css';

interface ChatProps {
  sessionId?: string;
  userId?: string;
  otherUserId?: string;
  otherUserName?: string;
  otherUserProfile?: string;
}

interface Message {
  id: string;
  sender: string; // Changed to always be string
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  type?: 'text' | 'image' | 'file';
}

const Chat: React.FC<ChatProps> = ({ 
  sessionId, 
  userId, 
  otherUserId, 
  otherUserName = 'Chat Partner',
  otherUserProfile 
}) => {
  const params = useParams();
  const { user } = useAuth();
  const { sendMessage, isConnected, connectionStatus } = useWebSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [page, setPage] = useState(1);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use props or URL params - ensure currentUserId is string
  const chatSessionId = sessionId || params.sessionId;
  const currentUserId = (userId || user?.id || '').toString(); // Convert to string
  
  useEffect(() => {
    if (chatSessionId) {
      fetchChatHistory();
    }
  }, [chatSessionId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatHistory = async (pageNum: number = 1) => {
    if (!chatSessionId || !user) return;

    try {
      setIsLoading(true);
      const response = await chatAPI.getChatHistory(chatSessionId);
      
      if (response.data && response.data.messages) {
        const newMessages = response.data.messages.map((msg: any) => ({
          ...msg,
          sender: msg.sender.toString(), // Ensure sender is string
          timestamp: new Date(msg.timestamp),
          status: msg.sender.toString() === currentUserId ? 'delivered' : undefined
        }));
        
        if (pageNum === 1) {
          setMessages(newMessages);
        } else {
          setMessages(prev => [...newMessages, ...prev]);
        }
        
        setHasMoreMessages(response.data.has_more || false);
        setPage(pageNum);
      }
    } catch (error: any) {
      console.error('Error fetching chat history:', error);
      setError(error.response?.data?.message || 'Failed to load chat history.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreMessages = () => {
    if (hasMoreMessages && !isLoading) {
      fetchChatHistory(page + 1);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !chatSessionId || !currentUserId) return;

    const tempId = Date.now().toString();
    const message: Message = {
      id: tempId,
      sender: currentUserId, // This is now guaranteed to be string
      content: newMessage,
      timestamp: new Date(),
      status: 'sending',
      type: 'text'
    };

    // Optimistically add message to UI
    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Send via WebSocket - handle the void return type
    try {
      sendMessage({
        type: 'chat_message',
        data: {
          sessionId: chatSessionId,
          message: newMessage,
          tempId: tempId
        },
        timestamp: Date.now()
      });
    } catch (error) {
      // If WebSocket is not connected, update status to sent (will retry later)
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...msg, status: 'sent' } : msg
        )
      );
      
      setError('Connection lost. Messages will be sent when reconnected.');
    }

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
  }, [newMessage, chatSessionId, currentUserId, sendMessage]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing indicator
    if (value.length > 0) {
      if (!isTyping) {
        setIsTyping(true);
        try {
          sendMessage({
            type: 'typing_indicator',
            data: {
              sessionId: chatSessionId,
              isTyping: true
            },
            timestamp: Date.now()
          });
        } catch (error) {
          console.error('Failed to send typing indicator:', error);
        }
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        try {
          sendMessage({
            type: 'typing_indicator',
            data: {
              sessionId: chatSessionId,
              isTyping: false
            },
            timestamp: Date.now()
          });
        } catch (error) {
          console.error('Failed to send typing indicator:', error);
        }
      }, 1000);
    } else {
      setIsTyping(false);
      try {
        sendMessage({
          type: 'typing_indicator',
          data: {
            sessionId: chatSessionId,
            isTyping: false
          },
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Failed to send typing indicator:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real app, you would upload the file and then send a message with the file URL
    console.log('File selected:', file.name);
    
    // For now, we'll just simulate sending a file message
    const tempId = Date.now().toString();
    const message: Message = {
      id: tempId,
      sender: currentUserId, // This is now guaranteed to be string
      content: `File: ${file.name}`,
      timestamp: new Date(),
      status: 'sending',
      type: 'file'
    };

    setMessages(prev => [...prev, message]);
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const isSameSender = (index: number) => {
    if (index === 0) return false;
    return messages[index].sender === messages[index - 1].sender;
  };

  const isSameDay = (index: number) => {
    if (index === 0) return true;
    const currentDate = new Date(messages[index].timestamp).toDateString();
    const previousDate = new Date(messages[index - 1].timestamp).toDateString();
    return currentDate === previousDate;
  };

  const shouldShowDate = (index: number) => {
    if (index === 0) return true;
    return !isSameDay(index);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-user-info">
          <div className="user-avatar">
            {otherUserProfile ? (
              <img src={otherUserProfile} alt={otherUserName} />
            ) : (
              otherUserName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="user-details">
            <h3>{otherUserName}</h3>
            <div className="user-status">
              <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`}></span>
              <span className="status-text">
                {isConnected ? (isTyping ? 'typing...' : 'online') : 'offline'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="chat-actions">
          <button className="icon-button">
            <i className="fas fa-phone"></i>
          </button>
          <button className="icon-button">
            <i className="fas fa-video"></i>
          </button>
          <button className="icon-button">
            <i className="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>
      
      <div className="messages-container" ref={messagesContainerRef}>
        {isLoading && messages.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-chat-icon">💬</div>
            <h3>No messages yet</h3>
            <p>Start a conversation with {otherUserName}</p>
          </div>
        ) : (
          <>
            {hasMoreMessages && (
              <div className="load-more-container">
                <button onClick={loadMoreMessages} disabled={isLoading} className="load-more-btn">
                  {isLoading ? 'Loading...' : 'Load earlier messages'}
                </button>
              </div>
            )}
            
            {messages.map((message, index) => {
              const isOwn = message.sender === currentUserId;
              const showAvatar = !isOwn && !isSameSender(index);
              const showDate = shouldShowDate(index);
              
              return (
                <React.Fragment key={message.id}>
                  {showDate && (
                    <div className="date-divider">
                      <span>{formatDate(new Date(message.timestamp))}</span>
                    </div>
                  )}
                  
                  <div
                    className={`message ${isOwn ? 'own-message' : 'other-message'} ${showAvatar ? 'with-avatar' : ''}`}
                  >
                    {showAvatar && (
                      <div className="message-avatar">
                        {otherUserProfile ? (
                          <img src={otherUserProfile} alt={otherUserName} />
                        ) : (
                          otherUserName.charAt(0).toUpperCase()
                        )}
                      </div>
                    )}
                    
                    <div className="message-content">
                      <div className="message-bubble">
                        {message.type === 'file' ? (
                          <div className="file-message">
                            <div className="file-icon">
                              <i className="fas fa-file"></i>
                            </div>
                            <div className="file-info">
                              <p className="file-name">{message.content.replace('File: ', '')}</p>
                              <span className="file-size">1.2 MB</span>
                            </div>
                            <button className="download-btn">
                              <i className="fas fa-download"></i>
                            </button>
                          </div>
                        ) : (
                          <p>{message.content}</p>
                        )}
                        <div className="message-meta">
                          <span className="message-time">{formatTime(message.timestamp)}</span>
                          {isOwn && (
                            <span className={`message-status ${message.status}`}>
                              {message.status === 'sending' && '🕒'}
                              {message.status === 'sent' && '✓'}
                              {message.status === 'delivered' && '✓✓'}
                              {message.status === 'read' && '✓✓👁️'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {error && (
        <div className="chat-error">
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div className="message-input-container">
        <div className="message-input-wrapper">
          <button 
            className="input-action-button"
            onClick={() => fileInputRef.current?.click()}
          >
            <i className="fas fa-paperclip"></i>
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="message-input"
            disabled={!isConnected}
          />
          
          <button className="input-action-button">
            <i className="fas fa-smile"></i>
          </button>
          
          <button 
            onClick={handleSendMessage} 
            disabled={!newMessage.trim() || !isConnected}
            className="send-button"
          >
            {newMessage.trim() ? (
              <i className="fas fa-paper-plane"></i>
            ) : (
              <i className="fas fa-microphone"></i>
            )}
          </button>
        </div>
        
        {!isConnected && (
          <div className="connection-status">
            <span className="connection-warning">
              Connection lost. Trying to reconnect...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;