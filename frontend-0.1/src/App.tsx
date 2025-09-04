import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { UserAuthProvider } from './context/UserAuthContext';
import AdminRoutes from './routes/AdminRoutes';
import HomePage from './pages/user/HomePage';
import NewsListPage from './pages/user/NewsListPage';
import NewsDetailPage from './pages/user/NewsDetailPage';
import QuizRegisterPage from './pages/user/QuizRegisterPage';
import QuizRegisterClientPage from './pages/user/QuizRegisterClientPage';
import ProfilePage from './pages/user/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <UserAuthProvider>
        <AdminAuthProvider>
          <Routes>
            {/* Admin routes */}
            <Route path="/admin/*" element={<AdminRoutes />} />
            
            {/* User routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/news" element={<NewsListPage />} />
            <Route path="/news/:id" element={<NewsDetailPage />} />
            <Route path="/quiz-register" element={<QuizRegisterPage />} />
            <Route path="/quiz-register-client" element={<QuizRegisterClientPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AdminAuthProvider>
      </UserAuthProvider>
    </BrowserRouter>
  );
}

export default App;