import { AiConfigService } from './ai-config';
import { ChatService } from './chat';
import { HttpClient } from './http';
import { I18nStore, normalizeLocale, type Locale } from './i18n';
import { PointsService } from './points';
import { SessionStore } from './session';
import { createBrowserStorage, type KeyValueStorage } from './storage';

export interface OneboxCore {
  http: HttpClient;
  session: SessionStore;
  i18n: I18nStore;
  aiConfig: AiConfigService;
  chat: ChatService;
  points: PointsService;
}

export interface CreateCoreOptions {
  /** 网关地址,如 https://api.oneboxable.com */
  apiBaseUrl: string;
  storage?: KeyValueStorage;
  locale?: Locale;
}

/**
 * 组装核心服务单例。依赖单向:HttpClient ← 各服务;Session 的令牌
 * 经回调注入 HttpClient,鉴权失败经回调反向通知 Session 注销。
 */
export function createOneboxCore(options: CreateCoreOptions): OneboxCore {
  const storage = options.storage ?? createBrowserStorage();
  const locale =
    options.locale ??
    normalizeLocale(typeof navigator !== 'undefined' ? navigator.language : null);

  let sessionRef: SessionStore | null = null;
  const http = new HttpClient({
    baseUrl: options.apiBaseUrl,
    getToken: () => sessionRef?.token ?? null,
    onAuthError: () => sessionRef?.logout(),
  });

  const session = new SessionStore(http, storage);
  sessionRef = session;
  session.restore();

  const i18n = new I18nStore(locale);

  return {
    http,
    session,
    i18n,
    aiConfig: new AiConfigService(http),
    chat: new ChatService(http),
    points: new PointsService(http, session),
  };
}
