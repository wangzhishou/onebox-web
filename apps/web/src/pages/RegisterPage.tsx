import { ApiError } from '@onebox/core';
import { useCore, useNavigator, useT } from '@onebox/core-react';
import { Button, Card, TextField } from '@onebox/ui';
import { useState, type FormEvent } from 'react';
import { useLinkProps } from '../app/router';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterPage() {
  const core = useCore();
  const navigator = useNavigator();
  const t = useT();
  const loginLink = useLinkProps('/login');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!EMAIL_RE.test(email)) {
      setError(t('auth.emailInvalid'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await core.session.register(username.trim() || email.split('@')[0]!, email, password);
      navigator.navigate('/', { replace: true });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : t('auth.registerFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <h1>{t('auth.registerTitle')}</h1>
        <form onSubmit={onSubmit} style={{ display: 'contents' }}>
          <TextField
            label={t('auth.username')}
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <TextField
            label={t('auth.confirmPassword')}
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={error || undefined}
            required
          />
          <Button type="submit" loading={submitting}>
            {t('auth.register')}
          </Button>
        </form>
        <div className="auth-card__links">
          <a {...loginLink}>{t('auth.hasAccount')}</a>
        </div>
      </Card>
    </div>
  );
}
