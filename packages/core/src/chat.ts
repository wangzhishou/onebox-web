import type { HttpClient } from './http';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface StreamChatParams {
  /** 路由段:/openai/:provider */
  provider: string;
  /** 透传给上游的模型名 */
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export type ChatStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'usage'; usage: ChatUsage }
  | { type: 'done' };

interface RawChunk {
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  } | null;
}

/**
 * OpenAI 兼容流式聊天:POST /openai/{provider}/v1/chat/completions。
 * 网关是透明反代,响应即上游 SSE(data: {...}\n\n,以 data: [DONE] 结束)。
 *
 * 注意:命中内容审核时网关会返回 HTTP 200 的伪正常响应(兜底文案),
 * 协议层无法区分,按普通回答展示即可。
 */
export class ChatService {
  constructor(private readonly http: HttpClient) {}

  async *streamChat(params: StreamChatParams): AsyncGenerator<ChatStreamEvent> {
    const response = await this.http.requestRaw({
      path: `/openai/${encodeURIComponent(params.provider)}/v1/chat/completions`,
      headers: { Accept: 'text/event-stream' },
      signal: params.signal,
      body: {
        model: params.model,
        messages: params.messages,
        stream: true,
        stream_options: { include_usage: true },
        ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
        ...(params.maxTokens !== undefined ? { max_tokens: params.maxTokens } : {}),
      },
    });

    if (!response.body) {
      throw new Error('Response body is not readable');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let boundary: number;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const event = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          for (const parsed of parseSseEvent(event)) {
            if (parsed === '[DONE]') {
              yield { type: 'done' };
              return;
            }
            const chunk = safeParseChunk(parsed);
            if (!chunk) continue;
            const text = chunk.choices?.[0]?.delta?.content;
            if (text) yield { type: 'delta', text };
            if (chunk.usage) {
              yield {
                type: 'usage',
                usage: {
                  promptTokens: chunk.usage.prompt_tokens ?? 0,
                  completionTokens: chunk.usage.completion_tokens ?? 0,
                  totalTokens: chunk.usage.total_tokens ?? 0,
                },
              };
            }
          }
        }
      }
    } finally {
      reader.cancel().catch(() => undefined);
    }
    yield { type: 'done' };
  }
}

function* parseSseEvent(raw: string): Generator<string> {
  for (const line of raw.split('\n')) {
    const trimmed = line.trimEnd();
    if (trimmed.startsWith('data:')) {
      yield trimmed.slice(5).trimStart();
    }
  }
}

function safeParseChunk(data: string): RawChunk | null {
  try {
    return JSON.parse(data) as RawChunk;
  } catch {
    return null;
  }
}
