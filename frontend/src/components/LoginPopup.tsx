import React, { useState } from 'react';

interface LoginPopupProps {
  show: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
}

const LoginPopup: React.FC<LoginPopupProps> = ({ show, onClose, onLogin }) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    
    try {
      await onLogin(loginEmail, loginPassword);
      setLoginEmail('');
      setLoginPassword('');
      onClose();
    } catch (err: any) {
      setLoginError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-80 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          disabled={isLoading}
        >
          ×
        </button>
        <h3 className="text-xl font-semibold mb-4">Login</h3>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            className="w-full mb-3 px-3 py-2 border rounded"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            disabled={isLoading}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full mb-4 px-3 py-2 border rounded"
            value={loginPassword}
            onChange={e => setLoginPassword(e.target.value)}
            disabled={isLoading}
            required
          />
          {loginError && (
            <div className="text-red-500 text-sm mb-2">{loginError}</div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPopup;