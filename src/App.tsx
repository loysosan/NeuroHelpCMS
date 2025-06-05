import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/*" element={<AppRoutes />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;