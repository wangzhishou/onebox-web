import { useCallback, useSyncExternalStore } from 'react';
import type { Navigator } from '@onebox/core-react';

const NAV_EVENT = 'ob:navigate';

function currentPath(): string {
  return window.location.pathname + window.location.search;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('popstate', callback);
  window.addEventListener(NAV_EVENT, callback);
  return () => {
    window.removeEventListener('popstate', callback);
    window.removeEventListener(NAV_EVENT, callback);
  };
}

/**
 * 极简 history 路由。只暴露 Navigator 接口与 usePath,
 * 后续要换 react-router 时工具模块零改动。
 */
export const historyNavigator: Navigator = {
  navigate(path, options) {
    if (options?.replace) {
      window.history.replaceState(null, '', path);
    } else {
      window.history.pushState(null, '', path);
    }
    window.dispatchEvent(new Event(NAV_EVENT));
  },
  back() {
    window.history.back();
  },
  currentPath,
};

export function usePath(): string {
  return useSyncExternalStore(subscribe, currentPath, () => '/');
}

export function useLinkProps(path: string) {
  return {
    href: path,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      historyNavigator.navigate(path);
    },
  };
}

/** 匹配 "/t/:slug" 风格模式,命中返回参数表,否则 null */
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('?')[0]!.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i]!;
    const v = pathParts[i]!;
    if (p.startsWith(':')) {
      params[p.slice(1)] = decodeURIComponent(v);
    } else if (p !== v) {
      return null;
    }
  }
  return params;
}
