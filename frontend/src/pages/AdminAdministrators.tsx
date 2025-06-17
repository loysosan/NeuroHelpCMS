import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import CreateAdminModal from '../components/CreateAdminModal';

interface Administrator {
    ID: number;
    Email: string;
    Username: string;
    FirstName: string;
    LastName: string;
    Phone: string | null;
    Status: string;
    Role: string;
}

const AdminAdministrators: React.FC = () => {
    const { token, user } = useAuth();
    const [administrators, setAdministrators] = useState<Administrator[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<Administrator | null>(null);

    const fetchAdministrators = async () => {
        try {
            const response = await fetch('/api/admin/administrators', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch administrators');
            const data = await response.json();
            setAdministrators(data);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        fetchAdministrators();
    }, [token]);

    const handleDelete = async (admin: Administrator) => {
        if (admin.Role === 'master') return;
        
        try {
            const response = await fetch(`/api/admin/administrators/${admin.ID}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to delete administrator');
            
            await fetchAdministrators();
            setIsDeleteModalOpen(false);
            setSelectedAdmin(null);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">Administrators</h2>
                    {user?.Role !== 'moderator' && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            Add Administrator
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="bg-white shadow overflow-hidden rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {administrators.map((admin) => (
                                <tr key={admin.ID}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {admin.FirstName} {admin.LastName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {admin.Email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            admin.Role === 'master' ? 'bg-purple-100 text-purple-800' :
                                            admin.Role === 'admin' ? 'bg-green-100 text-green-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {admin.Role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            admin.Status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {admin.Status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {admin.Role !== 'master' && user?.Role !== 'moderator' && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setSelectedAdmin(admin);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="text-red-600 hover:text-red-900 ml-4"
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <CreateAdminModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSubmit={async (data) => {
                        try {
                            const response = await fetch('/api/admin/administrators', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify(data)
                            });
                            if (!response.ok) throw new Error('Failed to create administrator');
                            
                            await fetchAdministrators();
                            setIsCreateModalOpen(false);
                        } catch (err) {
                            setError(err.message);
                        }
                    }}
                />

                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                        setSelectedAdmin(null);
                    }}
                    onConfirm={() => selectedAdmin && handleDelete(selectedAdmin)}
                    title="Confirm deletion"
                    message={`Are you sure you want to delete administrator ${selectedAdmin?.FirstName} ${selectedAdmin?.LastName}?`}
                />
            </div>
        </AdminLayout>
    );
};

export default AdminAdministrators;