import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLogin from '../pages/AdminLogin';
import AdminDashboard from '../pages/AdminDashboard';
import AdminUsers from '../pages/AdminUsers';
import UserHome from '../pages/UserHome';
import NotFound from '../pages/NotFound';
import PrivateRoute from '../utils/PrivateRoute';
import Register from '../pages/Register';
import RegistrationSuccess from '../pages/RegistrationSuccess';
import AdminEditUser from '../pages/AdminEditUser'; 
import AdminPlans from '../pages/AdminPlans';



const AppRoutes: React.FC = () => (
  <Routes>
    {/* Публічна сторінка для звичайного користувача */}
    <Route path="/" element={<UserHome />} />
    <Route path="/register" element={<Register />} />
    <Route path="/registration-success" element={<RegistrationSuccess />} />


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
    <Route
      path="/admin/users/:id/edit"
      element={
        <PrivateRoute>
          <AdminEditUser />
        </PrivateRoute>
      }
    />
    <Route path="/admin/plans" element={
      <PrivateRoute>
        <AdminPlans />
      </PrivateRoute>
    } />

    {/* Якщо не знайдено жодного шляху */}
    <Route path="*" element={<NotFound />} />

  </Routes>
);

export default AppRoutes;