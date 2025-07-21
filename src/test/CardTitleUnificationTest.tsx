import React, { useState } from "react";
import { Card, Row, Col, Space, Typography, Button } from "antd";
import {
  SettingOutlined,
  UserOutlined,
  RobotOutlined,
  BgColorsOutlined,
  DatabaseOutlined,
  HddOutlined,
  TeamOutlined,
  EditOutlined,
  BookOutlined,
  MessageOutlined,
  BulbOutlined,
  FileTextOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import CardSectionTitle from "../components/common/CardSectionTitle";
import SettingsModal from "../components/modals/SettingsModal";

const { Title, Text } = Typography;

/**
 * 卡片标题统一化测试页面
 * 用于验证所有卡片标题的视觉一致性
 */
const CardTitleUnificationTest: React.FC = () => {
  const [settingsVisible, setSettingsVisible] = useState(false);

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={2}>🎨 卡片标题统一化测试</Title>

      <Card style={{ marginBottom: 24 }}>
        <CardSectionTitle icon={<ExperimentOutlined />} iconType="success">
          测试说明
        </CardSectionTitle>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text>
            此页面展示了统一后的卡片标题样式，包括不同的图标颜色类型和响应式设计。
            所有标题都使用相同的字体大小、间距和布局规范。
          </Text>
          <Button
            type="primary"
            onClick={() => setSettingsVisible(true)}
            icon={<SettingOutlined />}
          >
            打开设置页面测试实际效果
          </Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {/* 基本样式测试 */}
        <Col xs={24} md={12}>
          <Card size="small">
            <CardSectionTitle icon={<SettingOutlined />}>
              基本设置
            </CardSectionTitle>
            <Text>默认图标颜色（蓝色）</Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card size="small">
            <CardSectionTitle icon={<UserOutlined />}>
              个人信息
            </CardSectionTitle>
            <Text>用户相关设置</Text>
          </Card>
        </Col>

        {/* 成功类型图标 */}
        <Col xs={24} md={12}>
          <Card size="small">
            <CardSectionTitle icon={<RobotOutlined />} iconType="success">
              AI设置
            </CardSectionTitle>
            <Text>成功类型图标（绿色）</Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card size="small">
            <CardSectionTitle icon={<MessageOutlined />} iconType="success">
              反馈与支持
            </CardSectionTitle>
            <Text>联系和帮助信息</Text>
          </Card>
        </Col>

        {/* 警告类型图标 */}
        <Col xs={24} md={12}>
          <Card size="small">
            <CardSectionTitle icon={<BulbOutlined />} iconType="warning">
              无限便签
            </CardSectionTitle>
            <Text>警告类型图标（橙色）</Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card size="small">
            <CardSectionTitle icon={<BgColorsOutlined />}>
              主题设置
            </CardSectionTitle>
            <Text>外观和主题配置</Text>
          </Card>
        </Col>

        {/* 紫色类型图标 */}
        <Col xs={24} md={12}>
          <Card size="small">
            <CardSectionTitle icon={<TeamOutlined />} iconType="purple">
              AI角色模板
            </CardSectionTitle>
            <Text>紫色类型图标</Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card size="small">
            <CardSectionTitle icon={<EditOutlined />}>
              编辑设置
            </CardSectionTitle>
            <Text>编辑相关配置</Text>
          </Card>
        </Col>

        {/* 数据相关 */}
        <Col xs={24} md={12}>
          <Card size="small">
            <CardSectionTitle icon={<DatabaseOutlined />}>
              数据操作
            </CardSectionTitle>
            <Text>数据管理功能</Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card size="small">
            <CardSectionTitle icon={<HddOutlined />}>数据统计</CardSectionTitle>
            <Text>存储和统计信息</Text>
          </Card>
        </Col>

        {/* 帮助相关 */}
        <Col xs={24} md={12}>
          <Card size="small">
            <CardSectionTitle icon={<BookOutlined />}>
              使用教程
            </CardSectionTitle>
            <Text>学习和帮助文档</Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card size="small">
            <CardSectionTitle icon={<FileTextOutlined />}>
              文档说明
            </CardSectionTitle>
            <Text>详细说明文档</Text>
          </Card>
        </Col>
      </Row>

      {/* 紧凑模式测试 */}
      <Card style={{ marginTop: 24 }}>
        <CardSectionTitle icon={<ExperimentOutlined />}>
          紧凑模式测试
        </CardSectionTitle>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={8}>
            <Card size="small">
              <CardSectionTitle icon={<SettingOutlined />} compact>
                紧凑标题 1
              </CardSectionTitle>
              <Text>紧凑模式下的标题样式</Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card size="small">
              <CardSectionTitle
                icon={<RobotOutlined />}
                iconType="success"
                compact
              >
                紧凑标题 2
              </CardSectionTitle>
              <Text>带颜色的紧凑标题</Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card size="small">
              <CardSectionTitle
                icon={<TeamOutlined />}
                iconType="purple"
                compact
              >
                紧凑标题 3
              </CardSectionTitle>
              <Text>紫色紧凑标题</Text>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 响应式测试说明 */}
      <Card style={{ marginTop: 24 }}>
        <CardSectionTitle icon={<FileTextOutlined />}>
          响应式设计测试
        </CardSectionTitle>
        <Space direction="vertical">
          <Text>
            📱 <strong>移动端 (≤576px):</strong> 字体12px，图标间距4px
          </Text>
          <Text>
            📱 <strong>平板端 (≤768px):</strong> 字体13px，图标间距6px
          </Text>
          <Text>
            💻 <strong>桌面端 (&gt;768px):</strong> 字体14px，图标间距8px
          </Text>
          <Text type="secondary">请调整浏览器窗口大小来测试响应式效果</Text>
        </Space>
      </Card>

      {/* 设置模态框 */}
      <SettingsModal
        open={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </div>
  );
};

export default CardTitleUnificationTest;
