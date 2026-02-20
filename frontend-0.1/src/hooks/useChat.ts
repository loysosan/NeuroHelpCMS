import { useCallback, useEffect, useRef, useState } from 'react';
import { getMessages } from '../api/user/chat';
import { Message, WSMessage } from '../types/chat';

interface UseChatResult {
  messages: Message[];
  connected: boolean;
  send: (content: string) => void;
  loadingHistory: boolean;
}

export function useChat(conversationId: number): UseChatResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  // Load history via REST on mount
  useEffect(() => {
    setLoadingHistory(true);
    getMessages(conversationId)
      .then((history) => setMessages(history))
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  }, [conversationId]);

  // Establish WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) return;

    // Detect ws:// or wss:// based on current protocol
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${proto}://${window.location.host}/api/ws/${conversationId}?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const wsMsg: WSMessage = JSON.parse(event.data);
        // Convert WSMessage → Message shape to unify state
        const newMsg: Message = {
          id: wsMsg.id,
          conversationId: wsMsg.conversationId,
          senderId: wsMsg.senderId,
          content: wsMsg.content,
          isRead: false,
          createdAt: wsMsg.createdAt,
        };
        setMessages((prev) => {
          // Avoid duplicates (same id from both REST history and WS)
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      } catch {
        // ignore malformed messages
      }
    };

    return () => {
      ws.close();
    };
  }, [conversationId]);

  const send = useCallback(
    (content: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ content }));
      }
    },
    [],
  );

  return { messages, connected, send, loadingHistory };
}
