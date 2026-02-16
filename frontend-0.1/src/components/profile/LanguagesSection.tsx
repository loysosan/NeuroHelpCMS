import React, { useState } from 'react';
import { Globe, Plus, X } from 'lucide-react';
import { Language } from './types';
import { useToast } from '../ui/Toast';

const LANGUAGES = [
  { code: 'UA', name: 'Українська' },
  { code: 'EN', name: 'Англійська' },
  { code: 'RU', name: 'Російська' },
  { code: 'PL', name: 'Польська' },
  { code: 'KZ', name: 'Казахська' },
];

const PROFICIENCY = [
  { value: 'native', label: 'Рідна' },
  { value: 'fluent', label: 'Вільне' },
  { value: 'intermediate', label: 'Середній' },
  { value: 'basic', label: 'Початковий' },
];

type Props = {
  languages: Language[];
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onReload: () => void;
};

const LanguagesSection: React.FC<Props> = ({ languages, authenticatedFetch, onReload }) => {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: 'UA', proficiency: 'native' });

  const getLangName = (code: string) => LANGUAGES.find(l => l.code === code)?.name || code;
  const getProfLabel = (val: string) => PROFICIENCY.find(p => p.value === val)?.label || val;

  const handleAdd = async () => {
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/users/portfolio/language', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (response.ok) {
        showToast('Мову додано');
        onReload();
        setForm({ name: 'UA', proficiency: 'native' });
        setShowForm(false);
      } else {
        showToast('Помилка додавання', 'error');
      }
    } catch {
      showToast('Помилка додавання', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setSaving(true);
    try {
      const response = await authenticatedFetch(`/api/users/portfolio/language/${id}`, { method: 'DELETE' });
      if (response.ok) {
        showToast('Мову видалено');
        onReload();
      } else {
        showToast('Помилка видалення', 'error');
      }
    } catch {
      showToast('Помилка видалення', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Мови</h2>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />Додати
          </button>
        )}
      </div>

      <div className="space-y-3">
        {languages.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {languages.map(lang => (
              <div key={lang.ID} className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 bg-gray-50 rounded-full border border-gray-200 group">
                <span className="text-sm font-medium text-gray-800">{getLangName(lang.Name)}</span>
                <span className="text-xs text-gray-400">{getProfLabel(lang.Proficiency)}</span>
                <button onClick={() => handleDelete(lang.ID)} disabled={saving}
                  className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Мови не вказані</p>
        )}

        {showForm && (
          <div className="flex flex-wrap gap-2 items-end p-3 bg-blue-50/50 border border-blue-200 rounded-xl">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs text-gray-500 mb-1">Мова</label>
              <select value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs text-gray-500 mb-1">Рівень</label>
              <select value={form.proficiency} onChange={e => setForm({ ...form, proficiency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                {PROFICIENCY.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <button onClick={handleAdd} disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              Додати
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Скасувати
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguagesSection;
