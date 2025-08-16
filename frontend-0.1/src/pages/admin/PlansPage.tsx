import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { CreatePlanModal } from '../../components/admin/modals/CreatePlanModal';
import { EditPlanModal } from '../../components/admin/modals/EditPlanModal';
import { ConfirmationModal } from '../../components/admin/modals/ConfirmationModal';

interface Plan {
  ID: number;
  Name: string;
  Description: string;
  Price: number;
  DurationDays: number;
  Features: string;
  CreatedAt?: string;
}

export const PlansPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch('/api/admin/plans', { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error('Не вдалося завантажити плани');
      const data = await r.json();
      setPlans(data || []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const create = async (d: any) => {
    if (!token) return;
    try {
      const r = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(d)
      });
      if (!r.ok) throw new Error('Не вдалося створити план');
      setCreateOpen(false);
      await load();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const update = async (p: Partial<Plan>) => {
    if (!token || !editPlan) return;
    try {
      const r = await fetch(`/api/admin/plans/${editPlan.ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(p)
      });
      if (!r.ok) throw new Error('Не вдалося оновити план');
      setEditPlan(null);
      await load();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const del = async () => {
    if (!token || !deleteId) return;
    try {
      const r = await fetch(`/api/admin/plans/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) throw new Error('Не вдалося видалити план');
      setDeleteId(null);
      await load();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-semibold">Плани підписки</h2>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm"
        >
          + Створити план
        </button>
      </div>
      {err && <div className="text-red-600">{err}</div>}
      {loading && <div>Завантаження...</div>}
      {!loading && !err && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(p => (
            <div key={p.ID} className="bg-white rounded shadow p-5 flex flex-col">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">{p.Name}</h3>
                <span className="text-sm px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                  ${p.Price}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2 line-clamp-3">{p.Description}</p>
              <div className="mt-3 text-xs text-gray-400">{p.DurationDays} днів</div>
              <div className="mt-4 flex gap-3 justify-end">
                <button
                  onClick={() => setEditPlan(p)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Редагувати
                </button>
                <button
                  onClick={() => setDeleteId(p.ID)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Видалити
                </button>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-12">Плани відсутні</div>
          )}
        </div>
      )}

      <CreatePlanModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={create}
      />
      <EditPlanModal
        isOpen={!!editPlan}
        plan={editPlan}
        onClose={() => setEditPlan(null)}
        onSubmit={update}
      />
      <ConfirmationModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={del}
        title="Підтвердження"
        message="Видалити план? Це незворотно."
      />
    </div>
  );
};