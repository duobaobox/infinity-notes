import { Layout, Spin } from "antd";
import { useEffect, useRef, useState } from "react";
import "./App.css";
import InfiniteCanvas from "./components/canvas/InfiniteCanvasNew";
import Sidebar from "./components/layout/Sidebar";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import AIPromptTemplateTest from "./test/AIPromptTemplateTest";
import MarkdownListTest from "./test/MarkdownListTest";
import ThinkingChainTest from "./test/ThinkingChainTest";
import ThinkingChainTimestampTest from "./test/ThinkingChainTimestampTest";
import VirtualizationStatusMonitorEnhanced from "./test/VirtualizationTestEnhanced";
import StreamingDebug from "./components/debug/StreamingDebug";

// 导入全局状态管理
import {
  initializeUserStore,
  useAIStore,
  useStickyNotesStore,
  useUIStore,
} from "./stores";

// 导入内存管理器

const { Content } = Layout;

function App() {
  // 检查是否为测试模式
  const urlParams = new URLSearchParams(window.location.search);
  const testMode = urlParams.get("test");
  const isTestMode =
    testMode === "prompt-template" ||
    testMode === "thinking-chain" ||
    testMode === "thinking-chain-timestamp" ||
    testMode === "markdown-list";

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
    } else if (testMode === "markdown-list") {
      return <MarkdownListTest />;
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

        {/* 开发环境下显示增强版虚拟化状态监控 */}
        {process.env.NODE_ENV === "development" && (
          <VirtualizationStatusMonitorEnhanced />
        )}

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

        {/* 流式输出调试组件 */}
        <StreamingDebug />
      </Content>
    </Layout>
  );
}

export default App;
