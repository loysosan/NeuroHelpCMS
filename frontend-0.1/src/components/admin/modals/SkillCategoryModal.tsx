import React, { useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data:{ Name:string }) => Promise<void>|void;
  initialData?: { ID:number; Name:string };
  isEditing?: boolean;
  titleCreate?: string;
  titleEdit?: string;
}

export const SkillCategoryModal: React.FC<Props> = ({
  isOpen,onClose,onSubmit,initialData,isEditing,
  titleCreate='Нова категорія', titleEdit='Редагувати категорію'
}) => {
  const [name,setName]=useState('');
  useEffect(()=>{
    if (initialData) setName(initialData.Name);
    else setName('');
  },[initialData,isOpen]);

  if(!isOpen) return null;

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!name.trim()) return;
    await onSubmit({ Name: name.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full m-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {isEditing ? titleEdit : titleCreate}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Назва</label>
            <input
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={name}
              onChange={e=>setName(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-3">
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
              {isEditing ? 'Зберегти' : 'Створити'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};