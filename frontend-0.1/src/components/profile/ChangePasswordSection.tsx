import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Save } from 'lucide-react';
import { useToast } from '../ui/Toast';

type Props = {
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
};

const ChangePasswordSection: React.FC<Props> = ({ authenticatedFetch }) => {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [show, setShow] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });
  const [clientError, setClientError] = useState('');

  const handleSubmit = async () => {
    setClientError('');

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setClientError('Заповніть усі поля');
      return;
    }
    if (form.newPassword.length < 8) {
      setClientError('Новий пароль повинен містити щонайменше 8 символів');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setClientError('Новий пароль і підтвердження не збігаються');
      return;
    }

    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/users/self/password', {
        method: 'PUT',
        body: JSON.stringify({
          oldPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      if (response.ok) {
        showToast('Пароль успішно змінено');
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await response.json().catch(() => null);
        const msg = data?.message || 'Помилка зміни пароля';
        if (response.status === 401) {
          setClientError('Поточний пароль невірний');
        } else {
          setClientError(msg);
        }
      }
    } catch {
      showToast('Помилка зʼєднання з сервером', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isDisabled = saving || !form.currentPassword || !form.newPassword || !form.confirmPassword;

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
          <Lock className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-lg font-semibold">Зміна пароля</h2>
      </div>

      <div className="max-w-sm space-y-4">
        <PasswordField
          label="Поточний пароль"
          value={form.currentPassword}
          show={show.current}
          onToggle={() => setShow(s => ({ ...s, current: !s.current }))}
          onChange={v => setForm(f => ({ ...f, currentPassword: v }))}
        />
        <PasswordField
          label="Новий пароль"
          value={form.newPassword}
          show={show.newPass}
          onToggle={() => setShow(s => ({ ...s, newPass: !s.newPass }))}
          onChange={v => setForm(f => ({ ...f, newPassword: v }))}
          hint="Мінімум 8 символів"
        />
        <PasswordField
          label="Підтвердження нового пароля"
          value={form.confirmPassword}
          show={show.confirm}
          onToggle={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
          onChange={v => setForm(f => ({ ...f, confirmPassword: v }))}
        />

        {clientError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {clientError}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isDisabled}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Збереження...' : 'Змінити пароль'}
        </button>
      </div>
    </div>
  );
};

type PasswordFieldProps = {
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (v: string) => void;
  hint?: string;
};

const PasswordField: React.FC<PasswordFieldProps> = ({ label, value, show, onToggle, onChange, hint }) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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

export default ChangePasswordSection;
