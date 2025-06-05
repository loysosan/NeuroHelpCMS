// src/components/Header.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { token, logout } = useAuth();
  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold">
        Мій Проєкт
      </Link>
      {token ? (
        <button onClick={logout} className="text-red-600 hover:underline">
          Вийти
        </button>
      ) : (
        <Link to="/admin/login" className="text-blue-600 hover:underline">
          Адмін-вхід
        </Link>
      )}
    </header>
  );
};

export default Header;