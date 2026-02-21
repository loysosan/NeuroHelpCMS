import React from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Session } from '../../types/booking';

const STATUS_CONFIG = {
  pending: {
    label: 'Очікує підтвердження',
    color: 'bg-amber-100 text-amber-700',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  confirmed: {
    label: 'Підтверджено',
    color: 'bg-blue-100 text-blue-700',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  completed: {
    label: 'Завершено',
    color: 'bg-green-100 text-green-700',
    icon: <Check className="w-3.5 h-3.5" />,
  },
  canceled: {
    label: 'Скасовано',
    color: 'bg-red-100 text-red-700',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

type Props = {
  session: Session;
  userRole: 'client' | 'psychologist';
  onCancel?: (id: number) => void;
  onConfirm?: (id: number) => void;
  onComplete?: (id: number) => void;
  loading?: number | null; // ID сесії що зараз завантажується
};

export const SessionCard: React.FC<Props> = ({
  session,
  userRole,
  onCancel,
  onConfirm,
  onComplete,
  loading,
}) => {
  const statusCfg = STATUS_CONFIG[session.status];
  const startDate = parseISO(session.startTime);
  const endDate = parseISO(session.endTime);
  const isLoading = loading === session.id;

  const otherPerson =
    userRole === 'client' ? session.psychologist : session.client;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      {/* Дата + час */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
            <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
            {format(startDate, 'd MMMM yyyy', { locale: uk })}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Clock className="w-4 h-4 shrink-0" />
            {format(startDate, 'HH:mm')} – {format(endDate, 'HH:mm')}
          </div>
        </div>

        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
          {statusCfg.icon}
          {statusCfg.label}
        </span>
      </div>

      {/* Ім'я клієнта/психолога */}
      {otherPerson && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4 shrink-0 text-gray-400" />
          <span>
            {userRole === 'client' ? 'Спеціаліст: ' : 'Клієнт: '}
            <span className="font-medium text-gray-800">
              {otherPerson.firstName} {otherPerson.lastName}
            </span>
          </span>
        </div>
      )}

      {/* Нотатки клієнта */}
      {session.clientNotes && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5 italic">
          {session.clientNotes}
        </p>
      )}

      {/* Кнопки дій */}
      <div className="flex gap-2 flex-wrap pt-1">
        {/* Психолог підтверджує pending */}
        {userRole === 'psychologist' && session.status === 'pending' && onConfirm && (
          <button
            onClick={() => onConfirm(session.id)}
            disabled={isLoading}
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {isLoading ? '...' : 'Підтвердити'}
          </button>
        )}

        {/* Психолог завершує confirmed */}
        {userRole === 'psychologist' && session.status === 'confirmed' && onComplete && (
          <button
            onClick={() => onComplete(session.id)}
            disabled={isLoading}
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {isLoading ? '...' : 'Завершити'}
          </button>
        )}

        {/* Скасування: обидві ролі для pending/confirmed */}
        {(session.status === 'pending' || session.status === 'confirmed') && onCancel && (
          <button
            onClick={() => onCancel(session.id)}
            disabled={isLoading}
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-60 transition-colors"
          >
            {isLoading ? '...' : 'Скасувати'}
          </button>
        )}
      </div>
    </div>
  );
};
