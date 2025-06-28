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
  photos: Photo[];
}

interface Photo {
  id: number;
  url: string;
  createdAt: string;
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
      setError('No token available');
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
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
      
      // Заповнення форм
      setBasicFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
      });

      if (data.role === 'psychologist' && data.portfolio) {
        setPortfolioFormData({
          description: data.portfolio.description || '',
          experience: data.portfolio.experience || 0,
          education: data.portfolio.education || '',
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
        throw new Error(errorData.message || 'Failed to update profile');
      }

      setSuccess('Basic information updated successfully!');
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
        throw new Error(errorData.message || 'Failed to update portfolio');
      }

      setSuccess('Portfolio updated successfully!');
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
        throw new Error(errorData.message || 'Failed to update skills');
      }

      setSuccess('Skills updated successfully!');
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
        throw new Error(errorData.message || 'Failed to upload photo');
      }

      setPhotoFile(null);
      setPhotoPreview(null);
      setSuccess('Photo uploaded successfully!');
      fetchProfile();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Видалення фото
  const handleDeletePhoto = async (photoId: number) => {
    setError('');
    setSuccess('');

    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/portfolio/photo/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete photo');
      }

      setSuccess('Photo deleted successfully!');
      fetchProfile();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Failed to load profile</div>
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
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <div className="flex space-x-4">
              <a 
                href="/"
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Home
              </a>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
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
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                  {profile.portfolio?.photos?.[0] ? (
                    <img src={profile.portfolio.photos[0].url} alt="Profile" className="w-full h-full object-cover" />
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
                  <p className="text-gray-600 capitalize">{profile.role}</p>
                  {isPsychologist && profile.rating && (
                    <div className="flex items-center mt-1">
                      <span className="text-yellow-400">⭐</span>
                      <span className="ml-1 text-sm text-gray-600">
                        {profile.rating.averageRating.toFixed(1)} ({profile.rating.reviewCount} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Status: {profile.status}</p>
                <p className="text-sm text-gray-500">
                  Verified: {profile.verified ? '✅' : '❌'}
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
                  Basic Information
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
                      Portfolio
                    </button>
                    <button
                      onClick={() => setActiveTab('skills')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'skills'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Skills
                    </button>
                    <button
                      onClick={() => setActiveTab('photos')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'photos'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Photos
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
                      Email (read-only)
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
                        First Name
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
                        Last Name
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
                      Phone Number
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
                    Save Basic Information
                  </button>
                </form>
              )}

              {/* Portfolio Tab (только для психологов) */}
              {activeTab === 'portfolio' && isPsychologist && (
                <form onSubmit={handleSavePortfolio} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Professional Description
                    </label>
                    <textarea
                      name="description"
                      value={portfolioFormData.description}
                      onChange={handlePortfolioInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your professional background and approach..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years of Experience
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
                      Education
                    </label>
                    <textarea
                      name="education"
                      value={portfolioFormData.education}
                      onChange={handlePortfolioInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="List your education, certifications, and qualifications..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save Portfolio
                  </button>
                </form>
              )}

              {/* Skills Tab (только для психологов) */}
              {activeTab === 'skills' && isPsychologist && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Select Your Skills</h3>
                    <button
                      onClick={handleSaveSkills}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save Skills
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

              {/* Photos Tab (только для психологов) */}
              {activeTab === 'photos' && isPsychologist && (
                <div className="space-y-6">
                  {/* Upload new photo */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Upload New Photo</h3>
                    <div className="flex items-center space-x-4">
                      {photoPreview && (
                        <div className="w-32 h-32 bg-gray-300 rounded-lg overflow-hidden">
                          <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
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
                          Choose Photo
                        </label>
                        {photoFile && (
                          <button
                            onClick={handlePhotoUpload}
                            disabled={isUploadingPhoto}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {isUploadingPhoto ? 'Uploading...' : 'Upload'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Existing photos */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Portfolio Photos</h3>
                    {profile.portfolio?.photos && profile.portfolio.photos.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {profile.portfolio.photos.map((photo) => (
                          <div key={photo.id} className="relative">
                            <img
                              src={photo.url}
                              alt="Portfolio"
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No photos uploaded yet.</p>
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