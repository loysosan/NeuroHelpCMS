import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ConfirmationModal } from '../../components/admin/modals/ConfirmationModal';
import { CreateNewsModal } from '../../components/admin/modals/CreateNewsModal';
import { EditNewsModal } from '../../components/admin/modals/EditNewsModal';

interface News {
  id: number;
  title: string;
  content: string;
  summary: string;
  imageUrl: string;
  isPublic: boolean;
  published: boolean;
  showOnHome: boolean;
  authorId: number;
  authorName: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

type Filter = 'all' | 'published' | 'draft' | 'public' | 'private';

export const NewsPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [news,setNews]=useState<News[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);

  // модалки
  const [isCreateModalOpen,setIsCreateModalOpen]=useState(false);
  const [isEditModalOpen,setIsEditModalOpen]=useState(false);
  const [isDeleteModalOpen,setIsDeleteModalOpen]=useState(false);
  const [selectedNews,setSelectedNews]=useState<News|null>(null);
  const [newsToDelete,setNewsToDelete]=useState<number|null>(null);

  const [filter,setFilter]=useState<Filter>('all');

  const fetchNews=async()=>{
    if(!token) return;
    try {
      setLoading(true);
      const r=await fetch('/api/admin/news',{ headers:{ Authorization:`Bearer ${token}` }});
      if(!r.ok) throw new Error('Не вдалося завантажити новини');
      const data=await r.json();
      setNews(data||[]);
    } catch(e:any){
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNews=async(data: Omit<News,'id'|'authorId'|'authorName'|'views'|'createdAt'|'updatedAt'>)=>{
    if(!token) return;
    try {
      const r=await fetch('/api/admin/news',{
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if(!r.ok) throw new Error('Не вдалося створити новину');
      await fetchNews();
    } catch(e:any){
      setError(e.message);
      throw e;
    }
  };

  const handleEditNews=async(form: Partial<News>)=>{
    if(!token || !selectedNews) return;
    try {
      const r=await fetch(`/api/admin/news/${selectedNews.id}`,{
        method:'PUT',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if(!r.ok) throw new Error('Не вдалося оновити новину');
      await fetchNews();
      setSelectedNews(null);
    } catch(e:any){
      setError(e.message);
      throw e;
    }
  };

  const handleTogglePublish=async(newsId:number,current:boolean)=>{
    if(!token) return;
    try {
      const action = current ? 'unpublish' : 'publish';
      const r=await fetch(`/api/admin/news/${newsId}/publish?action=${action}`,{
        method:'PATCH',
        headers:{ Authorization:`Bearer ${token}` }
      });
      if(!r.ok) throw new Error('Не вдалося змінити статус публікації');
      await fetchNews();
    } catch(e:any){
      setError(e.message);
    }
  };

  const handleDeleteConfirm=async()=>{
    if(!token || !newsToDelete) return;
    try {
      const r=await fetch(`/api/admin/news/${newsToDelete}`,{
        method:'DELETE',
        headers:{ Authorization:`Bearer ${token}` }
      });
      if(!r.ok) throw new Error('Не вдалося видалити новину');
      setNews(n=>n.filter(x=>x.id!==newsToDelete));
      setIsDeleteModalOpen(false);
      setNewsToDelete(null);
    } catch(e:any){
      setError(e.message);
    }
  };

  const getStatusBadge=(item:News)=>{
    if(!item.published) return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Чернетка</span>;
    if(item.isPublic) return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Публічна</span>;
    return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Для користувачів</span>;
  };

  const filteredNews = news.filter(n=>{
    switch(filter){
      case 'published': return n.published;
      case 'draft': return !n.published;
      case 'public': return n.isPublic;
      case 'private': return !n.isPublic;
      default: return true;
    }
  });

  useEffect(()=>{ fetchNews(); },[token]);

  if(loading){
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"/>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Управління новинами</h2>
        <button
          onClick={()=>setIsCreateModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Створити новину
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {(['all','published','draft','public','private'] as Filter[]).map(f=>(
          <button
            key={f}
            onClick={()=>setFilter(f)}
            className={`px-4 py-2 rounded text-sm font-medium ${
              filter===f ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {f==='all' && `Всі (${news.length})`}
            {f==='published' && `Опубліковані (${news.filter(n=>n.published).length})`}
            {f==='draft' && `Чернетки (${news.filter(n=>!n.published).length})`}
            {f==='public' && `Публічні (${news.filter(n=>n.isPublic).length})`}
            {f==='private' && `Приватні (${news.filter(n=>!n.isPublic).length})`}
          </button>
        ))}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredNews.length===0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
            </svg>
            <p>Новин не знайдено</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNews.map(item=>(
              <div key={item.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                      {getStatusBadge(item)}
                      {item.showOnHome && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Головна</span>
                      )}
                    </div>
                    {item.summary && <p className="text-gray-600 mb-2 line-clamp-2">{item.summary}</p>}
                    <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4">
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
                      onClick={()=>handleTogglePublish(item.id,item.published)}
                      className={`px-3 py-1 text-xs rounded ${
                        item.published
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {item.published ? 'Зняти з публікації' : 'Опублікувати'}
                    </button>
                    <button
                      onClick={()=>{
                        setSelectedNews(item);
                        setIsEditModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 px-3 py-1 text-sm"
                    >Редагувати</button>
                    <button
                      onClick={()=>{
                        setNewsToDelete(item.id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="text-red-600 hover:text-red-900 px-3 py-1 text-sm"
                    >Видалити</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модалі */}
      <CreateNewsModal
        isOpen={isCreateModalOpen}
        onClose={()=>setIsCreateModalOpen(false)}
        onSubmit={async d=>handleCreateNews(d)}
      />

      <EditNewsModal
        isOpen={isEditModalOpen}
        onClose={()=>{
          setIsEditModalOpen(false);
          setSelectedNews(null);
        }}
        onSubmit={handleEditNews}
        news={selectedNews}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={()=>setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Підтвердження видалення"
        message="Ви впевнені, що хочете видалити цю новину? Цю дію неможливо скасувати."
      />
    </div>
  );
};