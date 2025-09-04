import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import BottomNavigation from '../../components/user/BottomNavigation';

const ProfilePage: React.FC = () => {
  const { user, logout, isLoading } = useUserAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 pb-24 md:pb-0">
      <Header />
      
      <main className="flex-1 px-4 pt-8 pb-16 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Мій профіль</h1>
              <p className="text-gray-600 mt-1">Керування обліковим записом</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-500 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              Вийти
            </button>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-medium mb-4">Основна інформація</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ім'я</label>
                  <p className="text-gray-900">{user.firstName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Прізвище</label>
                  <p className="text-gray-900">{user.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
                  <p className="text-gray-900">{user.role === 'client' ? 'Користувач' : 'Спеціаліст'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Статус верифікації</label>
                  <p className={`${user.verified ? 'text-green-600' : 'text-orange-600'}`}>
                    {user.verified ? '✅ Підтверджено' : '⏳ Очікує підтвердження'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-blue-50 rounded-lg text-center">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Налаштування профілю в розробці
              </h3>
              <p className="text-blue-700 text-sm">
                Незабаром тут з'являться можливості редагування профілю, налаштування сповіщень та інші функції.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;