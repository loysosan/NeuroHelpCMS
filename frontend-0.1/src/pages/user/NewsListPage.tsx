import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import BottomNavigation from '../../components/user/BottomNavigation';
import NewsCard, { NewsCardData } from '../../components/user/news/NewsCard';
import { fetchNewsList } from '../../api/news';

interface News extends NewsCardData {}

const PAGE_SIZE = 12;

const NewsListPage: React.FC = () => {
  const [items, setItems] = useState<News[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const page = Number(params.get('page') || 1);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const { items, total } = await fetchNewsList(page, PAGE_SIZE);
      setItems(items);
      setTotal(total);
    } catch (e: any) {
      setErr(e.message || 'Помилка');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const goPage = (p: number) => {
    const np = new URLSearchParams(params);
    np.set('page', String(p));
    setParams(np, { replace: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 pb-24 md:pb-0">
      <Header />
      <main className="flex-1 px-4 pt-8 pb-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Усі новини</h1>
            <p className="text-sm md:text-base text-gray-500 mt-1">
              Сторінка {page} з {totalPages}
            </p>
          </div>
          <Link
            to="/"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            ← На головну
          </Link>
        </div>

        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 rounded-xl border bg-white animate-pulse" />
            ))}
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

        {!loading && !err && items.length === 0 && (
          <div className="rounded-xl border border-dashed bg-white p-12 text-center">
            <h3 className="text-lg font-medium mb-2">Новини відсутні</h3>
            <p className="text-sm text-gray-500 mb-6">Додайте матеріали або перевірте пізніше.</p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-indigo-500"
            >
              На головну
            </button>
          </div>
        )}

        {!loading && !err && items.length > 0 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map(n => (
                <NewsCard key={n.id} item={n} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => goPage(page - 1)}
                  className="px-3 h-9 rounded-md border text-sm disabled:opacity-40 hover:bg-gray-50"
                >
                  Попередня
                </button>
                {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => goPage(p)}
                      className={`px-3 h-9 rounded-md border text-sm ${
                        p === page
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                {totalPages > 7 && <span className="px-2 text-sm text-gray-500">…</span>}
                <button
                  disabled={page >= totalPages}
                  onClick={() => goPage(page + 1)}
                  className="px-3 h-9 rounded-md border text-sm disabled:opacity-40 hover:bg-gray-50"
                >
                  Наступна
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default NewsListPage;