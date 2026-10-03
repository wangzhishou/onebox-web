import type { HttpClient } from './http';
import type { KeyValueStorage } from './storage';
import { Store } from './store';

/** up_users 的对外投影(models/user.go),空值已由网关归一为 "" */
export interface ApiUser {
  id: number;
  username: string;
  nickname: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  avatar: string;
  points: number;
  invitationCode: string;
  phone: string;
  vipLevel: number;
  totalRechargeAmount: number;
}

/** 登录/注册/积分变动等接口的统一响应:重签 jwt + 最新 user */
export interface JwtResponse {
  jwt: string;
  user: ApiUser;
}

export type SessionState =
  | { status: 'anonymous' }
  | { status: 'authenticated'; jwt: string; user: ApiUser };

const STORAGE_KEY = 'onebox.session.v1';

/**
 * 会话存储:持有 jwt 与用户快照,持久化到注入的 KV 存储。
 * 网关无 /users/me,用户最新数据来自各接口返回的 JwtResponse,
 * 由 applyJwtResponse 统一汇入。
 */
export class SessionStore extends Store<SessionState> {
  constructor(
    private readonly http: HttpClient,
    private readonly storage: KeyValueStorage,
  ) {
    super({ status: 'anonymous' });
  }

  /** 启动时从持久化存储恢复 */
  restore(): void {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { jwt?: string; user?: ApiUser };
      if (parsed.jwt && parsed.user) {
        this.setState({ status: 'authenticated', jwt: parsed.jwt, user: parsed.user });
      }
    } catch {
      this.storage.removeItem(STORAGE_KEY);
    }
  }

  get token(): string | null {
    const s = this.state;
    return s.status === 'authenticated' ? s.jwt : null;
  }

  get user(): ApiUser | null {
    const s = this.state;
    return s.status === 'authenticated' ? s.user : null;
  }

  async login(identifier: string, password: string): Promise<void> {
    const res = await this.http.request<JwtResponse>({
      path: '/api/login',
      body: { identifier, password },
    });
    this.applyJwtResponse(res);
  }

  async register(username: string, email: string, password: string): Promise<void> {
    const res = await this.http.request<JwtResponse>({
      path: '/api/register',
      body: { username, email, password },
    });
    this.applyJwtResponse(res);
  }

  async sendPasswordResetCode(email: string): Promise<void> {
    await this.http.request<{ status: number; message: string }>({
      path: '/api/forgot-password',
      body: { email },
    });
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    await this.http.request<{ status: number; message: string }>({
      path: '/api/reset-password',
      body: { email, code, newPassword },
    });
  }

  /** 任何返回 JwtResponse 的接口(登录/积分/绑定邮箱)都经此汇入 */
  applyJwtResponse(res: JwtResponse): void {
    this.setState({ status: 'authenticated', jwt: res.jwt, user: res.user });
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify({ jwt: res.jwt, user: res.user }));
    } catch {
      // 存储不可用时仅保持内存会话
    }
  }

  logout(): void {
    this.setState({ status: 'anonymous' });
    this.storage.removeItem(STORAGE_KEY);
  }
}
