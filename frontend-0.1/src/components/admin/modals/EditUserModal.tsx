import React, { useEffect, useState } from 'react';

interface Plan {
  ID: number;
  Name: string;
  Price?: number;
  DurationDays?: number;
}

export interface EditUserData {
  ID: number;
  Email: string;
  FirstName: string;
  LastName: string;
  Role: string;
  Status: string;
  Verified: boolean;
  Phone?: string;
  PlanID?: number | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<EditUserData>) => Promise<void>;
  token: string;
  user: EditUserData | null;
}

export const EditUserModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, token, user }) => {
  const [form, setForm] = useState<EditUserData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const disabled = !form;

  useEffect(() => { setForm(user); }, [user]);

  useEffect(() => {
    if (!isOpen || !token) return;
    let alive = true;
    (async () => {
      setLoadingPlans(true);
      try {
        const r = await fetch('/api/admin/plans', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (r.ok) {
          const data = await r.json();
          if (alive) setPlans(data || []);
        }
      } finally {
        if (alive) setLoadingPlans(false);
      }
    })();
    return () => { alive = false; };
  }, [isOpen, token]);

  const change = (k: keyof EditUserData, v: any) =>
    setForm(s => (s ? { ...s, [k]: v } : s));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    await onSubmit({
      ID: form.ID,
      FirstName: form.FirstName,
      LastName: form.LastName,
      Email: form.Email,
      Role: form.Role,
      Status: form.Status,
      Verified: form.Verified,
      Phone: form.Phone || '',
      PlanID: form.Role === 'client' ? null : (form.PlanID ?? null)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold">Редагувати користувача</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >✕</button>
        </div>

        {err && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded">{err}</div>}

        {!form && (
          <div className="py-12 text-center text-gray-500">Немає даних</div>
        )}

        {form && (
          <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ім'я
                </label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.FirstName}
                  onChange={e => change('FirstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Прізвище
                </label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.LastName}
                  onChange={e => change('LastName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2"
                  value={form.Email}
                  onChange={e => change('Email', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Телефон
                </label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.Phone || ''}
                  onChange={e => change('Phone', e.target.value)}
                  placeholder="+380..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Роль
                </label>
                <select
                  value={form.Role}
                  onChange={e => change('Role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="client">Клієнт</option>
                  <option value="psychologist">Психолог</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Статус
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.Status}
                  onChange={e => change('Status', e.target.value)}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Disabled">Disabled</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {form.Role !== 'client' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    План
                  </label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={form.PlanID ?? ''}
                    onChange={e =>
                      change('PlanID', e.target.value === '' ? null : Number(e.target.value))
                    }
                  >
                    <option value="">(без плану)</option>
                    {plans.map(p => (
                      <option key={p.ID} value={p.ID}>
                        {p.Name}
                      </option>
                    ))}
                  </select>
                  {loadingPlans && (
                    <div className="text-xs text-gray-400 mt-1">Завантаження планів...</div>
                  )}
                </div>
              )}

              <div className="flex items-center mt-1">
                <input
                  id="verified"
                  type="checkbox"
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={form.Verified}
                  onChange={e => change('Verified', e.target.checked)}
                />
                <label htmlFor="verified" className="text-sm font-medium text-gray-700">
                  Email підтверджено
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50 text-sm"
              >
                Скасувати
              </button>
              <button
                disabled={disabled}
                className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-60"
              >
                Зберегти
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};