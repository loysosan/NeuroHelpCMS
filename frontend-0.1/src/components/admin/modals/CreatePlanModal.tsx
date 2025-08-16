import React, { useState } from 'react';
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data:any)=>Promise<void>|void;
}
export const CreatePlanModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [form,setForm]=useState({ Name:'', Description:'', Price:'', DurationDays:'', Features:'' });
  const submit=async(e:React.FormEvent)=>{ e.preventDefault(); await onSubmit({
    ...form,
    Price:Number(form.Price),
    DurationDays:Number(form.DurationDays)
  }); setForm({ Name:'', Description:'', Price:'', DurationDays:'', Features:'' }); };
  if(!isOpen) return null;
  return <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded w-full max-w-md space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Створити план</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        {['Name','Description','Price','DurationDays','Features'].map(f=>(
          <div key={f}>
            <label className="block text-sm font-medium">{f}</label>
            {f==='Description'||f==='Features'
              ? <textarea required className="mt-1 w-full border rounded px-3 py-2"
                  value={(form as any)[f]}
                  onChange={e=>setForm(s=>({ ...s,[f]:e.target.value }))} />
              : <input required className="mt-1 w-full border rounded px-3 py-2"
                  type={(f==='Price'||f==='DurationDays')?'number':'text'}
                  value={(form as any)[f]}
                  onChange={e=>setForm(s=>({ ...s,[f]:e.target.value }))} />
            }
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Скасувати</button>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500">Створити</button>
        </div>
      </form>
    </div>
  </div>;
};