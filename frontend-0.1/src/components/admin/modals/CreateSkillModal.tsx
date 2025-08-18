import React, { useState } from 'react';

interface Category { ID:number; Name:string; }
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data:{ Name:string; CategoryID:number|null; Description:string }) => Promise<void>|void;
  categories: Category[];
}
export const CreateSkillModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, categories }) => {
  const [form,setForm]=useState({ Name:'', CategoryID:'', Description:'' });
  const submit=async(e:React.FormEvent)=>{ e.preventDefault();
    await onSubmit({
      Name: form.Name.trim(),
      CategoryID: form.CategoryID ? Number(form.CategoryID) : null,
      Description: form.Description.trim()
    });
    setForm({ Name:'', CategoryID:'', Description:'' });
  };
  if(!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">Створити навичку</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Назва</label>
            <input className="w-full border rounded px-3 py-2" value={form.Name}
              onChange={e=>setForm(s=>({ ...s, Name:e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Категорія</label>
            <select className="w-full border rounded px-3 py-2"
              value={form.CategoryID}
              onChange={e=>setForm(s=>({ ...s, CategoryID:e.target.value }))}>
              <option value="">(Без категорії)</option>
              {categories.map(c=> <option key={c.ID} value={c.ID}>{c.Name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Опис (опц.)</label>
            <textarea className="w-full border rounded px-3 py-2 resize-none h-24"
              value={form.Description}
              onChange={e=>setForm(s=>({ ...s, Description:e.target.value }))}/>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">Скасувати</button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm">Створити</button>
          </div>
        </form>
      </div>
    </div>
  );
};