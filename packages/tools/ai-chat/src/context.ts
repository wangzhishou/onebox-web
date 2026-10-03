import { useCore } from '@onebox/core-react';
import {
  createContext,
  createElement,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { AiChatController } from './controller';

const AiChatContext = createContext<AiChatController | null>(null);

/** 在壳层挂一次,页面与 Dock 共享同一聊天会话 */
export function AiChatProvider(props: { children: ReactNode }) {
  const core = useCore();
  const controller = useMemo(() => new AiChatController(core), [core]);
  return createElement(AiChatContext.Provider, { value: controller }, props.children);
}

export function useAiChat(): AiChatController {
  const controller = useContext(AiChatContext);
  if (!controller) throw new Error('useAiChat must be used within <AiChatProvider>');
  return controller;
}
