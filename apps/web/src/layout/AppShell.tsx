import { useEffect, useState, type ReactNode } from 'react';
import { AiChatPanel } from '@onebox/tool-ai-chat';
import { Sidebar } from './Sidebar';

/**
 * 应用壳(对齐 design.html):
 * Sidebar 220px | 中间内容区 | 右侧 AI 面板 340px(grid 列宽过渡收起)
 * ≤1024px:面板变固定抽屉 + 遮罩,默认收起为右下角悬浮按钮
 * ≤768px:侧栏变抽屉,左上角汉堡开合
 */
export function AppShell(props: { children: ReactNode }) {
  const [chatOpen, setChatOpen] = useState(
    () => typeof window === 'undefined' || window.innerWidth > 1024,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 1024,
  );

  useEffect(() => {
    const onResize = () => {
      const isNarrow = window.innerWidth <= 1024;
      setNarrow((prev) => {
        if (prev !== isNarrow) {
          // 跨越断点时对齐原型行为:进窄屏默认收起,回宽屏默认展开
          setChatOpen(!isNarrow);
          setDrawerOpen(false);
        }
        return isNarrow;
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const scrimShown = drawerOpen || (narrow && chatOpen);
  const closeOverlays = () => {
    setDrawerOpen(false);
    if (narrow) setChatOpen(false);
  };

  return (
    <div className={`shell${chatOpen ? '' : ' shell--chat-collapsed'}`}>
      <div
        className={`scrim${scrimShown ? ' scrim--show' : ''}`}
        aria-hidden="true"
        onClick={closeOverlays}
      />
      <Sidebar
        open={drawerOpen}
        onOpenChat={() => setChatOpen(true)}
        onNavigate={() => setDrawerOpen(false)}
      />
      <div className="workspace">
        <main className="content">{props.children}</main>
        <aside className="chat-dock" aria-label="AI">
          <AiChatPanel variant="dock" onCollapse={() => setChatOpen(false)} />
        </aside>
      </div>
      <button
        type="button"
        className="burger"
        aria-label="Menu"
        onClick={() => setDrawerOpen((v) => !v)}
      >
        ☰
      </button>
      <button
        type="button"
        className="ai-fab"
        aria-label="AI"
        onClick={() => setChatOpen(true)}
      >
        <span className="ai-fab__ping" aria-hidden="true" />
        ✦
      </button>
    </div>
  );
}
