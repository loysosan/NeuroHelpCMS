import React, { useEffect, useState } from 'react';

interface Admin {
  ID: number;
  Email: string;
  FirstName: string;
  LastName: string;
  Role: string;
  Status: string;
  Phone?: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  admin: Admin | null;
  onSubmit: (data: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: string;
    role: string;
  }) => Promise<void>;
  loading?: boolean;
}

const ROLES = [
  { value: 'master', label: 'master' },
  { value: 'admin', label: 'admin' },
  { value: 'moderator', label: 'moderator' }
];

const STATUSES = [
  { value: 'Active', label: 'Active' },
  { value: 'Disabled', label: 'Disabled' },
  { value: 'Blocked', label: 'Blocked' }
];

export const EditAdminModal: React.FC<Props> = ({ isOpen, onClose, admin, onSubmit }) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'Active',
    role: 'admin'
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen && admin) {
      setForm({
        firstName: admin.FirstName || '',
        lastName: admin.LastName || '',
        email: admin.Email || '',
        phone: admin.Phone || '',
        status: admin.Status || 'Active',
        role: admin.Role || 'admin'
      });
      setErr(null);
      setBusy(false);
    }
  }, [isOpen, admin]);

  if (!isOpen || !admin) return null;

  const change = (k: string, v: string) =>
    setForm(s => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setErr('Заповніть обовʼязкові поля');
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      await onSubmit({
        id: admin.ID,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        status: form.status,
        role: form.role
      });
    } catch (e:any) {
      setErr(e.message || 'Помилка оновлення');
    } finally {
      setBusy(false);
    }
  };

  const isMaster = admin.Role === 'master';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Редагувати адміністратора</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-5">
          {err && (
            <div className="text-sm bg-red-100 border border-red-200 text-red-700 px-3 py-2 rounded">
              {err}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Імʼя *</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.firstName}
                onChange={e=>change('firstName', e.target.value)}
                disabled={busy}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Прізвище *</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.lastName}
                onChange={e=>change('lastName', e.target.value)}
                disabled={busy}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.email}
              onChange={e=>change('email', e.target.value)}
              disabled={busy || isMaster}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Телефон</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.phone}
              onChange={e=>change('phone', e.target.value)}
              disabled={busy}
              placeholder="+380..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Статус *</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.status}
                onChange={e=>change('status', e.target.value)}
                disabled={busy || isMaster}
              >
                {STATUSES.map(s=>(
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Роль *</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.role}
                onChange={e=>change('role', e.target.value)}
                disabled={busy || isMaster}
              >
                {ROLES
                  .filter(r=> r.value !== 'master') /* не можна змінити чи призначити master */
                  .map(r=>(
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
              </select>
            </div>
          </div>

            {isMaster && (
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded">
                Акаунт master не можна змінити (роль / статус / email).
              </div>
            )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm disabled:opacity-50"
            >Скасувати</button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm disabled:opacity-50"
            >{busy ? 'Збереження...' : 'Зберегти'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};