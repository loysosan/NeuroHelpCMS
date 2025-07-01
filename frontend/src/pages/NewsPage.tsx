import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import NewsCard from '../components/NewsCard';
import LoginPopup from '../components/LoginPopup';
import RegisterPopup from '../components/RegisterPopup';
import { useUserAuth } from '../context/UserAuthContext';

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

const NewsPage: React.FC = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { token, login } = useUserAuth();

  const newsPerPage = 12;

  useEffect(() => {
    fetchNews();
  }, [currentPage]);

  const fetchNews = async () => {
    try {
      const offset = (currentPage - 1) * newsPerPage;
      const response = await fetch(`/api/news?limit=${newsPerPage}&offset=${offset}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (currentPage === 1) {
          setNews(data);
        } else {
          setNews(prev => [...prev, ...data]);
        }
        
        setHasMore(data.length === newsPerPage);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setCurrentPage(prev => prev + 1);
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
        {/* Header Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Новини
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
                Останні новини та оновлення нашого сайту
              </p>
              <nav className="text-sm">
                <Link to="/" className="hover:underline">Головна</Link>
                <span className="mx-2">/</span>
                <span>Новини</span>
              </nav>
            </div>
          </div>
        </section>

        {/* News Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {loading && currentPage === 1 ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : news.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {news.map((article) => (
                    <NewsCard key={article.id} article={article} />
                  ))}
                </div>

                {hasMore && (
                  <div className="text-center">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Завантаження...
                        </>
                      ) : (
                        'Завантажити ще'
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Новин поки що немає</h3>
                <p className="text-gray-500">Перевірте пізніше, щоб побачити останні оновлення</p>
              </div>
            )}
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

export default NewsPage;