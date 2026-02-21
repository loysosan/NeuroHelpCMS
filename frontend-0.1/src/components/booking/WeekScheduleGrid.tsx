import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { ScheduleTemplate } from '../../types/booking';

const DAY_NAMES = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя'];
const DAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

type Props = {
  templates: ScheduleTemplate[];
  onAdd: (template: Omit<ScheduleTemplate, 'id' | 'psychologistId' | 'createdAt'>) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, isActive: boolean) => void;
};

export const WeekScheduleGrid: React.FC<Props> = ({ templates, onAdd, onDelete, onToggle }) => {
  const [addingDay, setAddingDay] = useState<number | null>(null);
  const [form, setForm] = useState({
    startTime: '09:00',
    endTime: '18:00',
    slotDurationMinutes: 60,
  });

  const getByDay = (day: number) =>
    templates.filter(t => t.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleAdd = () => {
    if (addingDay === null) return;
    onAdd({
      dayOfWeek: addingDay,
      startTime: form.startTime,
      endTime: form.endTime,
      slotDurationMinutes: form.slotDurationMinutes,
      isActive: true,
    });
    setAddingDay(null);
  };

  return (
    <div className="space-y-2">
      {DAY_NAMES.map((dayName, dayIndex) => {
        const dayTemplates = getByDay(dayIndex);
        const isAdding = addingDay === dayIndex;

        return (
          <div key={dayIndex} className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Заголовок дня */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-600">
                  {DAY_SHORT[dayIndex]}
                </span>
                <span className="text-sm font-medium text-gray-700">{dayName}</span>
                {dayTemplates.length > 0 && (
                  <span className="text-xs text-gray-400">({dayTemplates.length})</span>
                )}
              </div>
              <button
                onClick={() => setAddingDay(isAdding ? null : dayIndex)}
                className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                title="Додати шаблон"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Існуючі шаблони дня */}
            {dayTemplates.length > 0 && (
              <div className="px-4 py-2 space-y-1.5">
                {dayTemplates.map(tmpl => (
                  <div
                    key={tmpl.id}
                    className={`flex items-center justify-between gap-2 p-2 rounded-lg ${
                      tmpl.isActive ? 'bg-blue-50' : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={tmpl.isActive}
                        onChange={e => onToggle(tmpl.id, e.target.checked)}
                        className="rounded accent-blue-600 shrink-0"
                      />
                      <span className="text-sm text-gray-700 font-medium">
                        {tmpl.startTime.slice(0, 5)} – {tmpl.endTime.slice(0, 5)}
                      </span>
                      <span className="text-xs text-gray-400 truncate">
                        по {tmpl.slotDurationMinutes} хв
                      </span>
                    </div>
                    <button
                      onClick={() => onDelete(tmpl.id)}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Форма додавання */}
            {isAdding && (
              <div className="px-4 py-3 border-t border-gray-100 bg-blue-50 space-y-3">
                <p className="text-xs font-medium text-blue-700">Новий шаблон для {dayName}</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">З</label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">До</label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Тривалість</label>
                    <select
                      value={form.slotDurationMinutes}
                      onChange={e => setForm(f => ({ ...f, slotDurationMinutes: Number(e.target.value) }))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      <option value={30}>30 хв</option>
                      <option value={45}>45 хв</option>
                      <option value={60}>1 год</option>
                      <option value={90}>1.5 год</option>
                      <option value={120}>2 год</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    className="flex-1 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    Додати
                  </button>
                  <button
                    onClick={() => setAddingDay(null)}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
