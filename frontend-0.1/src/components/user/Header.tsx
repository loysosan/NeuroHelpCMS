import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Heart, Menu, Search, User, LogIn } from 'lucide-react';

const navItems = [
  { to: '/', id: 'home', label: 'Головна' },
  { to: '/search', id: 'search', label: 'Спеціалісти', icon: Search },
  { to: '/articles', id: 'articles', label: 'Статті' },
  { to: '/about', id: 'about', label: 'Про нас' }
];

const Header: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-gray-900">NeuroHelp</span>
          </button>

            {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map(item => (
              <NavLink
                key={item.id}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 h-9 inline-flex items-center gap-2 rounded-md text-sm font-medium transition-colors
                   ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
                }
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop user actions */}
          <div className="hidden md:flex items-center gap-3">
            <NavLink
              to="/favorites"
              className={({ isActive }) =>
                `px-3 h-9 inline-flex items-center gap-2 rounded-md text-sm font-medium transition-colors
                 ${isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
              }
            >
              <Heart className="w-4 h-4" />
              Обране
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `px-3 h-9 inline-flex items-center gap-2 rounded-md text-sm font-medium transition-colors
                 ${isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
              }
            >
              <User className="w-4 h-4" />
              Профіль
            </NavLink>
            <button
              onClick={() => navigate('/login')}
              className="px-4 h-9 inline-flex items-center gap-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Увійти
            </button>
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
          <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-xl flex flex-col">
            <div className="px-5 h-16 flex items-center justify-between border-b">
              <span className="font-semibold text-lg">Меню</span>
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                Закрити
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
              {navItems.map(item => (
                <NavLink
                  key={item.id}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `w-full inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                     ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`
                  }
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.label}
                </NavLink>
              ))}

              <div className="pt-4 mt-4 border-t space-y-2">
                <NavLink
                  to="/favorites"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `w-full inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                     ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`
                  }
                >
                  <Heart className="w-4 h-4" />
                  Обране
                </NavLink>
                <NavLink
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `w-full inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                     ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`
                  }
                >
                  <User className="w-4 h-4" />
                  Профіль
                </NavLink>
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate('/login');
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  <LogIn className="w-4 h-4" />
                  Увійти
                </button>
              </div>
            </div>
            <div className="px-5 py-4 border-t text-xs text-gray-500">
              © {new Date().getFullYear()} NeuroHelp
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;