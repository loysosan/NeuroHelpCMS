import { Routes, Route, Outlet } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import AdminLoginPage from '../pages/admin/AdminLoginPage';
import DashboardPage from '../pages/admin/DashboardPage';
import NewsPage from '../pages/admin/NewsPage';
import UsersPage from '../pages/admin/UsersPage';
import PlansPage from '../pages/admin/PlansPage';
import SkillsPage from '../pages/admin/SkillsPage';
import AdminPrivateRoute from '../utils/AdminPrivateRoute';

const AdminRoutes = () => (
  <Routes>
    <Route path="login" element={<AdminLoginPage />} />
    <Route
      path="/"
      element={
        <AdminPrivateRoute>
          <AdminLayout />
        </AdminPrivateRoute>
      }
    >
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="news" element={<NewsPage />} />
      <Route path="plans" element={<PlansPage />} />
      <Route path="skills" element={<SkillsPage />} />
    </Route>
  </Routes>
);

export default AdminRoutes;
