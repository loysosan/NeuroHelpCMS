import React, { useState, useEffect } from 'react';

type Plan = {
  ID: number;
  Name: string;
  Description: string;
  Price: number;
  DurationDays: number;
  Features: string;
  CreatedAt: string;
  UpdatedAt: string;
};

type EditPlanModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Plan, 'ID' | 'CreatedAt' | 'UpdatedAt' | 'Features'> & { Features: string, Price: number, DurationDays: number }) => void;
  planData: Plan;
};

const EditPlanModal: React.FC<EditPlanModalProps> = ({ isOpen, onClose, onSubmit, planData }) => {
  const [formData, setFormData] = useState({
    Name: '',
    Description: '',
    Price: 0,
    DurationDays: 0,
    Features: '',
  });

  useEffect(() => {
    if (planData) {
      setFormData({
        Name: planData.Name,
        Description: planData.Description,
        Price: planData.Price,
        DurationDays: planData.DurationDays,
        Features: planData.Features,
      });
    }
  }, [planData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'Price' || name === 'DurationDays' ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Редагувати план</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="Name" className="block text-sm font-medium text-gray-700">Назва</label>
            <input
              type="text"
              id="Name"
              name="Name"
              value={formData.Name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="Description" className="block text-sm font-medium text-gray-700">Опис</label>
            <textarea
              id="Description"
              name="Description"
              value={formData.Description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="Price" className="block text-sm font-medium text-gray-700">Ціна ($)</label>
            <input
              type="number"
              id="Price"
              name="Price"
              value={formData.Price}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="DurationDays" className="block text-sm font-medium text-gray-700">Тривалість (днів)</label>
            <input
              type="number"
              id="DurationDays"
              name="DurationDays"
              value={formData.DurationDays}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="Features" className="block text-sm font-medium text-gray-700">Особливості</label>
            <input
              type="text"
              id="Features"
              name="Features"
              value={formData.Features}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Скасувати
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              Зберегти зміни
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlanModal;