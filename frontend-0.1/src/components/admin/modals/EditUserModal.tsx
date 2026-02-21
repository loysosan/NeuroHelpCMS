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

interface PortfolioForm {
  description: string;
  experience: string;
  city: string;
  address: string;
  rate: string;
  contactEmail: string;
  contactPhone: string;
  telegram: string;
  facebookURL: string;
  instagramURL: string;
  scheduleEnforced: boolean;
  clientAgeMin: string;
  clientAgeMax: string;
}

const emptyPortfolio: PortfolioForm = {
  description: '', experience: '', city: '', address: '', rate: '',
  contactEmail: '', contactPhone: '', telegram: '', facebookURL: '',
  instagramURL: '', scheduleEnforced: false, clientAgeMin: '', clientAgeMax: '',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<EditUserData>) => Promise<void>;
  token: string;
  user: EditUserData | null;
}

type Tab = 'basic' | 'portfolio';

export const EditUserModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, token, user }) => {
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [form, setForm] = useState<EditUserData | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioForm>(emptyPortfolio);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [savingPortfolio, setSavingPortfolio] = useState(false);
  const [portfolioErr, setPortfolioErr] = useState<string | null>(null);
  const [portfolioOk, setPortfolioOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const disabled = !form;

  useEffect(() => {
    setForm(user);
    setActiveTab('basic');
    setPortfolio(emptyPortfolio);
    setPortfolioErr(null);
    setPortfolioOk(false);
  }, [user]);

  // Load plans
  useEffect(() => {
    if (!isOpen || !token) return;
    let alive = true;
    (async () => {
      setLoadingPlans(true);
      try {
        const r = await fetch('/api/admin/plans', { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) { const data = await r.json(); if (alive) setPlans(data || []); }
      } finally { if (alive) setLoadingPlans(false); }
    })();
    return () => { alive = false; };
  }, [isOpen, token]);

  // Load portfolio when switching to portfolio tab
  useEffect(() => {
    if (activeTab !== 'portfolio' || !user || !token) return;
    setLoadingPortfolio(true);
    fetch(`/api/admin/users/${user.ID}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const p = data.Portfolio;
        if (p && p.ID > 0) {
          setPortfolio({
            description: p.Description || '',
            experience: p.Experience != null ? String(p.Experience) : '',
            city: p.City || '',
            address: p.Address || '',
            rate: p.Rate != null ? String(p.Rate) : '',
            contactEmail: p.ContactEmail || '',
            contactPhone: p.ContactPhone || '',
            telegram: p.Telegram || '',
            facebookURL: p.FacebookURL || '',
            instagramURL: p.InstagramURL || '',
            scheduleEnforced: !!p.ScheduleEnforced,
            clientAgeMin: p.ClientAgeMin != null ? String(p.ClientAgeMin) : '',
            clientAgeMax: p.ClientAgeMax != null ? String(p.ClientAgeMax) : '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPortfolio(false));
  }, [activeTab, user, token]);

  const change = (k: keyof EditUserData, v: any) =>
    setForm(s => (s ? { ...s, [k]: v } : s));

  const pChange = (k: keyof PortfolioForm, v: any) =>
    setPortfolio(s => ({ ...s, [k]: v }));

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

  const savePortfolio = async () => {
    if (!user) return;
    setPortfolioErr(null);
    setPortfolioOk(false);
    setSavingPortfolio(true);
    try {
      const body: Record<string, unknown> = {
        description: portfolio.description,
        scheduleEnforced: portfolio.scheduleEnforced,
      };
      if (portfolio.experience !== '') body.experience = Number(portfolio.experience);
      if (portfolio.city !== '') body.city = portfolio.city;
      if (portfolio.address !== '') body.address = portfolio.address;
      if (portfolio.rate !== '') body.rate = Number(portfolio.rate);
      if (portfolio.contactEmail !== '') body.contactEmail = portfolio.contactEmail;
      if (portfolio.contactPhone !== '') body.contactPhone = portfolio.contactPhone;
      if (portfolio.telegram !== '') body.telegram = portfolio.telegram;
      if (portfolio.facebookURL !== '') body.facebookURL = portfolio.facebookURL;
      if (portfolio.instagramURL !== '') body.instagramURL = portfolio.instagramURL;
      if (portfolio.clientAgeMin !== '') body.clientAgeMin = Number(portfolio.clientAgeMin);
      if (portfolio.clientAgeMax !== '') body.clientAgeMax = Number(portfolio.clientAgeMax);

      const res = await fetch(`/api/admin/users/${user.ID}/portfolio`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setPortfolioOk(true);
        setTimeout(() => setPortfolioOk(false), 3000);
      } else {
        const data = await res.json().catch(() => null);
        setPortfolioErr(data?.message || 'Помилка збереження портфоліо');
      }
    } catch {
      setPortfolioErr('Помилка зʼєднання з сервером');
    } finally {
      setSavingPortfolio(false);
    }
  };

  if (!isOpen) return null;

  const isPsychologist = form?.Role === 'psychologist';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-900">Редагувати користувача</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {/* Tabs */}
        {isPsychologist && (
          <div className="flex border-b px-6">
            {(['basic', 'portfolio'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'basic' ? 'Основне' : 'Портфоліо'}
              </button>
            ))}
          </div>
        )}

        <div className="p-6">
          {err && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded">{err}</div>}

          {/* Basic tab */}
          {(!isPsychologist || activeTab === 'basic') && (
            <>
              {!form ? (
                <div className="py-12 text-center text-gray-500">Немає даних</div>
              ) : (
                <form onSubmit={submit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ім'я</label>
                      <input className="w-full border rounded px-3 py-2" value={form.FirstName}
                        onChange={e => change('FirstName', e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Прізвище</label>
                      <input className="w-full border rounded px-3 py-2" value={form.LastName}
                        onChange={e => change('LastName', e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" className="w-full border rounded px-3 py-2" value={form.Email}
                        onChange={e => change('Email', e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                      <input className="w-full border rounded px-3 py-2" value={form.Phone || ''}
                        onChange={e => change('Phone', e.target.value)} placeholder="+380..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
                      <select value={form.Role} onChange={e => change('Role', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                        <option value="client">Клієнт</option>
                        <option value="psychologist">Психолог</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                      <select className="w-full border rounded px-3 py-2" value={form.Status}
                        onChange={e => change('Status', e.target.value)} required>
                        <option value="Active">Active</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Disabled">Disabled</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                    {form.Role !== 'client' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">План</label>
                        <select className="w-full border rounded px-3 py-2" value={form.PlanID ?? ''}
                          onChange={e => change('PlanID', e.target.value === '' ? null : Number(e.target.value))}>
                          <option value="">(без плану)</option>
                          {plans.map(p => <option key={p.ID} value={p.ID}>{p.Name}</option>)}
                        </select>
                        {loadingPlans && <div className="text-xs text-gray-400 mt-1">Завантаження планів...</div>}
                      </div>
                    )}
                    <div className="flex items-center mt-1">
                      <input id="verified" type="checkbox" className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={form.Verified} onChange={e => change('Verified', e.target.checked)} />
                      <label htmlFor="verified" className="text-sm font-medium text-gray-700">Email підтверджено</label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose}
                      className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50 text-sm">
                      Скасувати
                    </button>
                    <button disabled={disabled}
                      className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-60">
                      Зберегти
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* Portfolio tab */}
          {isPsychologist && activeTab === 'portfolio' && (
            <div className="space-y-4">
              {loadingPortfolio ? (
                <div className="text-center py-12 text-gray-400">Завантаження...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Опис</label>
                      <textarea rows={3} className="w-full border rounded px-3 py-2 text-sm resize-none"
                        value={portfolio.description} onChange={e => pChange('description', e.target.value)} />
                    </div>
                    <PField label="Досвід (роки)" type="number" value={portfolio.experience}
                      onChange={v => pChange('experience', v)} />
                    <PField label="Місто" value={portfolio.city} onChange={v => pChange('city', v)} />
                    <PField label="Адреса" value={portfolio.address} onChange={v => pChange('address', v)} />
                    <PField label="Ставка (грн/год)" type="number" value={portfolio.rate}
                      onChange={v => pChange('rate', v)} />
                    <PField label="Контактний email" type="email" value={portfolio.contactEmail}
                      onChange={v => pChange('contactEmail', v)} />
                    <PField label="Контактний телефон" value={portfolio.contactPhone}
                      onChange={v => pChange('contactPhone', v)} />
                    <PField label="Telegram" value={portfolio.telegram} onChange={v => pChange('telegram', v)} />
                    <PField label="Facebook URL" value={portfolio.facebookURL} onChange={v => pChange('facebookURL', v)} />
                    <PField label="Instagram URL" value={portfolio.instagramURL} onChange={v => pChange('instagramURL', v)} />
                    <PField label="Мін. вік клієнта" type="number" value={portfolio.clientAgeMin}
                      onChange={v => pChange('clientAgeMin', v)} />
                    <PField label="Макс. вік клієнта" type="number" value={portfolio.clientAgeMax}
                      onChange={v => pChange('clientAgeMax', v)} />
                    <div className="flex items-center gap-2">
                      <input id="schedEnforced" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                        checked={portfolio.scheduleEnforced} onChange={e => pChange('scheduleEnforced', e.target.checked)} />
                      <label htmlFor="schedEnforced" className="text-sm font-medium text-gray-700">Примусовий розклад</label>
                    </div>
                  </div>

                  {portfolioErr && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{portfolioErr}</p>
                  )}
                  {portfolioOk && (
                    <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Портфоліо збережено</p>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose}
                      className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50 text-sm">
                      Закрити
                    </button>
                    <button onClick={savePortfolio} disabled={savingPortfolio}
                      className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-60">
                      {savingPortfolio ? 'Збереження...' : 'Зберегти портфоліо'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}> = ({ label, value, onChange, type = 'text' }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input type={type} className="w-full border rounded px-3 py-2 text-sm" value={value}
      onChange={e => onChange(e.target.value)} />
  </div>
);
