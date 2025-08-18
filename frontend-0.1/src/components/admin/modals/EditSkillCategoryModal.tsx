import React, { useEffect, useState } from 'react';

interface Category { ID:number; Name:string; }
interface Props {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSubmit: (patch:{ ID:number; Name:string }) => Promise<void>|void;
}

export const EditSkillCategoryModal: React.FC<Props> = ({ isOpen, onClose, category, onSubmit }) => {
  const [name,setName]=useState('');
  useEffect(()=>{ setName(category?.Name || ''); },[category]);
  if(!isOpen || !category) return null;
  const submit=async(e:React.FormEvent)=>{ e.preventDefault(); await onSubmit({ ID:category.ID, Name:name.trim() }); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">Редагувати категорію</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Назва</label>
            <input className="w-full border rounded px-3 py-2" value={name} onChange={e=>setName(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300">Скасувати</button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-500">Зберегти</button>
          </div>
        </form>
      </div>
    </div>
  );
};