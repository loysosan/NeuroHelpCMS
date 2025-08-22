import React from 'react';
import { NavLink } from 'react-router-dom';

const BottomNavigation: React.FC = () => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-white/95 backdrop-blur md:hidden">
      <div className="grid grid-cols-4 text-xs">
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