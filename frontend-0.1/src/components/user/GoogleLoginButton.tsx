import React, { useEffect, useRef } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

interface GoogleLoginButtonProps {
  onSuccess: (response: GoogleAuthResponse) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export interface GoogleUser {
  email: string;
  firstName: string;
  lastName: string;
  googleId: string;
}

export interface GoogleAuthResponse {
  status: 'authenticated' | 'registration_required';
  access_token?: string;
  googleUser?: GoogleUser;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError, disabled }) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) {
        // GIS SDK not loaded yet, retry
        setTimeout(initializeGoogle, 100);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
          locale: 'uk',
        });
      }
    };

    initializeGoogle();
  }, []);

  const handleCredentialResponse = async (response: { credential: string }) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Помилка авторизації через Google' }));
        onError(errorData.message || 'Помилка авторизації через Google');
        return;
      }

      const data: GoogleAuthResponse = await res.json();
      onSuccess(data);
    } catch (err) {
      console.error('Google auth error:', err);
      onError('Помилка з\'єднання з сервером');
    }
  };

  return (
    <div
      ref={buttonRef}
      style={{ display: 'flex', justifyContent: 'center', opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
    />
  );
};

export default GoogleLoginButton;
