import React, { useState } from 'react';
import { User, Edit3, Save } from 'lucide-react';
import { UserProfile } from './types';
import { useToast } from '../ui/Toast';

type Props = {
  user: UserProfile;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onReload: () => void;
};

const PersonalInfoSection: React.FC<Props> = ({ user, authenticatedFetch, onReload }) => {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/users/self/updateuser', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      if (response.ok) {
        showToast('Особисту інформацію збережено');
        onReload();
        setEditing(false);
      } else {
        showToast('Помилка збереження', 'error');
      }
    } catch {
      showToast('Помилка збереження', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Особиста інформація</h2>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Edit3 className="w-4 h-4" />
            Редагувати
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Ім'я</label>
              <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Прізвище</label>
              <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Телефон</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" placeholder="+380..." />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              <Save className="w-4 h-4" />{saving ? 'Збереження...' : 'Зберегти'}
            </button>
            <button onClick={() => setEditing(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Скасувати
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoField label="Ім'я" value={user.firstName} />
          <InfoField label="Прізвище" value={user.lastName} />
          <InfoField label="Email" value={user.email} />
          <InfoField label="Телефон" value={user.phone || 'Не вказано'} muted={!user.phone} />
        </div>
      )}
    </div>
  );
};

const InfoField: React.FC<{ label: string; value: string; muted?: boolean }> = ({ label, value, muted }) => (
  <div>
    <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</span>
    <p className={`text-sm font-medium ${muted ? 'text-gray-400' : 'text-gray-900'}`}>{value}</p>
  </div>
);

export default PersonalInfoSection;
