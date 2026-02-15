import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import BottomNavigation from '../../components/user/BottomNavigation';
import { User, Camera, Plus, X, Save, Edit3, MapPin, Globe, Trash2, BookOpen, Award, Baby } from 'lucide-react';

type Photo = {
  ID: number;
  URL: string;
};

type Language = {
  ID: number;
  Name: string;
  Proficiency: string;
};

type Education = {
  ID: number;
  Title: string;
  Institution: string;
  IssueDate: string;
  DocumentURL?: string;
};

type SkillItem = {
  id: number;
  name: string;
  category: string;
};

type ChildData = {
  id?: number;
  age: number;
  gender: string;
  problem: string;
};

type UserProfile = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  verified: boolean;
  skills?: SkillItem[];
  child?: ChildData;
  portfolio?: {
    id: number;
    description?: string;
    experience?: number;
    contactEmail?: string;
    contactPhone?: string;
    city?: string;
    address?: string;
    dateOfBirth?: string;
    gender?: string;
    telegram?: string;
    facebookURL?: string;
    instagramURL?: string;
    videoURL?: string;
    rate?: number;
    clientAgeMin?: number;
    clientAgeMax?: number;
    photos?: Photo[];
    educations?: Education[];
  };
};

const ProfilePage: React.FC = () => {
  const { user: authUser, logout, isLoading } = useUserAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);

  // Form states
  const [personalForm, setPersonalForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const [portfolioForm, setPortfolioForm] = useState({
    description: '',
    experience: 0,
    contactEmail: '',
    contactPhone: '',
    city: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    telegram: '',
    facebookURL: '',
    instagramURL: '',
    videoURL: '',
    rate: 0,
    clientAgeMin: 0,
    clientAgeMax: 0,
  });

  const [newLanguage, setNewLanguage] = useState({
    name: 'UA',
    proficiency: 'native',
  });

  const [newEducation, setNewEducation] = useState({
    title: '',
    institution: '',
    issueDate: '',
  });

  // Skills state
  const [allSkills, setAllSkills] = useState<{ id: number; name: string; category: string }[]>([]);
  const [userSkillIds, setUserSkillIds] = useState<number[]>([]);

  // Child state (for clients)
  const [childForm, setChildForm] = useState({
    age: 0,
    gender: 'notspecified',
    problem: '',
  });
  const [hasChild, setHasChild] = useState(false);

  const getToken = () => localStorage.getItem('userToken');

  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    const isFormData = options.body instanceof FormData;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });

    return response;
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/users/self');
      if (response.ok) {
        const data = await response.json();
        setUser(data);

        // Initialize forms
        setPersonalForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
        });

        if (data.portfolio) {
          setPortfolioForm({
            description: data.portfolio.description || '',
            experience: data.portfolio.experience || 0,
            contactEmail: data.portfolio.contactEmail || '',
            contactPhone: data.portfolio.contactPhone || '',
            city: data.portfolio.city || '',
            address: data.portfolio.address || '',
            dateOfBirth: data.portfolio.dateOfBirth ? data.portfolio.dateOfBirth.split('T')[0] : '',
            gender: data.portfolio.gender || '',
            telegram: data.portfolio.telegram || '',
            facebookURL: data.portfolio.facebookURL || '',
            instagramURL: data.portfolio.instagramURL || '',
            videoURL: data.portfolio.videoURL || '',
            rate: data.portfolio.rate || 0,
            clientAgeMin: data.portfolio.clientAgeMin || 0,
            clientAgeMax: data.portfolio.clientAgeMax || 0,
          });
        }

        // Initialize child form for clients
        if (data.role === 'client') {
          if (data.child) {
            setHasChild(true);
            setChildForm({
              age: data.child.age || 0,
              gender: data.child.gender || 'notspecified',
              problem: data.child.problem || '',
            });
          } else {
            setHasChild(false);
          }
        }

        // Initialize user skills
        if (data.skills && Array.isArray(data.skills)) {
          setUserSkillIds(data.skills.map((s: SkillItem) => s.id));
        }

        // Load languages for psychologists
        if (data.role === 'psychologist') {
          const langResponse = await authenticatedFetch(`/api/users/${data.id}/portfolio/languages`);
          if (langResponse.ok) {
            const langData = await langResponse.json();
            if (langData.success) {
              setLanguages(langData.data || []);
            }
          }

          // Load all available skills (API returns flat array [{id, name, category}, ...])
          const skillsResponse = await authenticatedFetch('/api/users/skills');
          if (skillsResponse.ok) {
            const skillsData = await skillsResponse.json();
            if (Array.isArray(skillsData)) {
              setAllSkills(skillsData);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authUser) {
      loadProfile();
    }
  }, [authUser]);

  const handlePersonalInfoSave = async () => {
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/users/self/updateuser', {
        method: 'PUT',
        body: JSON.stringify(personalForm),
      });

      if (response.ok) {
        await loadProfile();
        setEditingSection(null);
      }
    } catch (error) {
      console.error('Error updating personal info:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePortfolioSave = async () => {
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/users/self/portfolio', {
        method: 'PUT',
        body: JSON.stringify(portfolioForm),
      });

      if (response.ok) {
        await loadProfile();
        setEditingSection(null);
      }
    } catch (error) {
      console.error('Error updating portfolio:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/users/portfolio/photo', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await loadProfile();
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    setSaving(true);
    try {
      const response = await authenticatedFetch(`/api/users/portfolio/photo/${photoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadProfile();
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLanguage = async () => {
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/users/portfolio/language', {
        method: 'POST',
        body: JSON.stringify({
          name: newLanguage.name,
          proficiency: newLanguage.proficiency,
        }),
      });

      if (response.ok) {
        await loadProfile();
        setNewLanguage({ name: 'UA', proficiency: 'native' });
      }
    } catch (error) {
      console.error('Error adding language:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLanguage = async (languageId: number) => {
    setSaving(true);
    try {
      const response = await authenticatedFetch(`/api/users/portfolio/language/${languageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadProfile();
      }
    } catch (error) {
      console.error('Error deleting language:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddEducation = async () => {
    if (!newEducation.title || !newEducation.institution || !newEducation.issueDate) return;
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/users/portfolio/education', {
        method: 'POST',
        body: JSON.stringify(newEducation),
      });

      if (response.ok) {
        await loadProfile();
        setNewEducation({ title: '', institution: '', issueDate: '' });
      }
    } catch (error) {
      console.error('Error adding education:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEducation = async (educationId: number) => {
    setSaving(true);
    try {
      const response = await authenticatedFetch(`/api/users/portfolio/education/${educationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadProfile();
      }
    } catch (error) {
      console.error('Error deleting education:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSkillsSave = async () => {
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/users/self/skills', {
        method: 'PUT',
        body: JSON.stringify(userSkillIds),
      });

      if (response.ok) {
        await loadProfile();
        setEditingSection(null);
      }
    } catch (error) {
      console.error('Error saving skills:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChildSave = async () => {
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/users/self/child', {
        method: 'PUT',
        body: JSON.stringify(childForm),
      });

      if (response.ok) {
        await loadProfile();
        setEditingSection(null);
      }
    } catch (error) {
      console.error('Error saving child data:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skillId: number) => {
    setUserSkillIds(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const getPhotoUrl = (url: string): string => {
    if (url.startsWith('/uploads')) return `/api${url}`;
    if (url.startsWith('/api/uploads') || url.startsWith('http')) return url;
    return url;
  };

  const getLanguageName = (code: string): string => {
    const languageMap: { [key: string]: string } = {
      'EN': 'Англійська',
      'UA': 'Українська',
      'RU': 'Російська',
      'PL': 'Польська',
      'KZ': 'Казахська',
    };
    return languageMap[code] || code;
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!authUser || !user) {
    return <Navigate to="/" replace />;
  }

  const isClient = user.role === 'client';
  const isPsychologist = user.role === 'psychologist';

  // Group skills by category
  const skillsByCategory: Record<string, { id: number; name: string }[]> = {};
  for (const s of allSkills) {
    if (!skillsByCategory[s.category]) skillsByCategory[s.category] = [];
    skillsByCategory[s.category].push({ id: s.id, name: s.name });
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 pb-24 md:pb-0">
      <Header />

      <main className="flex-1 px-4 pt-8 pb-16 max-w-6xl mx-auto w-full">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Мій профіль</h1>
                <p className="text-gray-600 mt-2">Керування обліковим записом та налаштуваннями</p>
              </div>
              <button
                onClick={logout}
                className="px-6 py-3 text-sm text-red-600 hover:text-red-500 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                Вийти з системи
              </button>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Особиста інформація</h2>
              </div>
              {editingSection !== 'personal' && (
                <button
                  onClick={() => setEditingSection('personal')}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Редагувати
                </button>
              )}
            </div>

            {editingSection === 'personal' ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ім'я</label>
                    <input
                      value={personalForm.firstName}
                      onChange={(e) => setPersonalForm({ ...personalForm, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Прізвище</label>
                    <input
                      type="text"
                      value={personalForm.lastName}
                      onChange={(e) => setPersonalForm({ ...personalForm, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
                    <input
                      type="tel"
                      value={personalForm.phone}
                      onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+380..."
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handlePersonalInfoSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Збереження...' : 'Зберегти'}
                  </button>
                  <button
                    onClick={() => setEditingSection(null)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ім'я</label>
                  <p className="text-gray-900 font-medium">{user.firstName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Прізвище</label>
                  <p className="text-gray-900 font-medium">{user.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900 font-medium">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  <p className="text-gray-900 font-medium">{user.phone || 'Не вказано'}</p>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
                  <p className="text-gray-900 font-medium">
                    {user.role === 'client' ? 'Клієнт' : 'Спеціаліст-психолог'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Статус верифікації</label>
                  <p className={`font-medium ${user.verified ? 'text-green-600' : 'text-orange-600'}`}>
                    {user.verified ? 'Підтверджено' : 'Очікує підтвердження'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Section - Only for Psychologists */}
          {isPsychologist && (
            <>
              {/* Portfolio Info */}
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold">Портфоліо</h2>
                  </div>
                  {editingSection !== 'portfolio' && (
                    <button
                      onClick={() => setEditingSection('portfolio')}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Редагувати
                    </button>
                  )}
                </div>

                {editingSection === 'portfolio' ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Опис діяльності</label>
                      <textarea
                        value={portfolioForm.description}
                        onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Розкажіть про свій досвід та підходи до роботи..."
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Досвід роботи (роки)</label>
                        <input
                          type="number"
                          min="0"
                          value={portfolioForm.experience}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, experience: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ставка за годину (грн)</label>
                        <input
                          type="number"
                          min="0"
                          value={portfolioForm.rate}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, rate: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Мін. вік клієнта</label>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={portfolioForm.clientAgeMin}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, clientAgeMin: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Макс. вік клієнта</label>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={portfolioForm.clientAgeMax}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, clientAgeMax: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email для зв'язку</label>
                        <input
                          type="email"
                          value={portfolioForm.contactEmail}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, contactEmail: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Телефон для зв'язку</label>
                        <input
                          type="tel"
                          value={portfolioForm.contactPhone}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, contactPhone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Місто</label>
                        <input
                          type="text"
                          value={portfolioForm.city}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, city: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Київ"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Адреса</label>
                        <input
                          type="text"
                          value={portfolioForm.address}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, address: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Дата народження</label>
                        <input
                          type="date"
                          value={portfolioForm.dateOfBirth}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, dateOfBirth: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Стать</label>
                        <select
                          value={portfolioForm.gender}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, gender: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Не вказано</option>
                          <option value="male">Чоловік</option>
                          <option value="female">Жінка</option>
                          <option value="notselected">Не вказую</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Telegram</label>
                        <input
                          type="text"
                          value={portfolioForm.telegram}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, telegram: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="@username"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Facebook URL</label>
                        <input
                          type="url"
                          value={portfolioForm.facebookURL}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, facebookURL: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL</label>
                        <input
                          type="url"
                          value={portfolioForm.instagramURL}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, instagramURL: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">YouTube відео URL</label>
                        <input
                          type="url"
                          value={portfolioForm.videoURL}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, videoURL: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handlePortfolioSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Збереження...' : 'Зберегти'}
                      </button>
                      <button
                        onClick={() => setEditingSection(null)}
                        className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Скасувати
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {user.portfolio?.description && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Опис діяльності</label>
                        <p className="text-gray-900 leading-relaxed">{user.portfolio.description}</p>
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Досвід</label>
                        <p className="text-gray-900 font-medium">
                          {user.portfolio?.experience ? `${user.portfolio.experience} років` : 'Не вказано'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ставка</label>
                        <p className="text-gray-900 font-medium">
                          {user.portfolio?.rate ? `${user.portfolio.rate} грн/год` : 'Не вказано'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Місто</label>
                        <p className="text-gray-900 font-medium">{user.portfolio?.city || 'Не вказано'}</p>
                      </div>
                      {(user.portfolio?.clientAgeMin || user.portfolio?.clientAgeMax) ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Вік клієнтів</label>
                          <p className="text-gray-900 font-medium">
                            {user.portfolio.clientAgeMin || 0} — {user.portfolio.clientAgeMax || '...'} років
                          </p>
                        </div>
                      ) : null}
                      {user.portfolio?.videoURL && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Відео</label>
                          <a href={user.portfolio.videoURL} target="_blank" rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm">
                            Переглянути відео
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold">Навички</h2>
                  </div>
                  {editingSection !== 'skills' && (
                    <button
                      onClick={() => setEditingSection('skills')}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Редагувати
                    </button>
                  )}
                </div>

                {editingSection === 'skills' ? (
                  <div className="space-y-6">
                    {Object.entries(skillsByCategory).map(([category, skills]) => (
                      <div key={category}>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
                        <div className="flex flex-wrap gap-2">
                          {skills.map(skill => {
                            const active = userSkillIds.includes(skill.id);
                            return (
                              <button
                                key={skill.id}
                                type="button"
                                onClick={() => toggleSkill(skill.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                                  active
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {skill.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {allSkills.length === 0 && (
                      <p className="text-sm text-gray-500">Навички ще не додано адміністратором.</p>
                    )}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSkillsSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Збереження...' : 'Зберегти'}
                      </button>
                      <button
                        onClick={() => {
                          // Reset to original
                          if (user?.skills) setUserSkillIds(user.skills.map(s => s.id));
                          setEditingSection(null);
                        }}
                        className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Скасувати
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {user.skills && user.skills.length > 0 ? (
                      user.skills.map(skill => (
                        <span key={skill.id} className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                          {skill.name}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Навички не вказані</p>
                    )}
                  </div>
                )}
              </div>

              {/* Education */}
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold">Освіта</h2>
                  </div>
                </div>

                <div className="space-y-4">
                  {user.portfolio?.educations && user.portfolio.educations.length > 0 ? (
                    user.portfolio.educations.map(edu => (
                      <div key={edu.ID} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border">
                        <div>
                          <p className="font-medium text-gray-900">{edu.Title}</p>
                          <p className="text-sm text-gray-600">{edu.Institution}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(edu.IssueDate).toLocaleDateString('uk-UA')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteEducation(edu.ID)}
                          disabled={saving}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Освіта не вказана</p>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Додати освіту</h4>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Назва (напр. Магістр психології)"
                          value={newEducation.title}
                          onChange={(e) => setNewEducation({ ...newEducation, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Навчальний заклад"
                          value={newEducation.institution}
                          onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={newEducation.issueDate}
                          onChange={(e) => setNewEducation({ ...newEducation, issueDate: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={handleAddEducation}
                          disabled={saving || !newEducation.title || !newEducation.institution || !newEducation.issueDate}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Camera className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold">Фотографії</h2>
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                    <Plus className="w-4 h-4" />
                    Додати фото
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {user.portfolio?.photos?.map((photo) => (
                    <div key={photo.ID} className="relative group">
                      <img
                        src={getPhotoUrl(photo.URL)}
                        alt="Portfolio"
                        className="w-full h-40 object-cover rounded-lg shadow-sm"
                      />
                      <button
                        onClick={() => handleDeletePhoto(photo.ID)}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {(!user.portfolio?.photos || user.portfolio.photos.length === 0) && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Поки що немає фотографій</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Languages */}
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Globe className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold">Мови спілкування</h2>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang) => (
                      <div key={lang.ID} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-800 rounded-full">
                        <span className="font-medium">{getLanguageName(lang.Name)}</span>
                        <button
                          onClick={() => handleDeleteLanguage(lang.ID)}
                          className="p-1 hover:bg-blue-200 rounded-full transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Додати мову</label>
                      <select
                        value={newLanguage.name}
                        onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="UA">Українська</option>
                        <option value="EN">Англійська</option>
                        <option value="RU">Російська</option>
                        <option value="PL">Польська</option>
                        <option value="KZ">Казахська</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Рівень</label>
                      <select
                        value={newLanguage.proficiency}
                        onChange={(e) => setNewLanguage({ ...newLanguage, proficiency: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="native">Рідна</option>
                        <option value="fluent">Вільне володіння</option>
                        <option value="intermediate">Середній рівень</option>
                        <option value="basic">Початковий рівень</option>
                      </select>
                    </div>
                    <button
                      onClick={handleAddLanguage}
                      disabled={saving}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Client-specific: Child section */}
          {isClient && (
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Baby className="w-6 h-6 text-violet-600" />
                  <h2 className="text-xl font-semibold">Інформація про дитину</h2>
                </div>
                {editingSection !== 'child' && (
                  <button
                    onClick={() => setEditingSection('child')}
                    className="flex items-center gap-2 px-4 py-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Редагувати
                  </button>
                )}
              </div>

              {editingSection === 'child' ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Вік дитини</label>
                      <input
                        type="number"
                        min="0"
                        max="18"
                        value={childForm.age}
                        onChange={(e) => setChildForm({ ...childForm, age: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Стать дитини</label>
                      <select
                        value={childForm.gender}
                        onChange={(e) => setChildForm({ ...childForm, gender: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      >
                        <option value="notspecified">Не вказано</option>
                        <option value="male">Хлопчик</option>
                        <option value="female">Дівчинка</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Опис проблеми</label>
                    <textarea
                      value={childForm.problem}
                      onChange={(e) => setChildForm({ ...childForm, problem: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="Коротко опишіть, з якими труднощами стикається ваша дитина..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleChildSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Збереження...' : 'Зберегти'}
                    </button>
                    <button
                      onClick={() => setEditingSection(null)}
                      className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Скасувати
                    </button>
                  </div>
                </div>
              ) : (
                hasChild && user.child ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Вік</label>
                      <p className="text-gray-900 font-medium">{user.child.age} років</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Стать</label>
                      <p className="text-gray-900 font-medium">
                        {user.child.gender === 'male' ? 'Хлопчик' :
                         user.child.gender === 'female' ? 'Дівчинка' : 'Не вказано'}
                      </p>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Проблема</label>
                      <p className="text-gray-900">{user.child.problem || 'Не вказано'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Інформація про дитину не вказана. Натисніть "Редагувати", щоб додати.
                  </p>
                )
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
