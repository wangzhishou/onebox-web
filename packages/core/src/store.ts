export type Unsubscribe = () => void;
export type Listener<S> = (state: S) => void;

/**
 * 极简可订阅状态容器。框架无关,React 侧经 useSyncExternalStore 绑定。
 * 状态不可变更新:setState 必须传入新对象。
 */
export abstract class Store<S> {
  private listeners = new Set<Listener<S>>();

  protected constructor(private current: S) {}

  get state(): S {
    return this.current;
  }

  subscribe = (listener: Listener<S>): Unsubscribe => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  protected setState(next: S): void {
    if (Object.is(next, this.current)) return;
    this.current = next;
    for (const listener of this.listeners) listener(next);
  }
}
