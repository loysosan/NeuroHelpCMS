import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Image } from 'lucide-react';
import { UserProfile } from './types';
import { useToast } from '../ui/Toast';

type Props = {
  user: UserProfile;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onReload: () => void;
};

const getPhotoUrl = (url: string): string => {
  if (url.startsWith('/uploads')) return `/api${url}`;
  if (url.startsWith('/api/uploads') || url.startsWith('http')) return url;
  return url;
};

const PhotosSection: React.FC<Props> = ({ user, authenticatedFetch, onReload }) => {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const photos = user.portfolio?.photos || [];

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Підтримуються тільки зображення', 'warning');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Максимальний розмір — 5 МБ', 'warning');
      return;
    }

    setPreview(URL.createObjectURL(file));
    setSaving(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await authenticatedFetch('/api/users/portfolio/photo', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        showToast('Фото завантажено');
        onReload();
      } else {
        showToast('Помилка завантаження', 'error');
      }
    } catch {
      showToast('Помилка завантаження', 'error');
    } finally {
      setSaving(false);
      setPreview(null);
    }
  };

  const handleDelete = async (photoId: number) => {
    setSaving(true);
    try {
      const response = await authenticatedFetch(`/api/users/portfolio/photo/${photoId}`, { method: 'DELETE' });
      if (response.ok) {
        showToast('Фото видалено');
        onReload();
      } else {
        showToast('Помилка видалення', 'error');
      }
    } catch {
      showToast('Помилка видалення', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Camera className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Фотографії</h2>
          {photos.length > 0 && <span className="text-xs text-gray-400">{photos.length}</span>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {photos.map(photo => (
          <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-[4/3]">
            <img src={getPhotoUrl(photo.url)} alt="Portfolio"
              className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <button onClick={() => handleDelete(photo.id)}
              className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-red-50">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Preview of uploading photo */}
        {preview && (
          <div className="relative rounded-xl overflow-hidden aspect-[4/3] animate-pulse">
            <img src={preview} alt="Uploading" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}

        {/* Dropzone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed aspect-[4/3] cursor-pointer transition-all ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          }`}
        >
          <Upload className={`w-8 h-8 mb-2 ${dragOver ? 'text-blue-500' : 'text-gray-300'}`} />
          <span className="text-xs text-gray-400 text-center px-2">
            {dragOver ? 'Відпустіть файл' : 'Перетягніть або натисніть'}
          </span>
          <span className="text-xs text-gray-300 mt-1">до 5 МБ</span>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ''; }} />
        </div>
      </div>

      {photos.length === 0 && !preview && (
        <div className="text-center py-6">
          <Image className="w-10 h-10 mx-auto mb-2 text-gray-200" />
          <p className="text-sm text-gray-400">Додайте фотографії для вашого профілю</p>
        </div>
      )}
    </div>
  );
};

export default PhotosSection;
