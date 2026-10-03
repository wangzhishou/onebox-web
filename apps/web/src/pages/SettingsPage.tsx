import { SUPPORTED_LOCALES, type Locale } from '@onebox/core';
import { useCore, useLocale, useNavigator, useSessionState, useStore, useT } from '@onebox/core-react';
import { Badge, Button, Card } from '@onebox/ui';
import { persistLocale, themeStore, type ThemePreference } from '../app/stores';

const THEME_OPTIONS: { value: ThemePreference; labelKey: string }[] = [
  { value: 'light', labelKey: 'theme.light' },
  { value: 'dark', labelKey: 'theme.dark' },
  { value: 'system', labelKey: 'theme.system' },
];

export function SettingsPage() {
  const core = useCore();
  const t = useT();
  const locale = useLocale();
  const session = useSessionState();
  const navigator = useNavigator();
  const theme = useStore(themeStore, (s) => s.preference);

  return (
    <div className="home home--narrow home--padded">
      <div className="content-head">
        <h1>{t('settings.title')}</h1>
      </div>

      <Card className="settings-card">
        <h2>{t('settings.account')}</h2>
        {session.status === 'authenticated' ? (
          <div className="settings-account">
            <div className="settings-account__avatar">
              {(session.user.nickname || session.user.username || session.user.email)
                .slice(0, 1)
                .toUpperCase()}
            </div>
            <div className="settings-account__info">
              <strong>{session.user.nickname || session.user.username}</strong>
              <span>{session.user.email}</span>
              <Badge tone="primary">
                {t('points.label')} {session.user.points}
              </Badge>
            </div>
            <Button variant="secondary" size="sm" onClick={() => core.session.logout()}>
              {t('auth.logout')}
            </Button>
          </div>
        ) : (
          <div className="settings-account">
            <span className="settings-account__hint">{t('settings.loginPrompt')}</span>
            <Button size="sm" onClick={() => navigator.navigate('/login')}>
              {t('auth.login')}
            </Button>
          </div>
        )}
      </Card>

      <Card className="settings-card">
        <h2>{t('settings.theme')}</h2>
        <div className="theme-seg" role="group" aria-label={t('settings.theme')}>
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`theme-seg__btn${theme === option.value ? ' theme-seg__btn--active' : ''}`}
              onClick={() => themeStore.setPreference(option.value)}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </Card>

      <Card className="settings-card">
        <h2>{t('settings.language')}</h2>
        <select
          className="ob-select"
          value={locale}
          onChange={(e) => {
            const next = e.target.value as Locale;
            core.i18n.setLocale(next);
            persistLocale(next);
          }}
        >
          {SUPPORTED_LOCALES.map((l) => (
            <option key={l} value={l}>
              {l === 'zh-CN' ? '简体中文' : 'English'}
            </option>
          ))}
        </select>
      </Card>
    </div>
  );
}
