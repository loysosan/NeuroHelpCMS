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
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-80 max-w-full bg-white shadow-xl">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b">
                  <span className="text-lg font-semibold">Меню</span>
                  <button onClick={() => setOpen(false)} className="p-2 hover:bg-gray-100 rounded-md">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                  <Link
                    to="/"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    Головна
                  </Link>
                  <Link
                    to="/search"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    Спеціалісти
                  </Link>
                  <Link
                    to="/news"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    Новини
                  </Link>

                  {isAuthenticated && (
                    <Link
                      to="/profile"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      Профіль
                    </Link>
                  )}
                </nav>

                <div className="p-4 border-t">
                  {isAuthenticated ? (
                    <div className="space-y-3">
                      <div className="px-4 py-2 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-600">{user?.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Вийти
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setOpen(false);
                        setShowLoginModal(true);
                      }}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors"
                    >
                      Увійти
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
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