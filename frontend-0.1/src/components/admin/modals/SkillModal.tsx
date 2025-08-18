import React, { useEffect, useState } from 'react';

interface Category { ID:number; Name:string; }
interface SkillForm {
  Name: string;
  CategoryID: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data:{ Name:string; CategoryID:number }) => Promise<void>|void;
  categories: Category[];
  initialData?: { ID:number; Name:string; CategoryID:number };
  isEditing?: boolean;
}

export const SkillModal: React.FC<Props> = ({
  isOpen, onClose, onSubmit, categories, initialData, isEditing
}) => {
  const [form,setForm]=useState<SkillForm>({ Name:'', CategoryID:'' });

  useEffect(()=>{
    if (initialData) {
      setForm({ Name: initialData.Name, CategoryID: String(initialData.CategoryID || '') });
    } else {
      setForm({ Name:'', CategoryID:'' });
    }
  },[initialData,isOpen]);

  if(!isOpen) return null;

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!form.Name.trim()) return;
    await onSubmit({
      Name: form.Name.trim(),
      CategoryID: form.CategoryID ? Number(form.CategoryID) : 0
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">
            {isEditing ? 'Редагувати навичку' : 'Додати нову навичку'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Назва</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={form.Name}
              onChange={e=>setForm(s=>({...s,Name:e.target.value}))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Категорія</label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={form.CategoryID}
              onChange={e=>setForm(s=>({...s,CategoryID:e.target.value}))}
            >
              <option value="">Оберіть категорію</option>
              {categories.map(c=>(
                <option key={c.ID} value={c.ID}>{c.Name}</option>
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
              {isEditing ? 'Зберегти' : 'Створити'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};