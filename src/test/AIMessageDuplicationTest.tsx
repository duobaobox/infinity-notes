// AI消息重复提醒测试组件
import { Button, Card, Space, Typography } from "antd";
import {
  InfoCircleOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import React, { useState } from "react";
import CardSectionTitle from "../components/common/CardSectionTitle";
import { useAISettings } from "../hooks/ai/useAISettings";
import type { AIConfig } from "../services/ai/aiService";

const { Title, Text } = Typography;

/**
 * AI消息重复提醒测试组件
 * 用于验证修复后的AI设置保存和测试连接不会出现重复消息
 */
export const AIMessageDuplicationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const { config, saveConfig, testConnection, loading } = useAISettings();

  // 添加测试结果
  const addTestResult = (result: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ]);
  };

  // 测试保存AI配置
  const testSaveConfig = async () => {
    addTestResult("开始测试保存AI配置...");

    const testConfig: AIConfig = {
      ...config,
      apiUrl: "https://api.openai.com/v1",
      apiKey: "test-key-123",
      aiModel: "gpt-3.5-turbo",
      enableAI: true,
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: "",
    };

    try {
      const success = await saveConfig(testConfig);
      if (success) {
        addTestResult("✅ 保存配置成功 - 应该只看到一条成功消息");
      } else {
        addTestResult("❌ 保存配置失败");
      }
    } catch (error) {
      addTestResult(
        `❌ 保存配置异常: ${
          error instanceof Error ? error.message : "未知错误"
        }`
      );
    }
  };

  // 测试连接
  const testConnectionTest = async () => {
    addTestResult("开始测试连接...");

    try {
      const result = await testConnection();
      if (result.success) {
        addTestResult("✅ 连接测试成功 - 应该只看到一条成功消息");
      } else {
        addTestResult(`❌ 连接测试失败: ${result.error || "未知错误"}`);
      }
    } catch (error) {
      addTestResult(
        `❌ 连接测试异常: ${
          error instanceof Error ? error.message : "未知错误"
        }`
      );
    }
  };

  // 清空测试结果
  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <Title level={2}>🔧 AI消息重复提醒修复测试</Title>

      <Card style={{ marginBottom: 16 }}>
        <CardSectionTitle icon={<InfoCircleOutlined />}>
          测试说明
        </CardSectionTitle>
        <Text>
          此测试用于验证AI设置保存和测试连接功能是否还会出现重复的成功消息提醒。
          修复后，每个操作应该只显示一条消息。
        </Text>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <CardSectionTitle icon={<PlayCircleOutlined />}>
          测试操作
        </CardSectionTitle>
        <Space>
          <Button type="primary" onClick={testSaveConfig} loading={loading}>
            测试保存配置
          </Button>
          <Button onClick={testConnectionTest} loading={loading}>
            测试连接
          </Button>
          <Button onClick={clearResults}>清空结果</Button>
        </Space>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <CardSectionTitle icon={<CheckCircleOutlined />} iconType="success">
          测试结果
        </CardSectionTitle>
        <div
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
          }}
        >
          {testResults.length === 0 ? (
            <Text type="secondary">暂无测试结果</Text>
          ) : (
            testResults.map((result, index) => (
              <div key={index} style={{ marginBottom: "4px" }}>
                <Text code>{result}</Text>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <CardSectionTitle icon={<SettingOutlined />}>
          当前AI配置状态
        </CardSectionTitle>
        <Space direction="vertical">
          <Text>API地址: {config.apiUrl || "未设置"}</Text>
          <Text>API密钥: {config.apiKey ? "已设置" : "未设置"}</Text>
          <Text>AI模型: {config.aiModel || "未设置"}</Text>
          <Text>启用状态: {config.enableAI ? "已启用" : "未启用"}</Text>
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <CardSectionTitle icon={<FileTextOutlined />}>
          预期行为
        </CardSectionTitle>
        <Space direction="vertical">
          <Text>• 点击"测试保存配置"后，应该只看到一条成功消息</Text>
          <Text>• 点击"测试连接"后，应该只看到一条成功或失败消息</Text>
          <Text>• 不应该出现重复的消息提醒</Text>
          <Text>• 消息应该来自 useAISettings Hook，而不是组件层</Text>
        </Space>
      </Card>
    </div>
  );
};

export default AIMessageDuplicationTest;
