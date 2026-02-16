import React, { useState } from 'react';
import { Baby, Edit3, Save } from 'lucide-react';
import { UserProfile } from './types';
import { useToast } from '../ui/Toast';

type Props = {
  user: UserProfile;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onReload: () => void;
};

const ChildSection: React.FC<Props> = ({ user, authenticatedFetch, onReload }) => {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    age: user.child?.age || 0,
    gender: user.child?.gender || 'notspecified',
    problem: user.child?.problem || '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/users/self/child', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      if (response.ok) {
        showToast('Дані про дитину збережено');
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

  const genderLabel = (g: string) => g === 'male' ? 'Хлопчик' : g === 'female' ? 'Дівчинка' : 'Не вказано';

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
            <Baby className="w-5 h-5 text-violet-600" />
          </div>
          <h2 className="text-lg font-semibold">Інформація про дитину</h2>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
            <Edit3 className="w-4 h-4" />Редагувати
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Вік дитини</label>
              <input type="number" min="0" max="18" value={form.age}
                onChange={e => setForm({ ...form, age: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Стать</label>
              <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent">
                <option value="notspecified">Не вказано</option>
                <option value="male">Хлопчик</option>
                <option value="female">Дівчинка</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Опис проблеми</label>
            <textarea value={form.problem} onChange={e => setForm({ ...form, problem: e.target.value })}
              rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="Коротко опишіть, з якими труднощами стикається ваша дитина..." />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
              <Save className="w-4 h-4" />{saving ? 'Збереження...' : 'Зберегти'}
            </button>
            <button onClick={() => setEditing(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Скасувати
            </button>
          </div>
        </div>
      ) : user.child ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Вік</span>
            <p className="text-sm font-medium text-gray-900">{user.child.age} років</p>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Стать</span>
            <p className="text-sm font-medium text-gray-900">{genderLabel(user.child.gender)}</p>
          </div>
          {user.child.problem && (
            <div className="sm:col-span-3">
              <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Проблема</span>
              <p className="text-sm text-gray-700">{user.child.problem}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400">Натисніть "Редагувати", щоб додати інформацію про дитину.</p>
      )}
    </div>
  );
};

export default ChildSection;
