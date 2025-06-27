import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UserAuthProvider } from './context/UserAuthContext';
import AppRoutes from './routes/AppRoutes';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <UserAuthProvider>
        <Routes>
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </UserAuthProvider>
    </AuthProvider>
  );
};

export default App;