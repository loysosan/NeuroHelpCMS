import React, { useState } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import LoginPopup from '../components/LoginPopup';
import RegisterPopup from '../components/RegisterPopup';

const UserHome: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { token, login, logout } = useUserAuth();

  const isLoggedIn = !!token;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <header className="w-full flex justify-between items-center px-8 py-4 bg-white shadow">
        <h1 className="text-2xl font-bold text-blue-700">My Little Go CMS</h1>
        <div>
          {!isLoggedIn ? (
            <>
              <button
                className="mr-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => setShowLogin(true)}
              >
                Login
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={() => setShowRegister(true)}
              >
                Register
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <a
                href="/profile"
                className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
              >
                Profile
              </a>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold mb-4">Welcome to the site!</h2>
        <p className="text-gray-600">
          {isLoggedIn
            ? 'You are logged in! Visit your profile to manage your account.'
            : 'Please login or register to continue.'}
        </p>
      </main>

      <LoginPopup
        show={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={login}
      />
      
      <RegisterPopup
        show={showRegister}
        onClose={() => setShowRegister(false)}
      />
    </div>
  );
};

export default UserHome;