import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { logout, user } = useAuth(); // Add user from auth context
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-indigo-700' : '';
  };

  return (
    <div className="flex min-h-screen">
      {/* Бокове меню */}
      <div className="w-64 bg-indigo-800 text-white">
        <div className="p-4">
          <h1 className="text-xl font-bold">Адмін-панель</h1>
          <p className="text-sm text-indigo-300 mt-1">{user?.Role}</p>
        </div>
        <nav className="mt-4">
          <Link
            to="/admin/dashboard"
            className={`flex items-center px-4 py-2 hover:bg-indigo-700 ${isActive('/admin/dashboard')}`}
          >
            <span className="mr-2">📊</span>
            Головна
          </Link>

          {/* Користувачі - видимі для всіх */}
          <Link
            to="/admin/users"
            className={`flex items-center px-4 py-2 hover:bg-indigo-700 ${isActive('/admin/users')}`}
          >
            <span className="mr-2">👥</span>
            Користувачі
          </Link>

          {/* Управління навичками - видимі для всіх */}
          <Link
            to="/admin/skills"
            className={`flex items-center px-4 py-2 hover:bg-indigo-700 ${isActive('/admin/skills')}`}
          >
            <span className="mr-2">🎯</span>
            Навички
          </Link>

          {/* Управління планами - тільки для адміністраторів та майстрів */}
          {(user?.Role === 'admin' || user?.Role === 'master') && (
            <Link
              to="/admin/plans"
              className={`flex items-center px-4 py-2 hover:bg-indigo-700 ${isActive('/admin/plans')}`}
            >
              <span className="mr-2">📋</span>
              Плани підписки
            </Link>
          )}

          {/* Управління адміністраторами - тільки для адміністраторів та майстрів */}
          {(user?.Role === 'admin' || user?.Role === 'master') && (
            <Link
              to="/admin/administrators"
              className={`flex items-center px-4 py-2 hover:bg-indigo-700 ${isActive('/admin/administrators')}`}
            >
              <span className="mr-2">👨‍💼</span>
              Адміністратори
            </Link>
          )}
        </nav>
        <div className="absolute bottom-0 w-64 p-4">
          <button
            onClick={logout}
            className="flex items-center px-4 py-2 w-full text-left hover:bg-indigo-700 text-red-300 hover:text-red-200"
          >
            <span className="mr-2">🚪</span>
            Вийти
          </button>
        </div>
      </div>

      {/* Основний контент */}
      <div className="flex-1 bg-gray-100">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;