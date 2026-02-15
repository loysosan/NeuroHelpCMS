import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import BottomNavigation from '../../components/user/BottomNavigation';
import type { GoogleUser } from '../../components/user/GoogleLoginButton';

interface RegistrationData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  role: 'psychologist';
  telegram: string;
  instagram: string;
  city: string;
  street: string;
  shortDescription: string;
  videoUrl: string;
}

type SkillItem = { id: number; name: string; category: string };

const empty: RegistrationData = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  password: '',
  role: 'psychologist',
  telegram: '',
  instagram: '',
  city: '',
  street: '',
  shortDescription: '',
  videoUrl: '',
};

const QuizRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const googleUser = location.state?.googleUser as GoogleUser | undefined;
  const isOAuth = !!googleUser;

  const [step, setStep] = useState(1);
  const [data, setData] = useState<RegistrationData>({
    ...empty,
    ...(googleUser ? {
      firstName: googleUser.firstName || '',
      lastName: googleUser.lastName || '',
      email: googleUser.email || '',
    } : {}),
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Skills state
  const [allSkills, setAllSkills] = useState<SkillItem[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);

  // Load available skills on mount
  useEffect(() => {
    fetch('/api/users/skills')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) setAllSkills(data);
      })
      .catch(() => {});
  }, []);

  const setField = <K extends keyof RegistrationData>(k: K, v: RegistrationData[K]) =>
    setData(s => ({ ...s, [k]: v }));

  const toggleSkill = (id: number) => {
    setSelectedSkillIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const submit = useCallback(async () => {
    setError('');
    setBusy(true);
    try {
      const payload: any = { ...data };
      if (googleUser?.googleId) {
        payload.googleId = googleUser.googleId;
      }
      if (selectedSkillIds.length > 0) {
        payload.skillIds = selectedSkillIds;
      }

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error?.message || j.message || 'Помилка реєстрації');
      }

      navigate('/registration-success');
    } catch (e: any) {
      setError(e.message || 'Помилка');
      setBusy(false);
    }
  }, [data, selectedSkillIds, navigate, googleUser]);

  const onSubmitFinal = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  const totalSteps = 5;
  const progress = Math.round((step / totalSteps) * 100);

  // Group skills by category
  const skillsByCategory: Record<string, { id: number; name: string }[]> = {};
  for (const s of allSkills) {
    if (!skillsByCategory[s.category]) skillsByCategory[s.category] = [];
    skillsByCategory[s.category].push({ id: s.id, name: s.name });
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Особисті дані</h3>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">Імʼя *</label>
                  <input className="w-full h-11 rounded-lg border px-3 text-sm"
                    value={data.firstName}
                    onChange={e => setField('firstName', e.target.value)}
                    required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Прізвище *</label>
                  <input className="w-full h-11 rounded-lg border px-3 text-sm"
                    value={data.lastName}
                    onChange={e => setField('lastName', e.target.value)}
                    required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Телефон *</label>
                <input className="w-full h-11 rounded-lg border px-3 text-sm"
                  value={data.phone}
                  onChange={e => setField('phone', e.target.value)}
                  placeholder="+380..."
                  required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email *</label>
                <input className={`w-full h-11 rounded-lg border px-3 text-sm ${isOAuth ? 'bg-gray-100 text-gray-500' : ''}`}
                  type="email"
                  value={data.email}
                  onChange={e => setField('email', e.target.value)}
                  readOnly={isOAuth}
                  required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Пароль {isOAuth ? '(необовʼязково)' : '*'}
                </label>
                <input className="w-full h-11 rounded-lg border px-3 text-sm"
                  type="password"
                  value={data.password}
                  onChange={e => setField('password', e.target.value)}
                  required={!isOAuth} />
                <p className="text-xs text-gray-500 mt-1">
                  {isOAuth
                    ? 'Додайте пароль, щоб також входити через email та пароль'
                    : 'Мінімум 6 символів'}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={next}
                className="px-6 h-11 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500">
                Далі
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Локація</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Місто *</label>
                <input className="w-full h-11 rounded-lg border px-3 text-sm"
                  value={data.city}
                  onChange={e => setField('city', e.target.value)}
                  placeholder="Київ"
                  required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Адреса</label>
                <input className="w-full h-11 rounded-lg border px-3 text-sm"
                  value={data.street}
                  onChange={e => setField('street', e.target.value)}
                  placeholder="вул. Хрещатик, 1" />
              </div>
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={back}
                className="px-5 h-11 rounded-lg border text-sm hover:bg-gray-50">
                Назад
              </button>
              <button type="button" onClick={next}
                className="px-6 h-11 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500">
                Далі
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Контакти</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Telegram</label>
                <input className="w-full h-11 rounded-lg border px-3 text-sm"
                  value={data.telegram}
                  onChange={e => setField('telegram', e.target.value)}
                  placeholder="@username" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Instagram</label>
                <input className="w-full h-11 rounded-lg border px-3 text-sm"
                  value={data.instagram}
                  onChange={e => setField('instagram', e.target.value)}
                  placeholder="@username" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">YouTube відео (URL)</label>
                <input
                  type="url"
                  className="w-full h-11 rounded-lg border px-3 text-sm"
                  value={data.videoUrl}
                  onChange={e => setField('videoUrl', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Додайте відео-презентацію (необов'язково). Можна додати пізніше в профілі.
                </p>
              </div>
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={back}
                className="px-5 h-11 rounded-lg border text-sm hover:bg-gray-50">
                Назад
              </button>
              <button type="button" onClick={next}
                className="px-6 h-11 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500">
                Далі
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Спеціалізація</h3>
            <p className="text-sm text-gray-600">
              Оберіть навички, які описують вашу спеціалізацію. Це допоможе клієнтам знайти вас.
            </p>

            {Object.keys(skillsByCategory).length > 0 ? (
              <div className="space-y-5">
                {Object.entries(skillsByCategory).map(([category, skills]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {skills.map(skill => {
                        const active = selectedSkillIds.includes(skill.id);
                        return (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => toggleSkill(skill.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                              active
                                ? 'bg-indigo-600 border-indigo-600 text-white'
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
              </div>
            ) : (
              <p className="text-sm text-gray-500">Навички завантажуються...</p>
            )}

            {selectedSkillIds.length > 0 && (
              <p className="text-xs text-gray-500">
                Обрано: {selectedSkillIds.length}
              </p>
            )}

            <div className="flex justify-between">
              <button type="button" onClick={back}
                className="px-5 h-11 rounded-lg border text-sm hover:bg-gray-50">
                Назад
              </button>
              <button type="button" onClick={next}
                className="px-6 h-11 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500">
                Далі
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <form onSubmit={onSubmitFinal} className="space-y-6">
            <h3 className="text-xl font-semibold">Про себе</h3>
            <div>
              <label className="text-sm font-medium mb-1 block">Короткий опис *</label>
              <textarea
                className="w-full rounded-lg border px-3 py-2 text-sm resize-none h-32"
                value={data.shortDescription}
                onChange={e => setField('shortDescription', e.target.value)}
                placeholder="Розкажіть коротко про себе, свій досвід та підхід до роботи..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Цей опис відображатиметься в каталозі спеціалістів.
              </p>
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={back}
                className="px-5 h-11 rounded-lg border text-sm hover:bg-gray-50">
                Назад
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-6 h-11 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-60"
              >
                {busy ? 'Надсилання...' : 'Завершити реєстрацію'}
              </button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 pb-24 md:pb-0">
      <Header />
      <main className="flex-1 px-4 pt-10 pb-20 max-w-3xl mx-auto w-full">
        <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Реєстрація спеціаліста</h1>
              <span className="text-xs font-medium text-gray-500">
                Крок {step}/{totalSteps}
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-6 text-sm border border-red-300 bg-red-50 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {renderStep()}
        </div>
      </main>
      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default QuizRegisterPage;
