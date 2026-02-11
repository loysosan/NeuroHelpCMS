import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import BottomNavigation from '../../components/user/BottomNavigation';
import type { GoogleUser } from '../../components/user/GoogleLoginButton';

type Role = 'client' | 'psychologist';

interface RegistrationData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  role: Role | '';
  telegram: string;
  instagram: string;
  country: string;
  city: string;
  street: string;
  house: string;
  fullDescription: string;
  shortDescription: string;
  skills: string[];
  videoUrl: string;
}

const empty: RegistrationData = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  password: '',
  role: '',
  telegram: '',
  instagram: '',
  country: '',
  city: '',
  street: '',
  house: '',
  fullDescription: '',
  shortDescription: '',
  skills: [],
  videoUrl: ''
};

const QuizRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const googleUser = location.state?.googleUser as GoogleUser | undefined;
  const isOAuth = !!googleUser;

  const [step, setStep] = useState(1);
  const [data, setData] = useState<RegistrationData>({
    ...empty,
    role: 'psychologist',
    ...(googleUser ? {
      firstName: googleUser.firstName || '',
      lastName: googleUser.lastName || '',
      email: googleUser.email || '',
    } : {}),
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const setField = <K extends keyof RegistrationData>(k: K, v: RegistrationData[K]) =>
    setData(s => ({ ...s, [k]: v }));

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const submit = useCallback(async () => {
    setError('');
    setBusy(true);
    try {
      const payload: any = { ...data };
      // Прибираємо всю логіку з фото
      delete payload.photo;
      // Add googleId for OAuth registration
      if (googleUser?.googleId) {
        payload.googleId = googleUser.googleId;
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

      // Видаляємо всю логіку завантаження фото

      navigate('/registration-success');
    } catch (e: any) {
      setError(e.message || 'Помилка');
      setBusy(false);
    }
  }, [data, navigate]);

  const onSubmitFinal = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  // Змінюємо кількість кроків з 6 на 5
  const progress = Math.round((step / 5) * 100);

  const skillToggle = (val: string) =>
    setData(s => {
      const exists = s.skills.includes(val);
      return { ...s, skills: exists ? s.skills.filter(i => i !== val) : [...s.skills, val] };
    });

  const renderStep = () => {
    switch (step) {
      // Кроки 1-4 залишаються без змін
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Основна інформація</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Імʼя *</label>
                <input className={`w-full h-11 rounded-lg border px-3 text-sm ${isOAuth ? 'bg-gray-100 text-gray-500' : ''}`}
                  value={data.firstName}
                  onChange={e => setField('firstName', e.target.value)}
                  readOnly={isOAuth}
                  required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Прізвище *</label>
                <input className={`w-full h-11 rounded-lg border px-3 text-sm ${isOAuth ? 'bg-gray-100 text-gray-500' : ''}`}
                  value={data.lastName}
                  onChange={e => setField('lastName', e.target.value)}
                  readOnly={isOAuth}
                  required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Телефон *</label>
                <input className="w-full h-11 rounded-lg border px-3 text-sm"
                  value={data.phone}
                  onChange={e => setField('phone', e.target.value)}
                  required />
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
            <h3 className="text-xl font-semibold">Облікові дані</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Email *</label>
                <input className={`w-full h-11 rounded-lg border px-3 text-sm ${isOAuth ? 'bg-gray-100 text-gray-500' : ''}`}
                  type="email"
                  value={data.email}
                  onChange={e => setField('email', e.target.value)}
                  readOnly={isOAuth}
                  required />
              </div>
              {!isOAuth && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Пароль *</label>
                  <input className="w-full h-11 rounded-lg border px-3 text-sm"
                    type="password"
                    value={data.password}
                    onChange={e => setField('password', e.target.value)}
                    required />
                </div>
              )}
              {isOAuth && (
                <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                  Ви реєструєтесь через Google. Пароль не потрібен.
                </p>
              )}
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
                  onChange={e => setField('telegram', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Instagram</label>
                <input className="w-full h-11 rounded-lg border px-3 text-sm"
                  value={data.instagram}
                  onChange={e => setField('instagram', e.target.value)} />
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
            <h3 className="text-xl font-semibold">Локація</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Країна *</label>
                <input className="w-full h-11 rounded-lg border px-3 text-sm"
                  value={data.country}
                  onChange={e => setField('country', e.target.value)}
                  required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Місто *</label>
                <input className="w-full h-11 rounded-lg border px-3 text-sm"
                  value={data.city}
                  onChange={e => setField('city', e.target.value)}
                  required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Вулиця *</label>
                <input className="w-full h-11 rounded-lg border px-3 text-sm"
                  value={data.street}
                  onChange={e => setField('street', e.target.value)}
                  required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">№ будинку *</label>
                <input className="w-full h-11 rounded-lg border px-3 text-sm"
                  value={data.house}
                  onChange={e => setField('house', e.target.value)}
                  required />
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
      // Крок 5 (колишній крок 5) - Професійний профіль + YouTube відео + завершення
      case 5:
        return (
          <form onSubmit={onSubmitFinal} className="space-y-6">
            <h3 className="text-xl font-semibold">Професійний профіль</h3>
            <div>
              <label className="text-sm font-medium mb-1 block">Короткий опис *</label>
              <textarea
                className="w-full rounded-lg border px-3 py-2 text-sm resize-none h-24"
                value={data.shortDescription}
                onChange={e => setField('shortDescription', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Повний опис *</label>
              <textarea
                className="w-full rounded-lg border px-3 py-2 text-sm min-h-[140px]"
                value={data.fullDescription}
                onChange={e => setField('fullDescription', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Навички (приклад)</label>
              <div className="flex flex-wrap gap-2">
                {['CBT', 'EMDR', 'Mindfulness', 'Child', 'Trauma'].map(s => {
                  const active = data.skills.includes(s);
                  return (
                    <button
                      type="button"
                      key={s}
                      onClick={() => skillToggle(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        active
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
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
                Додайте відео-презентацію (необов'язково). Можна буде додати пізніше в профілі.
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
                Крок {step}/5
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