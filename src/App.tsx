import { Layout, Spin } from "antd";
import { useRef, useEffect, useState } from "react";
import "./App.css";
import InfiniteCanvas from "./components/canvas/InfiniteCanvasNew";
import Sidebar from "./components/layout/Sidebar";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

// 导入全局状态管理
import {
  useStickyNotesStore,
  useCanvasStore,
  useAIStore,
  useUIStore
} from "./stores";

const { Content } = Layout;

function App() {
  const canvasRef = useRef<any>(null);

  // 使用全局状态管理
  const {
    loading: notesLoading, // 只用于初始化加载
    operationLoading: notesOperationLoading, // 操作加载状态
    error: notesError,
    initialize: initializeStickyNotes
  } = useStickyNotesStore();
  const {
    loading: aiLoading,
    initialize: initializeAI
  } = useAIStore();
  const {
    globalLoading,
    initialize: initializeUI
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
        console.log("🚀 App: 开始初始化所有Store...");

        // 先初始化便签Store（包含数据库初始化）
        console.log("📝 App: 初始化便签Store...");
        await initializeStickyNotes();

        // 然后初始化AI Store
        console.log("🤖 App: 初始化AI Store...");
        await initializeAI();

        // 最后初始化UI Store（同步操作）
        console.log("🎨 App: 初始化UI Store...");
        initializeUI();

        // 标记应用初始化完成
        setAppInitialized(true);
        console.log("✅ App: 所有Store初始化完成");
      } catch (error) {
        console.error("❌ App: Store初始化失败:", error);
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
      // TODO: 打开设置模态框
      console.log("打开设置");
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
    onSearch: () => {
      canvasRef.current?.openSearch?.();
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
        <div style={{ color: "#666", fontSize: "16px" }}>
          正在初始化应用...
        </div>
        <div style={{ color: "#999", fontSize: "12px" }}>
          便签: {notesLoading ? '加载中' : '完成'} |
          AI: {aiLoading ? '加载中' : '完成'} |
          UI: {globalLoading ? '加载中' : '完成'}
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

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Content style={{ margin: "0", overflow: "hidden" }}>
          <InfiniteCanvas ref={canvasRef} />

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
    </Layout>
  );
}

export default App;
