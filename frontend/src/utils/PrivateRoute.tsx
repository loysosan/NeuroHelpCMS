import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { token, isLoading } = useAuth();

  console.log('PrivateRoute check:', { token: token ? 'present' : 'null', isLoading });

  // Показываем загрузку пока идет проверка токена
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Редиректим только если загрузка завершена и токена нет
  if (!token) {
    console.log('PrivateRoute: No token, redirecting to login');
    return <Navigate to="/admin/login" replace />;
  }

  console.log('PrivateRoute: Token present, rendering protected content');
  return <>{children}</>;
};

export default PrivateRoute;