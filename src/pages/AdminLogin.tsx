import React, { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

const AdminLogin: React.FC = () => {
  const { loginAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginAdmin(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Адмін-вхід</h2>
        {error && <div className="mb-2 text-red-600">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">
            Email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mt-1 p-2 border rounded focus:outline-none focus:ring"
            />
          </label>
          <label className="block mb-4">
            Пароль:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mt-1 p-2 border rounded focus:outline-none focus:ring"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Зачекайте...' : 'Увійти'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;