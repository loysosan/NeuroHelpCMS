import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Адмін-Панель</h1>
        <button onClick={logout} className="text-red-600 hover:underline">
          Вийти
        </button>
      </header>
      <main>
        <p className="mb-4">Ласкаво просимо до адміністративної частини.</p>
        <nav className="space-x-4">
          <Link to="/admin/users" className="text-blue-600 hover:underline">
            Користувачі
          </Link>
          <Link 
            to="/admin/plans" 
            className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            Плани підписки
          </Link>
          {/* Можна додати інші посилання: /admin/settings, /admin/reports */}
        </nav>
      </main>
    </div>
  );
};

export default AdminDashboard;