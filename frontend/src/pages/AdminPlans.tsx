import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import CreatePlanModal from '../components/CreatePlanModal';
import AdminLayout from '../components/AdminLayout';

// Оновлюємо тип Plan відповідно до структури з бекенду
type Plan = {
  ID: number;
  Name: string;
  Description: string;
  Price: number;
  DurationDays: number; // змінено з Duration
  Features: string;     // змінено з string[]
  CreatedAt: string;
  UpdatedAt: string;
};

const AdminPlans: React.FC = () => {
  const { token } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Не вдалося завантажити плани');

      const data = await res.json();
      setPlans(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (planId: number) => {
    setPlanToDelete(planId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;

    try {
      const res = await fetch(`/api/admin/plans/${planToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Не вдалося видалити план');

      setPlans(plans.filter(plan => plan.ID !== planToDelete));
      setIsDeleteModalOpen(false);
      setPlanToDelete(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreatePlan = async (planData: any) => {
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(planData)
      });

      if (!res.ok) throw new Error('Не вдалося створити план');

      await fetchPlans(); // Refresh plans after creation
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Плани підписки</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded"
          >
            + Створити план
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.ID} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{plan.Name}</h3>
                  <p className="text-gray-600">{plan.Description}</p>
                </div>
                <button
                  onClick={() => handleDeleteClick(plan.ID)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-2xl font-bold">${plan.Price}</p>
                <p className="text-gray-600">{plan.DurationDays} днів</p>
              </div>

              <div className="text-gray-700">
                {/* Відображаємо Features як текст, а не масив */}
                <p className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {plan.Features}
                </p>
              </div>
            </div>
          ))}
        </div>

        <CreatePlanModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreatePlan}
        />

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Підтвердження видалення"
          message="Ви впевнені, що хочете видалити цей план? Цю дію неможливо скасувати."
        />
      </div>
    </AdminLayout>
  );
};

export default AdminPlans;