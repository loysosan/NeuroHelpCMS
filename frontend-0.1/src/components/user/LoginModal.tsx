import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Eye, EyeOff } from 'lucide-react';
import { useUserAuth } from '../../context/UserAuthContext';
import GoogleLoginButton, { type GoogleAuthResponse } from './GoogleLoginButton';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, loginWithToken } = useUserAuth();
  const navigate = useNavigate();

  // Очищуємо форму при відкритті/закритті
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setError('');
      setShowPassword(false);
    }
  }, [isOpen]);

  // Закриваємо модал при натисканні Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('Form submission with:', { email, password: '***' }); // Для отладки

    // Валидація на клієнті
    if (!email.trim()) {
      setError('Email обов\'язковий для заповнення');
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError('Пароль обов\'язковий для заповнення');
      setIsLoading(false);
      return;
    }

    try {
      await login(email.trim(), password);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      console.error('Login error:', err); // Для отладки
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (response: GoogleAuthResponse) => {
    if (response.status === 'authenticated' && response.access_token) {
      try {
        await loginWithToken(response.access_token);
        onClose();
        onSuccess?.();
      } catch (err: any) {
        setError(err.message || 'Помилка авторизації');
      }
    } else if (response.status === 'registration_required' && response.googleUser) {
      onClose();
      navigate('/register-role', { state: { googleUser: response.googleUser } });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Вхід до системи</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Закрити"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            Увійдіть до свого облікового запису
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-11 px-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Введіть пароль"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Вхід...' : 'Увійти'}
            </button>
          </form>

          {/* Google OAuth separator */}
          <div className="mt-4 mb-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">або</span>
              </div>
            </div>
          </div>

          {/* Google Login Button */}
          <GoogleLoginButton
            disabled={isLoading}
            onSuccess={handleGoogleSuccess}
            onError={(errorMsg) => setError(errorMsg)}
          />

          <div className="mt-6 text-center space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Немає облікового запису?</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Link 
                to="/quiz-register-client" 
                onClick={onClose}
                className="text-sm text-violet-600 hover:text-violet-500 font-medium transition-colors"
              >
                Зареєструватися як користувач
              </Link>
              <Link 
                to="/quiz-register" 
                onClick={onClose}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
              >
                Зареєструватися як спеціаліст
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;