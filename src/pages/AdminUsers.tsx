import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

type UserItem = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
};

const AdminUsers: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) {
          throw new Error('Не вдалося отримати список користувачів');
        }
        const data = await res.json();
        setUsers(data.users);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchUsers();
  }, [token]);

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-semibold mb-4">Список користувачів</h2>
      {error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <table className="w-full bg-white rounded shadow">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Ім’я</th>
              <th className="p-2 text-left">Прізвище</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="p-2">{u.id}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.firstName}</td>
                <td className="p-2">{u.lastName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminUsers;