import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  verified: boolean;
  phone?: string;
  planId?: number;
}

interface Plan {
  ID: number;
  Name: string;
  Description: string;
  Price: number;
  DurationDays: number;
}

const AdminEditUser: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userData, setUserData] = useState<UserData>({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    status: '',
    verified: false,
    phone: '',
    planId: undefined
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch(`/api/admin/users/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          throw new Error(errorData.message || 'Failed to fetch user data');
        }

        const userData = await userResponse.json();
        
        // Fetch plans for dropdown
        const plansResponse = await fetch('/api/admin/plans', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!plansResponse.ok) {
          throw new Error('Failed to fetch plans');
        }

        const plansData = await plansResponse.json();
        setPlans(plansData || []);

        if (!userData) {
          throw new Error('No data received');
        }

        setUserData({
          firstName: userData.FirstName || '',
          lastName: userData.LastName || '',
          email: userData.Email || '',
          role: userData.Role || 'client',
          status: userData.Status || 'Active',
          verified: Boolean(userData.Verified),
          phone: userData.Phone || '',
          planId: userData.PlanID || undefined
        });
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchData();
    }
  }, [id, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          FirstName: userData.firstName,
          LastName: userData.lastName,
          Email: userData.email,
          Role: userData.role,
          Status: userData.status,
          Verified: userData.verified,
          Phone: userData.phone || null,
          PlanID: userData.role === 'client' ? null : (userData.planId || null)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      navigate('/admin/users');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'planId') {
      newValue = value === '' ? undefined : parseInt(value, 10);
    }
    
    setUserData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Edit User</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name
                <input
                  type="text"
                  name="firstName"
                  value={userData.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name
                <input
                  type="text"
                  name="lastName"
                  value={userData.lastName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
                <input
                  type="email"
                  name="email"
                  value={userData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
                <select
                  name="role"
                  value={userData.role}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="client">Client</option>
                  <option value="psychologist">Psychologist</option>
                </select>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
                <select
                  name="status"
                  value={userData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
                <input
                  type="tel"
                  name="phone"
                  value={userData.phone || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="+380..."
                />
              </label>
            </div>

            {/* Поле Plan показывается только якщо роль не client */}
            {userData.role !== 'client' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Plan
                  <select
                    name="planId"
                    value={userData.planId || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">No Plan</option>
                    {plans.map((plan) => (
                      <option key={plan.ID} value={plan.ID}>
                        {plan.Name} - ${plan.Price}
                        {plan.DurationDays && ` (${plan.DurationDays} days)`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div className="col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="verified"
                  checked={userData.verified}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Email Verified
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEditUser;