import { ApiError } from '@onebox/core';
import { useCore, useNavigator, useT } from '@onebox/core-react';
import { Button, Card, TextField, useToast } from '@onebox/ui';
import { useState, type FormEvent } from 'react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const core = useCore();
  const navigator = useNavigator();
  const toast = useToast();
  const t = useT();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sendCode = async () => {
    if (sending) return;
    if (!EMAIL_RE.test(email)) {
      setError(t('auth.emailInvalid'));
      return;
    }
    setError('');
    setSending(true);
    try {
      await core.session.sendPasswordResetCode(email);
      setCodeSent(true);
      toast.show(t('auth.codeSent'));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : t('auth.resetFailed'));
    } finally {
      setSending(false);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (newPassword.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await core.session.resetPassword(email, code.trim(), newPassword);
      toast.show(t('auth.resetSuccess'));
      navigator.navigate('/login', { replace: true });
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.code === 'INVALID_VERIFICATION_CODE'
          ? t('auth.resetFailed')
          : cause instanceof ApiError
            ? cause.message
            : t('auth.resetFailed'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <h1>{t('auth.forgotTitle')}</h1>
        <form onSubmit={onSubmit} style={{ display: 'contents' }}>
          <TextField
            label={t('auth.email')}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={codeSent}
            required
          />
          {!codeSent ? (
            <Button type="button" variant="secondary" loading={sending} onClick={() => void sendCode()}>
              {t('auth.sendCode')}
            </Button>
          ) : (
            <>
              <TextField
                label={t('auth.code')}
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <TextField
                label={t('auth.newPassword')}
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={error || undefined}
                required
              />
              <Button type="submit" loading={submitting}>
                {t('auth.reset')}
              </Button>
            </>
          )}
        </form>
      </Card>
    </div>
  );
}
