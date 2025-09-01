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

      {/* Hero + пошук */}
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

      {/* Нові блоки реєстрації (спеціаліст / користувач) */}
      <section className="px-4 max-w-7xl mx-auto w-full mb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="group relative overflow-hidden rounded-2xl border bg-white p-8 flex flex-col shadow-sm">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-indigo-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              Стати спеціалістом
            </h3>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              Отримуйте клієнтів, керуйте записами та публікуйте експертні матеріали. Інструменти аналітики й видимість у каталозі.
            </p>
            <ul className="text-sm text-gray-600 space-y-2 mb-6">
              <li className="flex gap-2"><span className="text-indigo-600">•</span>Персональний профіль</li>
              <li className="flex gap-2"><span className="text-indigo-600">•</span>Гнучкі формати (онлайн / офлайн)</li>
              <li className="flex gap-2"><span className="text-indigo-600">•</span>Статистика переглядів</li>
            </ul>
            <div className="mt-auto flex flex-wrap gap-3">
              {/* Оновлено: кнопка веде на квіз-реєстрацію */}
              <button
                onClick={() => navigate('/quiz-register?role=psychologist')}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
              >
                Зареєструватися
              </button>
              
              <button
                onClick={() => navigate('/login?role=specialist')}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Увійти
              </button>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border bg-white p-8 flex flex-col shadow-sm">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-violet-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              Стати користувачем
            </h3>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              Зберігайте обраних спеціалістів, швидко знаходьте потрібну допомогу та отримуйте доступ до персоналізованих матеріалів.
            </p>
            <ul className="text-sm text-gray-600 space-y-2 mb-6">
              <li className="flex gap-2"><span className="text-violet-600">•</span>Закладки та історія</li>
              <li className="flex gap-2"><span className="text-violet-600">•</span>Персональні рекомендації</li>
              <li className="flex gap-2"><span className="text-violet-600">•</span>Доступ до новин та статей</li>
            </ul>
            <div className="mt-auto flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/quiz-register-client')}
                className="px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors"
              >
                Зареєструватися
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Увійти
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Секція новин */}
      <section className="px-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Останні новини</h2>
            <p className="text-sm md:text-base text-gray-500 mt-1">
              Оновлення платформи, корисні поради та експертні статті
            </p>
          </div>
          {/* Якщо треба забрати лінк – видали цей <Link> */}
          {/* <Link to="/news" className="hidden md:inline-flex text-sm font-medium text-indigo-600 hover:underline">
            Переглянути всі →
          </Link> */}
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
                    {previews.map((n, idx) => (
                      <NewsCard
                        key={n.id}
                        item={{ ...n, highlight: true }}   // обидві у великому стилі
                        variant="highlight"
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
        )}
      </section>

      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default HomePage;