import { Layout, Spin } from "antd";
import { useEffect, useRef, useState } from "react";
import "./App.css";
import InfiniteCanvas from "./components/canvas/InfiniteCanvasNew";
import Sidebar from "./components/layout/Sidebar";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import AIPromptTemplateTest from "./test/AIPromptTemplateTest";
import CardTitleUnificationTest from "./test/CardTitleUnificationTest";
import EditorViewTest from "./test/EditorViewTest";
import MarkdownListTest from "./test/MarkdownListTest";
import NoteSettingsTest from "./test/NoteSettingsTest";
import RightClickDragTest from "./test/RightClickDragTest";
import RightClickSelectionTest from "./test/RightClickSelectionTest";
import StickyNoteDragTest from "./test/StickyNoteDragTest";
import TabsSpacingTest from "./test/TabsSpacingTest";
import ThinkingChainTest from "./test/ThinkingChainTest";
import ThinkingChainTimestampTest from "./test/ThinkingChainTimestampTest";
import ThinkingModeTest from "./test/ThinkingModeTest";
import { DebugDrawer } from "./components/debug";

// 导入全局状态管理
import {
  initializeUserStore,
  useAIStore,
  useStickyNotesStore,
  useUIStore,
} from "./stores";

// 导入内存管理器

// 在开发环境中导入测试
if (process.env.NODE_ENV === "development") {
  import("./test/environmentDetector.test");
}

const { Content } = Layout;

function App() {
  // 检查是否为测试模式
  const urlParams = new URLSearchParams(window.location.search);
  const testMode = urlParams.get("test");
  const isTestMode =
    testMode === "prompt-template" ||
    testMode === "thinking-chain" ||
    testMode === "thinking-chain-timestamp" ||
    testMode === "thinking-mode" ||
    testMode === "markdown-list" ||
    testMode === "card-title" ||
    testMode === "note-settings" ||
    testMode === "tabs-spacing" ||
    testMode === "right-click-drag" ||
    testMode === "right-click-selection" ||
    testMode === "sticky-note-drag" ||
    testMode === "editor-view";

  const canvasRef = useRef<{
    createNote: () => void;
    focusConsole: () => void;
    saveAllNotes: () => void;
    undo: () => void;
    redo: () => void;

    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
  }>(null);

  // 使用全局状态管理
  const {
    loading: notesLoading, // 只用于初始化加载
    operationLoading: notesOperationLoading, // 操作加载状态
    error: notesError,
    initialize: initializeStickyNotes,
  } = useStickyNotesStore();
  const { loading: aiLoading, initialize: initializeAI } = useAIStore();
  const {
    globalLoading,
    openSettingsModal,
    initialize: initializeUI,
  } = useUIStore();

  // 应用初始化状态
  const [appInitialized, setAppInitialized] = useState(false);

  // 计算总体加载状态 - 只在初始化时显示全屏加载
  const loading = !appInitialized || notesLoading || aiLoading || globalLoading;
  const error = notesError;

  // 操作加载状态 - 用于显示小的加载指示器
  const operationInProgress = notesOperationLoading;

  // 初始化所有Store
  useEffect(() => {
    const initializeStores = async () => {
      try {
        // 先初始化便签Store（包含数据库初始化）
        await initializeStickyNotes();

        // 然后初始化用户Store
        await initializeUserStore();

        // 接着初始化AI Store
        await initializeAI();

        // 最后初始化UI Store（同步操作）
        initializeUI();

        // 初始化内存管理器
        const { memoryManager } = await import("./utils/memoryManager");
        memoryManager.initialize();

        // 标记应用初始化完成
        setAppInitialized(true);
      } catch (error) {
        console.error("Store初始化失败:", error);
        setAppInitialized(true); // 即使失败也要标记完成，避免无限加载
      }
    };
    initializeStores();
  }, [initializeStickyNotes, initializeAI, initializeUI]);

  // 设置键盘快捷键
  useKeyboardShortcuts({
    onCreateNote: () => {
      canvasRef.current?.createNote?.();
    },
    onOpenSettings: () => {
      openSettingsModal("appearance");
    },
    onFocusConsole: () => {
      canvasRef.current?.focusConsole?.();
    },
    onSave: () => {
      canvasRef.current?.saveAllNotes?.();
    },
    onUndo: () => {
      canvasRef.current?.undo?.();
    },
    onRedo: () => {
      canvasRef.current?.redo?.();
    },

    onZoomIn: () => {
      canvasRef.current?.zoomIn?.();
    },
    onZoomOut: () => {
      canvasRef.current?.zoomOut?.();
    },
    onResetZoom: () => {
      canvasRef.current?.resetZoom?.();
    },
  });

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          gap: "16px",
        }}
      >
        <Spin size="large" />
        <div style={{ color: "#666", fontSize: "16px" }}>正在初始化应用...</div>
        <div style={{ color: "#999", fontSize: "12px" }}>
          便签: {notesLoading ? "加载中" : "完成"} | AI:{" "}
          {aiLoading ? "加载中" : "完成"} | UI:{" "}
          {globalLoading ? "加载中" : "完成"}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          color: "red",
        }}
      >
        数据库初始化失败: {error}
      </div>
    );
  }

  // 如果是测试模式，显示对应的测试页面
  if (isTestMode) {
    if (testMode === "prompt-template") {
      return <AIPromptTemplateTest />;
    } else if (testMode === "thinking-chain") {
      return <ThinkingChainTest />;
    } else if (testMode === "thinking-chain-timestamp") {
      return <ThinkingChainTimestampTest />;
    } else if (testMode === "thinking-mode") {
      return <ThinkingModeTest />;
    } else if (testMode === "markdown-list") {
      return <MarkdownListTest />;
    } else if (testMode === "card-title") {
      return <CardTitleUnificationTest />;
    } else if (testMode === "note-settings") {
      return <NoteSettingsTest />;
    } else if (testMode === "tabs-spacing") {
      return <TabsSpacingTest />;
    } else if (testMode === "right-click-drag") {
      return <RightClickDragTest />;
    } else if (testMode === "right-click-selection") {
      return <RightClickSelectionTest />;
    } else if (testMode === "sticky-note-drag") {
      return <StickyNoteDragTest />;
    } else if (testMode === "editor-view") {
      return <EditorViewTest />;
    }
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* 画布占据全屏 */}
      <Content
        style={{ margin: "0", overflow: "hidden", position: "relative" }}
      >
        <InfiniteCanvas ref={canvasRef} />

        {/* 悬浮侧边栏 */}
        <Sidebar />

        {/* 开发环境下显示调试抽屉 */}
        <DebugDrawer />

        {/* 操作加载指示器 - 小的、不阻塞的加载提示 */}
        {operationInProgress && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: "rgba(0, 0, 0, 0.7)",
              color: "white",
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Spin size="small" />
            <span>处理中...</span>
          </div>
        )}
      </Content>
    </Layout>
  );
}

export default App;
