import type { HttpClient } from './http';
import type { Locale } from './i18n';

/** GET /api/ai/config 的响应契约(models/ai_config.go) */
export interface EngineConfig {
  name: string;
  title: string;
  description: string;
  stream: boolean;
  vipLevel: number;
  defaultModelId: number;
  enabled: boolean;
  sortOrder: number;
  iconName: string;
  supportToolCalls: boolean;
}

export interface ModelConfig {
  id: number;
  /** 透传给上游的模型名,即请求体 model 字段 */
  name: string;
  title: string;
  description: string;
  /** 决定走 /openai/:provider 的哪一段 */
  provider: string;
  canUploadFile: boolean;
  canNetwork: boolean;
  canReasoning: boolean;
  canImage: boolean;
  canVideo: boolean;
  temperature: number;
  topP: number;
  maxTokens: number;
  contextWindowTokens: number;
  free: boolean;
  /** 积分计费系数:扣减积分 ≈ totalTokens × basePoints */
  basePoints: number;
  enabled: boolean;
  sortOrder: number;
  isFast: boolean;
  isCode: boolean;
  supportToolCalls: boolean;
}

export interface AiConfig {
  version: string;
  engines: EngineConfig[];
  models: ModelConfig[];
}

interface AiConfigResponse {
  code: number;
  message: string;
  data: AiConfig;
}

/**
 * AI 引擎/模型清单。AnyAuth 接口,登录与游客皆可;内存缓存一个版本。
 * 模型选择器约定:model.provider → 路由段,model.name → 请求体 model。
 */
export class AiConfigService {
  private cache = new Map<Locale, Promise<AiConfig>>();

  constructor(private readonly http: HttpClient) {}

  getConfig(locale: Locale): Promise<AiConfig> {
    let pending = this.cache.get(locale);
    if (!pending) {
      pending = this.http
        .request<AiConfigResponse>({ method: 'GET', path: '/api/ai/config', query: { locale } })
        .then((res) => ({
          version: res.data.version,
          engines: res.data.engines.filter((e) => e.enabled).sort(bySortOrder),
          models: res.data.models.filter((m) => m.enabled).sort(bySortOrder),
        }));
      this.cache.set(locale, pending);
      // 失败不缓存,下次重试
      pending.catch(() => this.cache.delete(locale));
    }
    return pending;
  }

  invalidate(): void {
    this.cache.clear();
  }
}

function bySortOrder(a: { sortOrder: number }, b: { sortOrder: number }): number {
  return a.sortOrder - b.sortOrder;
}
