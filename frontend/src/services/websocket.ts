// frontend/src/services/websocket.ts
class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId: number) {
    const wsUrl = `ws://localhost:8000/api/v1/ws/chat/${userId}`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      this.handleMessage(JSON.parse(event.data));
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect(userId);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private attemptReconnect(userId: number) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(userId), 1000 * this.reconnectAttempts);
    }
  }

  sendMessage(message: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private handleMessage(data: any) {
    // Handle different message types
    switch (data.type) {
      case 'chat_message':
        // Update UI with new message
        break;
      case 'moderation_warning':
        // Show moderation warning to user
        break;
      case 'ai_suggestions':
        // Show AI response suggestions
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }
}

export const webSocketService = new WebSocketService();
