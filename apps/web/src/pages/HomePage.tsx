import { useStore, useT, type ToolModule } from '@onebox/core-react';
import { useState } from 'react';
import { toolRegistry } from '../app/registry';
import { useLinkProps } from '../app/router';
import { searchStore } from '../app/stores';
import { LangSwitch } from '../layout/LangSwitch';
import { ThemeToggle } from '../layout/ThemeToggle';

const ALL = '__all__';

/** 首页:粘性工具栏(搜索+视图切换+分类 pill)+ 工具卡片网格(页面主角) */
export function HomePage() {
  const t = useT();
  const query = useStore(searchStore, (s) => s.query).trim().toLowerCase();
  const [activeCat, setActiveCat] = useState<string>(ALL);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const categories = toolRegistry.listCategories();
  const allTools = toolRegistry.list().filter((tool) => !tool.hidden);
  const visible = allTools.filter((tool) => {
    const okCat = activeCat === ALL || tool.category === activeCat;
    if (!okCat) return false;
    if (!query) return true;
    return `${t(tool.titleKey)} ${t(tool.descriptionKey)} ${tool.slug}`
      .toLowerCase()
      .includes(query);
  });

  const activeTitle =
    activeCat === ALL
      ? t('nav.allTools')
      : t(toolRegistry.categoryBySlug(activeCat)?.titleKey ?? 'nav.allTools');

  return (
    <div className="home">
      <div className="toolbar">
        <div className="toolbar__row">
          <div className="toolbar__search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder={t('search.placeholder')}
              aria-label={t('search.placeholder')}
              value={query}
              onChange={(e) => searchStore.setQuery(e.target.value)}
            />
          </div>
          <div className="toolbar-actions">
            <div className="view-switch" role="group" aria-label="View">
              <button
                type="button"
                className={`view-btn${view === 'grid' ? ' view-btn--active' : ''}`}
                aria-label={t('view.grid')}
                title={t('view.grid')}
                onClick={() => setView('grid')}
              >
                ▦
              </button>
              <button
                type="button"
                className={`view-btn${view === 'list' ? ' view-btn--active' : ''}`}
                aria-label={t('view.list')}
                title={t('view.list')}
                onClick={() => setView('list')}
              >
                ☰
              </button>
            </div>
            <ThemeToggle />
            <LangSwitch />
          </div>
        </div>
        <div className="cat-row" role="tablist" aria-label="Categories">
          <button
            type="button"
            className={`cat-pill${activeCat === ALL ? ' cat-pill--active cat-pill--blue' : ''}`}
            onClick={() => setActiveCat(ALL)}
          >
            {t('cat.all')}
          </button>
          {categories.map((category) => (
            <button
              key={category.slug}
              type="button"
              className={`cat-pill${
                activeCat === category.slug
                  ? ` cat-pill--active cat-pill--${category.tint ?? 'blue'}`
                  : ''
              }`}
              onClick={() => setActiveCat(category.slug)}
            >
              {t(category.titleKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="content-head">
        <h1>{activeTitle}</h1>
        <span className="count-pill">{t('home.count', { n: visible.length })}</span>
      </div>

      <div className={`tools-grid${view === 'list' ? ' tools-grid--list' : ''}`}>
        {visible.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
        {visible.length === 0 ? <div className="empty-tip">{t('home.empty')}</div> : null}
      </div>
    </div>
  );
}

export function ToolCard(props: { tool: ToolModule }) {
  const t = useT();
  const link = useLinkProps(`/t/${props.tool.slug}`);
  const tint = toolRegistry.categoryBySlug(props.tool.category)?.tint ?? 'blue';

  return (
    <a {...link} className="tool-card">
      <span className={`tool-card__icon tool-card__icon--${tint}`}>{props.tool.icon}</span>
      <span className="tool-card__body">
        <h3>{t(props.tool.titleKey)}</h3>
        <p>{t(props.tool.descriptionKey)}</p>
      </span>
      <span className="tool-card__go" aria-hidden="true">
        →
      </span>
    </a>
  );
}
