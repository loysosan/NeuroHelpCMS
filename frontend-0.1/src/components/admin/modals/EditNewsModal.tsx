import React, { useEffect, useState } from 'react';
import WYSIWYGEditor from '../WYSIWYGEditor';

interface News {
  id: number;
  title: string;
  content: string;
  summary: string;
  imageUrl: string;
  isPublic: boolean;
  published: boolean;
  showOnHome: boolean;
  authorName: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<News>) => Promise<void>;
  news: News | null;
}

export const EditNewsModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, news }) => {
  const [isSubmitting,setIsSubmitting]=useState(false);
  const [formData,setFormData]=useState({
    title:'', content:'', summary:'', imageUrl:'', isPublic:true, published:false, showOnHome:false
  });

  useEffect(()=>{
    if(news){
      setFormData({
        title: news.title,
        content: news.content,
        summary: news.summary,
        imageUrl: news.imageUrl,
        isPublic: news.isPublic,
        published: news.published,
        showOnHome: news.showOnHome || false
      });
    }
  },[news]);

  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!news) return;
    if(!formData.title.trim() || !formData.content.trim()){
      alert('Заголовок та контент обовʼязкові');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if(!isOpen || !news) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold">Редагувати новину</h3>
            <p className="text-sm text-gray-500 mt-1">
              Автор: {news.authorName} | Створено: {new Date(news.createdAt).toLocaleString('uk-UA')} | Переглядів: {news.views}
            </p>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Заголовок *</label>
            <input
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.title}
              onChange={e=>setFormData(f=>({...f,title:e.target.value}))}
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Summary</label>
            <textarea
              className="w-full px-3 py-2 border rounded resize-none h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.summary}
              onChange={e=>setFormData(f=>({...f,summary:e.target.value}))}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">URL зображення</label>
            <input
              type="url"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.imageUrl}
              onChange={e=>setFormData(f=>({...f,imageUrl:e.target.value}))}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Контент *</label>
            <WYSIWYGEditor
              value={formData.content}
              onChange={content=>setFormData(f=>({...f,content}))}
              placeholder="Оновіть контент..."
              height="300px"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <input type="checkbox" id="isPublic" className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                     checked={formData.isPublic}
                     onChange={e=>setFormData(f=>({...f,isPublic:e.target.checked}))}
                     disabled={isSubmitting}/>
              <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">Публічна</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="published" className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                     checked={formData.published}
                     onChange={e=>setFormData(f=>({...f,published:e.target.checked}))}
                     disabled={isSubmitting}/>
              <label htmlFor="published" className="ml-2 text-sm text-gray-700">Опублікована</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="showOnHome" className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                     checked={formData.showOnHome}
                     onChange={e=>setFormData(f=>({...f,showOnHome:e.target.checked}))}
                     disabled={isSubmitting}/>
              <label htmlFor="showOnHome" className="ml-2 text-sm text-gray-700">На головну</label>
            </div>
          </div>
          {formData.showOnHome && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded text-sm text-blue-700">
              Максимум 4 новини на головній.
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">Скасувати</button>
            <button type="submit" disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">
              {isSubmitting ? 'Збереження...' : 'Зберегти зміни'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};