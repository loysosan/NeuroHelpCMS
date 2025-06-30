import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import CreateNewsModal from '../components/CreateNewsModal';
import EditNewsModal from '../components/EditNewsModal';
import ConfirmationModal from '../components/ConfirmationModal';

interface News {
  id: number;
  title: string;
  content: string;
  summary: string;
  imageUrl?: string;
  isPublic: boolean;
  published: boolean;
  views: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

const AdminNews: React.FC = () => {
  const { token } = useAuth();
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Модальні стани
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [newsToDelete, setNewsToDelete] = useState<number | null>(null);
  
  // Фільтрація
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'public' | 'private'>('all');

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/news', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Не вдалося завантажити новини');

      const data = await res.json();
      setNews(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNews = async (newsData: Omit<News, 'id'>) => {
    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newsData)
      });

      if (!res.ok) throw new Error('Не вдалося створити новину');

      await fetchNews();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleEditNews = async (newsData: Partial<News>) => {
    if (!selectedNews) return;

    try {
      const res = await fetch(`/api/admin/news/${selectedNews.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newsData)
      });

      if (!res.ok) throw new Error('Не вдалося оновити новину');

      await fetchNews();
      setSelectedNews(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleDeleteClick = (newsId: number) => {
    setNewsToDelete(newsId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!newsToDelete) return;

    try {
      const res = await fetch(`/api/admin/news/${newsToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Не вдалося видалити новину');

      setNews(news.filter(item => item.id !== newsToDelete));
      setIsDeleteModalOpen(false);
      setNewsToDelete(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTogglePublish = async (newsId: number, currentStatus: boolean) => {
    try {
      const action = currentStatus ? 'unpublish' : 'publish';
      const res = await fetch(`/api/admin/news/${newsId}/publish?action=${action}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Не вдалося змінити статус публікації');

      await fetchNews();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditClick = (newsItem: News) => {
    setSelectedNews(newsItem);
    setIsEditModalOpen(true);
  };

  const filteredNews = news.filter(item => {
    switch (filter) {
      case 'published':
        return item.published;
      case 'draft':
        return !item.published;
      case 'public':
        return item.isPublic;
      case 'private':
        return !item.isPublic;
      default:
        return true;
    }
  });

  const getStatusBadge = (item: News) => {
    if (!item.published) {
      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Чернетка</span>;
    }
    if (item.isPublic) {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Публічна</span>;
    }
    return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Для користувачів</span>;
  };

  useEffect(() => {
    fetchNews();
  }, [token]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Управління новинами</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Створити новину
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Фільтри */}
        <div className="mb-6 flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Всі ({news.length})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-4 py-2 rounded ${filter === 'published' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Опубліковані ({news.filter(n => n.published).length})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-2 rounded ${filter === 'draft' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Чернетки ({news.filter(n => !n.published).length})
          </button>
          <button
            onClick={() => setFilter('public')}
            className={`px-4 py-2 rounded ${filter === 'public' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Публічні ({news.filter(n => n.isPublic).length})
          </button>
          <button
            onClick={() => setFilter('private')}
            className={`px-4 py-2 rounded ${filter === 'private' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Приватні ({news.filter(n => !n.isPublic).length})
          </button>
        </div>

        {/* Список новин */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {filteredNews.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className="mt-2">Новин не знайдено</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNews.map((item) => (
                <div key={item.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                        {getStatusBadge(item)}
                      </div>
                      
                      {item.summary && (
                        <p className="text-gray-600 mb-2">{item.summary}</p>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span>Автор: {item.authorName}</span>
                        <span>Переглядів: {item.views}</span>
                        <span>Створено: {new Date(item.createdAt).toLocaleDateString('uk-UA')}</span>
                        {item.updatedAt !== item.createdAt && (
                          <span>Оновлено: {new Date(item.updatedAt).toLocaleDateString('uk-UA')}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleTogglePublish(item.id, item.published)}
                        className={`px-3 py-1 text-xs rounded ${
                          item.published 
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {item.published ? 'Зняти з публікації' : 'Опублікувати'}
                      </button>
                      
                      <button
                        onClick={() => handleEditClick(item)}
                        className="text-indigo-600 hover:text-indigo-900 px-3 py-1 text-sm"
                      >
                        Редагувати
                      </button>
                      
                      <button
                        onClick={() => handleDeleteClick(item.id)}
                        className="text-red-600 hover:text-red-900 px-3 py-1 text-sm"
                      >
                        Видалити
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Модальні вікна */}
        <CreateNewsModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateNews}
        />

        <EditNewsModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedNews(null);
          }}
          onSubmit={handleEditNews}
          news={selectedNews}
        />

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Підтвердження видалення"
          message="Ви впевнені, що хочете видалити цю новину? Цю дію неможливо скасувати."
        />
      </div>
    </AdminLayout>
  );
};

export default AdminNews;