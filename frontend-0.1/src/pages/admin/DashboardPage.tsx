import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface Stats {
  usersTotal: number;
  usersActive: number;
  subscriptionsActive: number;
  skillsTotal: number;
  plansTotal: number;
  newsTotal: number;
}

export const DashboardPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Не вдалося завантажити статистику');
        const data = await res.json();
        if (alive) setStats(data);
      } catch (e:any) {
        if (alive) setErr(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [token]);

  if (loading) return <div>Завантаження...</div>;
  if (err) return <div className="text-red-600">{err}</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold">Панель адміністратора</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard title="Користувачі" value={stats?.usersTotal} sub="Всього" icon="👥" />
        <StatCard title="Активні корист." value={stats?.usersActive} sub="Активні" icon="✅" />
        <StatCard title="Підписки" value={stats?.subscriptionsActive} sub="Активні" icon="📦" />
        <StatCard title="Навички" value={stats?.skillsTotal} sub="У базі" icon="🎯" />
        <StatCard title="Плани" value={stats?.plansTotal} sub="Опубліковані" icon="📋" />
        <StatCard title="Новини" value={stats?.newsTotal} sub="Матеріали" icon="📰" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Placeholder title="Динаміка користувачів" />
        <Placeholder title="Статистика підписок" />
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title:string; value:any; sub:string; icon:string }> = ({ title,value,sub,icon }) => (
  <div className="bg-white p-6 rounded shadow flex items-center">
    <div className="text-3xl mr-4">{icon}</div>
    <div>
      <div className="text-xl font-semibold">{value ?? '—'}</div>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-xs text-gray-400">{sub}</div>
    </div>
  </div>
);

const Placeholder: React.FC<{ title:string }> = ({ title }) => (
  <div className="bg-white p-6 rounded shadow min-h-[260px] flex items-center justify-center text-gray-400">
    {title} (в розробці)
  </div>
);