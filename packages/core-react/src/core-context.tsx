import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import type { OneboxCore, SessionState, Store } from '@onebox/core';
import { createElement } from 'react';

const CoreContext = createContext<OneboxCore | null>(null);

export function CoreProvider(props: { core: OneboxCore; children: ReactNode }) {
  return createElement(CoreContext.Provider, { value: props.core }, props.children);
}

export function useCore(): OneboxCore {
  const core = useContext(CoreContext);
  if (!core) throw new Error('useCore must be used within <CoreProvider>');
  return core;
}

/** Store → React 绑定:selector 需返回稳定引用(基本类型/记忆化对象) */
export function useStore<S, R>(store: Store<S>, selector: (state: S) => R): R {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.state),
    () => selector(store.state),
  );
}

export function useSessionState(): SessionState {
  const core = useCore();
  return useStore(core.session, (s) => s);
}

export function useLocale() {
  const core = useCore();
  return useStore(core.i18n, (s) => s.locale);
}

/** 翻译函数:locale 变化时自动重渲染 */
export function useT(): (key: string, params?: Record<string, string | number>) => string {
  const core = useCore();
  useLocale();
  return core.i18n.t.bind(core.i18n);
}
