import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, Wifi, WifiOff } from 'lucide-react';
import Header from '../../components/user/Header';
import BottomNavigation from '../../components/user/BottomNavigation';
import { useChat } from '../../hooks/useChat';
import { useUserAuth } from '../../context/UserAuthContext';
import { getConversations } from '../../api/user/chat';
import { Conversation, ChatUser } from '../../types/chat';

const getAvatarUrl = (user?: ChatUser): string => {
  const url = user?.Portfolio?.Photos?.[0]?.url;
  if (!url) return '';
  if (url.startsWith('/uploads')) return `/api${url}`;
  if (url.startsWith('/api/uploads') || url.startsWith('http')) return url;
  return '';
};

const ChatRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useUserAuth();
  const convId = Number(id);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, connected, send, loadingHistory } = useChat(convId);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/');
  }, [isLoading, isAuthenticated, navigate]);

  // Load conversation metadata for the header title
  useEffect(() => {
    if (!isAuthenticated) return;
    getConversations().then((list) => {
      const found = list.find((c) => c.id === convId);
      if (found) setConversation(found);
    });
  }, [isAuthenticated, convId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getInterlocutor = () => {
    if (!conversation) return null;
    return user?.role === 'client' ? conversation.psychologist : conversation.client;
  };

  const interlocutor = getInterlocutor();
  const interlocutorName = interlocutor
    ? `${interlocutor.FirstName} ${interlocutor.LastName}`.trim()
    : 'Завантаження...';

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !connected) return;
    send(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16 md:pb-0">
      <Header />

      {/* Chat header */}
      <div className="sticky top-[64px] z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <Link to="/chats" className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>

        <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
          {getAvatarUrl(interlocutor ?? undefined) ? (
            <img
              src={getAvatarUrl(interlocutor ?? undefined)}
              alt={interlocutorName}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            interlocutorName.charAt(0).toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{interlocutorName}</p>
          <div className="flex items-center gap-1">
            {connected ? (
              <>
                <Wifi className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600">Онлайн</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">Не підключено</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-2xl w-full mx-auto">
        {loadingHistory && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loadingHistory && messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">Почніть розмову — напишіть перше повідомлення</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMine = msg.senderId === user?.id;
          const senderName = msg.sender
            ? `${msg.sender.FirstName} ${msg.sender.LastName}`.trim()
            : '';
          const showName = !isMine && senderName;

          return (
            <div key={msg.id ?? `tmp-${idx}`} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {showName && (
                  <span className="text-xs text-gray-500 px-1">{senderName}</span>
                )}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
                    isMine
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-gray-400 px-1">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="sticky bottom-16 md:bottom-0 bg-white border-t border-gray-200 px-4 py-3 z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={connected ? 'Напишіть повідомлення...' : 'Підключення...'}
            disabled={!connected}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || !connected}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ChatRoomPage;
