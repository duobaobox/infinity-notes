import React from "react";
import { Card, Button, Typography, Space, Tag, Divider } from "antd";
import { useAISettings } from "../hooks/useAISettings";
import { AIService } from "../services/aiService";

const { Title, Text, Paragraph } = Typography;

const AITestPanel: React.FC = () => {
  const { config, hasValidConfig, loading, error, testConnection } = useAISettings();

  const handleTestAI = async () => {
    console.log("🧪 AITestPanel: 开始测试AI生成");
    
    try {
      const aiService = new AIService(config);
      const result = await aiService.generateStickyNotes("测试：创建一个关于学习React的便签");
      
      console.log("🧪 AITestPanel: AI生成结果", result);
      
      if (result.success) {
        console.log("✅ AI生成成功:", result.notes);
      } else {
        console.error("❌ AI生成失败:", result.error);
      }
    } catch (error) {
      console.error("🧪 AITestPanel: AI测试异常", error);
    }
  };

  const handleTestConnection = async () => {
    console.log("🧪 AITestPanel: 开始测试连接");
    const result = await testConnection();
    console.log("🧪 AITestPanel: 连接测试结果", result);
  };

  return (
    <Card 
      title="AI配置测试面板" 
      style={{ 
        position: "fixed", 
        top: 20, 
        right: 20, 
        width: 400, 
        zIndex: 9999,
        maxHeight: "80vh",
        overflow: "auto"
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <div>
          <Title level={5}>配置状态</Title>
          <Space wrap>
            <Tag color={hasValidConfig ? "green" : "red"}>
              {hasValidConfig ? "配置有效" : "配置无效"}
            </Tag>
            <Tag color={loading ? "blue" : "default"}>
              {loading ? "加载中" : "已加载"}
            </Tag>
            {error && <Tag color="red">错误: {error}</Tag>}
          </Space>
        </div>

        <Divider />

        <div>
          <Title level={5}>配置详情</Title>
          <Paragraph>
            <Text strong>启用AI:</Text> {config.enableAI ? "是" : "否"}<br/>
            <Text strong>API地址:</Text> {config.apiUrl || "未设置"}<br/>
            <Text strong>API密钥:</Text> {config.apiKey ? "已设置" : "未设置"}<br/>
            <Text strong>AI模型:</Text> {config.aiModel || "未设置"}<br/>
            <Text strong>温度值:</Text> {config.temperature || "未设置"}<br/>
            <Text strong>最大Token:</Text> {config.maxTokens || "未设置"}
          </Paragraph>
        </div>

        <Divider />

        <Space>
          <Button 
            type="primary" 
            onClick={handleTestConnection}
            loading={loading}
          >
            测试连接
          </Button>
          <Button 
            type="default" 
            onClick={handleTestAI}
            disabled={!hasValidConfig}
          >
            测试AI生成
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

export default AITestPanel;
