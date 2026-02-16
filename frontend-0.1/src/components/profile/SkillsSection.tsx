import React, { useState } from 'react';
import { Award, Edit3, Save } from 'lucide-react';
import { UserProfile, SkillItem } from './types';
import { useToast } from '../ui/Toast';

type Props = {
  user: UserProfile;
  allSkills: SkillItem[];
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onReload: () => void;
};

const SkillsSection: React.FC<Props> = ({ user, allSkills, authenticatedFetch, onReload }) => {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>(user.skills?.map(s => s.id) || []);

  const toggle = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/users/self/skills', {
        method: 'PUT',
        body: JSON.stringify(selectedIds),
      });
      if (response.ok) {
        showToast('Навички збережено');
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

  const skillsByCategory: Record<string, { id: number; name: string }[]> = {};
  for (const s of allSkills) {
    if (!skillsByCategory[s.category]) skillsByCategory[s.category] = [];
    skillsByCategory[s.category].push({ id: s.id, name: s.name });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Award className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Навички</h2>
        </div>
        {!editing && (
          <button onClick={() => { setSelectedIds(user.skills?.map(s => s.id) || []); setEditing(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Edit3 className="w-4 h-4" />Редагувати
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-5">
          {Object.entries(skillsByCategory).map(([category, skills]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{category}</h4>
              <div className="flex flex-wrap gap-2">
                {skills.map(skill => {
                  const active = selectedIds.includes(skill.id);
                  return (
                    <button key={skill.id} type="button" onClick={() => toggle(skill.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        active ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                      }`}>
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {allSkills.length === 0 && <p className="text-sm text-gray-400">Навички ще не додано адміністратором.</p>}
          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              <Save className="w-4 h-4" />{saving ? 'Збереження...' : 'Зберегти'}
            </button>
            <button onClick={() => setEditing(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Скасувати
            </button>
            <span className="text-xs text-gray-400 ml-auto">Обрано: {selectedIds.length}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {user.skills && user.skills.length > 0 ? (
            user.skills.map(skill => (
              <span key={skill.id} className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {skill.name}
              </span>
            ))
          ) : (
            <p className="text-sm text-gray-400">Навички не вказані</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillsSection;
