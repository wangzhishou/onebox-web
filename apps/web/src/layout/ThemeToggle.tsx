import { useStore, useT } from '@onebox/core-react';
import { themeStore } from '../app/stores';

/** 主题切换:light/dark 循环,图标跟随当前解析结果(官网 icon-btn 风格) */
export function ThemeToggle() {
  const t = useT();
  const resolved = useStore(themeStore, (s) => s.resolved);
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={t('theme.toggle')}
      title={t('theme.toggle')}
      onClick={() => themeStore.toggle()}
    >
      {resolved === 'dark' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
