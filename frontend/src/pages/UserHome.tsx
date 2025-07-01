import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import UserHeader from '../components/UserHeader';
import LoginPopup from '../components/LoginPopup';
import RegisterPopup from '../components/RegisterPopup';
import NewsCard from '../components/NewsCard';
import { Link } from 'react-router-dom';

interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  imageUrl?: string;
  author: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  views: number;
}

const UserHome: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [homeNews, setHomeNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, login } = useUserAuth();

  const isLoggedIn = !!token;

  useEffect(() => {
    fetchHomeNews();
  }, []);

  const fetchHomeNews = async () => {
    try {
      const response = await fetch('/api/news/home');
      if (response.ok) {
        const data = await response.json();
        setHomeNews(data);
      }
    } catch (error) {
      console.error('Error fetching home news:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <UserHeader
        title="My Little Go CMS"
        showProfileLink={true}
        onLoginClick={() => setShowLogin(true)}
        onRegisterClick={() => setShowRegister(true)}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Ласкаво просимо на сайт!
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              {isLoggedIn
                ? 'Ви увійшли в систему! Відвідайте свій профіль для керування обліковим записом.'
                : 'Будь ласка, увійдіть або зареєструйтеся для продовження.'}
            </p>
            {!isLoggedIn && (
              <div className="space-x-4">
                <button
                  onClick={() => setShowLogin(true)}
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-300"
                >
                  Увійти
                </button>
                <button
                  onClick={() => setShowRegister(true)}
                  className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition duration-300"
                >
                  Зареєструватись
                </button>
              </div>
            )}
          </div>
        </section>

        {/* News Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Останні новини
              </h2>
              <p className="text-gray-600 text-lg">
                Дізнайтеся про найсвіжіші події та оновлення
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : homeNews.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {homeNews.map((article) => (
                    <NewsCard key={article.id} article={article} />
                  ))}
                </div>
                <div className="text-center">
                  <Link
                    to="/news"
                    className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
                  >
                    Переглянути всі новини
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Поки що немає новин для відображення</p>
                <Link
                  to="/news"
                  className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Переглянути всі новини →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Наші можливості
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white rounded-lg shadow-md">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Новини</h3>
                <p className="text-gray-600">Актуальні новини та оновлення</p>
              </div>
              <div className="text-center p-6 bg-white rounded-lg shadow-md">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Профіль</h3>
                <p className="text-gray-600">Персональний кабінет користувача</p>
              </div>
              <div className="text-center p-6 bg-white rounded-lg shadow-md">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Безпека</h3>
                <p className="text-gray-600">Надійна система авторизації</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LoginPopup
        show={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={login}
      />
      
      <RegisterPopup
        show={showRegister}
        onClose={() => setShowRegister(false)}
      />
    </div>
  );
};

export default UserHome;