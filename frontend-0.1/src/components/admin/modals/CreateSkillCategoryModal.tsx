import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data:{ Name:string }) => Promise<void>|void;
}

export const CreateSkillCategoryModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [name,setName]=useState('');
  const submit=async(e:React.FormEvent)=>{ e.preventDefault(); await onSubmit({ Name:name.trim() }); setName(''); };
  if(!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">Нова категорія</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Назва</label>
            <input className="w-full border rounded px-3 py-2" value={name} onChange={e=>setName(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300">Скасувати</button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-500">Створити</button>
          </div>
        </form>
      </div>
    </div>
  );
};