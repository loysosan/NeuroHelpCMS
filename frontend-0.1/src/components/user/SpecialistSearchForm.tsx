import React, { useState, useEffect } from 'react';
import { Filter, ChevronUp, ChevronDown, Search, X } from 'lucide-react';
import RangeSlider from '../ui/RangeSlider';
import SkillsDropdown from './SkillsDropdown';

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
  maxExperience?: number;
  minAge?: number;
  maxAge?: number;
  minChildAge?: number;
  maxChildAge?: number;
  skillIds: number[];
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
    maxExperience: undefined,
    minAge: undefined,
    maxAge: undefined,
    minChildAge: undefined,
    maxChildAge: undefined,
    skillIds: [],
  });
  const [openFilters, setOpenFilters] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsByCategory, setSkillsByCategory] = useState<SkillsByCategory>({});
  const [loadingSkills, setLoadingSkills] = useState(false);

  // Range sliders state
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [experienceRange, setExperienceRange] = useState<[number, number]>([0, 30]);
  const [specialistAgeRange, setSpecialistAgeRange] = useState<[number, number]>([18, 70]);
  const [childAgeRange, setChildAgeRange] = useState<[number, number]>([0, 18]);

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

    // Apply range values to search params
    const searchValues = {
      ...v,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 5000 ? priceRange[1] : undefined,
      minExperience: experienceRange[0] > 0 ? experienceRange[0] : undefined,
      maxExperience: experienceRange[1] < 30 ? experienceRange[1] : undefined,
      minAge: specialistAgeRange[0] > 18 ? specialistAgeRange[0] : undefined,
      maxAge: specialistAgeRange[1] < 70 ? specialistAgeRange[1] : undefined,
      minChildAge: childAgeRange[0] > 0 ? childAgeRange[0] : undefined,
      maxChildAge: childAgeRange[1] < 18 ? childAgeRange[1] : undefined,
    };

    onSearch(searchValues);
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
      maxExperience: undefined,
      minAge: undefined,
      maxAge: undefined,
      minChildAge: undefined,
      maxChildAge: undefined,
      skillIds: [],
    }));
    setPriceRange([0, 5000]);
    setExperienceRange([0, 30]);
    setSpecialistAgeRange([18, 70]);
    setChildAgeRange([0, 18]);
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
    (priceRange[0] > 0 || priceRange[1] < 5000) && {
      k: 'price',
      label: `${priceRange[0]}–${priceRange[1]}₴`,
      onRemove: () => setPriceRange([0, 5000]),
    },
    (experienceRange[0] > 0 || experienceRange[1] < 30) && {
      k: 'experience',
      label: `Досвід: ${experienceRange[0]}–${experienceRange[1]} років`,
      onRemove: () => setExperienceRange([0, 30]),
    },
    (specialistAgeRange[0] > 18 || specialistAgeRange[1] < 70) && {
      k: 'age',
      label: `Вік: ${specialistAgeRange[0]}–${specialistAgeRange[1]}`,
      onRemove: () => setSpecialistAgeRange([18, 70]),
    },
    (childAgeRange[0] > 0 || childAgeRange[1] < 18) && {
      k: 'childAge',
      label: `Вік дитини: ${childAgeRange[0]}–${childAgeRange[1]}`,
      onRemove: () => setChildAgeRange([0, 18]),
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
        <div className="space-y-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
          {/* Skills Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase text-gray-500">
              Спеціалізація / Навички
            </label>
            <SkillsDropdown
              skills={skills}
              skillsByCategory={skillsByCategory}
              selectedSkillIds={v.skillIds}
              onToggleSkill={toggleSkill}
              loading={loadingSkills}
            />
          </div>

          {/* Range Sliders Grid - 2 columns on desktop */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Price Range Slider */}
            <RangeSlider
              min={0}
              max={5000}
              step={50}
              values={priceRange}
              onChange={setPriceRange}
              label="Ціна за годину"
              formatValue={(val) => `${val}₴`}
            />

            {/* Experience Range Slider */}
            <RangeSlider
              min={0}
              max={30}
              step={1}
              values={experienceRange}
              onChange={setExperienceRange}
              label="Досвід (років)"
              formatValue={(val) => `${val} р`}
            />

            {/* Specialist Age Range */}
            <RangeSlider
              min={18}
              max={70}
              step={1}
              values={specialistAgeRange}
              onChange={setSpecialistAgeRange}
              label="Вік спеціаліста"
              formatValue={(val) => `${val} р`}
            />

            {/* Child Age Range */}
            <RangeSlider
              min={0}
              max={18}
              step={1}
              values={childAgeRange}
              onChange={setChildAgeRange}
              label="Вік дитини клієнта"
              formatValue={(val) => `${val} р`}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
