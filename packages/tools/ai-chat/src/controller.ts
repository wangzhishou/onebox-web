import {
  ApiError,
  chatPointsCost,
  Store,
  type ChatMessage,
  type ChatUsage,
  type ModelConfig,
  type OneboxCore,
} from '@onebox/core';

export type AiChatErrorCode = 'rate-limited' | 'upstream' | 'auth' | 'generic';

export interface AiChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
  errorCode?: AiChatErrorCode;
}

export type AiChatSendResult =
  | 'ok'
  | 'aborted'
  | 'error'
  | 'login-required'
  | 'no-points'
  | 'no-model';

export type ModelsStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface AiChatState {
  messages: AiChatMessage[];
  streaming: boolean;
  modelsStatus: ModelsStatus;
  models: ModelConfig[];
  selectedModelName: string | null;
}

/**
 * AI 聊天控制器:会话状态与网关交互全部收敛于此,框架无关。
 * 页面(/t/ai-chat)与右侧常驻 Dock 共享同一实例,对话随处延续。
 * 不感知路由/toast:门控结果经返回值告知视图层处理。
 */
export class AiChatController extends Store<AiChatState> {
  private abortController: AbortController | null = null;
  private nextId = 1;

  constructor(private readonly core: OneboxCore) {
    super({
      messages: [],
      streaming: false,
      modelsStatus: 'idle',
      models: [],
      selectedModelName: null,
    });
  }

  get selectedModel(): ModelConfig | null {
    const { models, selectedModelName } = this.state;
    return models.find((m) => m.name === selectedModelName) ?? null;
  }

  async loadModels(): Promise<void> {
    if (this.state.modelsStatus === 'loading' || this.state.modelsStatus === 'ready') return;
    this.setState({ ...this.state, modelsStatus: 'loading' });
    try {
      const config = await this.core.aiConfig.getConfig(this.core.i18n.locale);
      if (config.models.length === 0) {
        this.setState({ ...this.state, modelsStatus: 'error' });
        return;
      }
      const keep = config.models.some((m) => m.name === this.state.selectedModelName);
      this.setState({
        ...this.state,
        modelsStatus: 'ready',
        models: config.models,
        selectedModelName: keep ? this.state.selectedModelName : config.models[0]!.name,
      });
    } catch {
      this.setState({ ...this.state, modelsStatus: 'error' });
    }
  }

  retryLoadModels(): void {
    this.setState({ ...this.state, modelsStatus: 'idle' });
    void this.loadModels();
  }

  selectModel(name: string): void {
    if (this.state.models.some((m) => m.name === name)) {
      this.setState({ ...this.state, selectedModelName: name });
    }
  }

  async send(text: string): Promise<AiChatSendResult> {
    const trimmed = text.trim();
    if (!trimmed || this.state.streaming) return 'error';

    const user = this.core.session.user;
    if (!user) return 'login-required';
    if (user.points <= 0) return 'no-points';

    const model = this.selectedModel;
    if (!model) return 'no-model';

    const history: ChatMessage[] = this.state.messages
      .filter((m) => !m.errorCode && !m.pending)
      .map((m) => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: trimmed });

    const userId = this.nextId++;
    const assistantId = this.nextId++;
    this.setState({
      ...this.state,
      streaming: true,
      messages: [
        ...this.state.messages,
        { id: userId, role: 'user', content: trimmed },
        { id: assistantId, role: 'assistant', content: '', pending: true },
      ],
    });

    const controller = new AbortController();
    this.abortController = controller;
    let usage: ChatUsage | null = null;
    let result: AiChatSendResult = 'ok';

    try {
      for await (const event of this.core.chat.streamChat({
        provider: model.provider,
        model: model.name,
        messages: history,
        signal: controller.signal,
      })) {
        if (event.type === 'delta') {
          this.patchMessage(assistantId, (m) => ({
            ...m,
            pending: false,
            content: m.content + event.text,
          }));
        } else if (event.type === 'usage') {
          usage = event.usage;
        }
      }
      this.patchMessage(assistantId, (m) =>
        m.pending ? { ...m, pending: false, content: m.content || '…' } : m,
      );
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') {
        this.patchMessage(assistantId, (m) => ({ ...m, pending: false }));
        result = 'aborted';
      } else {
        const errorCode: AiChatErrorCode =
          cause instanceof ApiError
            ? cause.isRateLimited
              ? 'rate-limited'
              : cause.isAuthError
                ? 'auth'
                : cause.status === 502
                  ? 'upstream'
                  : 'generic'
            : 'generic';
        this.patchMessage(assistantId, (m) => ({ ...m, pending: false, errorCode }));
        result = errorCode === 'auth' ? 'login-required' : 'error';
      }
    } finally {
      this.abortController = null;
      this.setState({ ...this.state, streaming: false });
      this.settleBilling(usage, model);
    }
    return result;
  }

  stop(): void {
    this.abortController?.abort();
  }

  clear(): void {
    if (this.state.streaming) return;
    this.setState({ ...this.state, messages: [] });
  }

  private patchMessage(id: number, patch: (m: AiChatMessage) => AiChatMessage): void {
    this.setState({
      ...this.state,
      messages: this.state.messages.map((m) => (m.id === id ? patch(m) : m)),
    });
  }

  /** 与 App 同一契约:回答完成后客户端事后上报扣减,失败静默 */
  private settleBilling(usage: ChatUsage | null, model: ModelConfig): void {
    if (!usage) return;
    const cost = chatPointsCost(usage, model.basePoints);
    if (cost <= 0) return;
    void this.core.points.consume({
      points: cost,
      desc: `AI Chat (${model.title || model.name})`,
      source: 'WebChat',
    });
  }
}
