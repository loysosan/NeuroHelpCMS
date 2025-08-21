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
      <div className="flex items-center justify-between flex-col md:flex-row gap-4">
        <h2 className="text-2xl font-semibold">Плани підписки</h2>
        <button
          onClick={() => setCreateOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded"
        >
          + Створити план
        </button>
      </div>

      {err && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {err}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"/>
        </div>
      )}

      {!loading && !err && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan=>(
            <div key={plan.ID} className="bg-white rounded-lg shadow-md p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{plan.Name}</h3>
                  <p className="text-gray-600">{plan.Description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditPlan(plan)}
                    className="text-gray-500 hover:text-indigo-600"
                    aria-label="Edit plan"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteId(plan.ID)}
                    className="text-red-600 hover:text-red-800"
                    aria-label="Delete plan"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-2xl font-bold">${plan.Price}</p>
                  <p className="text-gray-600">{plan.DurationDays} днів</p>
                </div>
              </div>

              <div className="text-gray-700">
                <p className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  {plan.Features}
                </p>
              </div>
            </div>
          ))}
          {plans.length===0 && (
            <div className="col-span-full text-center text-gray-500 py-16">
              Плани відсутні
            </div>
          )}
        </div>
      )}

      <CreatePlanModal
        isOpen={createOpen}
        onClose={()=>setCreateOpen(false)}
        onSubmit={create}
      />

      <EditPlanModal
        isOpen={!!editPlan}
        onClose={()=>setEditPlan(null)}
        plan={editPlan}
        onSubmit={update}
      />

      <ConfirmationModal
        isOpen={deleteId!==null}
        onClose={()=>setDeleteId(null)}
        onConfirm={del}
        title="Підтвердження видалення"
        message="Ви впевнені, що хочете видалити цей план? Цю дію неможливо скасувати."
      />
    </div>
  );
};