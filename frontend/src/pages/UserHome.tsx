import React, { useState } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import UserHeader from '../components/UserHeader';
import LoginPopup from '../components/LoginPopup';
import RegisterPopup from '../components/RegisterPopup';

const UserHome: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { token, login } = useUserAuth();

  const isLoggedIn = !!token;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <UserHeader
        title="My Little Go CMS"
        showProfileLink={true}
        onLoginClick={() => setShowLogin(true)}
        onRegisterClick={() => setShowRegister(true)}
      />

      <main className="flex-1 flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold mb-4">Ласкаво просимо на сайт!</h2>
        <p className="text-gray-600">
          {isLoggedIn
            ? 'Ви увійшли в систему! Відвідайте свій профіль для керування обліковим записом.'
            : 'Будь ласка, увійдіть або зареєструйтеся для продовження.'}
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