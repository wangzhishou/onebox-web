import { useStore, useT } from '@onebox/core-react';
import { toolRegistry } from '../app/registry';
import { favoritesStore } from '../app/stores';
import { ToolCard } from './HomePage';

export function FavoritesPage() {
  const t = useT();
  const slugs = useStore(favoritesStore, (s) => s.slugs);
  const tools = slugs
    .map((slug) => toolRegistry.bySlug(slug))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool && !tool.hidden));

  return (
    <div className="home home--padded">
      <div className="content-head">
        <h1>{t('favorites.title')}</h1>
        <span className="count-pill">{t('home.count', { n: tools.length })}</span>
      </div>
      {tools.length === 0 ? (
        <div className="empty-tip">{t('favorites.empty')}</div>
      ) : (
        <div className="tools-grid">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}
