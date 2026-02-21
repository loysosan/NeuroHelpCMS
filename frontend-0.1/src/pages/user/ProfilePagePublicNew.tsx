import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star, MapPin, Phone, Mail, Calendar, Heart, MessageCircle,
  Clock, Award, CheckCircle, Video, Globe, GraduationCap,
  Camera, ChevronLeft, Share2, Briefcase, Target
} from 'lucide-react';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import BottomNavigation from '../../components/user/BottomNavigation';
import { useUserAuth } from '../../context/UserAuthContext';
import { startConversation } from '../../api/user/chat';

import '../../styles/design-system.css';
import '../../styles/utility-classes.css';

// Types (camelCase for API compatibility)
type Photo = {
  id?: number;
  url?: string;
};

type Language = {
  id?: number;
  name?: string;
  proficiency?: string;
};

type Education = {
  ID?: number;
  Title?: string;
  Institution?: string;
  IssueDate?: string;
};

type Portfolio = {
  ID?: number;
  Description?: string | null;
  Experience?: string | null;
  Education?: string | null;
  YearsOfExperience?: number | null;
  Photos?: Photo[] | null;
  ContactPhone?: string | null;
  Telegram?: string | null;
  Rate?: number | null;
  Languages?: Language[] | null;
  Educations?: Education[] | null;
  City?: string | null;
  Address?: string | null;
  VideoURL?: string | null;
};

type Skill = {
  ID: number;
  Name: string;
  CategoryID?: number;
  Category?: {
    ID: number;
    Name: string;
  };
};

type City = {
  ID: number;
  Name: string;
};

type PublicUser = {
  ID: number;
  FirstName?: string | null;
  LastName?: string | null;
  Email?: string | null;
  Phone?: string | null;
  CityID?: number | null;
  City?: City | null;
  Role?: string | null;
  ShortDescription?: string | null;
  FullDescription?: string | null;
  Skills?: (string | Skill)[] | null;
  Rating?: number | null;
  ReviewsCount?: number | null;
  Portfolio?: Portfolio | null;
  AvatarURL?: string | null;
};

const getEmbedUrl = (url: string): string | null => {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
};

// Utility functions
const getImageUrl = (url: string): string => {
  if (!url) return '/placeholder-image.jpg';
  if (url.startsWith('/uploads')) return `/api${url}`;
  if (url.startsWith('/api/uploads') || url.startsWith('http')) return url;
  return '/placeholder-image.jpg';
};

const isValidPhoto = (photo: any) => {
  return photo && photo.url && typeof photo.url === 'string' && photo.url.trim() !== '';
};

const getInitials = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
};

const AvatarPlaceholder: React.FC<{ name?: string; className?: string }> = ({ name, className }) => (
  <div className={`w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center ${className ?? ''}`}>
    <span className="text-white font-bold select-none" style={{ fontSize: 'clamp(1rem, 5cqi, 2.5rem)' }}>
      {getInitials(name)}
    </span>
  </div>
);

const ImageFallback: React.FC<{ src?: string; alt?: string; className?: string }> = ({ src, alt, className }) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(!!src);

  const resolvedSrc = src ? getImageUrl(src) : null;
  const showPlaceholder = !resolvedSrc || imgError;

  return (
    <div className="relative w-full h-full">
      {showPlaceholder ? (
        <AvatarPlaceholder name={alt} />
      ) : (
        <>
          {imgLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 animate-pulse" />
          )}
          <img
            src={resolvedSrc!}
            alt={alt || 'avatar'}
            className={className}
            onLoad={() => setImgLoading(false)}
            onError={() => { setImgLoading(false); setImgError(true); }}
          />
        </>
      )}
    </div>
  );
};

