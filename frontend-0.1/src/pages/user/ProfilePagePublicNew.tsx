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
  ID?: number;
  Name?: string;
  Proficiency?: string;
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
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-0">
      <Header />

      {/* ── Sticky mini-header (mobile, on scroll) ── */}
      <div className={`fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 transition-all duration-300 lg:hidden ${isScrolled ? 'translate-y-0 shadow-sm' : '-translate-y-full'}`}>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <button onClick={() => window.history.back()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 flex-shrink-0">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-blue-100">
            <ImageFallback src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{fullName}</p>
            <p className="text-xs text-blue-600 font-medium">{portfolio?.Rate ? `${portfolio.Rate} грн/год` : 'Договірна'}</p>
          </div>
          <button onClick={() => setIsFavorite(!isFavorite)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100">
            <Heart className={`w-4.5 h-4.5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>

      {/* ── Hero Banner ── */}
      <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-purple-700 overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative max-w-6xl mx-auto px-4 pt-6 pb-10">
          <button onClick={() => window.history.back()} className="inline-flex items-center gap-1.5 text-blue-100 hover:text-white text-sm font-medium mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Назад
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden ring-4 ring-white/25 shadow-2xl">
                <ImageFallback src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-green-400 rounded-full border-2 border-white shadow" />
            </div>

            {/* Name + meta */}
            <div className="text-center sm:text-left sm:pb-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{fullName}</h1>
                <CheckCircle className="w-5 h-5 text-blue-200 flex-shrink-0" />
              </div>
              <p className="text-blue-200 text-sm mb-3">Психолог · Онлайн та офлайн прийом</p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                {cityName && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-full text-xs font-medium text-white backdrop-blur-sm transition-colors">
                    <MapPin className="w-3 h-3" />{cityName}
                  </span>
                )}
                {Number(portfolio?.Experience) > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/15 rounded-full text-xs font-medium text-white">
                    <Clock className="w-3 h-3" />{portfolio!.Experience} р. досвіду
                  </span>
                )}
                {rating > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-400/20 rounded-full text-xs font-medium text-yellow-200">
                    <Star className="w-3 h-3 fill-current" />{rating.toFixed(1)}
                    {(user.ReviewsCount || 0) > 0 && <span className="opacity-70">({user.ReviewsCount})</span>}
                  </span>
                )}
                {languages.slice(0, 3).map((lang, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/15 rounded-full text-xs font-medium text-white">
                    <Globe className="w-3 h-3" />{getLanguageName(lang.Name || '')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main: two-column on desktop ── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6 lg:items-start">

          {/* ════ LEFT COLUMN ════ */}
          <div className="space-y-4">

            {/* About */}
            {portfolio?.Description && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <SectionTitle icon={<Briefcase className="w-4 h-4 text-blue-600" />} color="bg-blue-50">
                  Про спеціаліста
                </SectionTitle>
                <div
                  className="text-gray-700 leading-relaxed text-sm prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: portfolio.Description }}
                />
              </section>
            )}

            {/* Specializations */}
            {hasSkills && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <SectionTitle icon={<Target className="w-4 h-4 text-purple-600" />} color="bg-purple-50">
                  Спеціалізації
                </SectionTitle>
                <div className="space-y-4">
                  {Object.entries(groupedSkills).map(([cat, catSkills]) => (
                    <div key={cat}>
                      <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-2">{cat}</p>
                      <div className="flex flex-wrap gap-2">
                        {catSkills.map((s, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-100">
                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />{s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {educations.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <SectionTitle icon={<GraduationCap className="w-4 h-4 text-emerald-600" />} color="bg-emerald-50">
                  Освіта
                </SectionTitle>
                <div className="space-y-3">
                  {educations.map((edu, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mt-0.5">
                        <Award className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                        <p className="font-semibold text-gray-900 text-sm leading-snug">{edu.Title}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{edu.Institution}</p>
                        {edu.IssueDate && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(edu.IssueDate).getFullYear()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <SectionTitle icon={<Globe className="w-4 h-4 text-blue-600" />} color="bg-blue-50">
                  Мови
                </SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="text-sm font-medium text-gray-800">{getLanguageName(lang.Name || '')}</span>
                      {lang.Proficiency && (
                        <span className="text-xs text-gray-400 border-l border-gray-200 pl-2">{lang.Proficiency}</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Video */}
            {portfolio?.VideoURL && (() => {
              const embedUrl = getEmbedUrl(portfolio.VideoURL!);
              return (
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <SectionTitle icon={<Video className="w-4 h-4 text-red-500" />} color="bg-red-50">
                    Відео
                  </SectionTitle>
                  {embedUrl ? (
                    <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                      <iframe src={embedUrl} className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                  ) : (
                    <a href={portfolio.VideoURL!} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
                      <Video className="w-4 h-4" />Переглянути відео
                    </a>
                  )}
                </section>
              );
            })()}

            {/* Gallery */}
            {portfolio?.Photos && portfolio.Photos.filter(isValidPhoto).length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <SectionTitle icon={<Camera className="w-4 h-4 text-pink-500" />} color="bg-pink-50">
                  Фотографії
                </SectionTitle>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {portfolio.Photos.filter(isValidPhoto).map((photo, i) => (
                    <div key={photo.id || i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 group cursor-pointer">
                      <img src={getImageUrl(photo.url!)} alt={`Фото ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Contacts */}
            {(portfolio?.ContactPhone || portfolio?.Telegram) && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <SectionTitle icon={<Phone className="w-4 h-4 text-blue-600" />} color="bg-blue-50">
                  Контакти
                </SectionTitle>
                <div className="space-y-2">
                  {portfolio.ContactPhone && (
                    <a href={`tel:${portfolio.ContactPhone}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Телефон</p>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{portfolio.ContactPhone}</p>
                      </div>
                    </a>
                  )}
                  {portfolio.Telegram && (
                    <a href={`https://t.me/${portfolio.Telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                      <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-4 h-4 text-sky-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Telegram</p>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-sky-600 transition-colors">@{portfolio.Telegram.replace('@', '')}</p>
                      </div>
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* ════ RIGHT SIDEBAR (desktop) ════ */}
          <div className="hidden lg:block mt-0">
            <div className="sticky top-6 space-y-3">

              {/* Price + CTA card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                {/* Price */}
                <div className="text-center pb-4 mb-4 border-b border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Вартість консультації</p>
                  {portfolio?.Rate ? (
                    <>
                      <p className="text-4xl font-bold text-gray-900 leading-none">{portfolio.Rate}</p>
                      <p className="text-sm text-gray-500 mt-1">грн / годину</p>
                    </>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-600">Договірна</p>
                  )}
                </div>

                {/* CTA */}
                <Link to={`/booking/${user.ID}`}>
                  <button className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg mb-2.5">
                    <Calendar className="w-4 h-4" />
                    Записатися на сесію
                  </button>
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleWriteMessage}
                    disabled={chatLoading || !isAuthenticated || authUser?.role !== 'client'}
                    className="flex items-center justify-center gap-1.5 py-2.5 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {chatLoading ? '...' : 'Написати'}
                  </button>
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 border rounded-lg transition-colors text-sm font-medium ${
                      isFavorite ? 'border-red-200 text-red-500 bg-red-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    {isFavorite ? 'Збережено' : 'Зберегти'}
                  </button>
                </div>
              </div>

              {/* Info card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                {Number(portfolio?.Experience) > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Досвід роботи</p>
                      <p className="text-sm font-semibold text-gray-800">{portfolio!.Experience} років</p>
                    </div>
                  </div>
                )}
                {rating > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Рейтинг</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {rating.toFixed(1)}
                        {(user.ReviewsCount || 0) > 0 && (
                          <span className="text-gray-400 font-normal text-xs ml-1">({user.ReviewsCount} відгуків)</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                {cityName && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Місто</p>
                      <p className="text-sm font-semibold text-gray-800">{cityName}</p>
                    </div>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-100 flex flex-col gap-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600">
                    <Video className="w-3.5 h-3.5" />Онлайн консультації
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600">
                    <MapPin className="w-3.5 h-3.5" />Офлайн прийом
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile CTA (fixed bottom) ── */}
      <div className="fixed bottom-16 left-0 right-0 px-4 lg:hidden z-30 pb-2">
        <div className="flex gap-2">
          <Link to={`/booking/${user.ID}`} className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg">
              <Calendar className="w-4 h-4" />
              Записатися
            </button>
          </Link>
          <button
            onClick={handleWriteMessage}
            disabled={chatLoading || !isAuthenticated || authUser?.role !== 'client'}
            className="flex items-center justify-center gap-1.5 px-4 py-3.5 border-2 border-blue-600 text-blue-600 bg-white rounded-xl font-semibold disabled:opacity-40 shadow-lg"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`flex items-center justify-center px-4 py-3.5 border-2 rounded-xl shadow-lg bg-white ${isFavorite ? 'border-red-400 text-red-500' : 'border-gray-200 text-gray-400'}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <Footer />
      <BottomNavigation />
    </div>
  );
};

const SectionTitle: React.FC<{ icon: React.ReactNode; color: string; children: React.ReactNode }> = ({ icon, color, children }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
      {icon}
    </div>
    <h2 className="text-base font-bold text-gray-900">{children}</h2>
  </div>
);

export default ProfilePagePublicNew;
