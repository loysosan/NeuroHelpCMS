import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Shield, CheckCircle, LogOut } from 'lucide-react';
import { UserProfile } from './types';

type Props = {
  user: UserProfile;
  completeness: number;
  onLogout: () => void;
};

const getPhotoUrl = (url: string): string => {
  if (url.startsWith('/uploads')) return `/api${url}`;
  if (url.startsWith('/api/uploads') || url.startsWith('http')) return url;
  return url;
};

const ProfileHero: React.FC<Props> = ({ user, completeness, onLogout }) => {
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  const avatarUrl = user.portfolio?.photos?.[0]?.URL
    ? getPhotoUrl(user.portfolio.photos[0].URL)
    : null;

  return (
    <div className="rounded-2xl shadow-sm border overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white">
      <div className="px-6 py-6">
        {/* Avatar + basic info */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shadow-lg shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 shadow-lg flex items-center justify-center text-2xl font-bold text-white shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl font-bold">
                {user.firstName} {user.lastName}
              </h1>
              {user.verified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Верифіковано
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-400/20 text-amber-100 border border-amber-300/30">
                  <Shield className="w-3.5 h-3.5" />
                  Очікує підтвердження
                </span>
              )}
            </div>
            <p className="text-blue-100 text-sm mt-0.5">
              {user.role === 'psychologist' ? 'Спеціаліст-психолог' : 'Клієнт'} · {user.email}
            </p>
          </div>
          <div className="flex gap-2">
            {user.role === 'psychologist' && (
              <Link
                to={`/specialist/${user.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-white/15 hover:bg-white/25 rounded-lg transition-colors border border-white/20"
              >
                <ExternalLink className="w-4 h-4" />
                Публічний профіль
              </Link>
            )}
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-100 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors border border-red-300/30"
            >
              <LogOut className="w-4 h-4" />
              Вийти
            </button>
          </div>
        </div>

        {/* Completeness bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-blue-100">
              Профіль заповнено
            </span>
            <span className={`text-sm font-bold ${completeness === 100 ? 'text-green-300' : 'text-white'}`}>
              {completeness}%
            </span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completeness === 100 ? 'bg-green-400' : 'bg-white'
              }`}
              style={{ width: `${completeness}%` }}
            />
          </div>
          {completeness < 100 && (
            <p className="text-xs text-blue-200 mt-1.5">
              Заповніть профіль повністю — це підвищить вашу видимість у каталозі
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHero;
