import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO, addHours } from 'date-fns';
import { uk } from 'date-fns/locale';
import { ChevronLeft, MapPin, Star, Clock, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import BottomNavigation from '../../components/user/BottomNavigation';
import { MonthCalendar } from '../../components/booking/MonthCalendar';
import { useUserAuth } from '../../context/UserAuthContext';
import { AvailabilitySlot, ScheduleInfo } from '../../types/booking';

type SpecialistInfo = {
  ID: number;
  FirstName?: string;
  LastName?: string;
  AvatarURL?: string;
  Portfolio?: {
    Rate?: number;
    City?: string;
    Experience?: number;
    Description?: string;
  };
  Rating?: number;
};

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useUserAuth();

  const [specialist, setSpecialist] = useState<SpecialistInfo | null>(null);
  const [scheduleInfo, setScheduleInfo] = useState<ScheduleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Free-time форма
  const [freeDate, setFreeDate] = useState('');
  const [freeTime, setFreeTime] = useState('');
  const [freeDuration, setFreeDuration] = useState(60);
  const [freeNotes, setFreeNotes] = useState('');

  useEffect(() => {
    if (!id) return;
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    setLoading(true);
    Promise.all([
      token
        ? axios.get(`/api/users/${id}`, { headers: authHeaders }).catch(() => null)
        : Promise.resolve(null),
      axios.get(`/api/users/${id}/schedule-info`).catch(() => null),
    ])
      .then(([specRes, schedRes]) => {
        if (specRes) setSpecialist(specRes.data);
        if (schedRes) setScheduleInfo(schedRes.data);
        if (!schedRes) setError('Не вдалося завантажити дані спеціаліста');
      })
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleSlotSelect = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot);
    setConfirmOpen(true);
  };

  const handleBookSlot = async () => {
    if (!selectedSlot || !token) return;
    setBookingLoading(true);
    setError('');
    try {
      await axios.post(`/api/users/sessions/book/${selectedSlot.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(true);
      setConfirmOpen(false);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Не вдалося забронювати. Спробуйте ще раз.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleFreeTimeRequest = async () => {
    if (!freeDate || !freeTime || !token || !id) return;
    setBookingLoading(true);
    setError('');
    const startTime = new Date(`${freeDate}T${freeTime}:00`);
    const endTime = addHours(startTime, freeDuration / 60);
    try {
      await axios.post('/api/users/sessions/request', {
        psychologistId: Number(id),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        clientNotes: freeNotes,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Не вдалося надіслати запит.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
          <div className="bg-white rounded-2xl border p-8 max-w-sm w-full text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {scheduleInfo?.scheduleEnforced ? 'Записано!' : 'Запит надіслано!'}
            </h2>
            <p className="text-sm text-gray-500">
              {scheduleInfo?.scheduleEnforced
                ? 'Ваша консультація підтверджена. Деталі можна обговорити в чаті.'
                : 'Спеціаліст отримав ваш запит і незабаром підтвердить його.'}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => navigate('/profile')}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Мої записи
              </button>
              <Link
                to={`/specialist/${id}`}
                className="w-full py-2.5 text-center text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Назад до профілю
              </Link>
            </div>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-24 md:pb-0">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6 pb-16 space-y-5">
        {/* Назад */}
        <Link
          to={`/specialist/${id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Назад до профілю
        </Link>

        {/* Картка спеціаліста */}
        {specialist && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold shrink-0 overflow-hidden">
              {specialist.AvatarURL ? (
                <img src={specialist.AvatarURL} alt="" className="w-full h-full object-cover" />
              ) : (
                (specialist.FirstName?.[0] || '') + (specialist.LastName?.[0] || '')
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800">
                {specialist.FirstName} {specialist.LastName}
              </p>
              <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 mt-0.5">
                {specialist.Portfolio?.City && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {specialist.Portfolio.City}
                  </span>
                )}
                {specialist.Portfolio?.Experience !== undefined && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {specialist.Portfolio.Experience} р. досвіду
                  </span>
                )}
                {typeof specialist.Rating === 'number' && specialist.Rating > 0 && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3 h-3 fill-current" />
                    {specialist.Rating.toFixed(1)}
                  </span>
                )}
              </div>
              {specialist.Portfolio?.Rate && (
                <p className="text-sm font-semibold text-blue-600 mt-1">
                  {specialist.Portfolio.Rate} грн / год
                </p>
              )}
            </div>
          </div>
        )}

        {/* Помилка */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Не залогінений */}
        {!user && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            Для запису на консультацію необхідно{' '}
            <Link to="/login" className="font-medium underline">увійти</Link> в систему.
          </div>
        )}

        {user && scheduleInfo && (
          <>
            {scheduleInfo.scheduleEnforced ? (
              /* === РЕЖИМ: Вибір слоту === */
              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Оберіть зручний час
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Спеціаліст приймає тільки у доступний час
                  </p>
                </div>

                {scheduleInfo.availability.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Наразі немає доступних слотів.</p>
                    <p className="text-xs mt-1">Зверніться до спеціаліста через чат.</p>
                  </div>
                ) : (
                  <MonthCalendar
                    slots={scheduleInfo.availability}
                    onSlotSelect={handleSlotSelect}
                  />
                )}
              </div>
            ) : (
              /* === РЕЖИМ: Вільний час === */
              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-800">
                    Вкажіть зручний час
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Спеціаліст підтвердить запит і ви зможете обговорити деталі
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Дата</label>
                      <input
                        type="date"
                        value={freeDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setFreeDate(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Час</label>
                      <input
                        type="time"
                        value={freeTime}
                        onChange={e => setFreeTime(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Тривалість</label>
                    <select
                      value={freeDuration}
                      onChange={e => setFreeDuration(Number(e.target.value))}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      <option value={30}>30 хв</option>
                      <option value={45}>45 хв</option>
                      <option value={60}>1 година</option>
                      <option value={90}>1.5 години</option>
                      <option value={120}>2 години</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Коментар (необов'язково)
                    </label>
                    <textarea
                      value={freeNotes}
                      onChange={e => setFreeNotes(e.target.value)}
                      placeholder="Опишіть мету звернення або будь-яку іншу інформацію..."
                      rows={3}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleFreeTimeRequest}
                    disabled={!freeDate || !freeTime || bookingLoading}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {bookingLoading ? 'Надсилаємо...' : 'Надіслати запит'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Модалка підтвердження слоту */}
      {confirmOpen && selectedSlot && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-800">Підтвердіть запис</h3>
            <div className="bg-blue-50 rounded-xl p-4 space-y-1">
              <p className="text-sm font-medium text-blue-800">
                {format(parseISO(selectedSlot.startTime), 'EEEE, d MMMM yyyy', { locale: uk })}
              </p>
              <p className="text-sm text-blue-700">
                {format(parseISO(selectedSlot.startTime), 'HH:mm')} –{' '}
                {format(parseISO(selectedSlot.endTime), 'HH:mm')}
              </p>
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmOpen(false); setSelectedSlot(null); setError(''); }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Назад
              </button>
              <button
                onClick={handleBookSlot}
                disabled={bookingLoading}
                className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {bookingLoading ? '...' : 'Записатись'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <BottomNavigation />
    </div>
  );
}
