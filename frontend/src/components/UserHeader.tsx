import React from 'react';
import { useUserAuth } from '../context/UserAuthContext';

interface UserHeaderProps {
  title?: string;
  showProfileLink?: boolean;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
}

const UserHeader: React.FC<UserHeaderProps> = ({ 
  title = "My Little Go CMS", 
  showProfileLink = false,
  onLoginClick,
  onRegisterClick 
}) => {
  const { token, logout } = useUserAuth();
  const isLoggedIn = !!token;

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <h1 className="text-2xl font-bold text-blue-700">{title}</h1>
          
          <div className="flex items-center space-x-4">
            {!isLoggedIn ? (
              <>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={onLoginClick}
                >
                  Увійти
                </button>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  onClick={onRegisterClick}
                >
                  Реєстрація
                </button>
              </>
            ) : (
              <>
                <a 
                  href="/"
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Головна
                </a>
                {showProfileLink && (
                  <a
                    href="/profile"
                    className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
                  >
                    Профіль
                  </a>
                )}
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Вихід
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default UserHeader;