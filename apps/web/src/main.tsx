import { createOneboxCore } from '@onebox/core';
import { CoreProvider, NavigatorProvider } from '@onebox/core-react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from '@onebox/ui';
import '@onebox/ui/styles.css';
import { App } from './app/App';
import { shellDictionaries } from './app/i18n';
import { toolRegistry } from './app/registry';
import { historyNavigator } from './app/router';
import { readStoredLocale } from './app/stores'; // 副作用:首帧前解析并应用主题(dataset.theme)
import './styles.css';

const core = createOneboxCore({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'https://api.oneboxable.com',
  locale: readStoredLocale() ?? undefined,
});

core.i18n.register('zh-CN', shellDictionaries['zh-CN']);
core.i18n.register('en', shellDictionaries.en);
for (const tool of toolRegistry.list()) {
  for (const [locale, dict] of Object.entries(tool.dictionaries ?? {})) {
    if (dict) core.i18n.register(locale as 'zh-CN' | 'en', dict);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CoreProvider core={core}>
      <NavigatorProvider navigator={historyNavigator}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </NavigatorProvider>
    </CoreProvider>
  </StrictMode>,
);
