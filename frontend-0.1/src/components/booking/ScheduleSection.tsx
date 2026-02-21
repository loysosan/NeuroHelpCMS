import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import { uk } from 'date-fns/locale';
import { CalendarDays, RefreshCw, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { useUserAuth } from '../../context/UserAuthContext';
import { WeekScheduleGrid } from './WeekScheduleGrid';
import { SessionsList } from './SessionsList';
import { ScheduleTemplate } from '../../types/booking';
import { UserProfile } from '../profile/types';

type Props = {
  user: UserProfile | null;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onReload: () => void;
};

const GENERATE_WEEKS_OPTIONS = [1, 2, 4, 8];

export default function ScheduleSection({ user, authenticatedFetch, onReload }: Props) {
  const { token } = useUserAuth();
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [enforced, setEnforced] = useState(user?.portfolio?.scheduleEnforced ?? false);
  const [enforcedLoading, setEnforcedLoading] = useState(false);
  const [generateWeeks, setGenerateWeeks] = useState(4);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateResult, setGenerateResult] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<'templates' | 'sessions'>('templates');

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await authenticatedFetch('/api/users/schedule-templates');
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : []);
    } catch {
      setError('Не вдалося завантажити шаблони');
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Тогл schedule_enforced
  const handleToggleEnforced = async () => {
    setEnforcedLoading(true);
    const newVal = !enforced;
    try {
      const res = await authenticatedFetch('/api/users/self/portfolio', {
        method: 'PUT',
        body: JSON.stringify({ scheduleEnforced: newVal }),
      });
      if (res.ok) {
        setEnforced(newVal);
        onReload();
      }
    } catch {
      setError('Не вдалося зберегти налаштування');
    } finally {
      setEnforcedLoading(false);
    }
  };

  // Додати шаблон
  const handleAddTemplate = async (tmpl: Omit<ScheduleTemplate, 'id' | 'psychologistId' | 'createdAt'>) => {
    setError('');
    try {
      const res = await authenticatedFetch('/api/users/schedule-templates', {
        method: 'POST',
        body: JSON.stringify(tmpl),
      });
      const data = await res.json();
      if (data.success) {
        setTemplates(prev => [...prev, data.data]);
      }
    } catch {
      setError('Не вдалося додати шаблон');
    }
  };

  // Видалити шаблон
  const handleDeleteTemplate = async (id: number) => {
    setError('');
    try {
      await authenticatedFetch(`/api/users/schedule-templates/${id}`, { method: 'DELETE' });
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch {
      setError('Не вдалося видалити шаблон');
    }
  };

  // Вкл/викл шаблон
  const handleToggleTemplate = async (id: number, isActive: boolean) => {
    setError('');
    try {
      const res = await authenticatedFetch(`/api/users/schedule-templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, isActive } : t));
      }
    } catch {
      setError('Не вдалося оновити шаблон');
    }
  };

  // Генерація слотів
  const handleGenerate = async () => {
    setGenerateLoading(true);
    setGenerateResult(null);
    setError('');
    const startDate = format(new Date(), 'yyyy-MM-dd');
    const endDate = format(addDays(new Date(), generateWeeks * 7), 'yyyy-MM-dd');
    try {
      const res = await axios.post('/api/users/schedule-templates/generate',
        { startDate, endDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGenerateResult(`Згенеровано ${res.data.generated} слотів`);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Помилка генерації слотів');
    } finally {
      setGenerateLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Підзаголовок + переключення секцій */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection('templates')}
          className={`px-4 py-2 text-sm rounded-xl font-medium transition-colors ${
            activeSection === 'templates' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Налаштування
        </button>
        <button
          onClick={() => setActiveSection('sessions')}
          className={`px-4 py-2 text-sm rounded-xl font-medium transition-colors ${
            activeSection === 'sessions' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Мої сесії
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {activeSection === 'templates' && (
        <>
          {/* Тогл schedule_enforced */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Приймати тільки у доступний час</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Клієнт зможе записатись тільки на вільний слот у вашому розкладі
                </p>
              </div>
              <button
                onClick={handleToggleEnforced}
                disabled={enforcedLoading}
                className="shrink-0 disabled:opacity-60"
              >
                {enforced
                  ? <ToggleRight className="w-9 h-9 text-blue-600" />
                  : <ToggleLeft className="w-9 h-9 text-gray-400" />
                }
              </button>
            </div>

            {!enforced && (
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  Клієнт може вказати будь-який зручний час — деталі будуть обговорюватись при особистому спілкуванні.
                </span>
              </div>
            )}
          </div>

          {/* Шаблони тижневого розкладу */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-800">Тижневий розклад</h3>
            </div>
            <p className="text-xs text-gray-500">
              Задайте повторюваний графік. Натисніть «+» поряд з днем щоб додати часовий проміжок.
            </p>

            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <WeekScheduleGrid
                templates={templates}
                onAdd={handleAddTemplate}
                onDelete={handleDeleteTemplate}
                onToggle={handleToggleTemplate}
              />
            )}
          </div>

          {/* Генерація слотів */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-800">Згенерувати слоти</h3>
            </div>
            <p className="text-xs text-gray-500">
              Автоматично створити слоти доступності на основі активних шаблонів вище.
            </p>

            <div className="flex items-center gap-3">
              <select
                value={generateWeeks}
                onChange={e => setGenerateWeeks(Number(e.target.value))}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {GENERATE_WEEKS_OPTIONS.map(w => (
                  <option key={w} value={w}>{w} {w === 1 ? 'тиждень' : 'тижні'} вперед</option>
                ))}
              </select>

              <button
                onClick={handleGenerate}
                disabled={generateLoading || templates.filter(t => t.isActive).length === 0}
                className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {generateLoading ? 'Генеруємо...' : 'Згенерувати'}
              </button>
            </div>

            {generateResult && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                ✓ {generateResult}
              </div>
            )}

            {templates.filter(t => t.isActive).length === 0 && (
              <p className="text-xs text-gray-400">Немає активних шаблонів для генерації</p>
            )}
          </div>
        </>
      )}

      {activeSection === 'sessions' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <SessionsList userRole="psychologist" />
        </div>
      )}
    </div>
  );
}
