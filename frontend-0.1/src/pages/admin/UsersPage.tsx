import React, { useEffect, useState, useMemo } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { CreateUserModal } from '../../components/admin/modals/CreateUserModal';
import { ConfirmationModal } from '../../components/admin/modals/ConfirmationModal';
import { EditUserModal, EditUserData } from '../../components/admin/modals/EditUserModal';
import { UserDetailModal } from '../../components/admin/modals/UserDetailModal';
import { ChangeUserPasswordModal } from '../../components/admin/modals/ChangeUserPasswordModal';

interface RawUser {
  ID: number;
  Email: string;
  FirstName?: string;
  LastName?: string;
  Role?: string;
  Status?: string;
  Verified?: boolean;
  Phone?: string;
  CreatedAt?: string;
  PlanID?: number | null;
  Portfolio?: { Photos?: { id: number; url: string }[] };
}

const getAvatarUrl = (user: RawUser): string | null => {
  const photo = user.Portfolio?.Photos?.[0];
  if (!photo) return null;
  return photo.url.startsWith('/uploads') ? `/api${photo.url}` : photo.url;
};

interface Plan {
  ID: number;
  Name: string;
}

export const UsersPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [users, setUsers] = useState<RawUser[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<RawUser | null>(null);
  const [viewingUserId, setViewingUserId] = useState<number | null>(null);
  const [passwordUser, setPasswordUser] = useState<RawUser | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) throw new Error('Не вдалося отримати список користувачів');
      const data = await r.json();
      setUsers(data || []);
    } catch (e:any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    if (!token) return;
    setPlansLoading(true);
    try {
      const r = await fetch('/api/admin/plans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        const data = await r.json();
        setPlans(data || []);
      }
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); fetchPlans(); }, [token]);

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
      await fetchUsers();
    } catch (e:any) { setErr(e.message); }
  };

  const handleUpdate = async (data: Partial<EditUserData>) => {
    if (!token || !data.ID) return;
    try {
      const r = await fetch(`/api/admin/users/${data.ID}`, {
        method:'PUT',
        headers: {
          'Content-Type':'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          FirstName: data.FirstName,
          LastName: data.LastName,
          Email: data.Email,
          Role: data.Role,
          Status: data.Status,
          Verified: data.Verified,
          Phone: data.Phone || '',
          PlanID: data.PlanID ?? null
        })
      });
      if (!r.ok) {
        let msg = 'Не вдалося оновити користувача';
        try { const j = await r.json(); msg = j.message || msg; } catch {}
        throw new Error(msg);
      }
      setEditingUser(null);
      await fetchUsers();
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
      await fetchUsers();
    } catch (e:any) {
      setErr(e.message);
    }
  };

  const filtered = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        u.Email?.toLowerCase().includes(q) ||
        u.FirstName?.toLowerCase().includes(q) ||
        u.LastName?.toLowerCase().includes(q) ||
        u.Phone?.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'all' || u.Status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [users, search, filterStatus]);

  const getStatusStyle = (s?: string) => {
    switch (s) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Blocked': return 'bg-red-100 text-red-800';
      case 'Disabled': return 'bg-yellow-100 text-yellow-800';
      case 'Pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleStyle = (r?: string) => {
    switch (r) {
      case 'psychologist': return 'bg-blue-100 text-blue-800';
      case 'client': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('uk-UA', { year:'numeric', month:'short', day:'numeric' }) : '—';

  const resolvePlanName = (planID?: number | null) => {
    if (!planID) return '—';
    const p = plans.find(pl => pl.ID === planID);
    return p ? p.Name : `#${planID}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Користувачі</h1>
        <p className="mt-2 text-sm text-gray-600">Управління користувачами системи</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center flex-wrap gap-3">
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
            <option value="Disabled">Disabled</option>
            <option value="Pending">Pending</option>
          </select>
          <div className="flex space-x-2">
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Активні: {users.filter(u => u.Status === 'Active').length}
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              Заблоковані: {users.filter(u => u.Status === 'Blocked').length}
            </span>
          </div>
          {plansLoading && <span className="text-xs text-gray-400">Плани…</span>}
        </div>
        <button
          onClick={()=>setCreateOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center shadow-sm text-sm"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Створити користувача
        </button>
      </div>

      {err && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
          {err}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {!loading && !err && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Користувач
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Контакти
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    План
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата реєстрації
                  </th>
                  <th className="px-6 py-3"/>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map(u => {
                  const initials = (u.FirstName?.[0] || 'U').toUpperCase() + (u.LastName?.[0] || '').toUpperCase();
                  const avatarUrl = getAvatarUrl(u);
                  return (
                    <tr key={u.ID} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt=""
                                className="h-10 w-10 rounded-full object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                <span className="text-sm font-semibold text-white">
                                  {initials}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {u.FirstName} {u.LastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {u.ID}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{u.Email}</div>
                        <div className="text-sm text-gray-500">{u.Phone || 'Не вказано'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(u.Status)}`}>
                            {u.Status}
                          </span>
                          {u.Verified && (
                            <svg className="w-4 h-4 ml-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleStyle(u.Role)}`}>
                          {u.Role === 'psychologist' ? 'Психолог' :
                           u.Role === 'client' ? 'Клієнт' : u.Role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resolvePlanName(u.PlanID)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(u.CreatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => setViewingUserId(u.ID)}
                            className="text-gray-600 hover:text-gray-900 inline-flex items-center px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                            title="Деталі"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Деталі
                          </button>
                          <button
                            onClick={() => setEditingUser(u)}
                            className="text-indigo-600 hover:text-indigo-900 inline-flex items-center px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                            title="Редагувати"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M16.586 3.586a2 2 0 112.828 2.828L12 14l-4 1 1-4 7.586-7.586z" />
                            </svg>
                            Редагувати
                          </button>
                          <button
                            onClick={() => setPasswordUser(u)}
                            className="text-amber-600 hover:text-amber-900 inline-flex items-center px-2 py-1 rounded hover:bg-amber-50 transition-colors"
                            title="Змінити пароль"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Пароль
                          </button>
                          <button
                            onClick={() => setDeleteId(u.ID)}
                            className="text-red-600 hover:text-red-900 inline-flex items-center px-2 py-1 rounded hover:bg-red-50 transition-colors"
                            title="Видалити"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Видалити
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Користувачі відсутні</h3>
              <p className="mt-1 text-sm text-gray-500">
                Почніть зі створення нового користувача.
              </p>
            </div>
          )}
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
        title="Підтвердження видалення"
        message="Ви впевнені, що хочете видалити цього користувача? Цю дію неможливо скасувати."
      />

      <EditUserModal
        isOpen={!!editingUser}
        onClose={()=>setEditingUser(null)}
        onSubmit={handleUpdate}
        token={token || ''}
        user={editingUser ? {
          ID: editingUser.ID,
          Email: editingUser.Email,
          FirstName: editingUser.FirstName || '',
          LastName: editingUser.LastName || '',
          Role: editingUser.Role || 'client',
          Status: editingUser.Status || 'Active',
          Verified: !!editingUser.Verified,
          Phone: editingUser.Phone || '',
          PlanID: editingUser.PlanID ?? null
        } : null}
      />

      <UserDetailModal
        isOpen={viewingUserId !== null}
        onClose={() => setViewingUserId(null)}
        userId={viewingUserId}
        token={token || ''}
      />

      <ChangeUserPasswordModal
        isOpen={passwordUser !== null}
        onClose={() => setPasswordUser(null)}
        userId={passwordUser?.ID ?? null}
        userName={passwordUser ? `${passwordUser.FirstName || ''} ${passwordUser.LastName || ''}`.trim() || passwordUser.Email : ''}
        token={token || ''}
      />
    </div>
  );
};