const ProfilePagePublicNew: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user: authUser } = useUserAuth();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [cityName, setCityName] = useState<string>('');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const handleWriteMessage = async () => {
    if (!isAuthenticated || !user) return;
    if (authUser?.role !== 'client') return;
    setChatLoading(true);
    try {
      const conv = await startConversation(user.ID);
      navigate(`/chats/${conv.id}`);
    } catch {
      // silently ignore — user will see nothing changed
    } finally {
      setChatLoading(false);
    }
  };

  // Sticky header on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const getToken = () => localStorage.getItem('userToken');
    const getRefreshToken = () => localStorage.getItem('refreshToken');

    const refreshTokens = async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;

      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) return false;

        const data = await response.json();
        if (data.token) {
          localStorage.setItem('userToken', data.token);
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    let token = getToken();

    const makeRequest = async (authToken: string | null) => {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers,
      };

      return fetch(url, {
        ...options,
        headers,
      });
    };

    let response = await makeRequest(token);

    if (response.status === 401 && token) {
      const refreshed = await refreshTokens();

      if (refreshed) {
        token = getToken();
        response = await makeRequest(token);
      } else {
        localStorage.removeItem('userToken');
        localStorage.removeItem('refreshToken');
      }
    }

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('refreshToken');
    }

    return response;
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchProfile = async () => {
      setLoading(true);
      setErr(null);
      try {
        let response = await authenticatedFetch(`/api/users/${encodeURIComponent(id)}`);

        if ((response.status === 401 || response.status === 403) && localStorage.getItem('userToken')) {
          const selfResponse = await authenticatedFetch('/api/users/self');

          if (selfResponse.ok) {
            const selfData = await selfResponse.json();

            if (selfData && String(selfData.ID) === String(id)) {
              if (!cancelled) {
                setUser(selfData);
                if (selfData.Portfolio?.City) {
                  setCityName(selfData.Portfolio.City);
                } else if (selfData.City?.Name) {
                  setCityName(selfData.City.Name);
                } else {
                  setCityName('Місто не вказано');
                }
              }
              return;
            } else {
              throw new Error('Ви можете переглядати тільки свій власний профіль');
            }
          } else {
            throw new Error('Доступ заборонено. Увійдіть в систему для перегляду профілів.');
          }
        }

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Профіль не знайдено');
          }
          if (response.status === 401 || response.status === 403) {
            throw new Error('Доступ заборонено. Увійдіть в систему для перегляду профілів.');
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || `Помилка: ${response.status}`);
        }

        const data = await response.json();

        if (!cancelled) {
          if (data.Role !== 'psychologist') {
            setErr('Цей профіль доступний тільки для спеціалістів.');
            setLoading(false);
            return;
          }

          setUser(data);

          if (data.Portfolio?.City) {
            setCityName(data.Portfolio.City);
          } else if (data.City?.Name) {
            setCityName(data.City.Name);
          } else {
            setCityName('Місто не вказано');
          }

          if (data.Role === 'psychologist') {
            try {
              const languagesResponse = await authenticatedFetch(`/api/users/${encodeURIComponent(id)}/portfolio/languages`);
              if (languagesResponse.ok) {
                const languagesData = await languagesResponse.json();
                if (languagesData.success && languagesData.data) {
                  setLanguages(languagesData.data);
                }
              }
            } catch (langErr) {
              console.warn('Не вдалося завантажити мови:', langErr);
            }

            try {
              const educationsResponse = await authenticatedFetch(`/api/users/${encodeURIComponent(id)}/portfolio/educations`);
              if (educationsResponse.ok) {
                const educationsData = await educationsResponse.json();
                if (educationsData.success && educationsData.data) {
                  setEducations(educationsData.data);
                }
              }
            } catch (eduErr) {
              console.warn('Не вдалося завантажити освіту:', eduErr);
            }
          }
        }
      } catch (err: any) {
        if (!cancelled) setErr(err.message || 'Не вдалося завантажити профіль');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    return () => { cancelled = true; };
  }, [id, authenticatedFetch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Завантаження профілю...</p>
          </div>
        </div>
        <Footer />
        <BottomNavigation />
      </div>
    );
  }

  if (err || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Помилка завантаження</h3>
            <p className="text-gray-600 mb-6">{err || 'Профіль не знайдено'}</p>
            <div className="flex gap-3">
              <Link to="/" className="flex-1">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  На головну
                </button>
              </Link>
              <button onClick={() => window.history.back()} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Назад
              </button>
            </div>
          </div>
        </div>
        <Footer />
        <BottomNavigation />
      </div>
    );
  }

  const fullName = `${user.FirstName || ''} ${user.LastName || ''}`.trim() || 'Спеціаліст';
  const skills = user.Skills || [];
  const portfolio = user.Portfolio;
  const rating = user.Rating && typeof user.Rating === 'number' && !isNaN(user.Rating) ? user.Rating : 0;
  const avatarUrl = user.AvatarURL || (portfolio?.Photos && portfolio.Photos.length > 0 && isValidPhoto(portfolio.Photos[0]) ? portfolio.Photos[0].url : undefined);

  const groupSkillsByCategory = (skills: (string | Skill)[]) => {
    const grouped: { [key: string]: string[] } = {};

    skills.forEach(skill => {
      if (typeof skill === 'string') {
        if (!grouped['Загальні']) grouped['Загальні'] = [];
        grouped['Загальні'].push(skill);
      } else if (skill && typeof skill === 'object') {
        const categoryName = skill.Category?.Name || 'Інші спеціалізації';
        const skillName = skill.Name || 'Спеціалізація';

        if (!grouped[categoryName]) grouped[categoryName] = [];
        grouped[categoryName].push(skillName);
      }
    });

    return grouped;
  };

  const groupedSkills = groupSkillsByCategory(skills);
  const hasSkills = skills.length > 0;

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

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
      <Header />

      {/* Sticky Mobile Header */}
      <div className={`fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 transition-all duration-300 md:hidden ${isScrolled ? 'translate-y-0 shadow-lg' : '-translate-y-full'}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={() => window.history.back()} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden ring-2 ring-blue-100">
              <ImageFallback src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-sm truncate">{fullName}</h2>
              <p className="text-xs text-blue-600 font-semibold">{portfolio?.Rate ? `${portfolio.Rate} грн/год` : 'Ціна не вказана'}</p>
            </div>
          </div>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>

      {/* Hero Section - Compact */}
      <div className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-8">
          {/* Back button for desktop */}
          <button onClick={() => window.history.back()} className="hidden md:flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Назад</span>
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar & Quick Info */}
                <div className="flex gap-4 items-start w-full md:flex-1">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-28 h-28 md:w-40 md:h-40 rounded-full overflow-hidden ring-4 ring-white shadow-xl bg-gradient-to-br from-blue-100 to-purple-100">
                      <ImageFallback src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                      <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-white rounded-full" />
                    </div>
                  </div>

                  {/* Name & Basic Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{fullName}</h1>
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                    </div>

                    {/* Quick Stats */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {cityName && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                          <MapPin className="w-3.5 h-3.5" />
                          {cityName}
                        </span>
                      )}
                      {portfolio?.Experience && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                          <Clock className="w-3.5 h-3.5" />
                          {portfolio.Experience} років
                        </span>
                      )}
                      {rating > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-50 rounded-full text-xs font-medium text-yellow-700">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {rating.toFixed(1)} ({user.ReviewsCount || 0})
                        </span>
                      )}
                    </div>

                    {/* Languages */}
                    {languages.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {languages.slice(0, 3).map((lang, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700">
                            <Globe className="w-3 h-3" />
                            {getLanguageName(lang.name || '')}
                          </span>
                        ))}
                        {languages.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
                            +{languages.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Price & Actions */}
                <div className="w-full md:w-72 flex-shrink-0 space-y-3">
                  {/* Price */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Вартість консультації</div>
                      <div className="text-3xl font-bold text-blue-600">
                        {portfolio?.Rate ? `${portfolio.Rate} грн` : 'Договірна'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">за годину</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="hidden md:flex flex-col gap-2">
                    <Link to={`/booking/${user.ID}`}>
                      <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
                        <Calendar className="w-5 h-5" />
                        Записатися на сесію
                      </button>
                    </Link>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleWriteMessage}
                        disabled={chatLoading || !isAuthenticated || authUser?.role !== 'client'}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {chatLoading ? '...' : 'Написати'}
                      </button>
                      <button
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded-lg transition-colors text-sm font-medium ${
                          isFavorite
                            ? 'border-red-200 text-red-600 bg-red-50'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                        {isFavorite ? 'Збережено' : 'Зберегти'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Types */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700">
                  <Video className="w-3.5 h-3.5" />
                  Онлайн консультації
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-xs font-medium text-purple-700">
                  <MapPin className="w-3.5 h-3.5" />
                  Офлайн прийом
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* About Section */}
        {portfolio?.Description && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
              Про спеціаліста
            </h2>
            <p className="text-gray-700 leading-relaxed">{portfolio.Description}</p>
          </div>
        )}

        {/* Video embed */}
        {portfolio?.VideoURL && (() => {
          const embedUrl = getEmbedUrl(portfolio.VideoURL!);
          return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <Video className="w-4 h-4 text-red-600" />
                </div>
                Відео
              </h2>
              {embedUrl ? (
                <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a href={portfolio.VideoURL!} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200">
                  <Video className="w-4 h-4" /> Переглянути відео
                </a>
              )}
            </div>
          );
        })()}

        {/* Specializations - Tags */}
        {hasSkills && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              Спеціалізації
            </h2>
            <div className="space-y-4">
              {Object.entries(groupedSkills).map(([categoryName, categorySkills]) => (
                <div key={categoryName}>
                  <h3 className="text-sm font-semibold text-purple-600 mb-2">{categoryName}</h3>
                  <div className="flex flex-wrap gap-2">
                    {categorySkills.map((skillName, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-sm font-medium text-purple-700">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {skillName}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {educations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-green-600" />
              </div>
              Освіта
            </h2>
            <div className="space-y-3">
              {educations.map((edu, index) => (
                <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm">{edu.Title}</h4>
                    <p className="text-sm text-gray-600">{edu.Institution}</p>
                    {edu.IssueDate && (
                      <p className="text-xs text-gray-500 mt-1">{new Date(edu.IssueDate).toLocaleDateString('uk-UA')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Info */}
        {(portfolio?.ContactPhone || portfolio?.Telegram) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Phone className="w-4 h-4 text-blue-600" />
              </div>
              Контакти
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {portfolio.ContactPhone && (
                <a href={`tel:${portfolio.ContactPhone}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500">Телефон</div>
                    <div className="font-medium text-gray-900">{portfolio.ContactPhone}</div>
                  </div>
                </a>
              )}
              {portfolio.Telegram && (
                <a href={`https://t.me/${portfolio.Telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500">Telegram</div>
                    <div className="font-medium text-gray-900">@{portfolio.Telegram.replace('@', '')}</div>
                  </div>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Photo Gallery */}
        {portfolio?.Photos && portfolio.Photos.filter(isValidPhoto).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
              <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
                <Camera className="w-4 h-4 text-pink-600" />
              </div>
              Фотографії
            </h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {portfolio.Photos.filter(isValidPhoto).map((photo, index) => (
                <div key={photo.id || index} className="aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <img
                    src={getImageUrl(photo.url!)}
                    alt={`Фото ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-20 left-0 right-0 px-4 md:hidden z-30">
        <Link to={`/booking/${user.ID}`}>
          <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold shadow-2xl hover:shadow-3xl transition-all">
            <Calendar className="w-5 h-5" />
            Записатися на сесію
          </button>
        </Link>
      </div>

      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default ProfilePagePublicNew;
