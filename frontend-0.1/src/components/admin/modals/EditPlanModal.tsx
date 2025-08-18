import React, { useEffect, useState } from 'react';

interface Plan {
  ID: number;
  Name: string;
  Description: string;
  Price: number;
  DurationDays: number;
  Features: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data:Partial<Plan>)=>Promise<void>|void;
  plan: Plan | null;
}

export const EditPlanModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, plan }) => {
  const [form,setForm]=useState<Plan | null>(null);
  useEffect(()=>{ setForm(plan); },[plan]);
  if(!isOpen || !form) return null;
  const change=(k:keyof Plan,v:any)=>setForm(s=>s?{...s,[k]:v}:s);
  const submit=async(e:React.FormEvent)=>{ e.preventDefault(); await onSubmit({
    ...form,
    Price:Number(form.Price),
    DurationDays:Number(form.DurationDays)
  }); };
  return <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded w-full max-w-md space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Редагувати план</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        {(['Name','Description','Price','DurationDays','Features'] as (keyof Plan)[]).map(f=>(
          <div key={f}>
            <label className="block text-sm font-medium">{f}</label>
            {f==='Description'||f==='Features'
              ? <textarea required className="mt-1 w-full border rounded px-3 py-2"
                  value={form[f] as any}
                  onChange={e=>change(f,e.target.value)} />
              : <input required className="mt-1 w-full border rounded px-3 py-2"
                  type={(f==='Price'||f==='DurationDays')?'number':'text'}
                  value={form[f] as any}
                  onChange={e=>change(f,e.target.value)} />
            }
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Скасувати</button>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500">Зберегти</button>
        </div>
      </form>
    </div>
  </div>;
};