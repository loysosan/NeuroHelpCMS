import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Header from '../../components/user/Header';
import QuickSearchForm from '../../components/user/QuickSearchForm';
import BottomNavigation from '../../components/user/BottomNavigation';
import Footer from '../../components/user/Footer';

interface News {
  id: number;
  title: string;
  summary?: string;
  content?: string;
  imageUrl?: string;
  views: number;
  createdAt: string;
  authorName?: string;
}

const SKELETON_COUNT = 4;

const HomePage: React.FC = () => {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchHomeNews = useCallback(async () => {
    setError(null);
    setLoading(true);
    const controller = new AbortController();
    try {
      const base = import.meta.env.VITE_API_URL || '';
      let res = await fetch(`${base}/api/news/home`, { signal: controller.signal });
      if (!res.ok) {
        res = await fetch(`${base}/api/news?home=1`, { signal: controller.signal });
      }
      if (!res.ok) throw new Error('Не вдалося завантажити новини');
      const data = await res.json();
      setNews(Array.isArray(data) ? data.slice(0, 4) : []);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setError(e.message || 'Помилка завантаження');
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, []);

  useEffect(() => {
    fetchHomeNews();
  }, [fetchHomeNews]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 pb-24 md:pb-0">
      <Header />

      {/* Hero */}
      <section className="relative px-4 pt-12 pb-10 md:pt-20 md:pb-16 max-w-7xl mx-auto">
        <div className="max-w-3xl">
          <h1 className="font-semibold tracking-tight text-3xl md:text-5xl mb-6">
            Платформа підтримки NeuroHelp
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
            Знаходьте спеціалістів, отримуйте професійну допомогу та читайте актуальні матеріали.
          </p>
          <QuickSearchForm
            onSubmit={(q: string) => navigate(`/search?query=${encodeURIComponent(q)}`)}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(circle_at_20%_30%,#6366f130,transparent_60%)]" />
      </section>

      {/* News */}
      <section className="mt-4 md:mt-10 px-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Останні новини</h2>
            <p className="text-sm md:text-base text-gray-500 mt-1">
              Підбірка матеріалів та оновлень платформи
            </p>
          </div>
          <Link to="/news" className="hidden md:inline-flex text-sm font-medium text-indigo-600 hover:underline">
            Переглянути всі →
          </Link>
        </div>

        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-white p-4 animate-pulse flex flex-col shadow-sm">
                <div className="h-36 w-full rounded-md bg-gray-200 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="mt-auto h-3 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-6 max-w-md">
            <p className="font-medium text-red-600 mb-2">Помилка</p>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <button
              onClick={fetchHomeNews}
              className="text-sm bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-500 transition-colors"
            >
              Спробувати ще раз
            </button>
          </div>
        )}

        {!loading && !error && news.length === 0 && (
          <div className="rounded-xl border border-dashed bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              🗎
            </div>
            <h3 className="text-lg font-medium mb-2">Новини відсутні</h3>
            <p className="text-sm text-gray-500 mb-6">
              Додайте матеріали через адміністративну панель або перевірте пізніше.
            </p>
            <Link
              to="/news"
              className="inline-flex bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-indigo-500 transition-colors"
            >
              Перейти до розділу новин
            </Link>
          </div>
        )}

        {!loading && !error && news.length > 0 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {news.map((n) => (
                <Link
                  to={`/news/${n.id}`}
                  key={n.id}
                  className="group rounded-xl border bg-white hover:border-indigo-300 transition-colors flex flex-col overflow-hidden shadow-sm hover:shadow"
                >
                  <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
                    {n.imageUrl ? (
                      <img
                        src={n.imageUrl}
                        alt={n.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                        Немає зображення
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-medium text-sm md:text-base line-clamp-2 mb-2 leading-snug">
                      {n.title}
                    </h3>
                    {n.summary && (
                      <p className="text-xs md:text-sm text-gray-500 line-clamp-3 mb-3">
                        {n.summary}
                      </p>
                    )}
                    <div className="mt-auto pt-3 flex items-center justify-between border-t text-[11px] md:text-xs text-gray-500">
                      <span>{new Date(n.createdAt).toLocaleDateString('uk-UA')}</span>
                      <span className="flex items-center gap-1">
                        👁️ {n.views}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center md:hidden">
              <Link to="/news" className="inline-flex text-sm font-medium text-indigo-600 hover:underline">
                Всі новини →
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Допоміжний CTA */}
      <section className="mt-16 mb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl border bg-white p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center shadow-sm">
            <div className="flex-1">
              <h3 className="text-2xl font-semibold mb-3">Почніть сьогодні</h3>
              <p className="text-gray-500 mb-6 max-w-prose">
                Зареєструйтеся та знайдіть спеціаліста або перегляньте корисні матеріали платформи.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors"
                >
                  Увійти / Реєстрація
                </button>
                <button
                  onClick={() => navigate('/search')}
                  className="border border-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Знайти спеціаліста
                </button>
              </div>
            </div>
            <div className="opacity-50 text-7xl md:text-8xl select-none">♟</div>
          </div>
        </div>
      </section>
      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default HomePage;