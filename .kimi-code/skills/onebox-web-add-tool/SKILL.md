---
name: onebox-web-add-tool
description: 给 onebox-web(Web 版工具箱平台)新增一个工具模块的完整流水线:新建 packages/tools/<slug> 包 → 实现 ToolModule 契约 → 壳应用注册一行 → 验证上架。当用户说"给网站/onebox-web 加个 XX 工具""把 App 的 XX 功能搬到 web""上架新工具模块"时使用。
---

# onebox-web 新增工具模块

仓库:`/Users/wangzhishou/app/onebox-web`(GitHub `wangzhishou/onebox-web`,pnpm monorepo)。

架构一句话:壳应用(`apps/web`)只认识 `ToolModule` 接口,**新工具 = 新包 + 注册一行**,路由 `/t/<slug>`、首页卡片、搜索、收藏、最近使用全部自动获得。

## 参考实现

`packages/tools/ai-chat/` 是唯一已上架工具,任何约定不确定就看它(契约 + 懒加载 + 词典 + 壳层单例 Provider 模式都在)。

## 步骤

### 1. 建包 `packages/tools/<slug>/`

`package.json`(照抄 ai-chat,只改 name 为 `@onebox/tool-<slug>`):

```json
{
  "name": "@onebox/tool-<slug>",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": { "types": "./src/index.ts", "default": "./src/index.ts" } },
  "scripts": { "typecheck": "tsc --noEmit" },
  "dependencies": {
    "@onebox/core": "workspace:*",
    "@onebox/core-react": "workspace:*",
    "@onebox/ui": "workspace:*"
  },
  "peerDependencies": { "react": ">=19" },
  "devDependencies": { "@types/react": "^19.1.0", "react": "^19.1.0", "typescript": "~5.9.2" }
}
```

`tsconfig.json`:`{ "extends": "../../../tsconfig.base.json", "include": ["src"] }`

### 2. `src/index.ts` 导出 ToolModule

契约定义在 `packages/core-react/src/tool.ts`。必填:`slug`(全局唯一,进路由)、`category`(必须是已注册分类,见下)、`titleKey`、`descriptionKey`、`icon`(emoji)、`load: () => import('./XxxPage')`(**页面组件必须 default export**,懒加载不分担首屏)、`dictionaries`(zh-CN + en 全套词条,key 用 `<模块前缀>.xxx` 命名空间)。

现有分类(registry.ts,tint 决定卡片图标/pill 配色):`image`(cyan)、`doc`(purple)、`efficiency`(orange)、`life`(green)、`ai`(blue)、`game`(pink)。要新分类先在 registry.ts 的 categories 加一项并在 `apps/web/src/app/i18n.ts` 补 `cat.*` 词条。

### 3. 写页面组件(硬约束)

- **不许裸 fetch / 硬编码 URL**:一律 `useCore()` 拿服务——`core.http`(自动带 JWT、错误规范化)、`core.session`(登录态)、`core.points.consume`(积分事后扣减,失败静默)、`core.aiConfig`(模型清单,带缓存)。鉴权拦截参照 ai-chat controller:发送前查 `core.session` 状态,未登录返回 `'login-required'` 由视图层 toast + 跳 `/login`。
- **文案零硬编码**:全部进 dictionaries,组件里 `useT()` 取。
- **样式**:自己的 `xxx.css` 由组件 import;只用 `--ob-*` 设计令牌(`packages/ui/src/styles.css`),**禁止写死颜色**——令牌已含暗色主题,写死颜色 = 暗色下破相。组件优先用 `@onebox/ui`(Button/TextField/Select/Card/Badge/Toast)。
- 需要跨页面共享状态(如 dock 与工具页共享会话)时,按 ai-chat 的 `context.ts`(壳层 Provider 单例)+ `controller.ts`(框架无关 Store)模式,不要在组件里 useState 了事。

### 4. 壳应用接线(两处 + install)

1. `apps/web/package.json` dependencies 加 `"@onebox/tool-<slug>": "workspace:*"`
2. `apps/web/src/app/registry.ts` tools 数组加一行 `xxxTool`(顶部 import)
3. `pnpm install`(刷新 workspace 链接)

### 5. 验证(必须全做)

```bash
cd /Users/wangzhishou/app/onebox-web
pnpm run typecheck   # 5+ 包全过
pnpm run build       # 页面分包出现在构建产物里
pnpm --filter @onebox/web exec vite preview --port 5199   # 后台
```

Chrome headless 截图目检首页卡片与 `/t/<slug>` 页面(浅色 + `?theme=dark` 暗色各一张):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --window-size=1440,900 --screenshot=/tmp/tool.png "http://localhost:5199/t/<slug>"
```

截完 `pkill -f "vite preview --port 5199"`。

## 注意

- 本仓库**公开**,任何密钥/token 不得入库;后端密钥永远放 strapi_go 网关侧,web 只带用户 JWT。
- 仓库无测试文化,不写单测,以 typecheck + build + 截图为准。
- 完成后 `git commit`(conventional commits,如 `feat(tools): add <slug> tool`)并 push。
