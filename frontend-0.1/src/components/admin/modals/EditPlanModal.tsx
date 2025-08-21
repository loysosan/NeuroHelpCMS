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
  onSubmit: (data: Partial<Plan>) => Promise<void>|void;
  plan: Plan | null;
}

export const EditPlanModal: React.FC<Props> = ({ isOpen,onClose,onSubmit,plan }) => {
  const [form,setForm]=useState<Plan | null>(null);
  const [busy,setBusy]=useState(false);

  useEffect(()=>{ setForm(plan); },[plan]);

  if(!isOpen || !form) return null;

  const change=(k:keyof Plan,v:any)=>{
    setForm(s=> s ? { ...s, [k]: (k==='Price'||k==='DurationDays')?Number(v):v } : s);
  };

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();
    setBusy(true);
    await onSubmit({
      Name: form.Name,
      Description: form.Description,
      Price: form.Price,
      DurationDays: form.DurationDays,
      Features: form.Features
    });
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Редагувати план</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Назва</label>
            <input
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={form.Name}
              onChange={e=>change('Name',e.target.value)}
              required
              disabled={busy}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Опис</label>
            <textarea
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={form.Description}
              onChange={e=>change('Description',e.target.value)}
              required
              disabled={busy}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Ціна ($)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={form.Price}
                onChange={e=>change('Price',e.target.value)}
                required
                disabled={busy}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Тривалість (днів)</label>
              <input
                type="number"
                min={1}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={form.DurationDays}
                onChange={e=>change('DurationDays',e.target.value)}
                required
                disabled={busy}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Особливості</label>
            <input
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={form.Features}
              onChange={e=>change('Features',e.target.value)}
              required
              disabled={busy}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
            >Скасувати</button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >{busy?'Збереження...':'Зберегти зміни'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};