import React, { useState } from 'react';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import { UserProfile } from './types';
import { useToast } from '../ui/Toast';

type Props = {
  user: UserProfile;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onReload: () => void;
};

const EducationSection: React.FC<Props> = ({ user, authenticatedFetch, onReload }) => {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', institution: '', issueDate: '' });

  const educations = user.portfolio?.educations || [];

  const handleAdd = async () => {
    if (!form.title || !form.institution || !form.issueDate) return;
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/users/portfolio/education', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (response.ok) {
        showToast('Освіту додано');
        onReload();
        setForm({ title: '', institution: '', issueDate: '' });
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
      const response = await authenticatedFetch(`/api/users/portfolio/education/${id}`, { method: 'DELETE' });
      if (response.ok) {
        showToast('Освіту видалено');
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
            <GraduationCap className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Освіта</h2>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />Додати
          </button>
        )}
      </div>

      <div className="space-y-3">
        {educations.length > 0 ? (
          educations.map(edu => (
            <div key={edu.ID} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl group">
              <div className="min-w-0">
                <p className="font-medium text-sm text-gray-900">{edu.Title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{edu.Institution}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(edu.IssueDate).toLocaleDateString('uk-UA')}</p>
              </div>
              <button onClick={() => handleDelete(edu.ID)} disabled={saving}
                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 py-2">Освіта не вказана</p>
        )}

        {showForm && (
          <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-xl space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Назва (напр. Магістр психології)"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
              <input value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })}
                placeholder="Навчальний заклад"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
            </div>
            <div className="flex gap-2">
              <input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
              <button onClick={handleAdd} disabled={saving || !form.title || !form.institution || !form.issueDate}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                Додати
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Скасувати
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EducationSection;
