import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { NewsPage } from '../pages/admin/NewsPage';
import { UsersPage } from '../pages/admin/UsersPage';
import { PlansPage } from '../pages/admin/PlansPage';
import { SkillsPage } from '../pages/admin/SkillsPage';
import { AdministratorsPage } from '../pages/admin/AdministratorsPage';
import { AdminPrivateRoute } from '../utils/AdminPrivateRoute';

const AdminRoutes: React.FC = () => (
  <Routes>
    <Route path="login" element={<AdminLoginPage />} />
    <Route element={<AdminPrivateRoute />}>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="skills" element={<SkillsPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="administrators" element={<AdministratorsPage />} />
      </Route>
    </Route>
  </Routes>
);

export default AdminRoutes;
