import React, { useEffect, useState, useMemo } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { CreateUserModal } from '../../components/admin/modals/CreateUserModal';
import { ConfirmationModal } from '../../components/admin/modals/ConfirmationModal';

interface User {
  ID: number;
  Email: string;
  FirstName?: string;
  LastName?: string;
  Role?: string;
  Status?: string;
  CreatedAt?: string;
}

export const UsersPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) throw new Error('Не вдалося завантажити користувачів');
      const data = await r.json();
      setUsers(data || []);
    } catch (e:any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const handleCreate = async (d:any) => {
    if (!token) return;
    try {
      const r = await fetch('/api/admin/users', {
        method:'POST',
        headers: {
          'Content-Type':'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: d.email,
            firstName: d.firstName,
            lastName: d.lastName,
            password: d.password,
            role: d.role,
            status: d.status
        })
      });
      if (!r.ok) {
        let msg = 'Помилка створення';
        try { const j = await r.json(); msg = j.message || msg; } catch {}
        throw new Error(msg);
      }
      setCreateOpen(false);
      await load();
    } catch (e:any) {
      setErr(e.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId || !token) return;
    try {
      const r = await fetch(`/api/admin/users/${deleteId}`, {
        method:'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) throw new Error('Не вдалося видалити користувача');
      setDeleteId(null);
      await load();
    } catch (e:any) {
      setErr(e.message);
    }
  };

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch = search === '' ||
        (u.Email?.toLowerCase().includes(search.toLowerCase())) ||
        (u.FirstName?.toLowerCase().includes(search.toLowerCase())) ||
        (u.LastName?.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = filterStatus === 'all' || u.Status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [users, search, filterStatus]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-semibold">Користувачі</h2>
        <div className="flex gap-3">
          <input
            placeholder="Пошук..."
            className="border rounded px-3 py-2 text-sm"
            value={search}
            onChange={e=>setSearch(e.target.value)}
          />
          <select
            className="border rounded px-2 py-2 text-sm"
            value={filterStatus}
            onChange={e=>setFilterStatus(e.target.value)}
          >
            <option value="all">Всі статуси</option>
            <option value="Active">Active</option>
            <option value="Blocked">Blocked</option>
            <option value="Pending">Pending</option>
          </select>
          <button
            onClick={()=>setCreateOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm"
          >+ Створити</button>
        </div>
      </div>

      {err && <div className="text-red-600">{err}</div>}
      {loading && <div>Завантаження...</div>}

      {!loading && !err && (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Ім'я</th>
                <th className="px-4 py-2 text-left">Роль</th>
                <th className="px-4 py-2 text-left">Статус</th>
                <th className="px-4 py-2 text-left">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(u => (
                <tr key={u.ID} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{u.ID}</td>
                  <td className="px-4 py-2">{u.Email}</td>
                  <td className="px-4 py-2">{[u.FirstName,u.LastName].filter(Boolean).join(' ')}</td>
                  <td className="px-4 py-2">{u.Role || '—'}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      u.Status === 'Active' ? 'bg-green-100 text-green-700' :
                      u.Status === 'Blocked' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {u.Status || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={()=>setDeleteId(u.ID)}
                      className="text-red-600 hover:text-red-800"
                    >Видалити</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Нічого не знайдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <CreateUserModal
        isOpen={createOpen}
        onClose={()=>setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <ConfirmationModal
        isOpen={deleteId !== null}
        onClose={()=>setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Підтвердження"
        message="Видалити користувача?"
      />
    </div>
  );
};