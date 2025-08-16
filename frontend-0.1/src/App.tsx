import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import AdminRoutes from './routes/AdminRoutes';
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
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;