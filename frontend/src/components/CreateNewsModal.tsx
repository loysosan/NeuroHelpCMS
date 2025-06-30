import React, { useState } from 'react';
import WYSIWYGEditor from './WYSIWYGEditor';

interface News {
  id?: number;
  title: string;
  content: string;
  summary: string;
  imageUrl?: string;
  isPublic: boolean;
  published: boolean;
}

interface CreateNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newsData: Omit<News, 'id'>) => Promise<void>;
}

const CreateNewsModal: React.FC<CreateNewsModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    imageUrl: '',
    isPublic: true,
    published: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Заголовок та контент є обов\'язковими полями');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Очищуємо форму після успішного створення
      setFormData({
        title: '',
        content: '',
        summary: '',
        imageUrl: '',
        isPublic: true,
        published: false
      });
      onClose();
    } catch (error) {
      console.error('Error creating news:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      content: '',
      summary: '',
      imageUrl: '',
      isPublic: true,
      published: false
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">Створити нову новину</h3>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Заголовок */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Заголовок *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Введіть заголовок новини"
            />
          </div>

          {/* Короткий опис */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Короткий опис
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Короткий опис для списку новин"
            />
          </div>

          {/* URL зображення */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL головного зображення
            </label>
            <input
              type="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Контент */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Контент *
            </label>
            <div style={{ height: '300px', marginBottom: '50px' }}>
              <WYSIWYGEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Напишіть контент новини..."
                height="250px"
              />
            </div>
          </div>

          {/* Опції публікації */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                Публічна новина (доступна всім)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
                Опублікувати одразу
              </label>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Створення...' : 'Створити новину'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNewsModal;