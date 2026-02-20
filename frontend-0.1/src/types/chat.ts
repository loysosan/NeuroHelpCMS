// User as returned from Go's User struct (no JSON tags → PascalCase)
export interface ChatUser {
  ID: number;
  FirstName: string;
  LastName: string;
  Portfolio?: {
    Photos?: Array<{ url?: string }>;
  };
}

export interface Conversation {
  id: number;
  clientId: number;
  psychologistId: number;
  client?: ChatUser;
  psychologist?: ChatUser;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  sender?: ChatUser;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// Received over WebSocket
export interface WSMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  createdAt: string;
}
