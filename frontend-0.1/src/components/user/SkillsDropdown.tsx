import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

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

interface Props {
  skills: Skill[];
  skillsByCategory: SkillsByCategory;
  selectedSkillIds: number[];
  onToggleSkill: (skillId: number) => void;
  loading?: boolean;
}

const SkillsDropdown: React.FC<Props> = ({
  skills,
  skillsByCategory,
  selectedSkillIds,
  onToggleSkill,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Filter skills by search query
  const filteredCategories = Object.entries(skillsByCategory).reduce((acc, [categoryName, categorySkills]) => {
    const filtered = categorySkills.filter(skill =>
      skill.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[categoryName] = filtered;
    }
    return acc;
  }, {} as SkillsByCategory);

  const selectedSkills = skills.filter(s => selectedSkillIds.includes(s.id));

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {selectedSkills.length > 0 ? (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-sm text-gray-700">
                {selectedSkills.slice(0, 2).map(s => s.name).join(', ')}
              </span>
              {selectedSkills.length > 2 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  +{selectedSkills.length - 2}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400">Оберіть навички...</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-hidden flex flex-col">
          {/* Search input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук навичок..."
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Skills list */}
          <div className="overflow-y-auto p-2">
            {loading ? (
              <div className="text-center py-8 text-sm text-gray-500">
                Завантаження...
              </div>
            ) : Object.keys(filteredCategories).length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                {searchQuery ? 'Нічого не знайдено' : 'Немає навичок'}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(filteredCategories).map(([categoryName, categorySkills]) => (
                  <div key={categoryName}>
                    <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
                      {categoryName}
                    </div>
                    <div className="space-y-0.5">
                      {categorySkills.map((skill) => {
                        const isSelected = selectedSkillIds.includes(skill.id);
                        return (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => onToggleSkill(skill.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                              isSelected
                                ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span>{skill.name}</span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-indigo-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with selected count */}
          {selectedSkills.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  Обрано: {selectedSkills.length}
                </span>
                <button
                  type="button"
                  onClick={() => selectedSkillIds.forEach(id => onToggleSkill(id))}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Очистити все
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillsDropdown;
