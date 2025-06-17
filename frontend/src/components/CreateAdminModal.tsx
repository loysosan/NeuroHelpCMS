import React, { useState } from 'react';

interface CreateAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
}

const CreateAdminModal: React.FC<CreateAdminModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        Email: '',
        Username: '',
        Password: '',
        FirstName: '',
        LastName: '',
        Phone: '',
        Role: 'moderator'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
        setFormData({
            Email: '',
            Username: '',
            Password: '',
            FirstName: '',
            LastName: '',
            Phone: '',
            Role: 'moderator'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-lg font-medium mb-4">Add New Administrator</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.Email}
                            onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.Username}
                            onChange={(e) => setFormData({ ...formData, Username: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.Password}
                            onChange={(e) => setFormData({ ...formData, Password: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                value={formData.FirstName}
                                onChange={(e) => setFormData({ ...formData, FirstName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                value={formData.LastName}
                                onChange={(e) => setFormData({ ...formData, LastName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                            type="tel"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.Phone}
                            onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.Role}
                            onChange={(e) => setFormData({ ...formData, Role: e.target.value })}
                        >
                            <option value="moderator">Moderator</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAdminModal;