import { Suspense, lazy, useEffect, useMemo } from 'react';
import { useStore, useT } from '@onebox/core-react';
import { Spinner } from '@onebox/ui';
import { toolRegistry } from '../app/registry';
import { favoritesStore, recentStore } from '../app/stores';
import { NotFoundPage } from './NotFoundPage';

export function ToolHostPage(props: { slug: string }) {
  const t = useT();
  const tool = toolRegistry.bySlug(props.slug);
  // lazy() 缓存:slug 不变不重复包装,避免每次渲染重建组件
  const Page = useMemo(() => (tool ? lazy(tool.load) : null), [tool]);
  const favorite = useStore(favoritesStore, (s) => s.slugs.includes(props.slug));

  useEffect(() => {
    if (tool) recentStore.record(tool.slug);
  }, [tool]);

  if (!tool || !Page) return <NotFoundPage />;

  return (
    <div className="tool-page">
      <header className="tool-page__header">
        <span className="tool-page__icon">{tool.icon}</span>
        <div className="tool-page__title">
          <h1>{t(tool.titleKey)}</h1>
          <p>{t(tool.descriptionKey)}</p>
        </div>
        <button
          type="button"
          className={`tool-page__fav${favorite ? ' tool-page__fav--active' : ''}`}
          onClick={() => favoritesStore.toggle(tool.slug)}
          aria-label={favorite ? t('tool.unfavorite') : t('tool.favorite')}
          title={favorite ? t('tool.unfavorite') : t('tool.favorite')}
        >
          {favorite ? '♥' : '♡'}
        </button>
      </header>
      <Suspense
        fallback={
          <div className="tool-page__loading">
            <Spinner />
          </div>
        }
      >
        <Page />
      </Suspense>
    </div>
  );
}
