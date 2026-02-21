import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: number | null;
  userName: string;
  token: string;
}

export const ChangeUserPasswordModal: React.FC<Props> = ({ isOpen, onClose, userId, userName, token }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowNew(false);
    setShowConfirm(false);
    setError(null);
    setSuccess(false);
    setSaving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    if (!newPassword || !confirmPassword) { setError('Заповніть обидва поля'); return; }
    if (newPassword.length < 8) { setError('Пароль повинен містити щонайменше 8 символів'); return; }
    if (newPassword !== confirmPassword) { setError('Паролі не збігаються'); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(handleClose, 1500);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.message || 'Помилка зміни пароля');
      }
    } catch {
      setError('Помилка зʼєднання з сервером');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Зміна пароля</h3>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">Користувач: <span className="font-medium text-gray-800">{userName}</span></p>

          {success ? (
            <div className="text-center py-4">
              <div className="text-green-600 text-2xl mb-2">✓</div>
              <p className="text-green-700 font-medium">Пароль успішно змінено</p>
            </div>
          ) : (
            <>
              <PasswordField
                label="Новий пароль"
                value={newPassword}
                show={showNew}
                onToggle={() => setShowNew(v => !v)}
                onChange={setNewPassword}
                hint="Мінімум 8 символів"
              />
              <PasswordField
                label="Підтвердження пароля"
                value={confirmPassword}
                show={showConfirm}
                onToggle={() => setShowConfirm(v => !v)}
                onChange={setConfirmPassword}
              />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Збереження...' : 'Змінити пароль'}
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Скасувати
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const PasswordField: React.FC<{
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (v: string) => void;
  hint?: string;
}> = ({ label, value, show, onToggle, onChange, hint }) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);
