import React, { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';

export const AdminLoginPage: React.FC = () => {
  const { login, isLoading } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <form
        onSubmit={submit}
        className="bg-white dark:bg-gray-800 p-6 rounded shadow w-full max-w-sm space-y-4"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Admin Login
        </h2>
        {err && (
          <div className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded">
            {err}
          </div>
        )}
        <div>
          <label className="block text-sm mb-1">Email</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
            />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
        </div>
        <button
          disabled={busy || isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white py-2 rounded"
        >
          {busy ? '...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default AdminLoginPage;