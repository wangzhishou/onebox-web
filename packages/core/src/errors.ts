/** 网关统一错误体(service/response.go) */
export interface ApiErrorBody {
  data: null;
  error: {
    status: number;
    code: string;
    name: string;
    message: string;
    details?: unknown;
  };
}

/** 鉴权类错误码:出现即应清理本地会话并引导重新登录 */
export const AUTH_ERROR_CODES = new Set([
  'AUTH_MISSING',
  'AUTH_MALFORMED',
  'AUTH_TOKEN_EXPIRED',
  'AUTH_TOKEN_INVALID',
]);

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errorName: string;
  readonly details?: unknown;

  constructor(init: {
    status: number;
    code: string;
    name: string;
    message: string;
    details?: unknown;
  }) {
    super(init.message);
    this.status = init.status;
    this.code = init.code;
    this.errorName = init.name;
    this.details = init.details;
  }

  get isAuthError(): boolean {
    return this.status === 401 || AUTH_ERROR_CODES.has(this.code);
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }

  static fromBody(status: number, body: unknown): ApiError {
    const err = (body as Partial<ApiErrorBody> | null)?.error;
    if (err && typeof err.code === 'string') {
      return new ApiError({
        status: err.status ?? status,
        code: err.code,
        name: err.name ?? 'Error',
        message: err.message ?? `Request failed with status ${status}`,
        details: err.details,
      });
    }
    return new ApiError({
      status,
      code: `HTTP_${status}`,
      name: 'HttpError',
      message: `Request failed with status ${status}`,
    });
  }

  static network(cause: unknown): ApiError {
    return new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      name: 'NetworkError',
      message: cause instanceof Error ? cause.message : 'Network request failed',
      details: cause,
    });
  }
}
