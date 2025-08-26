import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import BottomNavigation from '../../components/user/BottomNavigation';
import { fetchNewsItem } from '../../api/news';
import type { NewsCardData } from '../../components/user/news/NewsCard';

const NewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<NewsCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchNewsItem(id);
      setItem(data);
    } catch (e: any) {
      setErr(e.message || 'Помилка');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const date = item ? new Date(item.createdAt).toLocaleDateString('uk-UA') : '';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 pb-24 md:pb-0">
      <Header />
      <main className="flex-1 px-4 pt-8 pb-16 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
          >
            ← Назад
          </button>
          <Link
            to="/news"
            className="text-sm text-indigo-600 hover:underline font-medium"
          >
            Усі новини
          </Link>
        </div>

        {loading && (
          <div className="space-y-4">
            <div className="h-8 w-2/3 bg-white border animate-pulse rounded" />
            <div className="h-4 w-40 bg-white border animate-pulse rounded" />
            <div className="h-72 bg-white border animate-pulse rounded" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 bg-white border animate-pulse rounded" />
              ))}
            </div>
          </div>
        )}

        {!loading && err && (
          <div className="max-w-md rounded-lg border border-red-300 bg-red-50 p-6">
            <p className="font-medium text-red-600 mb-2">Помилка</p>
            <p className="text-sm text-red-700 mb-4">{err}</p>
            <button
              onClick={load}
              className="text-sm bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-500"
            >
              Спробувати ще раз
            </button>
          </div>
        )}

        {!loading && !err && item && (
          <article className="space-y-8">
            <header>
              <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-4">
                {item.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <span>{date}</span>
                <span>👁 {item.views}</span>
                {item.authorName && <span>✍ {item.authorName}</span>}
              </div>
            </header>

            {item.imageUrl && (
              <div className="rounded-2xl overflow-hidden border bg-white">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-auto max-h-[480px] object-cover"
                  loading="lazy"
                />
              </div>
            )}

            <div className="prose prose-sm md:prose-base max-w-none prose-indigo">
              {item.content
                ? <div dangerouslySetInnerHTML={{ __html: item.content }} />
                : <p className="text-gray-600">{item.summary}</p>
              }
            </div>

            <hr className="border-gray-200" />

            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                to="/news"
                className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
              >
                ← Повернутись до списку
              </Link>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-gray-600 hover:text-gray-900 hover:underline"
              >
                До початку ↑
              </button>
            </div>
          </article>
        )}
      </main>
      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default NewsDetailPage;