import React, { useState } from 'react';
import { Briefcase, Edit3, Save, MapPin, Phone, Mail, Clock, Users, Calendar, MessageCircle, Video } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const getEmbedUrl = (url: string): string | null => {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
};
import { UserProfile } from './types';
import { useToast } from '../ui/Toast';
import RangeSlider, { DualRangeSlider } from '../ui/RangeSlider';

type Props = {
  user: UserProfile;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onReload: () => void;
};

const PortfolioSection: React.FC<Props> = ({ user, authenticatedFetch, onReload }) => {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const p = user.portfolio;

  const [form, setForm] = useState({
    description: p?.description || '',
    experience: p?.experience || 0,
    contactEmail: p?.contactEmail || '',
    contactPhone: p?.contactPhone || '',
    city: p?.city || '',
    address: p?.address || '',
    dateOfBirth: p?.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
    gender: p?.gender || '',
    telegram: p?.telegram || '',
    facebookURL: p?.facebookURL || '',
    instagramURL: p?.instagramURL || '',
    videoURL: p?.videoURL || '',
    rate: p?.rate || 0,
    clientAgeMin: p?.clientAgeMin || 0,
    clientAgeMax: p?.clientAgeMax || 0,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/users/self/portfolio', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      if (response.ok) {
        showToast('Портфоліо збережено');
        onReload();
        setEditing(false);
      } else {
        showToast('Помилка збереження', 'error');
      }
    } catch {
      showToast('Помилка збереження', 'error');
    } finally {
      setSaving(false);
    }
  };

  const genderLabel = (g?: string) => {
    if (g === 'male') return 'Чоловік';
    if (g === 'female') return 'Жінка';
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Портфоліо</h2>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Edit3 className="w-4 h-4" />Редагувати
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-6">
          {/* Group: About */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-gray-700 mb-2">Про себе</legend>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Опис діяльності</label>
              <div className="rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                <ReactQuill
                  theme="snow"
                  value={form.description}
                  onChange={v => setForm({ ...form, description: v })}
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link'],
                      ['clean'],
                    ],
                  }}
                  placeholder="Розкажіть про свій досвід та підходи до роботи..."
                  className="portfolio-editor"
                />
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <RangeSlider
                label="Досвід роботи"
                value={form.experience}
                onChange={v => setForm({ ...form, experience: v })}
                min={0}
                max={50}
                step={1}
                suffix=" р."
                minLabel="0"
                maxLabel="50+"
              />
              <RangeSlider
                label="Ставка за годину"
                value={form.rate}
                onChange={v => setForm({ ...form, rate: v })}
                min={0}
                max={5000}
                step={50}
                suffix=" грн"
                minLabel="0"
                maxLabel="5000+"
              />
            </div>
            <DualRangeSlider
              label="Вік клієнтів"
              valueMin={form.clientAgeMin}
              valueMax={form.clientAgeMax}
              onChangeMin={v => setForm({ ...form, clientAgeMin: v })}
              onChangeMax={v => setForm({ ...form, clientAgeMax: v })}
              min={0}
              max={100}
              step={1}
              suffix=" р."
            />
          </fieldset>

          {/* Group: Location */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-gray-700 mb-2">Розташування</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Місто</label>
                <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Київ" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Адреса</label>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
          </fieldset>

          {/* Group: Contacts */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-gray-700 mb-2">Контакти</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Email для зв'язку</label>
                <input type="email" value={form.contactEmail}
                  onChange={e => setForm({ ...form, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Телефон для зв'язку</label>
                <input type="tel" value={form.contactPhone}
                  onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Telegram</label>
                <input value={form.telegram} onChange={e => setForm({ ...form, telegram: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="@username" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Instagram</label>
                <input value={form.instagramURL} onChange={e => setForm({ ...form, instagramURL: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="@username" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Facebook</label>
                <input value={form.facebookURL} onChange={e => setForm({ ...form, facebookURL: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">YouTube відео</label>
                <input value={form.videoURL} onChange={e => setForm({ ...form, videoURL: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://youtube.com/watch?v=..." />
              </div>
            </div>
          </fieldset>

          {/* Group: Personal */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-gray-700 mb-2">Особисте</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Дата народження</label>
                <input type="date" value={form.dateOfBirth}
                  onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Стать</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Не вказано</option>
                  <option value="male">Чоловік</option>
                  <option value="female">Жінка</option>
                </select>
              </div>
            </div>
          </fieldset>

          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              <Save className="w-4 h-4" />{saving ? 'Збереження...' : 'Зберегти'}
            </button>
            <button onClick={() => setEditing(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Скасувати
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Description */}
          {p?.description && (
            <div
              className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: p.description }}
            />
          )}

          {/* Info grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {p?.experience ? <InfoChip icon={<Clock className="w-4 h-4" />} label="Досвід" value={`${p.experience} р.`} /> : null}
            {p?.rate ? <InfoChip icon={<span className="font-semibold text-sm">₴</span>} label="Ставка" value={`${p.rate} грн/год`} /> : null}
            {p?.city ? <InfoChip icon={<MapPin className="w-4 h-4" />} label="Місто" value={p.address ? `${p.city}, ${p.address}` : p.city} /> : null}
            {(p?.clientAgeMin || p?.clientAgeMax) ? <InfoChip icon={<Users className="w-4 h-4" />} label="Вік клієнтів" value={`${p?.clientAgeMin || 0} — ${p?.clientAgeMax || '...'} р.`} /> : null}
            {genderLabel(p?.gender) ? <InfoChip icon={<Calendar className="w-4 h-4" />} label="Стать" value={genderLabel(p?.gender)!} /> : null}
            {p?.dateOfBirth ? <InfoChip icon={<Calendar className="w-4 h-4" />} label="Дата народження" value={new Date(p.dateOfBirth).toLocaleDateString('uk-UA')} /> : null}
          </div>

          {/* Video embed */}
          {p?.videoURL && (() => {
            const embedUrl = getEmbedUrl(p.videoURL!);
            return embedUrl ? (
              <div className="pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  <Video className="w-3.5 h-3.5" /> Відео
                </span>
                <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-gray-100">
                <a href={p.videoURL!} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-full hover:bg-red-100 transition-colors border border-red-200">
                  <Video className="w-3.5 h-3.5" /> Відео
                </a>
              </div>
            );
          })()}

          {/* Contacts */}
          {(p?.contactEmail || p?.contactPhone || p?.telegram || p?.instagramURL || p?.facebookURL) && (
            <div className="pt-3 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Контакти</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {p?.contactEmail && <ContactBadge icon={<Mail className="w-3.5 h-3.5" />} value={p.contactEmail} />}
                {p?.contactPhone && <ContactBadge icon={<Phone className="w-3.5 h-3.5" />} value={p.contactPhone} />}
                {p?.telegram && <ContactBadge icon={<MessageCircle className="w-3.5 h-3.5" />} value={p.telegram} />}
                {p?.instagramURL && <ContactBadge icon={<span className="text-xs">IG</span>} value={p.instagramURL} />}
                {p?.facebookURL && <ContactBadge icon={<span className="text-xs">FB</span>} value={p.facebookURL} href={p.facebookURL} />}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const InfoChip: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
    <div className="text-gray-400">{icon}</div>
    <div>
      <span className="block text-xs text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  </div>
);

const ContactBadge: React.FC<{ icon: React.ReactNode; value: string; href?: string }> = ({ icon, value, href }) => {
  const cls = "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-full border border-gray-200";
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={`${cls} hover:bg-gray-100`}>{icon}{value}</a>;
  return <span className={cls}>{icon}{value}</span>;
};

export default PortfolioSection;
