import { useT } from '@onebox/core-react';
import { AiChatProvider } from '@onebox/tool-ai-chat';
import { AppShell } from '../layout/AppShell';
import { FavoritesPage } from '../pages/FavoritesPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RecentPage } from '../pages/RecentPage';
import { RegisterPage } from '../pages/RegisterPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ToolHostPage } from '../pages/ToolHostPage';
import { matchPath, usePath } from './router';

export function App() {
  const path = usePath();
  useT(); // locale 切换时整树重渲染

  let page: React.ReactNode;
  const toolMatch = matchPath('/t/:slug', path);
  if (path === '/') {
    page = <HomePage />;
  } else if (path === '/login') {
    page = <LoginPage />;
  } else if (path === '/register') {
    page = <RegisterPage />;
  } else if (path === '/forgot-password') {
    page = <ForgotPasswordPage />;
  } else if (path === '/favorites') {
    page = <FavoritesPage />;
  } else if (path === '/recent') {
    page = <RecentPage />;
  } else if (path === '/settings') {
    page = <SettingsPage />;
  } else if (toolMatch) {
    page = <ToolHostPage slug={toolMatch.slug!} />;
  } else {
    page = <NotFoundPage />;
  }

  return (
    <AiChatProvider>
      <AppShell>{page}</AppShell>
    </AiChatProvider>
  );
}
