import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data:any) => Promise<void> | void;
}

export const CreateUserModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    email: '', firstName: '', lastName: '', password: '', role: 'User', status: 'Active'
  });
  const change = (k:keyof typeof form, v:string) => setForm(s => ({ ...s, [k]: v }));
  const submit = async (e:React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Створити користувача</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input required type="email" className="mt-1 w-full border rounded px-3 py-2"
              value={form.email} onChange={e=>change('email', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Ім'я</label>
              <input required className="mt-1 w-full border rounded px-3 py-2"
                value={form.firstName} onChange={e=>change('firstName', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Прізвище</label>
              <input required className="mt-1 w-full border rounded px-3 py-2"
                value={form.lastName} onChange={e=>change('lastName', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Пароль</label>
            <input required type="password" className="mt-1 w-full border rounded px-3 py-2"
              value={form.password} onChange={e=>change('password', e.target.value)} />
          </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
                <select
                  value={form.role} onChange={e=>change('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Оберіть роль</option>
                  <option value="client">Клієнт</option>
                  <option value="psychologist">Психолог</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Статус</label>
                <select className="mt-1 w-full border rounded px-2 py-2"
                  value={form.status} onChange={e=>change('status', e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>
            </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Скасувати</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500">Створити</button>
          </div>
        </form>
      </div>
    </div>
  );
};