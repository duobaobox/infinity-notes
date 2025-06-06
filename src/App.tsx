import { Layout } from "antd";
import "./App.css";
import InfiniteCanvas from "./components/InfiniteCanvas";
import Sidebar from "./components/Sidebar"; // Import the new Sidebar component

const { Content } = Layout;

function App() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar /> {/* 移除了canvasName属性 */}
      <Layout>
        <Content style={{ margin: "0", overflow: "hidden" }}>
          <InfiniteCanvas />
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
