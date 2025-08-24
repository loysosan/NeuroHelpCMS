import React, { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    Email: string;
    FirstName: string;
    LastName: string;
    Password: string;
    Role: string;
    Status: string;
  }) => Promise<void>;
}

const ROLES = [
  { value: 'master', label: 'Master' },
  { value: 'admin', label: 'Admin' },
  { value: 'moderator', label: 'Moderator' }
];

const STATUSES = [
  { value: 'Active', label: 'Активний' },
  { value: 'Disabled', label: 'Вимкнений' }
];

export const CreateAdminModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    Email: '',
    FirstName: '',
    LastName: '',
    Password: '',
    Role: 'admin',
    Status: 'Active'
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setForm({
        Email: '',
        FirstName: '',
        LastName: '',
        Password: '',
        Role: 'admin',
        Status: 'Active'
      });
      setErr(null);
      setBusy(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const change = (k: string, v: string) =>
    setForm(s => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.Email.trim() || !form.Password.trim() || !form.FirstName.trim() || !form.LastName.trim()) {
      setErr('Заповніть усі обовʼязкові поля');
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      await onSubmit(form);
    } catch (e: any) {
      setErr(e.message || 'Помилка створення');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Створити адміністратора</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {err && (
            <div className="text-sm text-red-600 bg-red-100 border border-red-200 px-3 py-2 rounded">
              {err}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Імʼя *</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.FirstName}
                onChange={e => change('FirstName', e.target.value)}
                required
                disabled={busy}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Прізвище *</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.LastName}
                onChange={e => change('LastName', e.target.value)}
                required
                disabled={busy}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.Email}
              onChange={e => change('Email', e.target.value)}
              required
              disabled={busy}
            />
          </div>
            <div>
              <label className="block text-sm font-medium mb-1">Пароль *</label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.Password}
                onChange={e => change('Password', e.target.value)}
                required
                disabled={busy}
                autoComplete="new-password"
              />
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Роль *</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.Role}
                onChange={e => change('Role', e.target.value)}
                disabled={busy}
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Статус *</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.Status}
                onChange={e => change('Status', e.target.value)}
                disabled={busy}
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
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
            >{busy ? 'Створення...' : 'Створити'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};