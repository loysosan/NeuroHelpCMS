import React, { useState } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, isPast,
  parseISO, isToday,
} from 'date-fns';
import { uk } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { AvailabilitySlot } from '../../types/booking';

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

type Props = {
  slots: AvailabilitySlot[];
  onSlotSelect: (slot: AvailabilitySlot) => void;
};

export const MonthCalendar: React.FC<Props> = ({ slots, onSlotSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getSlotsForDay = (day: Date) =>
    slots.filter(s => isSameDay(parseISO(s.startTime), day));

  const daySlots = selectedDay ? getSlotsForDay(selectedDay) : [];

  return (
    <div className="space-y-4">
      {/* Навігація місяцями */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-gray-800 capitalize">
          {format(currentMonth, 'LLLL yyyy', { locale: uk })}
        </span>
        <button
          onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Сітка */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {/* Заголовки днів */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {DAY_LABELS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-gray-500">
              {d}
            </div>
          ))}
        </div>

        {/* Клітинки днів */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const daySlotCount = getSlotsForDay(day).length;
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isPastDay = isPast(day) && !isToday(day);
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const hasSlots = daySlotCount > 0;

            return (
              <button
                key={i}
                onClick={() => {
                  if (!isPastDay && isCurrentMonth && hasSlots) {
                    setSelectedDay(prev =>
                      prev && isSameDay(prev, day) ? null : day
                    );
                  }
                }}
                disabled={isPastDay || !isCurrentMonth || !hasSlots}
                className={`
                  relative p-1 min-h-[52px] flex flex-col items-center justify-start gap-0.5
                  border-b border-r border-gray-100 transition-colors
                  ${!isCurrentMonth ? 'opacity-30' : ''}
                  ${isPastDay ? 'opacity-40 cursor-not-allowed' : ''}
                  ${isSelected ? 'bg-blue-50' : ''}
                  ${hasSlots && !isPastDay && isCurrentMonth ? 'cursor-pointer hover:bg-blue-50' : ''}
                `}
              >
                <span className={`
                  text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                  ${isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-700'}
                  ${isSelected && !isToday(day) ? 'bg-blue-100' : ''}
                `}>
                  {format(day, 'd')}
                </span>
                {hasSlots && isCurrentMonth && !isPastDay && (
                  <span className="text-[10px] font-medium text-blue-600 leading-none">
                    {daySlotCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Слоти вибраного дня */}
      {selectedDay && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {format(selectedDay, 'd MMMM, EEEE', { locale: uk })}
          </p>
          {daySlots.length === 0 ? (
            <p className="text-sm text-gray-400">Немає доступних слотів</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {daySlots.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => onSlotSelect(slot)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-blue-200 bg-blue-50 rounded-lg text-sm text-blue-700 font-medium hover:bg-blue-100 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {format(parseISO(slot.startTime), 'HH:mm')} –{' '}
                  {format(parseISO(slot.endTime), 'HH:mm')}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
