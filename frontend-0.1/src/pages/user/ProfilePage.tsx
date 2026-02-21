import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Award, GraduationCap, Camera, Globe, Baby, CalendarDays, ClipboardList, Lock } from 'lucide-react';
import { useUserAuth } from '../../context/UserAuthContext';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import BottomNavigation from '../../components/user/BottomNavigation';
import ProfileHero from '../../components/profile/ProfileHero';
import PersonalInfoSection from '../../components/profile/PersonalInfoSection';
import PortfolioSection from '../../components/profile/PortfolioSection';
import SkillsSection from '../../components/profile/SkillsSection';
import EducationSection from '../../components/profile/EducationSection';
import PhotosSection from '../../components/profile/PhotosSection';
import LanguagesSection from '../../components/profile/LanguagesSection';
import ChildSection from '../../components/profile/ChildSection';
import ScheduleSection from '../../components/booking/ScheduleSection';
import { SessionsList } from '../../components/booking/SessionsList';
import ChangePasswordSection from '../../components/profile/ChangePasswordSection';
import { UserProfile, Language, SkillItem, ProfileTab } from '../../components/profile/types';

const PSYCHOLOGIST_TABS: { key: ProfileTab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Огляд', icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: 'portfolio', label: 'Портфоліо', icon: <Briefcase className="w-4 h-4" /> },
  { key: 'skills', label: 'Навички', icon: <Award className="w-4 h-4" /> },
  { key: 'education', label: 'Освіта', icon: <GraduationCap className="w-4 h-4" /> },
  { key: 'photos', label: 'Фото', icon: <Camera className="w-4 h-4" /> },
  { key: 'languages', label: 'Мови', icon: <Globe className="w-4 h-4" /> },
  { key: 'schedule', label: 'Розклад', icon: <CalendarDays className="w-4 h-4" /> },
  { key: 'security', label: 'Безпека', icon: <Lock className="w-4 h-4" /> },
];

const CLIENT_TABS: { key: ProfileTab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Огляд', icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: 'child', label: 'Дитина', icon: <Baby className="w-4 h-4" /> },
  { key: 'sessions', label: 'Мої записи', icon: <ClipboardList className="w-4 h-4" /> },
  { key: 'security', label: 'Безпека', icon: <Lock className="w-4 h-4" /> },
];

const ProfilePage: React.FC = () => {
  const { user: authUser, logout, isLoading } = useUserAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [allSkills, setAllSkills] = useState<SkillItem[]>([]);

  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('userToken');
    const isFormData = options.body instanceof FormData;
    return fetch(url, {
      ...options,
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/api/users/self');
      if (!response.ok) return;

      const data = await response.json();
      setUser(data);

      if (data.role === 'psychologist') {
        const [langRes, skillsRes] = await Promise.all([
          authenticatedFetch(`/api/users/${data.id}/portfolio/languages`),
          authenticatedFetch('/api/users/skills'),
        ]);

        if (langRes.ok) {
          const langData = await langRes.json();
          if (langData.success) setLanguages(langData.data || []);
        }
        if (skillsRes.ok) {
          const skillsData = await skillsRes.json();
          if (Array.isArray(skillsData)) setAllSkills(skillsData);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    if (authUser) loadProfile();
  }, [authUser]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Завантаження профілю...</span>
        </div>
      </div>
    );
  }

  if (!authUser || !user) {
    return <Navigate to="/" replace />;
  }

  const isPsychologist = user.role === 'psychologist';
  const tabs = isPsychologist ? PSYCHOLOGIST_TABS : CLIENT_TABS;

  const calcCompleteness = (): number => {
    const checks: boolean[] = [
      !!user.firstName,
      !!user.lastName,
      !!user.phone,
    ];

    if (isPsychologist) {
      const p = user.portfolio;
      checks.push(
        !!p?.description,
        !!p?.experience,
        !!p?.city,
        (p?.photos?.length || 0) > 0,
        (user.skills?.length || 0) > 0,
        (p?.educations?.length || 0) > 0,
        !!p?.rate,
        !!(p?.contactEmail || p?.contactPhone),
      );
    } else {
      checks.push(!!user.child);
    }

    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 pb-24 md:pb-0">
      <Header />

      <main className="flex-1 px-4 pt-6 pb-16 max-w-5xl mx-auto w-full space-y-6">
        <ProfileHero user={user} completeness={calcCompleteness()} onLogout={logout} />

        {/* Tabs */}
        <div className="bg-white rounded-xl border p-1.5 overflow-x-auto">
          <div className="flex min-w-max sm:min-w-0">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <PersonalInfoSection user={user} authenticatedFetch={authenticatedFetch} onReload={loadProfile} />
            {isPsychologist && (
              <PortfolioSection user={user} authenticatedFetch={authenticatedFetch} onReload={loadProfile} />
            )}
            {!isPsychologist && (
              <ChildSection user={user} authenticatedFetch={authenticatedFetch} onReload={loadProfile} />
            )}
          </div>
        )}

        {activeTab === 'portfolio' && isPsychologist && (
          <PortfolioSection user={user} authenticatedFetch={authenticatedFetch} onReload={loadProfile} />
        )}

        {activeTab === 'skills' && isPsychologist && (
          <SkillsSection user={user} allSkills={allSkills} authenticatedFetch={authenticatedFetch} onReload={loadProfile} />
        )}

        {activeTab === 'education' && isPsychologist && (
          <EducationSection user={user} authenticatedFetch={authenticatedFetch} onReload={loadProfile} />
        )}

        {activeTab === 'photos' && isPsychologist && (
          <PhotosSection user={user} authenticatedFetch={authenticatedFetch} onReload={loadProfile} />
        )}

        {activeTab === 'languages' && isPsychologist && (
          <LanguagesSection languages={languages} authenticatedFetch={authenticatedFetch} onReload={loadProfile} />
        )}

        {activeTab === 'child' && !isPsychologist && (
          <ChildSection user={user} authenticatedFetch={authenticatedFetch} onReload={loadProfile} />
        )}

        {activeTab === 'schedule' && isPsychologist && (
          <ScheduleSection user={user} authenticatedFetch={authenticatedFetch} onReload={loadProfile} />
        )}

        {activeTab === 'sessions' && !isPsychologist && (
          <SessionsList userRole="client" />
        )}

        {activeTab === 'security' && (
          <ChangePasswordSection authenticatedFetch={authenticatedFetch} />
        )}
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
