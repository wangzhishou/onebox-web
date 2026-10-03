import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastTone = 'info' | 'error';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

export interface Toaster {
  show(message: string, tone?: ToastTone): void;
}

const ToastContext = createContext<Toaster | null>(null);

const TOAST_DURATION_MS = 3200;

export function ToastProvider(props: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = nextId.current++;
    setItems((prev) => [...prev.slice(-2), { id, message, tone }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  return createElement(
    ToastContext.Provider,
    { value: { show } },
    props.children,
    createElement(
      'div',
      { className: 'ob-toaster', role: 'status', 'aria-live': 'polite' },
      items.map((item) =>
        createElement(
          'div',
          { key: item.id, className: `ob-toast${item.tone === 'error' ? ' ob-toast--error' : ''}` },
          item.message,
        ),
      ),
    ),
  );
}

export function useToast(): Toaster {
  const toaster = useContext(ToastContext);
  if (!toaster) throw new Error('useToast must be used within <ToastProvider>');
  return toaster;
}
