import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUnreadCount } from '../../hooks/useUnreadCount';

const BottomNavigation: React.FC = () => {
  const unreadCount = useUnreadCount();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-white/95 backdrop-blur md:hidden">
      <div className="grid grid-cols-5 text-xs">
        <NavLink
          to="/"
          className={({ isActive }) =>
            'flex flex-col items-center py-3 ' +
            (isActive ? 'text-indigo-600 font-medium' : 'text-gray-600')
          }
        >
          <span>🏠</span>
          <span>Головна</span>
        </NavLink>
        <NavLink
          to="/search"
          className={({ isActive }) =>
            'flex flex-col items-center py-3 ' +
            (isActive ? 'text-indigo-600 font-medium' : 'text-gray-600')
          }
        >
          <span>🔍</span>
          <span>Пошук</span>
        </NavLink>
        <NavLink
          to="/news"
          className={({ isActive }) =>
            'flex flex-col items-center py-3 ' +
            (isActive ? 'text-indigo-600 font-medium' : 'text-gray-600')
          }
        >
          <span>📰</span>
          <span>Новини</span>
        </NavLink>
        <NavLink
          to="/chats"
          className={({ isActive }) =>
            'flex flex-col items-center py-3 ' +
            (isActive ? 'text-indigo-600 font-medium' : 'text-gray-600')
          }
        >
          <span className="relative">
            💬
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </span>
          <span>Чати</span>
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            'flex flex-col items-center py-3 ' +
            (isActive ? 'text-indigo-600 font-medium' : 'text-gray-600')
          }
        >
          <span>👤</span>
          <span>Профіль</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNavigation;
