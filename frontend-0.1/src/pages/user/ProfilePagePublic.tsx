import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Phone, Mail, Calendar, Heart, MessageCircle, Clock, Award, Users, CheckCircle, Shield, Video, ArrowLeft } from 'lucide-react';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import BottomNavigation from '../../components/user/BottomNavigation';

import '../../styles/design-system.css';
import '../../styles/utility-classes.css';

type Photo = {
  ID?: number;
  URL?: string;
};

type Portfolio = {
  ID?: number;
  Description?: string | null;
  Experience?: string | null;
  Education?: string | null;
  Photos?: Photo[] | null;
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

type PublicUser = {
  ID: number;
  FirstName?: string | null;
  LastName?: string | null;
  Email?: string | null;
  Phone?: string | null;
  City?: string | null;
  Role?: string | null;
  ShortDescription?: string | null;
  FullDescription?: string | null;
  Skills?: (string | Skill)[] | null;
  Rating?: number | null;
  ReviewsCount?: number | null;
  Portfolio?: Portfolio | null;
  AvatarURL?: string | null;
};

const getImageUrl = (url: string): string => {
  if (!url) return '/placeholder-image.jpg';
  
  if (url.startsWith('/uploads')) {
    return `/api${url}`;
  }
  
  if (url.startsWith('/api/uploads') || url.startsWith('http')) {
    return url;
  }
  
  return '/placeholder-image.jpg';
};

const isValidPhoto = (photo: any) => {
  return photo && photo.URL && typeof photo.URL === 'string' && photo.URL.trim() !== '';
};

const ImageFallback: React.FC<{ src?: string; alt?: string; className?: string }> = ({ src, alt, className }) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  
  const handleImageLoad = () => {
    setImgLoading(false);
    setImgError(false);
  };
  
  const handleImageError = () => {
    setImgLoading(false);
    setImgError(true);
  };
  
  const finalSrc = (!src || imgError) ? '/placeholder-image.jpg' : getImageUrl(src);
  
  return (
    <div className="relative">
      {imgLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center rounded-xl">
          <span className="text-xs text-gray-500">Завантаження...</span>
        </div>
      )}
      <img 
        src={finalSrc} 
        alt={alt || 'avatar'} 
        className={className}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 ${className}`}>
    {children}
  </div>
);

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 lg:p-7 ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-6 lg:p-7 pb-0">
    {children}
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-xl font-bold text-gray-900 mb-0 flex items-center gap-2 ${className}`}>
    {children}
  </h3>
);

