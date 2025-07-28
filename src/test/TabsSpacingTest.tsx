import React from "react";
import { Tabs, Card, Typography, Space } from "antd";
import {
  UserOutlined,
  SettingOutlined,
  RobotOutlined,
  SkinOutlined,
  InfoCircleOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

/**
 * Tabs图标和文字间距测试组件
 * 用于测试和展示ant-tabs-tab的图标和文字间距优化效果
 */
const TabsSpacingTest: React.FC = () => {
  // 测试用的tabs项目
  const testTabItems = [
    {
      key: "user",
      label: (
        <span>
          <UserOutlined />
          用户设置
        </span>
      ),
      children: (
        <Card>
          <Title level={4}>用户设置页面</Title>
          <Text>这里展示用户相关的设置选项。</Text>
        </Card>
      ),
    },
    {
      key: "appearance",
      label: (
        <span>
          <SkinOutlined />
          外观设置
        </span>
      ),
      children: (
        <Card>
          <Title level={4}>外观设置页面</Title>
          <Text>这里展示外观相关的设置选项。</Text>
        </Card>
      ),
    },
    {
      key: "ai",
      label: (
        <span>
          <RobotOutlined />
          AI设置
        </span>
      ),
      children: (
        <Card>
          <Title level={4}>AI设置页面</Title>
          <Text>这里展示AI相关的设置选项。</Text>
        </Card>
      ),
    },
    {
      key: "advanced",
      label: (
        <span>
          <SettingOutlined />
          高级设置
        </span>
      ),
      children: (
        <Card>
          <Title level={4}>高级设置页面</Title>
          <Text>这里展示高级功能的设置选项。</Text>
        </Card>
      ),
    },
    {
      key: "data",
      label: (
        <span>
          <DatabaseOutlined />
          数据管理
        </span>
      ),
      children: (
        <Card>
          <Title level={4}>数据管理页面</Title>
          <Text>这里展示数据管理相关的功能。</Text>
        </Card>
      ),
    },
    {
      key: "about",
      label: (
        <span>
          <InfoCircleOutlined />
          关于
        </span>
      ),
      children: (
        <Card>
          <Title level={4}>关于页面</Title>
          <Text>这里展示应用的相关信息。</Text>
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", height: "100vh", background: "#f5f5f5" }}>
      <Title level={2}>Tabs 图标和文字间距测试</Title>

      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* 顶部tabs测试 */}
        <Card title="顶部 Tabs（默认样式）">
          <Tabs
            defaultActiveKey="user"
            items={testTabItems}
            style={{ minHeight: "200px" }}
          />
        </Card>

        {/* 左侧tabs测试 */}
        <Card title="左侧 Tabs（类似设置模态框）">
          <div style={{ height: "400px" }}>
            <Tabs
              defaultActiveKey="user"
              items={testTabItems}
              tabPosition="left"
              className="settings-tabs"
              style={{ height: "100%" }}
            />
          </div>
        </Card>

        {/* 设置模态框样式测试 */}
        <Card title="设置模态框样式 Tabs">
          <div
            className="settings-modal"
            style={{
              height: "400px",
              background: "#f5f5f5",
              padding: "16px",
              borderRadius: "8px",
            }}
          >
            <Tabs
              defaultActiveKey="user"
              items={testTabItems}
              tabPosition="left"
              className="settings-tabs"
              style={{ height: "100%" }}
            />
          </div>
        </Card>
      </Space>

      <div
        style={{
          marginTop: "24px",
          padding: "16px",
          background: "#fff",
          borderRadius: "8px",
        }}
      >
        <Title level={4}>样式说明</Title>
        <ul>
          <li>
            <strong>通用间距</strong>：所有tabs的图标和文字间距设为6px
          </li>
          <li>
            <strong>设置模态框</strong>：图标和文字间距增加到10px，提升可读性
          </li>
          <li>
            <strong>图标大小</strong>：通用14px，设置模态框16px
          </li>
          <li>
            <strong>悬停效果</strong>：图标轻微放大(scale 1.05)，渐变背景
          </li>
          <li>
            <strong>激活状态</strong>：紫蓝渐变背景，白色文字和图标
          </li>
          <li>
            <strong>位移修复</strong>：预留透明边框空间，避免切换时UI位移
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TabsSpacingTest;
