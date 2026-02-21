import React, { useEffect, useState } from 'react';

interface Education { ID: number; Title: string; Institution: string; IssueDate: string; }
interface Photo { id: number; url: string; }
interface Language { ID: number; Name: string; Proficiency: string; }
interface Portfolio {
  ID: number; Description: string; Experience: number;
  City?: string; Address?: string; Rate?: number;
  ContactEmail?: string; ContactPhone?: string;
  Telegram?: string; FacebookURL?: string; InstagramURL?: string;
  ScheduleEnforced: boolean; ClientAgeMin?: number; ClientAgeMax?: number;
  Educations?: Education[]; Photos?: Photo[]; Languages?: Language[];
}
interface Child { ID: number; Age?: number; Gender?: string; }
interface Skill { ID: number; Name: string; Category?: { ID: number; Name: string }; }
interface FullUser {
  ID: number; Email: string; FirstName: string; LastName: string;
  Phone?: string; Role: string; Status: string; Verified: boolean;
  CreatedAt: string; Portfolio?: Portfolio; Child?: Child; Skills?: Skill[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: number | null;
  token: string;
}

export const UserDetailModal: React.FC<Props> = ({ isOpen, onClose, userId, token }) => {
  const [user, setUser] = useState<FullUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !userId || !token) return;
    setLoading(true);
    setErr(null);
    fetch(`/api/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject('Помилка завантаження'))
      .then(setUser)
      .catch(() => setErr('Не вдалося завантажити дані користувача'))
      .finally(() => setLoading(false));
  }, [isOpen, userId, token]);

  if (!isOpen) return null;

  const getImageUrl = (url: string) => url?.startsWith('/uploads') ? `/api${url}` : url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-900">Деталі користувача</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {loading && <div className="text-center py-12 text-gray-400">Завантаження...</div>}
          {err && <div className="text-red-600 bg-red-50 rounded-lg p-3 text-sm">{err}</div>}

          {user && (
            <>
              {/* Аватар */}
              {(() => {
                const firstPhoto = user.Portfolio?.Photos?.[0];
                const avatarUrl = firstPhoto ? getImageUrl(firstPhoto.url) : null;
                const initials = (user.FirstName?.[0] || 'U').toUpperCase() + (user.LastName?.[0] || '').toUpperCase();
                return (
                  <div className="flex items-center gap-4 pb-2 border-b">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="w-20 h-20 rounded-2xl object-cover border border-gray-200 shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-2xl font-bold text-white select-none">{initials}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{user.FirstName} {user.LastName}</p>
                      <p className="text-sm text-gray-500">{user.Email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {user.Role === 'psychologist' ? 'Психолог' : 'Клієнт'} · ID {user.ID}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Основна інформація */}
              <Section title="Основна інформація">
                <Grid>
                  <Field label="ID" value={String(user.ID)} />
                  <Field label="Ім'я" value={`${user.FirstName} ${user.LastName}`} />
                  <Field label="Email" value={user.Email} />
                  <Field label="Телефон" value={user.Phone || '—'} />
                  <Field label="Роль" value={user.Role === 'psychologist' ? 'Психолог' : 'Клієнт'} />
                  <Field label="Статус" value={user.Status} />
                  <Field label="Email підтверджено" value={user.Verified ? 'Так' : 'Ні'} />
                  <Field label="Дата реєстрації" value={user.CreatedAt ? new Date(user.CreatedAt).toLocaleDateString('uk-UA') : '—'} />
                </Grid>
              </Section>

              {/* Портфоліо (тільки психолог) */}
              {user.Role === 'psychologist' && user.Portfolio && user.Portfolio.ID > 0 && (
                <Section title="Портфоліо">
                  <Grid>
                    <Field label="Опис" value={user.Portfolio.Description || '—'} wide />
                    <Field label="Досвід (роки)" value={String(user.Portfolio.Experience ?? '—')} />
                    <Field label="Місто" value={user.Portfolio.City || '—'} />
                    <Field label="Адреса" value={user.Portfolio.Address || '—'} />
                    <Field label="Ставка (грн/год)" value={user.Portfolio.Rate ? String(user.Portfolio.Rate) : '—'} />
                    <Field label="Контактний email" value={user.Portfolio.ContactEmail || '—'} />
                    <Field label="Контактний телефон" value={user.Portfolio.ContactPhone || '—'} />
                    <Field label="Telegram" value={user.Portfolio.Telegram || '—'} />
                    <Field label="Facebook" value={user.Portfolio.FacebookURL || '—'} />
                    <Field label="Instagram" value={user.Portfolio.InstagramURL || '—'} />
                    <Field label="Примусовий розклад" value={user.Portfolio.ScheduleEnforced ? 'Так' : 'Ні'} />
                    {user.Portfolio.ClientAgeMin != null && (
                      <Field label="Вік клієнта" value={`${user.Portfolio.ClientAgeMin}–${user.Portfolio.ClientAgeMax ?? '?'} р.`} />
                    )}
                  </Grid>

                  {user.Portfolio.Educations && user.Portfolio.Educations.length > 0 && (
                    <SubSection title="Освіта">
                      {user.Portfolio.Educations.map(e => (
                        <div key={e.ID} className="text-sm text-gray-700 border-l-2 border-indigo-200 pl-3 py-0.5">
                          <span className="font-medium">{e.Title}</span> — {e.Institution}
                          {e.IssueDate && <span className="text-gray-400 ml-2">{new Date(e.IssueDate).getFullYear()}</span>}
                        </div>
                      ))}
                    </SubSection>
                  )}

                  {user.Portfolio.Languages && user.Portfolio.Languages.length > 0 && (
                    <SubSection title="Мови">
                      <div className="flex flex-wrap gap-2">
                        {user.Portfolio.Languages.map(l => (
                          <span key={l.ID} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs">
                            {l.Name} · {l.Proficiency}
                          </span>
                        ))}
                      </div>
                    </SubSection>
                  )}

                  {user.Portfolio.Photos && user.Portfolio.Photos.length > 0 && (
                    <SubSection title="Фото">
                      <div className="flex flex-wrap gap-2">
                        {user.Portfolio.Photos.map(p => (
                          <img key={p.id} src={getImageUrl(p.url)} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                        ))}
                      </div>
                    </SubSection>
                  )}
                </Section>
              )}

              {/* Дитина (тільки клієнт) */}
              {user.Role === 'client' && user.Child && user.Child.ID > 0 && (
                <Section title="Дитина">
                  <Grid>
                    <Field label="Вік" value={user.Child.Age ? `${user.Child.Age} р.` : '—'} />
                    <Field label="Стать" value={
                      user.Child.Gender === 'male' ? 'Хлопчик' :
                      user.Child.Gender === 'female' ? 'Дівчинка' : '—'
                    } />
                  </Grid>
                </Section>
              )}

              {/* Навички */}
              {user.Skills && user.Skills.length > 0 && (
                <Section title="Навички">
                  <div className="flex flex-wrap gap-2">
                    {user.Skills.map(s => (
                      <span key={s.ID} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {s.Category?.Name && <span className="text-gray-400 mr-1">{s.Category.Name} /</span>}
                        {s.Name}
                      </span>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h4>
    <div className="space-y-3">{children}</div>
  </div>
);

const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mt-3">
    <p className="text-xs font-medium text-gray-400 mb-1.5">{title}</p>
    <div className="space-y-1">{children}</div>
  </div>
);

const Grid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{children}</div>
);

const Field: React.FC<{ label: string; value: string; wide?: boolean }> = ({ label, value, wide }) => (
  <div className={wide ? 'col-span-2 md:col-span-3' : ''}>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm font-medium text-gray-800 break-words">{value}</p>
  </div>
);
