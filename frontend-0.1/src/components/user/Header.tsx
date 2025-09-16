import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, LogIn, LogOut } from 'lucide-react';
import { useUserAuth } from '../../context/UserAuthContext';
import LoginModal from './LoginModal';

const navItems = [
  { to: '/', id: 'home', label: 'Головна' },
  { to: '/search', id: 'search', label: 'Спеціалісти' },
  { to: '/news', id: 'articles', label: 'Новини' },
  { to: '/about', id: 'about', label: 'Про нас' }
];

const Header: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated, user, logout } = useUserAuth();

  const handleLogout = () => {
    logout();
    setOpen(false);
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    setOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="px-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">NH</span>
              </div>
              <span className="text-xl font-bold text-gray-900">NeuroHelp</span>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center gap-6">
              <NavLink to="/" className={({ isActive }) => 
                `text-sm font-medium transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-700 hover:text-gray-900'}`
              }>
                Головна
              </NavLink>
              <NavLink to="/search" className={({ isActive }) => 
                `text-sm font-medium transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-700 hover:text-gray-900'}`
              }>
                Спеціалісти
              </NavLink>
              <NavLink to="/news" className={({ isActive }) => 
                `text-sm font-medium transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-700 hover:text-gray-900'}`
              }>
                Новини
              </NavLink>

              {isAuthenticated ? (
                <>
                  <NavLink to="/profile" className={({ isActive }) => 
                    `text-sm font-medium transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-700 hover:text-gray-900'}`
                  }>
                    Профіль
                  </NavLink>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="px-4 h-9 inline-flex items-center gap-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Вийти
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 h-9 inline-flex items-center gap-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Увійти
                </button>
              )}
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setOpen(true)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md hover:bg-gray-100 text-gray-700"
              aria-label="Меню"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile sheet */}
        {open && (
          <>
            {/* Оверлей позади меню */}
            <div
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
            />

            {/* Панель меню */}
            <div
              className="fixed top-0 left-0 right-0 z-50 bg-white/95 supports-[backdrop-filter]:backdrop-blur-md border-b border-gray-200 shadow-lg
                         animate-in slide-in-from-top duration-200"
            >
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <span className="font-semibold text-gray-900">Меню</span>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <span className="sr-only">Закрити</span>
                    ✕
                  </button>
                </div>

                <nav className="px-2 py-3 space-y-1">
                  <Link
                    to="/"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Головна
                  </Link>
                  <Link
                    to="/search"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Спеціалісти
                  </Link>
                  <Link
                    to="/news"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Новини
                  </Link>
                  {isAuthenticated && (
                    <Link
                      to="/profile"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Профіль
                    </Link>
                  )}
                </nav>

                <div className="p-4 border-t">
                  {isAuthenticated ? (
                    <div className="space-y-3">
                      <Link
                        to="/favorites"
                        onClick={() => setOpen(false)}
                        className="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-lg
                                   bg-indigo-600 text-white hover:bg-indigo-500"
                      >
                        Обране
                      </Link>
                      <button
                        onClick={() => { logout(); setOpen(false); }}
                        className="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-lg
                                   border border-gray-300 hover:bg-gray-50"
                      >
                        Вийти
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link
                        to="/login"
                        onClick={() => setOpen(false)}
                        className="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-lg
                                   bg-indigo-600 text-white hover:bg-indigo-500"
                      >
                        Увійти
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setOpen(false)}
                        className="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-lg
                                   border border-gray-300 hover:bg-gray-50"
                      >
                        Реєстрація
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default Header;