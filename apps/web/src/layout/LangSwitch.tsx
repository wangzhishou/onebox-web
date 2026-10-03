import { useCore, useLocale } from '@onebox/core-react';
import { persistLocale } from '../app/stores';

/** 语言切换:zh-CN ⇄ en 循环,官网 lang-btn 风格(mono 小字) */
export function LangSwitch() {
  const core = useCore();
  const locale = useLocale();
  const next = locale === 'zh-CN' ? 'en' : 'zh-CN';
  return (
    <button
      type="button"
      className="lang-switch"
      aria-label="Language / 语言"
      title="Language / 语言"
      onClick={() => {
        core.i18n.setLocale(next);
        persistLocale(next);
      }}
    >
      {locale === 'zh-CN' ? '中文' : 'EN'}
    </button>
  );
}
