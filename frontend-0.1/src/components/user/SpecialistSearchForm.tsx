import React, { useState, useEffect } from 'react';
import { Filter, ChevronUp, ChevronDown, Search, X } from 'lucide-react';

interface Skill {
  id: number;
  name: string;
  categoryId: number;
  category: {
    id: number;
    name: string;
  };
}

interface SkillsByCategory {
  [categoryName: string]: Skill[];
}

export interface SpecialistSearchValues {
  q: string;
  specialization: string; // deprecated, kept for compatibility
  city: string;
  format: string;
  minPrice?: number;
  maxPrice?: number;
  minExperience?: number;
  skillIds: number[]; // NEW: array of skill IDs
}

interface Props {
  onSearch: (v: SpecialistSearchValues) => void;
}

const cityOptions = ['Київ', 'Львів', 'Одеса', 'Харків', 'Дніпро', 'Онлайн'];
const formatOptions = [
  { value: 'online', label: 'Онлайн' },
  { value: 'offline', label: 'Офлайн' },
  { value: 'hybrid', label: 'Гібрид' },
];

const SpecialistSearchForm: React.FC<Props> = ({ onSearch }) => {
  const [v, setV] = useState<SpecialistSearchValues>({
    q: '',
    specialization: '',
    city: '',
    format: '',
    minPrice: undefined,
    maxPrice: undefined,
    minExperience: undefined,
    skillIds: [],
  });
  const [openFilters, setOpenFilters] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsByCategory, setSkillsByCategory] = useState<SkillsByCategory>({});
  const [loadingSkills, setLoadingSkills] = useState(false);

  // Load skills from API on mount
  useEffect(() => {
    const fetchSkills = async () => {
      setLoadingSkills(true);
      try {
        const base = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${base}/api/users/skills`);
        if (response.ok) {
          const data = await response.json();
          setSkills(data || []);

          // Group skills by category
          const grouped: SkillsByCategory = {};
          (data || []).forEach((skill: Skill) => {
            const categoryName = skill.category?.name || 'Інше';
            if (!grouped[categoryName]) {
              grouped[categoryName] = [];
            }
            grouped[categoryName].push(skill);
          });
          setSkillsByCategory(grouped);
        }
      } catch (error) {
        console.error('Failed to load skills:', error);
      } finally {
        setLoadingSkills(false);
      }
    };

    fetchSkills();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(v);
  };

  const set = <K extends keyof SpecialistSearchValues>(
    k: K,
    val: SpecialistSearchValues[K]
  ) => setV((prev) => ({ ...prev, [k]: val }));

  const clearFilters = () => {
    setV((p) => ({
      ...p,
      specialization: '',
      city: '',
      format: '',
      minPrice: undefined,
      maxPrice: undefined,
      minExperience: undefined,
      skillIds: [],
    }));
  };

  // Toggle skill selection
  const toggleSkill = (skillId: number) => {
    setV((prev) => {
      const skillIds = prev.skillIds.includes(skillId)
        ? prev.skillIds.filter((id) => id !== skillId)
        : [...prev.skillIds, skillId];
      return { ...prev, skillIds };
    });
  };

  // Get selected skill names for pills
  const selectedSkills = skills.filter((s) => v.skillIds.includes(s.id));

  const pills = [
    ...selectedSkills.map((skill) => ({
      k: `skill-${skill.id}`,
      label: skill.name,
      onRemove: () => toggleSkill(skill.id),
    })),
    v.city && {
      k: 'city',
      label: v.city,
      onRemove: () => set('city', ''),
    },
    v.format && {
      k: 'format',
      label: formatOptions.find((f) => f.value === v.format)?.label,
      onRemove: () => set('format', ''),
    },
    (v.minPrice || v.maxPrice) && {
      k: 'price',
      label: `${v.minPrice ?? 0}–${v.maxPrice ?? '∞'}₴`,
      onRemove: () => {
        set('minPrice', undefined);
        set('maxPrice', undefined);
      },
    },
    v.minExperience && {
      k: 'experience',
      label: `Досвід ≥ ${v.minExperience}р`,
      onRemove: () => set('minExperience', undefined),
    },
  ].filter(Boolean) as Array<{ k: string; label?: string; onRemove: () => void }>;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <button
          type="button"
          onClick={() => setOpenFilters(!openFilters)}
          className="flex items-center justify-center gap-2 h-12 px-6 rounded-lg border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Фільтри
          {openFilters ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        <button
          type="submit"
          className="h-12 px-8 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          Знайти спеціалістів
        </button>

        {pills.length > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="h-12 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Скинути
          </button>
        )}
      </div>

      {pills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pills.map((pill) => (
            <span
              key={pill.k}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium"
            >
              {pill.label}
              <button
                type="button"
                onClick={pill.onRemove}
                className="hover:bg-indigo-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {openFilters && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          {/* Skills Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase text-gray-500">
              Спеціалізація / Навички
            </label>
            {loadingSkills ? (
              <div className="text-sm text-gray-500">Завантаження...</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(skillsByCategory).map(([categoryName, categorySkills]) => (
                  <div key={categoryName} className="space-y-1">
                    <div className="text-xs font-semibold text-gray-700">
                      {categoryName}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {categorySkills.map((skill) => (
                        <button
                          key={skill.id}
                          type="button"
                          onClick={() => toggleSkill(skill.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            v.skillIds.includes(skill.id)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {skill.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* City */}
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase text-gray-500">
                Місто
              </label>
              <select
                value={v.city}
                onChange={(e) => set('city', e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Будь-яке</option>
                {cityOptions.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Format */}
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase text-gray-500">
                Формат
              </label>
              <div className="flex gap-2">
                {formatOptions.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() =>
                      set('format', v.format === f.value ? '' : f.value)
                    }
                    className={`flex-1 h-10 rounded-md border text-xs transition ${
                      v.format === f.value
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase text-gray-500">
                Досвід (років)
              </label>
              <input
                type="number"
                min={0}
                placeholder="від 0"
                value={v.minExperience ?? ''}
                onChange={(e) =>
                  set(
                    'minExperience',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full h-10 rounded-md border border-gray-300 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Price Range */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium uppercase text-gray-500">
                Ціна (₴)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Від"
                  value={v.minPrice ?? ''}
                  onChange={(e) =>
                    set('minPrice', e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full h-10 rounded-md border border-gray-300 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="До"
                  value={v.maxPrice ?? ''}
                  onChange={(e) =>
                    set('maxPrice', e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full h-10 rounded-md border border-gray-300 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 h-10 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
            >
              Застосувати фільтри
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-6 h-10 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-white transition-colors"
            >
              Очистити
            </button>
          </div>
        </div>
      )}
    </form>
  );
};

export default SpecialistSearchForm;
