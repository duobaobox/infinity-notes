import { Layout, Spin } from "antd";
import "./App.css";
import InfiniteCanvas from "./components/InfiniteCanvas";
import Sidebar from "./components/Sidebar";
import { useDatabase } from "./database/useIndexedDB";

const { Content } = Layout;

function App() {
  const { loading, error } = useDatabase();

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
          <InfiniteCanvas />
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
