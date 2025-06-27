import React, { useState } from 'react';

interface RegisterPopupProps {
  show: boolean;
  onClose: () => void;
}

const RegisterPopup: React.FC<RegisterPopupProps> = ({ show, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [registerError, setRegisterError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Registration failed');
      }

      // Успешная регистрация
      alert('Registration successful! Please login.');
      setFormData({ firstName: '', lastName: '', email: '', password: '' });
      onClose();
    } catch (err: any) {
      setRegisterError(err.message || 'Registration failed');
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
        <h3 className="text-xl font-semibold mb-4">Register</h3>
        <form onSubmit={handleRegister}>
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            className="w-full mb-3 px-3 py-2 border rounded"
            value={formData.firstName}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            className="w-full mb-3 px-3 py-2 border rounded"
            value={formData.lastName}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full mb-3 px-3 py-2 border rounded"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full mb-4 px-3 py-2 border rounded"
            value={formData.password}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          />
          {registerError && (
            <div className="text-red-500 text-sm mb-2">{registerError}</div>
          )}
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPopup;