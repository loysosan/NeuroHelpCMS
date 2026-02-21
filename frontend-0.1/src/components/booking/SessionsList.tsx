import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUserAuth } from '../../context/UserAuthContext';
import { Session } from '../../types/booking';
import { SessionCard } from './SessionCard';
import { CalendarOff } from 'lucide-react';

type FilterType = 'upcoming' | 'past' | 'all';

const FILTER_LABELS: Record<FilterType, string> = {
  upcoming: 'Майбутні',
  past: 'Минулі',
  all: 'Усі',
};

type Props = {
  userRole: 'client' | 'psychologist';
};

export const SessionsList: React.FC<Props> = ({ userRole }) => {
  const { token } = useUserAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterType>('upcoming');
  const [error, setError] = useState('');

  const fetchSessions = async () => {
    try {
      const res = await axios.get('/api/users/sessions/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(res.data || []);
    } catch {
      setError('Не вдалося завантажити сесії');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCancel = async (id: number) => {
    setActionLoading(id);
    try {
      await axios.put(`/api/users/sessions/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'canceled' } : s));
    } catch {
      setError('Не вдалося скасувати сесію');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirm = async (id: number) => {
    setActionLoading(id);
    try {
      await axios.put(`/api/users/sessions/${id}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'confirmed' } : s));
    } catch {
      setError('Не вдалося підтвердити сесію');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id: number) => {
    setActionLoading(id);
    try {
      await axios.put(`/api/users/sessions/${id}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'completed' } : s));
    } catch {
      setError('Не вдалося завершити сесію');
    } finally {
      setActionLoading(null);
    }
  };

  const now = new Date().toISOString();
  const filtered = sessions.filter(s => {
    if (filter === 'upcoming') return s.startTime >= now && s.status !== 'canceled';
    if (filter === 'past') return s.startTime < now || s.status === 'completed' || s.status === 'canceled';
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Фільтри */}
      <div className="flex gap-2">
        {(Object.keys(FILTER_LABELS) as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Список */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
          <CalendarOff className="w-10 h-10" />
          <p className="text-sm">Сесій немає</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              userRole={userRole}
              onCancel={handleCancel}
              onConfirm={userRole === 'psychologist' ? handleConfirm : undefined}
              onComplete={userRole === 'psychologist' ? handleComplete : undefined}
              loading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
};
