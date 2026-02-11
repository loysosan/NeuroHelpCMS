import React from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { User, Stethoscope } from 'lucide-react';
import type { GoogleUser } from '../../components/user/GoogleLoginButton';

const GoogleRoleSelectPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const googleUser = location.state?.googleUser as GoogleUser | undefined;

  // If no Google user data, redirect to home
  if (!googleUser) {
    return <Navigate to="/" replace />;
  }

  const handleSelectRole = (role: 'client' | 'psychologist') => {
    const targetPath = role === 'client' ? '/quiz-register-client' : '/quiz-register';
    navigate(targetPath, { state: { googleUser } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Вітаємо, {googleUser.firstName}!
          </h1>
          <p className="text-gray-600">
            Оберіть, як ви хочете використовувати платформу
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client card */}
          <button
            onClick={() => handleSelectRole('client')}
            className="group bg-white rounded-2xl shadow-md border-2 border-transparent hover:border-violet-400 hover:shadow-lg transition-all p-8 text-left"
          >
            <div className="w-16 h-16 bg-violet-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-violet-200 transition-colors">
              <User className="w-8 h-8 text-violet-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Я клієнт
            </h2>
            <p className="text-gray-600 text-sm">
              Шукаю спеціаліста для своєї дитини. Хочу знайти найкращого психолога та записатися на консультацію.
            </p>
          </button>

          {/* Specialist card */}
          <button
            onClick={() => handleSelectRole('psychologist')}
            className="group bg-white rounded-2xl shadow-md border-2 border-transparent hover:border-indigo-400 hover:shadow-lg transition-all p-8 text-left"
          >
            <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
              <Stethoscope className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Я спеціаліст
            </h2>
            <p className="text-gray-600 text-sm">
              Я психолог і хочу пропонувати свої послуги на платформі. Створити профіль та приймати клієнтів.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleRoleSelectPage;
