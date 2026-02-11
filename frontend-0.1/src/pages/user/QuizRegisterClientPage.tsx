import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import BottomNavigation from '../../components/user/BottomNavigation';
import type { GoogleUser } from '../../components/user/GoogleLoginButton';

interface ClientRegistrationData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  country: string;
  city: string;
  street: string;
  house: string;
  // Дані про дитину (опціонально)
  hasChild: boolean;
  childAge?: number;
  childProblem?: string;
  childGender?: 'male' | 'female' | 'notspecified';
}

const empty: ClientRegistrationData = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  password: '',
  country: '',
  city: '',
  street: '',
  house: '',
  hasChild: false,
  childAge: undefined,
  childProblem: '',
  childGender: 'notspecified'
};

const QuizRegisterClientPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const googleUser = location.state?.googleUser as GoogleUser | undefined;
  const isOAuth = !!googleUser;

  const [step, setStep] = useState(1);
  const [data, setData] = useState<ClientRegistrationData>({
    ...empty,
    ...(googleUser ? {
      firstName: googleUser.firstName || '',
      lastName: googleUser.lastName || '',
      email: googleUser.email || '',
    } : {}),
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const setField = <K extends keyof ClientRegistrationData>(k: K, v: ClientRegistrationData[K]) =>
    setData(s => ({ ...s, [k]: v }));

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const submit = useCallback(async () => {
    setError('');
    setBusy(true);
    try {
      // Підготовка payload для реєстрації
      const payload: any = {
        email: data.email,
        password: data.password,
        role: 'client',
        ...(googleUser?.googleId ? { googleId: googleUser.googleId } : {}),
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        country: data.country,
        city: data.city,
        street: data.street,
        house: data.house,
        // Дані про дитину, якщо є
        child: data.hasChild ? {
          age: data.childAge,
          problem: data.childProblem,
          gender: data.childGender
        } : null
      };

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
  }, [data, navigate]);

  const onSubmitFinal = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  const totalSteps = data.hasChild ? 5 : 4;
  const progress = Math.round((step / totalSteps) * 100);

  const renderStep = () => {
    switch (step) {
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
                  placeholder="+380..."
                  required />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={next}
                className="px-6 h-11 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500">
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
                  <p className="text-xs text-gray-500 mt-1">Мінімум 6 символів</p>
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
                className="px-6 h-11 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500">
                Далі
              </button>
            </div>
          </div>
        );

      case 3:
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
                className="px-6 h-11 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500">
                Далі
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Інформація про дитину</h3>
            <p className="text-sm text-gray-600">
              Якщо ви шукаете допомогу для дитини, будь ласка, надайте додаткову інформацію.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="hasChild"
                  className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                  checked={data.hasChild}
                  onChange={e => setField('hasChild', e.target.checked)}
                />
                <label htmlFor="hasChild" className="text-sm font-medium">
                  Я шукаю допомогу для своєї дитини
                </label>
              </div>

              {data.hasChild && (
                <div className="space-y-4 p-4 bg-violet-50 rounded-lg border border-violet-200">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Вік дитини *</label>
                    <input
                      type="number"
                      min="0"
                      max="18"
                      className="w-full h-11 rounded-lg border px-3 text-sm"
                      value={data.childAge || ''}
                      onChange={e => setField('childAge', e.target.value ? parseInt(e.target.value) : undefined)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Стать дитини</label>
                    <select
                      className="w-full h-11 rounded-lg border px-3 text-sm"
                      value={data.childGender}
                      onChange={e => setField('childGender', e.target.value as any)}
                    >
                      <option value="notspecified">Не вказано</option>
                      <option value="male">Хлопчик</option>
                      <option value="female">Дівчинка</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Опис проблеми *</label>
                    <textarea
                      className="w-full rounded-lg border px-3 py-2 text-sm min-h-[100px]"
                      value={data.childProblem}
                      onChange={e => setField('childProblem', e.target.value)}
                      placeholder="Коротко опишіть, з якими труднощами стикається ваша дитина..."
                      required={data.hasChild}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={back}
                className="px-5 h-11 rounded-lg border text-sm hover:bg-gray-50">
                Назад
              </button>
              {data.hasChild ? (
                <button type="button" onClick={next}
                  className="px-6 h-11 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500">
                  Далі
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={busy}
                  className="px-6 h-11 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-60"
                >
                  {busy ? 'Надсилання...' : 'Завершити реєстрацію'}
                </button>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <form onSubmit={onSubmitFinal} className="space-y-6">
            <h3 className="text-xl font-semibold">Підтвердження</h3>
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h4 className="font-medium">Перевірте ваші дані:</h4>
              <div className="grid gap-3 text-sm">
                <div><span className="font-medium">Імʼя:</span> {data.firstName} {data.lastName}</div>
                <div><span className="font-medium">Email:</span> {data.email}</div>
                <div><span className="font-medium">Телефон:</span> {data.phone}</div>
                <div><span className="font-medium">Адреса:</span> {data.country}, {data.city}, {data.street} {data.house}</div>
                {data.hasChild && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="font-medium mb-2">Інформація про дитину:</div>
                    <div><span className="font-medium">Вік:</span> {data.childAge} років</div>
                    <div><span className="font-medium">Стать:</span> {
                      data.childGender === 'male' ? 'Хлопчик' :
                      data.childGender === 'female' ? 'Дівчинка' : 'Не вказано'
                    }</div>
                    <div><span className="font-medium">Проблема:</span> {data.childProblem}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={back}
                className="px-5 h-11 rounded-lg border text-sm hover:bg-gray-50">
                Назад
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-6 h-11 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-60"
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
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Реєстрація користувача</h1>
            <span className="text-xs font-medium text-gray-500">
              Крок {step}/{totalSteps}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-violet-500 transition-all"
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

export default QuizRegisterClientPage;