import type { HttpClient } from './http';
import type { JwtResponse, SessionStore } from './session';
import type { ChatUsage } from './chat';

export interface ConsumePointsParams {
  points: number;
  desc: string;
  source: string;
}

/**
 * 积分服务。扣减为客户端事后上报(与 Android 端同一契约):
 * 报多少扣多少,余额不足扣到 0 不报错;响应带回最新 user 与重签 jwt。
 */
export class PointsService {
  constructor(
    private readonly http: HttpClient,
    private readonly session: SessionStore,
  ) {}

  /** 扣减并同步最新余额到会话。失败时静默返回 false(与 App 行为一致) */
  async consume(params: ConsumePointsParams): Promise<boolean> {
    if (params.points <= 0) return true;
    try {
      const res = await this.http.request<JwtResponse>({
        path: '/user/consume-points',
        body: {
          points: Math.round(params.points),
          time: Date.now(),
          desc: params.desc,
          source: params.source,
        },
      });
      this.session.applyJwtResponse(res);
      return true;
    } catch {
      return false;
    }
  }
}

/** 计费公式:积分 ≈ totalTokens × basePoints,有消耗时至少 1 分 */
export function chatPointsCost(usage: ChatUsage, basePoints: number): number {
  if (usage.totalTokens <= 0 || basePoints <= 0) return 0;
  return Math.max(1, Math.round(usage.totalTokens * basePoints));
}
