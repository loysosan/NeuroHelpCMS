import React from 'react';
import AdminLayout from '../components/AdminLayout';

const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Панель керування</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Картка статистики користувачів */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Користувачі</h3>
                <p className="text-gray-500">Загальна статистика</p>
              </div>
            </div>
          </div>

          {/* Картка статистики планів */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Плани</h3>
                <p className="text-gray-500">Активні підписки</p>
              </div>
            </div>
          </div>

          {/* Картка статистики навичок */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Навички</h3>
                <p className="text-gray-500">База знань</p>
              </div>
            </div>
          </div>
        </div>

        {/* Місце для майбутніх графіків та додаткової статистики */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6 min-h-[400px]">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Активність користувачів</h3>
            <div className="flex items-center justify-center h-full text-gray-400">
              Графік активності (в розробці)
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 min-h-[400px]">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Статистика підписок</h3>
            <div className="flex items-center justify-center h-full text-gray-400">
              Графік підписок (в розробці)
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;