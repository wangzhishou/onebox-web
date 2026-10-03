import type { ComponentType } from 'react';
import type { Dictionary, Locale } from '@onebox/core';

/** 工具分类:首页卡片墙与分类页的组织单元,由壳应用注册 */
export interface ToolCategory {
  slug: string;
  titleKey: string;
  descriptionKey?: string;
  /** 卡片头部主图标(emoji 或图片 URL) */
  icon: string;
  /** 卡片色调,决定图标玻璃块与分类 pill active 的彩色玻璃 */
  tint?: 'blue' | 'cyan' | 'green' | 'orange' | 'purple' | 'pink';
}

/**
 * 工具模块契约:每个工具包默认导出一个 ToolModule。
 * 壳应用只认识这个接口——新工具 = 新包 + 注册一行。
 */
export interface ToolModule {
  /** 全局唯一,出现在路由 /t/:slug 中 */
  slug: string;
  /** 所属分类 slug,须在注册工具前注册对应分类 */
  category: string;
  /** i18n key,标题/描述走词典以便多语言 */
  titleKey: string;
  descriptionKey: string;
  /** 卡片图标(emoji 或图片 URL) */
  icon: string;
  /** 懒加载页面组件,首屏不分担工具代码 */
  load: () => Promise<{ default: ComponentType }>;
  /** 工具自带的词条,注册时并入全局 i18n */
  dictionaries?: Partial<Record<Locale, Dictionary>>;
  /** 是否在首页卡片墙隐藏(如纯二级工具) */
  hidden?: boolean;
}

export class ToolRegistry {
  private tools = new Map<string, ToolModule>();
  private toolOrder: string[] = [];
  private categories = new Map<string, ToolCategory>();
  private categoryOrder: string[] = [];

  registerCategory(category: ToolCategory): void {
    if (this.categories.has(category.slug)) {
      throw new Error(`Duplicate category slug: ${category.slug}`);
    }
    this.categories.set(category.slug, category);
    this.categoryOrder.push(category.slug);
  }

  register(tool: ToolModule): void {
    if (this.tools.has(tool.slug)) {
      throw new Error(`Duplicate tool slug: ${tool.slug}`);
    }
    if (!this.categories.has(tool.category)) {
      throw new Error(`Tool "${tool.slug}" references unregistered category "${tool.category}"`);
    }
    this.tools.set(tool.slug, tool);
    this.toolOrder.push(tool.slug);
  }

  registerAll(tools: ToolModule[]): void {
    for (const tool of tools) this.register(tool);
  }

  bySlug(slug: string): ToolModule | undefined {
    return this.tools.get(slug);
  }

  categoryBySlug(slug: string): ToolCategory | undefined {
    return this.categories.get(slug);
  }

  /** 按注册顺序列出全部工具 */
  list(): ToolModule[] {
    return this.toolOrder.map((slug) => this.tools.get(slug)!);
  }

  /** 有可见工具的分类,按注册顺序 */
  listCategories(): ToolCategory[] {
    return this.categoryOrder
      .map((slug) => this.categories.get(slug)!)
      .filter((category) =>
        this.list().some((tool) => tool.category === category.slug && !tool.hidden),
      );
  }

  toolsByCategory(categorySlug: string): ToolModule[] {
    return this.list().filter((tool) => tool.category === categorySlug);
  }
}

export function createToolRegistry(
  categories: ToolCategory[] = [],
  tools: ToolModule[] = [],
): ToolRegistry {
  const registry = new ToolRegistry();
  for (const category of categories) registry.registerCategory(category);
  registry.registerAll(tools);
  return registry;
}
