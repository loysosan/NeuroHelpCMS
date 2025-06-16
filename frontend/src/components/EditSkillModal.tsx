import React, { useState, useEffect } from 'react';

interface EditSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (skillId: number, data: any) => Promise<void>;
  skill: any;
  categories: Array<{ ID: number; Name: string; }>;
}

const EditSkillModal: React.FC<EditSkillModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  skill,
  categories
}) => {
  const [formData, setFormData] = useState({
    Name: '',
    CategoryID: ''
  });

  useEffect(() => {
    if (skill) {
      setFormData({
        Name: skill.Name,
        CategoryID: skill.CategoryID
      });
    }
  }, [skill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(skill.ID, formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Редагувати навичку</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Назва</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.Name}
              onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Категорія</label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.CategoryID}
              onChange={(e) => setFormData({ ...formData, CategoryID: e.target.value })}
            >
              <option value="">Оберіть категорію</option>
              {categories.map(category => (
                <option key={category.ID} value={category.ID}>
                  {category.Name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Зберегти
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSkillModal;