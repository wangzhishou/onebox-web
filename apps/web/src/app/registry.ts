import { createToolRegistry } from '@onebox/core-react';
import { aiChatTool } from '@onebox/tool-ai-chat';

/**
 * 模块注册表。
 * 新增分类:categories 加一项;新增工具:加依赖 + tools 加一行。
 * tint 决定分类 pill active 与工具图标的彩色玻璃(蓝/青/绿/橙/紫/粉)。
 */
export const toolRegistry = createToolRegistry(
  [
    { slug: 'image', titleKey: 'cat.image', descriptionKey: 'cat.imageDesc', icon: '🖼️', tint: 'cyan' },
    { slug: 'doc', titleKey: 'cat.doc', descriptionKey: 'cat.docDesc', icon: '📄', tint: 'purple' },
    { slug: 'efficiency', titleKey: 'cat.efficiency', descriptionKey: 'cat.efficiencyDesc', icon: '⚡', tint: 'orange' },
    { slug: 'life', titleKey: 'cat.life', descriptionKey: 'cat.lifeDesc', icon: '🌱', tint: 'green' },
    { slug: 'ai', titleKey: 'cat.ai', descriptionKey: 'cat.aiDesc', icon: '✨', tint: 'blue' },
    { slug: 'game', titleKey: 'cat.game', descriptionKey: 'cat.gameDesc', icon: '🎮', tint: 'pink' },
  ],
  [aiChatTool],
);
