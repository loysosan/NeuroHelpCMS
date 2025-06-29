import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../context/UserAuthContext';

interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: 'client' | 'psychologist';
  status: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  portfolio?: Portfolio;
  skills?: Skill[];
  rating?: Rating;
}

interface Portfolio {
  id: number;
  description: string;
  experience: number;
  education: string;
  contactEmail?: string;
  contactPhone?: string;
  photos: Photo[];
}

interface Photo {
  ID: number;        // Изменено с id на ID  
  URL: string;       // Изменено с url на URL
  PortfolioID: number;
  CreatedAt: string; // Изменено с createdAt на CreatedAt
}

interface Skill {
  id: number;
  name: string;
  category: string;
}

interface Rating {
  averageRating: number;
  reviewCount: number;
}

const UserProfile: React.FC = () => {
  const { token, logout } = useUserAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  // Стани для основної інформації
  const [basicFormData, setBasicFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  // Стани для портфоліо (тільки для психологів)
  const [portfolioFormData, setPortfolioFormData] = useState({
    description: '',
    experience: 0,
    education: '',
    contactEmail: '',
    contactPhone: '',
  });

  // Стани для скілів
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);

  // Стани для фото
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Завантаження профілю
  const fetchProfile = async () => {
    console.log('fetchProfile called with token:', token); // Дебаг
    
    if (!token) {
      setError('Токен недоступний');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Making request with Authorization:', `Bearer ${token}`); // Дебаг
      
      const response = await fetch('/api/users/self', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status); // Дебаг

      if (!response.ok) {
        throw new Error('Не вдалося завантажити профіль');
      }

      const data = await response.json();
      console.log('Profile data received:', data);
      console.log('Portfolio photos:', data.portfolio?.photos); // Додайте цей рядок
      
      // Додайте цю перевірку:
      if (data.portfolio?.photos) {
        console.log('Photos found:', data.portfolio.photos.length);
        data.portfolio.photos.forEach((photo: any, index: number) => {
          console.log(`Photo ${index}:`, {
            ID: photo.ID,           // Изменено на заглавные
            URL: photo.URL,         // Изменено на заглавные
            finalUrl: getImageUrl(photo.URL),
            IDtype: typeof photo.ID
          });
        });
      } else {
        console.log('No photos in portfolio');
      }
      
      setProfile(data);
      
      // Заповнення форм існуючими даними
      setBasicFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
      });

      // Заповнення портфоліо існуючими даними
      if (data.role === 'psychologist') {
        setPortfolioFormData({
          description: data.portfolio?.description || '',
          experience: data.portfolio?.experience || 0,
          education: data.portfolio?.education || '',
          contactEmail: data.portfolio?.contactEmail || '',
          contactPhone: data.portfolio?.contactPhone || '',
        });
      }

      if (data.skills) {
        setSelectedSkills(data.skills.map((skill: Skill) => skill.id));
      }
    } catch (err: any) {
      console.error('fetchProfile error:', err); // Дебаг
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Завантаження всіх скілів (для психологів)
  const fetchAllSkills = async () => {
    if (profile?.role !== 'psychologist') return;

    try {
      const response = await fetch('/api/users/skills', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllSkills(data);
      }
    } catch (err) {
      console.error('Failed to fetch skills:', err);
    }
  };

  useEffect(() => {
    console.log('Token in useEffect:', token); // Дебаг
    if (token) {
      fetchProfile();
    } else {
      // Якщо токена немає, перенаправляємо на головну
      window.location.href = '/';
    }
  }, [token]);

  useEffect(() => {
    if (profile?.role === 'psychologist') {
      fetchAllSkills();
    }
  }, [profile]);

  // Обробка зміни основних полів
  const handleBasicInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBasicFormData(prev => ({ 
      ...prev, 
      [name]: name === 'phone' ? (value || '') : value
    }));
  };

  // Обробка зміни портфоліо
  const handlePortfolioInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPortfolioFormData(prev => ({ ...prev, [name]: name === 'experience' ? Number(value) : value }));
  };

  // Збереження основної інформації
  const handleSaveBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users/self/updateuser', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(basicFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Не вдалося оновити профіль');
      }

      setSuccess('Основну інформацію успішно оновлено!');
      fetchProfile();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Збереження портфоліо
  const handleSavePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users/self/portfolio', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(portfolioFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Не вдалося оновити портфоліо');
      }

      setSuccess('Портфоліо успішно оновлено!');
      fetchProfile();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Збереження скілів
  const handleSaveSkills = async () => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users/self/skills', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(selectedSkills),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Не вдалося оновити навички');
      }

      setSuccess('Навички успішно оновлено!');
      fetchProfile();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Обробка вибору скілів
  const handleSkillToggle = (skillId: number) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  // Завантаження фото
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;

    setIsUploadingPhoto(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('photo', photoFile);

      const response = await fetch('/api/users/portfolio/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Не вдалося завантажити фото');
      }

      setPhotoFile(null);
      setPhotoPreview(null);
      setSuccess('Фото успішно завантажено!');
      fetchProfile();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Видалення фото
  const handleDeletePhoto = async (photoId: number) => {
    console.log('handleDeletePhoto called with:', photoId, typeof photoId);
    
    setError('');
    setSuccess('');

    // Додаткова валідація
    if (!photoId || photoId === undefined || isNaN(photoId)) {
      setError('Помилка: невірний ID фото');
      console.error('Invalid photo ID:', photoId);
      return;
    }

    if (!confirm('Ви впевнені, що хочете видалити це фото?')) {
      return;
    }

    try {
      console.log('Making DELETE request to:', `/api/users/portfolio/photo/${photoId}`);

      const response = await fetch(`/api/users/portfolio/photo/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete error response:', errorData);
        throw new Error(errorData.message || 'Не вдалося видалити фото');
      }

      const responseData = await response.json();
      console.log('Delete success response:', responseData);

      setSuccess('Фото успішно видалено!');
      fetchProfile(); // Оновлюємо профіль
    } catch (err: any) {
      console.error('Delete photo error:', err);
      setError(err.message);
    }
  };

  // Додайте цю функцію валідації фото
  const isValidPhoto = (photo: any): photo is Photo => {
    return photo && 
           typeof photo === 'object' && 
           photo.ID &&           // Изменено с photo.id на photo.ID
           photo.URL &&          // Изменено с photo.url на photo.URL
           typeof photo.ID === 'number' && 
           typeof photo.URL === 'string';
  };

  // Создайте функцию для формирования относительных URL
  const getImageUrl = (photoUrl: string): string => {
    if (!photoUrl) return '';
    
    // Если URL уже полный, возвращаем как есть
    if (photoUrl.startsWith('http')) {
      return photoUrl;
    }
    
    // Используем относительные пути
    if (photoUrl.startsWith('/api/uploads/')) {
      return photoUrl; // Уже правильный путь
    }
    
    if (photoUrl.startsWith('/uploads/')) {
      return `/api${photoUrl}`; // Добавляем /api
    }
    
    // В остальных случаях формируем полный путь
    return `/api/uploads/${photoUrl}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Завантаження...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Не вдалося завантажити профіль</div>
      </div>
    );
  }

  const isPsychologist = profile.role === 'psychologist';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Мій профіль</h1>
            <div className="flex space-x-4">
              <a 
                href="/"
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Головна
              </a>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Вихід
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Messages */}
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="text-red-700">{error}</div>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
              <div className="text-green-700">{success}</div>
            </div>
          )}

          {/* Profile Summary */}
          <div className="bg-white shadow rounded-lg mb-6 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Profile Photo - исправление аватарки */}
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                  {profile.portfolio?.photos && 
                   profile.portfolio.photos.length > 0 && 
                   isValidPhoto(profile.portfolio.photos[0]) ? (
                    <img 
                      src={getImageUrl(profile.portfolio.photos[0].URL)} // Изменено на .URL
                      alt="Профіль" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Failed to load avatar:', profile.portfolio.photos[0].URL);
                        console.error('Attempted URL:', getImageUrl(profile.portfolio.photos[0].URL));
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('svg')) {
                          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                          svg.setAttribute('class', 'w-8 h-8 text-gray-500');
                          svg.setAttribute('fill', 'none');
                          svg.setAttribute('stroke', 'currentColor');
                          svg.setAttribute('viewBox', '0 0 24 24');
                          
                          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                          path.setAttribute('stroke-linecap', 'round');
                          path.setAttribute('stroke-linejoin', 'round');
                          path.setAttribute('stroke-width', '2');
                          path.setAttribute('d', 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z');
                          
                          svg.appendChild(path);
                          parent.appendChild(svg);
                        }
                      }}
                      onLoad={() => {
                        console.log('Avatar loaded successfully:', getImageUrl(profile.portfolio.photos[0].URL));
                      }}
                    />
                  ) : (
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <p className="text-gray-600 capitalize">
                    {profile.role === 'psychologist' ? 'Психолог' : 'Клієнт'}
                  </p>
                  {isPsychologist && profile.rating && (
                    <div className="flex items-center mt-1">
                      <span className="text-yellow-400">⭐</span>
                      <span className="ml-1 text-sm text-gray-600">
                        {profile.rating.averageRating.toFixed(1)} ({profile.rating.reviewCount} відгуків)
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Статус: {profile.status}</p>
                <p className="text-sm text-gray-500">
                  Підтверджено: {profile.verified ? '✅' : '❌'}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'basic'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Основна інформація
                </button>
                {isPsychologist && (
                  <>
                    <button
                      onClick={() => setActiveTab('portfolio')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'portfolio'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Портфоліо
                    </button>
                    <button
                      onClick={() => setActiveTab('skills')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'skills'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Навички
                    </button>
                    <button
                      onClick={() => setActiveTab('photos')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'photos'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Фотографії
                    </button>
                  </>
                )}
              </nav>
            </div>

            <div className="p-6">
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <form onSubmit={handleSaveBasicInfo} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Електронна пошта (тільки для читання)
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ім'я
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={basicFormData.firstName}
                        onChange={handleBasicInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Прізвище
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={basicFormData.lastName}
                        onChange={handleBasicInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Номер телефону
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={basicFormData.phone || ''}
                      onChange={handleBasicInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Зберегти основну інформацію
                  </button>
                </form>
              )}

              {/* Portfolio Tab (только для психологів) */}
              {activeTab === 'portfolio' && isPsychologist && (
                <form onSubmit={handleSavePortfolio} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Професійний опис
                    </label>
                    <textarea
                      name="description"
                      value={portfolioFormData.description}
                      onChange={handlePortfolioInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Опишіть свій професійний досвід та підхід..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Роки досвіду
                    </label>
                    <input
                      type="number"
                      name="experience"
                      value={portfolioFormData.experience}
                      onChange={handlePortfolioInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Освіта
                    </label>
                    <textarea
                      name="education"
                      value={portfolioFormData.education}
                      onChange={handlePortfolioInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Перелічіть вашу освіту, сертифікати та кваліфікації..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Публічна електронна пошта
                      </label>
                      <input
                        type="email"
                        name="contactEmail"
                        value={portfolioFormData.contactEmail}
                        onChange={handlePortfolioInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Електронна пошта для зв'язку з клієнтами"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Публічний телефон
                      </label>
                      <input
                        type="tel"
                        name="contactPhone"
                        value={portfolioFormData.contactPhone}
                        onChange={handlePortfolioInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Номер телефону для зв'язку з клієнтами"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Зберегти портфоліо
                  </button>
                </form>
              )}

              {/* Skills Tab (только для психологів) */}
              {activeTab === 'skills' && isPsychologist && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Оберіть ваші навички</h3>
                    <button
                      onClick={handleSaveSkills}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Зберегти навички
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allSkills.map((skill) => (
                      <label key={skill.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSkills.includes(skill.id)}
                          onChange={() => handleSkillToggle(skill.id)}
                          className="form-checkbox h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm">{skill.name}</span>
                        <span className="text-xs text-gray-500">({skill.category})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos Tab - исправление полей */}
              {activeTab === 'photos' && isPsychologist && (
                <div className="space-y-6">
                  {/* Upload new photo остается без изменений */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Завантажити нове фото</h3>
                    <div className="flex items-center space-x-4">
                      {photoPreview && (
                        <div className="w-32 h-32 bg-gray-300 rounded-lg overflow-hidden">
                          <img src={photoPreview} alt="Попередній перегляд" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label
                          htmlFor="photo-upload"
                          className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 mr-2"
                        >
                          Обрати фото
                        </label>
                        {photoFile && (
                          <button
                            onClick={handlePhotoUpload}
                            disabled={isUploadingPhoto}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {isUploadingPhoto ? 'Завантаження...' : 'Завантажити'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Existing photos */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Фотографії портфоліо</h3>
                    {profile.portfolio?.photos && profile.portfolio.photos.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {profile.portfolio.photos
                          .filter(isValidPhoto)
                          .map((photo, index) => {
                            console.log('Rendering photo:', photo);
                            console.log('Image URL will be:', getImageUrl(photo.URL)); // Изменено на .URL
                            
                            return (
                              <div key={photo.ID} className="relative"> {/* Изменено на photo.ID */}
                                <img
                                  src={getImageUrl(photo.URL)} // Изменено на .URL
                                  alt={`Портфоліо ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                                  onError={(e) => {
                                    console.error('Failed to load image:', photo.URL);
                                    console.error('Attempted URL:', getImageUrl(photo.URL));
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50" y="50" font-family="Arial, sans-serif" font-size="12" fill="%236b7280" text-anchor="middle" dy=".3em"%3EНе вдалося завантажити%3C/text%3E%3C/svg%3E';
                                    target.className = "w-full h-32 object-cover rounded-lg border border-red-200";
                                  }}
                                  onLoad={() => {
                                    console.log('Image loaded successfully:', getImageUrl(photo.URL));
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    console.log('Attempting to delete photo:', photo);
                                    if (photo.ID && typeof photo.ID === 'number') { // Изменено на photo.ID
                                      handleDeletePhoto(photo.ID); // Изменено на photo.ID
                                    } else {
                                      console.error('Invalid photo ID:', photo.ID);
                                      setError('Помилка: некоректний ID фото');
                                    }
                                  }}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-md transition-colors"
                                  title={`Видалити фото (ID: ${photo.ID})`} // Изменено на photo.ID
                                >
                                  ×
                                </button>
                                {/* Отладочная информация */}
                                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                  ID: {photo.ID} {/* Изменено на photo.ID */}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 mt-2">Фотографії ще не завантажено.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;