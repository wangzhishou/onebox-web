import { ApiError } from '@onebox/core';
import { useCore, useNavigator, useT } from '@onebox/core-react';
import { Button, Card, TextField, useToast } from '@onebox/ui';
import { useState, type FormEvent } from 'react';
import { useLinkProps } from '../app/router';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  const core = useCore();
  const navigator = useNavigator();
  const toast = useToast();
  const t = useT();
  const registerLink = useLinkProps('/register');
  const forgotLink = useLinkProps('/forgot-password');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!EMAIL_RE.test(email)) {
      setError(t('auth.emailInvalid'));
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await core.session.login(email, password);
      toast.show(t('auth.loginTitle'));
      navigator.navigate('/', { replace: true });
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.code === 'LOGIN_FAILED'
          ? t('auth.loginFailed')
          : cause instanceof ApiError
            ? cause.message
            : t('auth.loginFailed'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <h1>{t('auth.loginTitle')}</h1>
        <form onSubmit={onSubmit} style={{ display: 'contents' }}>
          <TextField
            label={t('auth.email')}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label={t('auth.password')}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error || undefined}
            required
          />
          <Button type="submit" loading={submitting}>
            {t('auth.login')}
          </Button>
        </form>
        <div className="auth-card__links">
          <a {...registerLink}>{t('auth.noAccount')}</a>
          <a {...forgotLink}>{t('auth.forgot')}</a>
        </div>
      </Card>
    </div>
  );
}
