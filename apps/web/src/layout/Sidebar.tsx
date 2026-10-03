import { useNavigator, useSessionState, useT } from '@onebox/core-react';
import { Badge, Button } from '@onebox/ui';
import { useLinkProps, usePath } from '../app/router';

interface NavEntry {
  key: string;
  icon: string;
  labelKey: string;
  path?: string;
  action?: 'open-chat';
  dot?: boolean;
  match: (path: string) => boolean;
}

const NAV_ENTRIES: NavEntry[] = [
  { key: 'tools', icon: '▦', labelKey: 'nav.allTools', path: '/', match: (p) => p === '/' || p.startsWith('/t/') },
  { key: 'ai', icon: '✦', labelKey: 'nav.ai', action: 'open-chat', dot: true, match: () => false },
  { key: 'favorites', icon: '♡', labelKey: 'nav.favorites', path: '/favorites', match: (p) => p === '/favorites' },
  { key: 'recent', icon: '◷', labelKey: 'nav.recent', path: '/recent', match: (p) => p === '/recent' },
  { key: 'settings', icon: '⚙', labelKey: 'nav.settings', path: '/settings', match: (p) => p === '/settings' },
];

/** 左侧 220px 文字侧栏:品牌 + 导航 + 底部账号块(对齐 design.html) */
export function Sidebar(props: { open: boolean; onOpenChat: () => void; onNavigate?: () => void }) {
  const t = useT();
  const path = usePath();
  const session = useSessionState();
  const navigator = useNavigator();

  return (
    <aside className={`sidebar${props.open ? ' sidebar--open' : ''}`} aria-label="Sidebar">
      <div className="sidebar__logo">
        <img className="sidebar__logo-img" src="/icon.webp" alt="OneBox" />
        <span className="sidebar__logo-text">OneBox</span>
      </div>

      <nav className="sidebar__nav">
        {NAV_ENTRIES.map((entry) => (
          <NavItem
            key={entry.key}
            entry={entry}
            label={t(entry.labelKey)}
            active={entry.match(path)}
            onOpenChat={props.onOpenChat}
            onNavigate={props.onNavigate}
          />
        ))}
      </nav>

      <div className="sidebar__footer">
        {session.status === 'authenticated' ? (
          <button className="sidebar__account" onClick={() => { props.onNavigate?.(); navigator.navigate('/settings'); }}>
            <span className="sidebar__account-avatar">
              {(session.user.nickname || session.user.username || session.user.email)
                .slice(0, 1)
                .toUpperCase()}
            </span>
            <span className="sidebar__account-name">
              {session.user.nickname || session.user.username || session.user.email}
            </span>
            <Badge tone="primary">{session.user.points}</Badge>
          </button>
        ) : (
          <div className="sidebar__account">
            <span className="sidebar__account-hint">{t('settings.loginPrompt')}</span>
            <Button size="sm" onClick={() => { props.onNavigate?.(); navigator.navigate('/login'); }}>
              {t('auth.login')}
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavItem(props: {
  entry: NavEntry;
  label: string;
  active: boolean;
  onOpenChat: () => void;
  onNavigate?: () => void;
}) {
  const link = useLinkProps(props.entry.path ?? '/');
  const className = `sidebar__nav-item${props.active ? ' sidebar__nav-item--active' : ''}`;

  if (props.entry.action === 'open-chat') {
    return (
      <button type="button" className={className} onClick={() => { props.onOpenChat(); props.onNavigate?.(); }}>
        <span className="sidebar__nav-icon">{props.entry.icon}</span>
        {props.label}
        {props.entry.dot ? <span className="sidebar__nav-dot" aria-hidden="true" /> : null}
      </button>
    );
  }
  return (
    <a
      {...link}
      className={className}
      aria-current={props.active ? 'page' : undefined}
      onClick={(e) => { link.onClick(e); props.onNavigate?.(); }}
    >
      <span className="sidebar__nav-icon">{props.entry.icon}</span>
      {props.label}
    </a>
  );
}
