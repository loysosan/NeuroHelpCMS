import React, { useState } from 'react';
import { Filter, ChevronUp, ChevronDown, Search, X } from 'lucide-react';

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
  const [v, setV] = useState<SpecialistSearchValues>({
    q: '', // залишаємо в стейті, але не показуємо
    specialization: '',
    city: '',
    format: '',
    minPrice: undefined,
    maxPrice: undefined,
    minExperience: undefined
  });
  const [openFilters, setOpenFilters] = useState(false);

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
      {/* Видалено поле для вводу запиту */}
      <div className="flex flex-col md:flex-row gap-3">
        <button
          type="button"
          onClick={() => setOpenFilters(!openFilters)}
          className="flex items-center justify-center gap-2 h-12 px-6 rounded-lg border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Фільтри
          {openFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        <button
          type="submit"
          className="h-12 px-8 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          Знайти спеціалістів
        </button>
      </div>

      {pills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pills.map(pill => (
            <span
              key={pill.k}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium"
            >
              {pill.label}
              <button
                type="button"
                onClick={() => removePill(pill.k)}
                className="hover:bg-indigo-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
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