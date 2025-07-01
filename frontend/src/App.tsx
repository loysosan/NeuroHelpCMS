import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UserAuthProvider } from './context/UserAuthContext';
import AppRoutes from './routes/AppRoutes';
import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <UserAuthProvider>
        <Routes>
          <Route path="/*" element={<AppRoutes />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:id" element={<NewsDetailPage />} />
        </Routes>
      </UserAuthProvider>
    </AuthProvider>
  );
};

export default App;