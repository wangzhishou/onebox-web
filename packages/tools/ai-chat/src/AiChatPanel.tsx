import { useNavigator, useStore, useT } from '@onebox/core-react';
import { Button, Card, Select, TextArea, useToast } from '@onebox/ui';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useAiChat } from './context';
import type { AiChatErrorCode } from './controller';
import './chat-page.css';

const ERROR_KEY: Record<AiChatErrorCode, string> = {
  'rate-limited': 'chat.rateLimited',
  upstream: 'chat.errorUpstream',
  auth: 'chat.loginRequired',
  generic: 'chat.errorGeneric',
};

const CHIP_KEYS = ['chat.chip1', 'chat.chip2', 'chat.chip3'] as const;

export interface AiChatPanelProps {
  variant: 'page' | 'dock';
  /** dock 形态下由壳注入:收起面板 */
  onCollapse?: () => void;
}

/**
 * AI 聊天面板:page(整页)与 dock(右侧常驻)双形态,共享同一控制器。
 * 视觉对齐 design.html 原型:头部状态、气泡、思考点、快捷 chips、输入行。
 */
export function AiChatPanel(props: AiChatPanelProps) {
  const controller = useAiChat();
  const state = useStore(controller, (s) => s);
  const navigator = useNavigator();
  const toast = useToast();
  const t = useT();

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void controller.loadModels();
  }, [controller]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.messages]);

  const send = async (text: string) => {
    const result = await controller.send(text);
    if (result === 'login-required') {
      toast.show(t('chat.loginRequired'));
      navigator.navigate('/login');
    } else if (result === 'no-points') {
      toast.show(t('chat.noPoints'), 'error');
    }
  };

  const submit = () => {
    const text = input.trim();
    if (!text || state.streaming) return;
    setInput('');
    void send(text);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  const modelSelect = (
    <Select
      aria-label={t('chat.model')}
      value={state.selectedModelName ?? ''}
      onChange={(e) => controller.selectModel(e.target.value)}
      disabled={state.streaming || state.modelsStatus !== 'ready'}
    >
      {state.models.map((m) => (
        <option key={m.id} value={m.name}>
          {m.title || m.name}
          {m.free ? ' · Free' : ''}
        </option>
      ))}
    </Select>
  );

  const messages = (
    <div className="chat-msgs" ref={scrollRef} role="log" aria-live="polite">
      {state.messages.length === 0 ? (
        <div className="msg msg--ai">{t('chat.greeting')}</div>
      ) : (
        state.messages.map((message) =>
          message.pending ? (
            <ThinkingBubble key={message.id} label={t('chat.thinking')} />
          ) : (
            <div
              key={message.id}
              className={[
                'msg',
                message.role === 'user' ? 'msg--user' : 'msg--ai',
                message.errorCode ? 'msg--error' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {message.errorCode ? t(ERROR_KEY[message.errorCode]) : message.content}
            </div>
          ),
        )
      )}
    </div>
  );

  const chips = (
    <div className="chat-chips">
      {CHIP_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          className="chip"
          disabled={state.streaming}
          onClick={() => void send(t(key))}
        >
          {t(key)}
        </button>
      ))}
    </div>
  );

  if (props.variant === 'dock') {
    return (
      <div className="chat-panel">
        <div className="chat-head">
          <span className="chat-head-icon" aria-hidden="true">
            ✦
          </span>
          <div className="chat-head__text">
            <h2>{t('chat.dockTitle')}</h2>
            <span
              className={`chat-state${state.modelsStatus === 'ready' ? '' : ' chat-state--busy'}`}
            >
              {state.modelsStatus === 'ready' ? t('chat.online') : t('chat.loadingModels')}
            </span>
          </div>
          {props.onCollapse ? (
            <button
              type="button"
              className="chat-collapse"
              onClick={props.onCollapse}
              aria-label={t('chat.collapse')}
              title={t('chat.collapse')}
            >
              ›
            </button>
          ) : null}
        </div>
        <div className="chat-models">{modelSelect}</div>
        {messages}
        {chips}
        <div className="chat-input-row">
          <div className="chat-input">
            <input
              type="text"
              placeholder={t('chat.placeholderDock')}
              aria-label={t('chat.placeholderDock')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
          {state.streaming ? (
            <button type="button" className="chat-send chat-send--stop" onClick={() => controller.stop()}>
              {t('chat.stop')}
            </button>
          ) : (
            <button
              type="button"
              className="chat-send"
              disabled={!input.trim() || state.modelsStatus !== 'ready'}
              onClick={submit}
            >
              {t('chat.send')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-toolbar">
        <div className="chat-toolbar__picker">
          <Select
            label={t('chat.model')}
            value={state.selectedModelName ?? ''}
            onChange={(e) => controller.selectModel(e.target.value)}
            disabled={state.streaming || state.modelsStatus !== 'ready'}
          >
            {state.models.map((m) => (
              <option key={m.id} value={m.name}>
                {m.title || m.name}
                {m.free ? ' · Free' : ''}
              </option>
            ))}
          </Select>
        </div>
        {state.modelsStatus === 'error' ? (
          <Button variant="secondary" size="sm" onClick={() => controller.retryLoadModels()}>
            {t('chat.retry')}
          </Button>
        ) : null}
        <span className="chat-toolbar__spacer" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => controller.clear()}
          disabled={state.streaming || state.messages.length === 0}
        >
          {t('chat.newChat')}
        </Button>
      </div>
      <Card className="chat-msgs-card">{messages}</Card>
      {chips}
      <div className="chat-composer">
        <TextArea
          placeholder={t('chat.placeholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
        />
        {state.streaming ? (
          <Button variant="secondary" onClick={() => controller.stop()}>
            {t('chat.stop')}
          </Button>
        ) : (
          <Button onClick={submit} disabled={!input.trim() || state.modelsStatus !== 'ready'}>
            {t('chat.send')}
          </Button>
        )}
      </div>
    </div>
  );
}

function ThinkingBubble(props: { label: string }) {
  return (
    <div className="msg msg--thinking" role="status">
      <span className="thinking-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>{props.label}</span>
    </div>
  );
}
