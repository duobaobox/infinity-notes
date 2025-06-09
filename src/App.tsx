import { Layout, Spin } from "antd";
import { useRef } from "react";
import "./App.css";
import InfiniteCanvas from "./components/InfiniteCanvas";
import Sidebar from "./components/Sidebar";
import AITestPanel from "./components/AITestPanel";
import { useDatabase } from "./database/useIndexedDB";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

const { Content } = Layout;

function App() {
  const { loading, error } = useDatabase();
  const canvasRef = useRef<any>(null);

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
          正在初始化数据库...
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
          <AITestPanel />
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
