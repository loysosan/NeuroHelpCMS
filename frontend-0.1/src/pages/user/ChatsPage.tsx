import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, ChevronRight, Clock } from 'lucide-react';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import BottomNavigation from '../../components/user/BottomNavigation';
import { getConversations } from '../../api/user/chat';
import { Conversation, ChatUser } from '../../types/chat';
import { useUserAuth } from '../../context/UserAuthContext';

const getAvatarUrl = (user?: ChatUser): string => {
  const url = user?.Portfolio?.Photos?.[0]?.url;
  if (!url) return '';
  if (url.startsWith('/uploads')) return `/api${url}`;
  if (url.startsWith('/api/uploads') || url.startsWith('http')) return url;
  return '';
};

const getInitial = (user?: ChatUser): string => {
  return user?.FirstName?.charAt(0)?.toUpperCase() ?? '?';
};

const formatTime = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  return sameDay
    ? d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
};

const Avatar: React.FC<{ user?: ChatUser; size?: number }> = ({ user, size = 12 }) => {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = getAvatarUrl(user);
  const initial = getInitial(user);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={initial}
        className={`w-${size} h-${size} rounded-full object-cover`}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className={`w-${size} h-${size} rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-lg flex-shrink-0`}>
      {initial}
    </div>
  );
};

const ChatsPage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useUserAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/');
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getConversations()
      .then(setConversations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const getInterlocutor = (conv: Conversation): ChatUser | undefined => {
    return user?.role === 'client' ? conv.psychologist : conv.client;
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-indigo-600" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Повідомлення</h1>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {!loading && !error && conversations.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-50 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-indigo-300" />
            </div>
            <p className="text-gray-500 font-medium">Поки немає розмов</p>
            <p className="text-sm text-gray-400 mt-1">Знайдіть спеціаліста та натисніть «Написати»</p>
            <Link
              to="/search"
              className="inline-block mt-4 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Знайти спеціаліста
            </Link>
          </div>
        )}

        {!loading && conversations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
            {conversations.map((conv) => {
              const interlocutor = getInterlocutor(conv);
              const name = interlocutor
                ? `${interlocutor.FirstName} ${interlocutor.LastName}`.trim()
                : 'Невідомий';
              const time = formatTime(conv.lastMessageAt ?? conv.createdAt);
              const hasUnread = (conv.unreadCount ?? 0) > 0;

              return (
                <Link
                  key={conv.id}
                  to={`/chats/${conv.id}`}
                  className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar user={interlocutor} size={12} />
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>
                        {name}
                      </span>
                      <span className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={`text-sm truncate ${hasUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                        {conv.lastMessageAt ? 'Остання активність' : 'Розмова розпочата'}
                      </p>
                      {hasUnread && (
                        <span className="flex-shrink-0 ml-2 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-indigo-600 text-white text-[11px] font-bold">
                          {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="flex-shrink-0 w-4 h-4 text-gray-300" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default ChatsPage;
