import { ApiError, type ApiErrorBody } from './errors';

export interface HttpClientOptions {
  baseUrl: string;
  /** 每次请求时取当前令牌;返回 null 则不带 Authorization 头 */
  getToken?: () => string | null;
  /** 收到鉴权类错误(401/AUTH_*)时回调,通常用于清理会话 */
  onAuthError?: (error: ApiError) => void;
  /** 底层 fetch 实现,便于测试替换 */
  fetchImpl?: typeof fetch;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * 网关 HTTP 客户端:Bearer 注入、错误规范化、鉴权失败回调。
 * 不持有会话状态,令牌来源由外部注入,保持单向依赖。
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly getToken?: () => string | null;
  private readonly onAuthError?: (error: ApiError) => void;
  private readonly fetchImpl: typeof fetch;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.getToken = options.getToken;
    this.onAuthError = options.onAuthError;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  /** JSON 请求:自动序列化/反序列化,非 2xx 抛 ApiError */
  async request<T>(options: RequestOptions): Promise<T> {
    const response = await this.send(options);
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ApiError({
        status: response.status,
        code: 'INVALID_JSON',
        name: 'ParseError',
        message: 'Server returned invalid JSON',
      });
    }
  }

  /** 原始请求:用于 SSE 等流式场景。非 2xx 同样抛 ApiError */
  async requestRaw(options: RequestOptions): Promise<Response> {
    return this.send(options);
  }

  private async send(options: RequestOptions): Promise<Response> {
    const url = this.buildUrl(options.path, options.query);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...options.headers,
    };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    const token = this.getToken?.();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: options.signal,
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
      throw ApiError.network(cause);
    }

    if (response.ok) return response;

    const error = await this.readError(response);
    if (error.isAuthError) this.onAuthError?.(error);
    throw error;
  }

  private async readError(response: Response): Promise<ApiError> {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // 非 JSON 错误体(如 502 空 body),走 fromBody 的兜底分支
    }
    return ApiError.fromBody(response.status, body as Partial<ApiErrorBody>);
  }

  private buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
    const url = new URL(`${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    return url.toString();
  }
}
