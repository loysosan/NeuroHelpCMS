import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import AdminRoutes from './routes/AdminRoutes';
import HomePage from './pages/user/HomePage';
import NewsListPage from './pages/user/NewsListPage';
import NewsDetailPage from './pages/user/NewsDetailPage';
import QuizRegisterPage from './pages/user/QuizRegisterPage';
// import UserRoutes from './routes/UserRoutes'; // для майбутньої користувацької частини

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/admin/*" 
          element={
            <AdminAuthProvider>
              <AdminRoutes />
            </AdminAuthProvider>
          } 
        />
        {/* Публичные пользовательские маршруты */}
        <Route path="/" element={<HomePage />} />
        <Route path="/news" element={<NewsListPage />} />
        <Route path="/news/:id" element={<NewsDetailPage />} />
        <Route path="/quiz-register" element={<QuizRegisterPage />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
        {/* Добавь остальные маршруты (новости, детальная, логин и т.д.) */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;