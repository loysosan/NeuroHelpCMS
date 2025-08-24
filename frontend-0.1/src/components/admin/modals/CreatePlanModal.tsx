import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data:{
    Name:string;
    Description:string;
    Price:number;
    DurationDays:number;
    Features:string;
  })=>Promise<void>|void;
}

export const CreatePlanModal: React.FC<Props> = ({ isOpen,onClose,onSubmit }) => {
  const [form,setForm]=useState({ Name:'', Description:'', Price:'', DurationDays:'', Features:'' });
  const [busy,setBusy]=useState(false);

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();
    setBusy(true);
    await onSubmit({
      Name: form.Name.trim(),
      Description: form.Description.trim(),
      Price: Number(form.Price),
      DurationDays: Number(form.DurationDays),
      Features: form.Features.trim()
    });
    setBusy(false);
    setForm({ Name:'', Description:'', Price:'', DurationDays:'', Features:'' });
  };

  if(!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Створити новий план</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Назва</label>
            <input
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={form.Name}
              onChange={e=>setForm(s=>({...s,Name:e.target.value}))}
              disabled={busy}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Опис</label>
            <textarea
              required
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={form.Description}
              onChange={e=>setForm(s=>({...s,Description:e.target.value}))}
              disabled={busy}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Ціна ($)</label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={form.Price}
                onChange={e=>setForm(s=>({...s,Price:e.target.value}))}
                disabled={busy}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Тривалість (днів)</label>
              <input
                type="number"
                required
                min={1}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={form.DurationDays}
                onChange={e=>setForm(s=>({...s,DurationDays:e.target.value}))}
                disabled={busy}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Особливості</label>
            <textarea
              required
              rows={2}
              placeholder="Перерахуйте головні особливості"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={form.Features}
              onChange={e=>setForm(s=>({...s,Features:e.target.value}))}
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
            >{busy?'Створення...':'Створити'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};