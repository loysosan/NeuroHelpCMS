import React, { useState } from 'react';

export interface SpecialistSearchValues {
  q: string;
  specialization: string;
  city: string;
  format: string; // online | offline | hybrid | ''
  minPrice?: number;
  maxPrice?: number;
  minExperience?: number;
}

interface Props {
  onSearch: (v: SpecialistSearchValues) => void;
}

const specializationOptions = ['Психолог','Психотерапевт','Психіатр','Коуч','Нейропсихолог'];
const cityOptions = ['Київ','Львів','Одеса','Харків','Дніпро','Онлайн'];
const formatOptions = [
  { value: 'online', label: 'Онлайн' },
  { value: 'offline', label: 'Офлайн' },
  { value: 'hybrid', label: 'Гібрид' },
];

const SpecialistSearchForm: React.FC<Props> = ({ onSearch }) => {
  const [openFilters, setOpenFilters] = useState(true);
  const [v, setV] = useState<SpecialistSearchValues>({
    q: '',
    specialization: '',
    city: '',
    format: '',
    minPrice: undefined,
    maxPrice: undefined,
    minExperience: undefined
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(v);
  };

  const set = <K extends keyof SpecialistSearchValues>(k: K, val: SpecialistSearchValues[K]) =>
    setV(prev => ({ ...prev, [k]: val }));

  const clearFilters = () => {
    setV(p => ({ ...p, specialization:'', city:'', format:'', minPrice:undefined, maxPrice:undefined, minExperience:undefined }));
  };

  const pills = [
    v.specialization && { k: 'specialization', label: v.specialization },
    v.city && { k: 'city', label: v.city },
    v.format && { k: 'format', label: formatOptions.find(f => f.value === v.format)?.label },
    (v.minPrice || v.maxPrice) && { k: 'price', label: `${v.minPrice ?? 0}–${v.maxPrice ?? '∞'}₴` },
    v.minExperience && { k: 'experience', label: `Досвід ≥ ${v.minExperience}р` }
  ].filter(Boolean) as { k: string; label?: string }[];

  const removePill = (k: string) => {
    setV(p => {
      const n = { ...p };
      if (k === 'price') { n.minPrice = undefined; n.maxPrice = undefined; }
      else if (k === 'experience') { n.minExperience = undefined; }
      else (n as any)[k] = '';
      return n;
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <input
          value={v.q}
          onChange={e => set('q', e.target.value)}
          placeholder="Пошук спеціаліста / ключові слова..."
          className="flex-1 h-12 rounded-lg border border-gray-300 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="button"
            onClick={() => setOpenFilters(o => !o)}
          className="h-12 px-4 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50"
        >
          {openFilters ? 'Приховати фільтри' : 'Фільтри'}
        </button>
        <button
          type="submit"
          className="h-12 px-6 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
        >
          Знайти
        </button>
      </div>

      {pills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pills.map(p => (
            <span key={p.k} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs">
              {p.label}
              <button type="button" onClick={() => removePill(p.k)} className="hover:text-indigo-900">×</button>
            </span>
          ))}
          <button type="button" onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-700 underline">
            Скинути
          </button>
        </div>
      )}

      {openFilters && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase text-gray-500">Спеціалізація</label>
            <select
              value={v.specialization}
              onChange={e => set('specialization', e.target.value)}
              className="w-full h-10 rounded-md border border-gray-300 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Всі</option>
              {specializationOptions.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase text-gray-500">Місто</label>
            <select
              value={v.city}
              onChange={e => set('city', e.target.value)}
              className="w-full h-10 rounded-md border border-gray-300 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Будь-яке</option>
              {cityOptions.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase text-gray-500">Формат</label>
            <div className="flex gap-2">
              {formatOptions.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => set('format', v.format === f.value ? '' : f.value)}
                  className={`flex-1 h-10 rounded-md border text-xs transition ${
                    v.format === f.value ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase text-gray-500">Ціна (₴)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                placeholder="Від"
                value={v.minPrice ?? ''}
                onChange={e => set('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full h-10 rounded-md border border-gray-300 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                min={0}
                placeholder="До"
                value={v.maxPrice ?? ''}
                onChange={e => set('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full h-10 rounded-md border border-gray-300 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase text-gray-500">Досвід (років)</label>
            <input
              type="number"
              min={0}
              placeholder="від 0"
              value={v.minExperience ?? ''}
              onChange={e => set('minExperience', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full h-10 rounded-md border border-gray-300 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col justify-end md:col-span-2 lg:col-span-1">
            <button
              type="submit"
              className="h-10 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
            >
              Застосувати
            </button>
          </div>
        </div>
      )}
    </form>
  );
};

export default SpecialistSearchForm;