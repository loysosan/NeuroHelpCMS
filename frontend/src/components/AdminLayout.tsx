import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { logout, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/admin/login', { replace: true });
    }
  }, [token, navigate]);

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Перевірка авторизації...</p>
        </div>
      </div>
    );
  }

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-indigo-700' : '';
  };

  return (
    <div className="flex min-h-screen">
      {/* Бокове меню */}
      <div className="w-64 bg-indigo-800 text-white flex flex-col">
        <div className="p-4">
          <h1 className="text-xl font-bold">Адмін-панель</h1>
          <p className="text-sm text-indigo-300 mt-1">Администратор</p>
        </div>
        
        <nav className="flex-1 mt-4">
          <Link
            to="/admin/dashboard"
            className={`flex items-center px-4 py-2 hover:bg-indigo-700 ${isActive('/admin/dashboard')}`}
          >
            <span className="mr-2">📊</span>
            Головна
          </Link>

          <Link
            to="/admin/users"
            className={`flex items-center px-4 py-2 hover:bg-indigo-700 ${isActive('/admin/users')}`}
          >
            <span className="mr-2">👥</span>
            Користувачі
          </Link>

          <Link
            to="/admin/skills"
            className={`flex items-center px-4 py-2 hover:bg-indigo-700 ${isActive('/admin/skills')}`}
          >
            <span className="mr-2">🎯</span>
            Навички
          </Link>

          <Link
            to="/admin/news"
            className={`flex items-center px-4 py-2 hover:bg-indigo-700 ${isActive('/admin/news')}`}
          >
            <span className="mr-2">📰</span>
            Новини
          </Link>

          <Link
            to="/admin/plans"
            className={`flex items-center px-4 py-2 hover:bg-indigo-700 ${isActive('/admin/plans')}`}
          >
            <span className="mr-2">📋</span>
            Плани підписки
          </Link>

          <Link
            to="/admin/administrators"
            className={`flex items-center px-4 py-2 hover:bg-indigo-700 ${isActive('/admin/administrators')}`}
          >
            <span className="mr-2">👨‍💼</span>
            Адміністратори
          </Link>
        </nav>

        <div className="p-4 border-t border-indigo-700">
          <button
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="flex items-center px-4 py-2 w-full text-left hover:bg-indigo-700 text-red-300 hover:text-red-200 rounded"
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