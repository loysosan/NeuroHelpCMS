import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();
  return (
    <header className="w-full border-b bg-white/80 backdrop-blur z-30">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-semibold text-lg tracking-tight flex items-center gap-2">
          <span className="text-indigo-600">NeuroHelp</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/news" className="text-gray-600 hover:text-gray-900">Новини</Link>
          <Link to="/articles" className="text-gray-600 hover:text-gray-900">Статті</Link>
          <Link to="/search" className="text-gray-600 hover:text-gray-900">Пошук</Link>
        </nav>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-sm px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
          >
            Увійти
          </button>
          <button
            onClick={() => navigate('/register')}
            className="text-sm px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
          >
            Реєстрація
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;