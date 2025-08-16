import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface Skill {
  id: number;
  name: string;
}

export const SkillsPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/skills', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load skills');
        const data = await res.json();
        setSkills(data || []);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  }, [token]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Skills</h2>
      {loading && <div>Loading...</div>}
      {err && <div className="text-red-600 mb-2">{err}</div>}
      <div className="flex flex-wrap gap-2">
        {skills.map(s => (
          <span
            key={s.id}
            className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
          >
            {s.name}
          </span>
        ))}
        {!loading && skills.length === 0 && (
          <div className="text-gray-500 text-sm">No skills</div>
        )}
      </div>
    </div>
  );
};