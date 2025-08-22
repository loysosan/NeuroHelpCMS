import React, { useState, FormEvent } from 'react';

interface Props {
  onSubmit: (q: string) => void;
  placeholder?: string;
}

const QuickSearchForm: React.FC<Props> = ({ onSubmit, placeholder = 'Пошук спеціаліста або матеріалів...' }) => {
  const [q, setQ] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <form onSubmit={submit} className="w-full max-w-xl flex items-stretch gap-2">
      <div className="relative flex-1">
        <input
          value={q}
            onChange={e => setQ(e.target.value)}
          className="w-full h-12 rounded-lg border border-gray-300 bg-white px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder={placeholder}
        />
        <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 pointer-events-none">🔍</span>
      </div>
      <button
        type="submit"
        className="h-12 px-6 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
      >
        Пошук
      </button>
    </form>
  );
};

export default QuickSearchForm;