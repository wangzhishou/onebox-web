import { Store } from './store';

export type Locale = 'zh-CN' | 'en';
export type Dictionary = Record<string, string>;

export const SUPPORTED_LOCALES: readonly Locale[] = ['zh-CN', 'en'];
export const DEFAULT_LOCALE: Locale = 'en';

/** 与网关 locale 归一规则一致:zh* → zh-CN,其余 → en */
export function normalizeLocale(raw: string | null | undefined): Locale {
  return raw?.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

interface I18nState {
  locale: Locale;
}

/**
 * 词典式 i18n:各模块(壳/工具)向同一 store 注册自己的词条,
 * key 全局命名空间化(如 "chat.placeholder"),避免冲突。
 */
export class I18nStore extends Store<I18nState> {
  private dictionaries = new Map<Locale, Dictionary>();

  constructor(initialLocale: Locale) {
    super({ locale: initialLocale });
  }

  get locale(): Locale {
    return this.state.locale;
  }

  setLocale(locale: Locale): void {
    if (locale !== this.state.locale) this.setState({ locale });
  }

  register(locale: Locale, dictionary: Dictionary): void {
    this.dictionaries.set(locale, { ...this.dictionaries.get(locale), ...dictionary });
  }

  t(key: string, params?: Record<string, string | number>): string {
    const template =
      this.dictionaries.get(this.state.locale)?.[key] ??
      this.dictionaries.get(DEFAULT_LOCALE)?.[key] ??
      key;
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in params ? String(params[name]) : match,
    );
  }
}
