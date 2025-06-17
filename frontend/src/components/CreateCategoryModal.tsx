import React, { useState, useEffect } from 'react';

interface Category {
  Name: string;
}

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (categoryData: { Name: string }) => Promise<void>;
  initialData?: Category | null;
  isEditing?: boolean;
}

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false
}) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.Name);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ Name: name });
    setName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Додати нову категорію</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Назва категорії
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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
              Створити
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCategoryModal;