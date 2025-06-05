import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLogin from '../pages/AdminLogin';
import AdminDashboard from '../pages/AdminDashboard';
import AdminUsers from '../pages/AdminUsers';
import UserHome from '../pages/UserHome';
import NotFound from '../pages/NotFound';
import PrivateRoute from '../utils/PrivateRoute';

const AppRoutes: React.FC = () => (
  <Routes>
    {/* Публічна сторінка для звичайного користувача */}
    <Route path="/" element={<UserHome />} />

    {/* Адмінська частина */}
    <Route path="/admin/login" element={<AdminLogin />} />

    <Route
      path="/admin/dashboard"
      element={
        <PrivateRoute>
          <AdminDashboard />
        </PrivateRoute>
      }
    />
    <Route
      path="/admin/users"
      element={
        <PrivateRoute>
          <AdminUsers />
        </PrivateRoute>
      }
    />

    {/* Якщо не знайдено жодного шляху */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;