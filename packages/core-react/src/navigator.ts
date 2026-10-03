import { createContext, createElement, useContext, type ReactNode } from 'react';

/**
 * 导航抽象:工具模块不感知具体路由实现(hand-rolled / react-router),
 * 只面向此接口编程。壳应用注入实现。
 */
export interface Navigator {
  navigate(path: string, options?: { replace?: boolean }): void;
  back(): void;
  /** 当前路径(含查询串),响应式由壳保证 */
  currentPath(): string;
}

const NavigatorContext = createContext<Navigator | null>(null);

export function NavigatorProvider(props: { navigator: Navigator; children: ReactNode }) {
  return createElement(NavigatorContext.Provider, { value: props.navigator }, props.children);
}

export function useNavigator(): Navigator {
  const navigator = useContext(NavigatorContext);
  if (!navigator) throw new Error('useNavigator must be used within <NavigatorProvider>');
  return navigator;
}
