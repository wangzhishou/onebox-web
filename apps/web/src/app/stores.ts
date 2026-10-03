import { Store, type Locale } from '@onebox/core';

const FAVORITES_KEY = 'onebox.favorites.v1';

/** 工具收藏:localStorage 持久化,壳级单例 */
class FavoritesStore extends Store<{ slugs: string[] }> {
  constructor() {
    super({ slugs: readSlugs() });
  }

  has(slug: string): boolean {
    return this.state.slugs.includes(slug);
  }

  toggle(slug: string): void {
    const slugs = this.has(slug)
      ? this.state.slugs.filter((s) => s !== slug)
      : [...this.state.slugs, slug];
    this.setState({ slugs });
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(slugs));
    } catch {
      // 存储不可用时仅保持内存态
    }
  }
}

function readSlugs(): string[] {
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

/** 顶栏搜索词:工具栏写入,首页消费 */
class SearchStore extends Store<{ query: string }> {
  constructor() {
    super({ query: '' });
  }

  setQuery(query: string): void {
    if (query !== this.state.query) this.setState({ query });
  }
}

const RECENT_KEY = 'onebox.recent.v1';
const RECENT_CAP = 12;

/** 最近使用:进入工具页时记录,localStorage 持久化 */
class RecentStore extends Store<{ slugs: string[] }> {
  constructor() {
    super({ slugs: readRecent() });
  }

  record(slug: string): void {
    if (this.state.slugs[0] === slug) return;
    const slugs = [slug, ...this.state.slugs.filter((s) => s !== slug)].slice(0, RECENT_CAP);
    this.setState({ slugs });
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(slugs));
    } catch {
      // 存储不可用时仅保持内存态
    }
  }
}

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export const favoritesStore = new FavoritesStore();
export const searchStore = new SearchStore();
export const recentStore = new RecentStore();

const LOCALE_KEY = 'onebox.locale.v1';

/** 读取持久化的语言选择(无则返回 null,由 core 回退到浏览器语言) */
export function readStoredLocale(): Locale | null {
  try {
    const raw = window.localStorage.getItem(LOCALE_KEY);
    return raw === 'zh-CN' || raw === 'en' ? raw : null;
  } catch {
    return null;
  }
}

export function persistLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // 存储不可用时仅保持内存态
  }
}

export type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

const THEME_KEY = 'onebox.theme.v1';

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference;
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function readStoredPreference(): ThemePreference | null {
  try {
    const raw = window.localStorage.getItem(THEME_KEY);
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : null;
  } catch {
    return null;
  }
}

/** 初始解析顺序:URL ?theme=light|dark > localStorage > system;解析后清掉地址栏参数 */
function readInitialPreference(): ThemePreference {
  try {
    const url = new URL(window.location.href);
    const param = url.searchParams.get('theme');
    if (param === 'light' || param === 'dark') {
      url.searchParams.delete('theme');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      return param;
    }
  } catch {
    // 忽略异常 URL 环境
  }
  return readStoredPreference() ?? 'system';
}

/**
 * 主题:preference 持久化到 localStorage,resolved 写到 document.documentElement.dataset.theme;
 * preference 为 system 时跟随 prefers-color-scheme 变化
 */
class ThemeStore extends Store<{ preference: ThemePreference; resolved: ResolvedTheme }> {
  constructor() {
    const preference = readInitialPreference();
    super({ preference, resolved: resolveTheme(preference) });
    this.apply();
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.state.preference === 'system') this.refresh();
      });
    } catch {
      // matchMedia 不可用时仅保持静态解析
    }
  }

  setPreference(preference: ThemePreference): void {
    try {
      window.localStorage.setItem(THEME_KEY, preference);
    } catch {
      // 存储不可用时仅保持内存态
    }
    if (preference !== this.state.preference) {
      this.setState({ preference, resolved: resolveTheme(preference) });
      this.apply();
    }
  }

  /** 侧栏切换:按当前解析结果在 light/dark 间循环 */
  toggle(): void {
    this.setPreference(this.state.resolved === 'dark' ? 'light' : 'dark');
  }

  private refresh(): void {
    const resolved = resolveTheme(this.state.preference);
    if (resolved !== this.state.resolved) {
      this.setState({ preference: this.state.preference, resolved });
      this.apply();
    }
  }

  private apply(): void {
    document.documentElement.dataset.theme = this.state.resolved;
  }
}

export const themeStore = new ThemeStore();
