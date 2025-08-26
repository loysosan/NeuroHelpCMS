import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/user/Header';
import BottomNavigation from '../../components/user/BottomNavigation';
import Footer from '../../components/user/Footer';
import SpecialistSearchForm, { SpecialistSearchValues } from '../../components/user/SpecialistSearchForm';
import NewsCard, { NewsCardData } from '../../components/user/news/NewsCard';

interface News extends NewsCardData {}

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
        res = await fetch(`${base}/api/news?limit=8&home=1`, { signal: controller.signal });
      }
      if (!res.ok) throw new Error('Не вдалося завантажити новини');
      const data = await res.json();
      let items: News[] = Array.isArray(data) ? data : [];

      // FIX: гарантуємо що highlight = перша карточка, а друга новина НЕ зникає.
      if (items.length) {
        // Якщо перша без зображення, але далі є зображення – підтягуємо таку новину вгору,
        // але оригінальну першу не втрачаємо (вона стане другою).
        if (!items[0].imageUrl) {
          const withImgIdx = items.findIndex((n, idx) => idx > 0 && n.imageUrl);
          if (withImgIdx > 0) {
            const [withImg] = items.splice(withImgIdx, 1);
            items.unshift(withImg);
          }
        }
        items[0].highlight = true; // тільки перша
      }

      setNews(items.slice(0, 7));
    } catch (e: any) {
      if (e.name !== 'AbortError') setError(e.message || 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, []);

  useEffect(() => { fetchHomeNews(); }, [fetchHomeNews]);

  const handleSpecialistSearch = (v: SpecialistSearchValues) => {
    const params = new URLSearchParams();
    if (v.q) params.set('q', v.q);
    if (v.specialization) params.set('specialization', v.specialization);
    if (v.city) params.set('city', v.city);
    if (v.format) params.set('format', v.format);
    if (v.minPrice !== undefined) params.set('minPrice', String(v.minPrice));
    if (v.maxPrice !== undefined) params.set('maxPrice', String(v.maxPrice));
    if (v.minExperience !== undefined) params.set('minExp', String(v.minExperience));
    navigate(`/search?${params.toString()}`);
  };

  const highlight = news.find(n => n.highlight);
  const rest = news.filter(n => n !== highlight);
  const compact = rest.slice(0, 2);
  const grid = rest.slice(2);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 pb-24 md:pb-0">
      <Header />

      <section className="relative px-4 pt-12 pb-12 md:pt-20 md:pb-14 max-w-7xl mx-auto w-full">
        <div className="max-w-4xl">
          <h1 className="font-semibold tracking-tight text-3xl md:text-5xl mb-6">
            Платформа підтримки NeuroHelp
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
            Пошук сертифікованих спеціалістів та актуальні матеріали з ментального здоровʼя.
          </p>
          <SpecialistSearchForm onSearch={handleSpecialistSearch} />
        </div>
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(circle_at_20%_30%,#6366f130,transparent_60%)]" />
      </section>

      <section className="px-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Останні новини</h2>
            <p className="text-sm md:text-base text-gray-500 mt-1">
              Оновлення платформи, корисні поради та експертні статті
            </p>
          </div>
          <Link to="/news" className="hidden md:inline-flex text-sm font-medium text-indigo-600 hover:underline">
            Переглянути всі →
          </Link>
        </div>

        {loading && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-80 md:h-full rounded-2xl bg-white border animate-pulse" />
              <div className="flex flex-col gap-4">
                <div className="h-32 rounded-xl bg-white border animate-pulse" />
                <div className="h-32 rounded-xl bg-white border animate-pulse" />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-white p-4 animate-pulse h-56" />
              ))}
            </div>
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
          <div className="rounded-2xl border border-dashed bg-white p-12 text-center shadow-sm">
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
          <div className="space-y-10">
            {(() => {
              const previews = news.slice(0, 2);
              return (
                <div className="grid gap-6 md:grid-cols-2">
                  {previews.map(n => (
                    <NewsCard
                      key={n.id}
                      item={n}
                      variant="highlight"
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </section>

      <section className="mt-20 mb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl border bg-white p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center shadow-sm">
            <div className="flex-1">
              <h3 className="text-2xl font-semibold mb-3">Почніть сьогодні</h3>
              <p className="text-gray-500 mb-6 max-w-prose">
                Створіть обліковий запис, щоб знаходити фахівців швидше та зберігати улюблені матеріали.
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