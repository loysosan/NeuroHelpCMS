import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface Admin {
  id: number;
  email: string;
  role?: string;
}

export const AdministratorsPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetch('/api/admin/administrators', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!r.ok) throw new Error(`Load failed ${r.status}`);
        const j = await r.json();
        if (alive) setItems(j || []);
      } catch (e:any) {
        if (alive) setErr(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [token]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Адміністратори</h2>
      {loading && <div>Loading...</div>}
      {err && <div className="text-red-600 mb-2">{err}</div>}
      {!loading && !err && items.length === 0 && (
        <div className="text-gray-500 text-sm">No administrators</div>
      )}
      {items.length > 0 && (
        <table className="w-full text-sm bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2 border-b">ID</th>
              <th className="p-2 border-b">Email</th>
              <th className="p-2 border-b">Role</th>
            </tr>
          </thead>
            <tbody>
            {items.map(a => (
              <tr key={a.id} className="border-b last:border-b-0">
                <td className="p-2">{a.id}</td>
                <td className="p-2">{a.email}</td>
                <td className="p-2">{a.role || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};