import React, { useEffect, useState } from 'react';

interface Category { ID:number; Name:string; }
export interface SkillEditable {
  ID: number;
  Name: string;
  CategoryID: number | null;
  Description?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (patch: Partial<SkillEditable> & { ID:number }) => Promise<void>|void;
  categories: Category[];
  skill: SkillEditable | null;
}

export const EditSkillModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, categories, skill }) => {
  const [form,setForm]=useState<SkillEditable | null>(null);
  useEffect(()=>{ setForm(skill); },[skill]);
  if(!isOpen || !form) return null;

  const change=<K extends keyof SkillEditable>(k:K,v:any)=>setForm(s=> s?{ ...s, [k]:v }:s);
  const submit=async(e:React.FormEvent)=>{ e.preventDefault();
    await onSubmit({
      ID: form.ID,
      Name: form.Name.trim(),
      CategoryID: form.CategoryID,
      Description: form.Description?.trim() || ''
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">Редагувати навичку</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Назва</label>
            <input className="w-full border rounded px-3 py-2"
              value={form.Name}
              onChange={e=>change('Name', e.target.value)}
              required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Категорія</label>
            <select className="w-full border rounded px-3 py-2"
              value={form.CategoryID ?? ''}
              onChange={e=>change('CategoryID', e.target.value===''?null:Number(e.target.value))}>
              <option value="">(Без категорії)</option>
              {categories.map(c=> <option key={c.ID} value={c.ID}>{c.Name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Опис</label>
            <textarea className="w-full border rounded px-3 py-2 h-28 resize-none"
              value={form.Description || ''}
              onChange={e=>change('Description', e.target.value)}/>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">Скасувати</button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm">Зберегти</button>
          </div>
        </form>
      </div>
    </div>
  );
};