const Badge: React.FC<{ children: React.ReactNode; variant?: string; className?: string }> = ({ 
  children, 

  
  variant = 'default', 
  className = '' 
}) => {
  const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold";
  const variantClasses = {
    default: "bg-blue-600 text-white",
    secondary: "bg-gray-100 text-gray-700",
    outline: "border border-gray-200 text-gray-700 bg-white",
    success: "bg-green-100 text-green-700 border border-green-200",
    primary: "bg-blue-50 text-blue-700 border border-blue-200"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Button: React.FC<{ 
  children: React.ReactNode; 
  variant?: string; 
  size?: string; 
  className?: string;
  onClick?: () => void;
}> = ({ children, variant = 'default', size = 'default', className = '', onClick }) => {
  const baseClasses = "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
  
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md",
    outline: "border border-gray-200 text-gray-700 hover:bg-gray-50 bg-white",
    ghost: "text-gray-700 hover:bg-gray-100",
    gradient: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
  };
  
  const sizeClasses = {
    sm: "px-3 py-2 text-sm rounded-lg",
    default: "px-6 py-3 rounded-xl",
    lg: "px-8 py-4 text-lg rounded-xl"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const Separator = () => (
  <div className="border-t border-gray-200 my-3" />
);

const ProfilePagePublic: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const useAuthenticatedFetch = () => {
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

    const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
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
    };

    return authenticatedFetch;
  };

  const authenticatedFetch = useAuthenticatedFetch();

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
              if (!cancelled) setUser(selfData);
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
        
        if (!cancelled) setUser(data);
      } catch (err: any) {
        if (!cancelled) setErr(err.message || 'Не вдалося завантажити профіль');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfile();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="animate-pulse">
            <Card>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="w-52 h-68 bg-gray-200 rounded-xl"></div>
                  <div className="flex-1 space-y-4">
                    <div className="h-8 bg-gray-200 rounded-lg w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
        <BottomNavigation />
      </div>
    );
  }
  
  if (err) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardContent className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Помилка завантаження</h3>
              <p className="text-gray-600 mb-6">{err}</p>
              <div className="space-y-3">
                <Link to="/login">
                  <Button className="w-full">Увійти в систему</Button>
                </Link>
                <Link to="/">
                  <Button variant="outline" className="w-full">На головну</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
        <BottomNavigation />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Профіль не знайдено</h3>
          <p className="text-gray-600">Спеціаліст з таким ID не існує</p>
        </div>
      </div>
    );
  }

  const fullName = `${user.FirstName || ''} ${user.LastName || ''}`.trim() || 'Спеціаліст';
  const skills = user.Skills || [];
  const portfolio = user.Portfolio;
  const rating = user.Rating && typeof user.Rating === 'number' && !isNaN(user.Rating) ? user.Rating : 0;

  // Функція для групування скілів за категоріями
  const groupSkillsByCategory = (skills: (string | Skill)[]) => {
    const grouped: { [key: string]: string[] } = {};
    
    skills.forEach(skill => {
      if (typeof skill === 'string') {
        // Якщо скіл - це рядок, додаємо до категорії "Загальні"
        if (!grouped['Загальні']) {
          grouped['Загальні'] = [];
        }
        grouped['Загальні'].push(skill);
      } else if (skill && typeof skill === 'object') {
        // Якщо скіл - це об'єкт
        const categoryName = skill.Category?.Name || 'Інші спеціалізації';
        const skillName = skill.Name || 'Спеціалізація';
        
        if (!grouped[categoryName]) {
          grouped[categoryName] = [];
        }
        grouped[categoryName].push(skillName);
      }
    });
    
    return grouped;
  };

  const groupedSkills = groupSkillsByCategory(skills);
  const hasSkills = skills.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header />
      
      {/* Header with back button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-gray-900 font-medium">Спеціаліст</span>
              <Badge variant="secondary">
                {user.Role === 'psychologist' ? 'Психолог' : (user.Role || 'Спеціаліст')}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-8 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <Card className="overflow-hidden">
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Column - Profile Info */}
                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                    {/* Professional photo with status indicator */}
                    <div className="relative">
                      <div className="w-56 h-72 lg:w-64 lg:h-80 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white bg-gradient-to-br from-blue-100 to-purple-100">
                        <ImageFallback 
                          src={user.AvatarURL || (portfolio?.Photos && portfolio.Photos.length > 0 && isValidPhoto(portfolio.Photos[0]) ? portfolio.Photos[0].URL : undefined)}
                          alt={fullName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-green-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                        <div className="w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                    
                    {/* Name and basic info */}
                    <div className="text-center sm:text-left flex-1">
                      <div className="mb-4">
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 leading-tight">{fullName}</h1>
                        <Badge variant="primary" className="mb-3">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Верифіковано
                        </Badge>
                      </div>
                      
                      <p className="text-xl sm:text-2xl text-blue-600 font-bold mb-4">
                        {user.Role === 'psychologist' ? 'Дитячий психолог' : 'Спеціаліст'}
                      </p>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 justify-center sm:justify-start text-gray-600">
                          <MapPin className="w-5 h-5 flex-shrink-0" />
                          <span className="text-base sm:text-lg">{user.City || 'Місто не вказано'}</span>
                        </div>
                        <div className="flex items-center gap-6 flex-wrap justify-center sm:justify-start text-gray-600">
                          <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 flex-shrink-0" />
                            <span className="text-base sm:text-lg whitespace-nowrap">8 років досвіду</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 flex-shrink-0" />
                            <span className="text-base sm:text-lg whitespace-nowrap">зазвичай протягом 2 год</span>
                          </div>
                        </div>
                      </div>

                      {/* Languages */}
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4">
                        {['Українська', 'Російська', 'Англійська'].map((lang, index) => (
                          <Badge key={index} variant="outline" className="text-sm">
                            {lang}
                          </Badge>
                        ))}
                      </div>

                      {/* Rating */}
                      {rating > 0 && (
                        <div className="flex items-center gap-3 justify-center sm:justify-start">
                          <div className="flex items-center gap-1">
                            <Star className="w-5 h-5 text-yellow-400 fill-current" />
                            <span className="font-bold text-lg text-gray-900">{rating.toFixed(1)}</span>
                          </div>
                          <span className="text-gray-600">
                            ({user.ReviewsCount || 0} відгуків)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Stats and Actions */}
                <div className="lg:w-80">
                  {/* Price Card */}
                  <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 mb-6">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        800 грн
                      </div>
                      <p className="text-sm text-gray-600">за 60 хв сесію</p>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <Link to={`/booking/${user.ID}`}>
                      <Button
                        variant="gradient"
                        size="lg"
                        className="w-full"
                      >
                        <Calendar className="w-5 h-5 mr-2" />
                        Записатися на сесію
                      </Button>
                    </Link>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {user.Email && (
                        <a href={`mailto:${user.Email}`}>
                          <Button 
                            variant="outline"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50 w-full"
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Написати
                          </Button>
                        </a>
                      )}
                      <Button 
                        variant="outline"
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={isFavorite ? "text-red-600 border-red-200 hover:bg-red-50" : "border-gray-200 hover:bg-gray-50"}
                      >
                        <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                      </Button>
                    </div>

                    {/* Session types */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Badge variant="secondary" className="flex items-center justify-center py-2">
                        <Video className="w-3 h-3 mr-1" />
                        Онлайн
                      </Badge>
                      <Badge variant="secondary" className="flex items-center justify-center py-2">
                        <MapPin className="w-3 h-3 mr-1" />
                        Офлайн
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Shield className="w-6 h-6 text-blue-600" />
                  Про спеціаліста
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1 space-y-3">
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Опис</h4>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {user.ShortDescription || user.FullDescription || 'Професійний дитячий психолог з багаторічним досвідом роботи з дітьми з розладами аутистичного спектру.'}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Підхід до роботи</h4>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    Індивідуальний підхід до кожної дитини, використання сучасних методик ABA-терапії, робота з батьками.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Specializations - тільки якщо є скіли */}
            {hasSkills && (
              <Card>
                <CardHeader>
                  <CardTitle>Спеціалізації</CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="space-y-4">
                    {Object.entries(groupedSkills).map(([categoryName, categorySkills]) => (
                      <div key={categoryName}>
                        <h4 className="text-lg font-bold text-gray-900 mb-2 text-blue-600">
                          {categoryName}
                        </h4>
                        <div className="space-y-1 ml-3">
                          {categorySkills.map((skillName, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></div>
                              <span className="text-gray-700 text-base">{skillName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Portfolio Photos */}
            {portfolio?.Photos && portfolio.Photos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Портфоліо</CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  {portfolio.Description && (
                    <p className="text-gray-600 leading-relaxed mb-4 text-lg">{portfolio.Description}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {portfolio.Photos.filter(isValidPhoto).map((photo, index) => (
                      <div key={photo.ID || index} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                        <ImageFallback
                          src={photo.URL}
                          alt={`Portfolio ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Контактна інформація</CardTitle>
              </CardHeader>
              <CardContent className="pt-1 space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">{user.Phone || 'Не вказано'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">{user.Email || 'Не вказано'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">@specialist_telegram</span>
                </div>
              </CardContent>
            </Card>

            {/* Experience & Education */}
            {portfolio && (portfolio.Experience || portfolio.Education) && (
              <Card>
                <CardHeader>
                  <CardTitle>Досвід та освіта</CardTitle>
                </CardHeader>
                <CardContent className="pt-1 space-y-3">
                  {portfolio.Experience && (
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Досвід роботи</span>
                      <p className="text-gray-700 leading-relaxed mt-1">{portfolio.Experience}</p>
                    </div>
                  )}
                  {portfolio.Education && (
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Освіта</span>
                      <p className="text-gray-700 leading-relaxed mt-1">{portfolio.Education}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default ProfilePagePublic;