import React from 'react';
import { Link } from 'react-router-dom';

export interface NewsCardData {
  id: number;
  title: string;
  summary?: string;
  imageUrl?: string;
  views: number;
  createdAt: string;
  authorName?: string;
  content?: string;
  highlight?: boolean;
}

interface Props {
  item: NewsCardData;
  variant?: 'highlight' | 'compact' | 'default';
}

const NewsCard: React.FC<Props> = ({ item, variant = 'default' }) => {
  const date = new Date(item.createdAt).toLocaleDateString('uk-UA');
  const words = (item.content || item.summary || item.title || '').split(/\s+/).filter(Boolean).length;
  const readMin = Math.max(1, Math.round(words / 180));

  if (variant === 'highlight') {
    return (
      <Link
        to={`/news/${item.id}`}
        className="group relative flex flex-col md:flex-row overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow transition"
      >
        <div className="relative w-full md:w-1/2 h-64 md:h-auto bg-gray-100 overflow-hidden">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              Немає зображення
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <span className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-medium px-2 py-1 rounded">
            Головне
          </span>
        </div>
        <div className="flex-1 p-6 md:p-8 flex flex-col">
          <h3 className="text-xl md:text-2xl font-semibold mb-3 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-3">
            {item.title}
          </h3>
          {item.summary && (
            <p className="text-sm md:text-base text-gray-600 mb-4 line-clamp-4">
              {item.summary}
            </p>
          )}
          <div className="mt-auto pt-4 flex flex-wrap gap-4 text-xs text-gray-500 border-t">
            <span>{date}</span>
            <span>👁 {item.views}</span>
            <span>⏱ {readMin} хв</span>
            {item.authorName && <span>✍ {item.authorName}</span>}
          </div>
        </div>
      </Link>
    );
  }

  const compact = variant === 'compact';

  return (
    <Link
      to={`/news/${item.id}`}
      className={`group flex flex-col overflow-hidden rounded-xl border bg-white hover:shadow-md transition ${
        compact ? 'sm:flex-row sm:h-32' : ''
      }`}
    >
      <div className={`${compact ? 'w-full sm:w-40 h-40 sm:h-full' : 'h-40 w-full'} bg-gray-100 relative`}>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
            Немає
          </div>
        )}
        {item.highlight && (
          <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded">
            Top
          </span>
        )}
      </div>
      <div className={`p-4 flex flex-col ${compact ? 'flex-1' : ''}`}>
        <h4 className={`font-medium text-gray-900 mb-2 line-clamp-2 ${compact ? 'text-sm' : 'text-sm md:text-base'} group-hover:text-indigo-600`}>
          {item.title}
        </h4>
        {!compact && item.summary && (
          <p className="text-xs md:text-sm text-gray-500 line-clamp-3 mb-3">
            {item.summary}
          </p>
        )}
        <div className="mt-auto flex flex-wrap gap-3 text-[11px] md:text-xs text-gray-500 pt-2 border-t">
          <span>{date}</span>
            <span>👁 {item.views}</span>
          <span>⏱ {readMin} хв</span>
        </div>
      </div>
    </Link>
  );
};

export default NewsCard;