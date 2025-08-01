import { Button, Card, Space, Typography, Alert } from "antd";
import { ExperimentOutlined, CheckCircleOutlined } from "@ant-design/icons";
import React, { useState } from "react";
import { AIService } from "../services/ai/aiService";
import CardSectionTitle from "../components/common/CardSectionTitle";

const { Title, Text, Paragraph } = Typography;

/**
 * 思维链XML标签解析测试页面
 * 用于验证优化后的XML标签格式解析是否正常工作
 */
const ThinkingChainXMLTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // 创建测试用的AI服务实例
  const createTestAIService = () => {
    return new AIService({
      apiUrl: "https://api.deepseek.com",
      apiKey: "test-key",
      aiModel: "deepseek-reasoner",
      enableAI: true,
    });
  };

  // 测试XML标签解析
  const runXMLParsingTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const results: string[] = [];
    const aiService = createTestAIService();

    try {
      // 测试1: DeepSeek <think> 格式
      results.push("🧪 测试1: DeepSeek <think> 格式");
      const deepseekResponse = `<think>
这是一个关于React的问题。让我分析一下：

1. React是一个JavaScript库
2. 用于构建用户界面
3. 由Facebook开发

结论：React是一个强大的前端框架。
</think>

React是一个用于构建用户界面的JavaScript库，由Facebook开发并维护。它采用组件化架构，支持虚拟DOM，能够高效地更新和渲染用户界面。`;

      // 使用私有方法进行测试（通过类型断言访问）
      const result1 = (aiService as any).parseThinkingChain(deepseekResponse, "什么是React？", true);
      
      if (result1.thinkingChain) {
        results.push("✅ DeepSeek格式解析成功");
        results.push(`   思维步骤数: ${result1.thinkingChain.steps.length}`);
        results.push(`   最终答案长度: ${result1.cleanContent.length}`);
        results.push(`   思维内容预览: ${result1.thinkingChain.steps[0]?.content.substring(0, 50)}...`);
      } else {
        results.push("❌ DeepSeek格式解析失败");
      }

      // 测试2: 通用 <thinking> 格式
      results.push("\n🧪 测试2: 通用 <thinking> 格式");
      const generalResponse = `<thinking>
让我思考一下如何回答这个关于Vue的问题：

首先，Vue是什么？
- Vue是一个渐进式JavaScript框架
- 专注于视图层
- 易于学习和使用

然后，Vue的特点是什么？
- 响应式数据绑定
- 组件化开发
- 灵活的架构

最后，总结Vue的优势。
</thinking>

Vue.js是一个渐进式JavaScript框架，专注于构建用户界面。它具有响应式数据绑定、组件化开发等特点，学习曲线相对平缓，适合各种规模的项目开发。`;

      const result2 = (aiService as any).parseThinkingChain(generalResponse, "什么是Vue？", true);
      
      if (result2.thinkingChain) {
        results.push("✅ 通用格式解析成功");
        results.push(`   思维步骤数: ${result2.thinkingChain.steps.length}`);
        results.push(`   最终答案长度: ${result2.cleanContent.length}`);
        results.push(`   思维内容预览: ${result2.thinkingChain.steps[0]?.content.substring(0, 50)}...`);
      } else {
        results.push("❌ 通用格式解析失败");
      }

      // 测试3: 无思维链内容
      results.push("\n🧪 测试3: 无思维链内容");
      const noThinkingResponse = `这是一个直接的回答，没有思维过程。JavaScript是一种编程语言，广泛用于网页开发。`;

      const result3 = (aiService as any).parseThinkingChain(noThinkingResponse, "什么是JavaScript？", true);
      
      if (!result3.thinkingChain) {
        results.push("✅ 无思维链内容处理正确");
        results.push(`   直接返回内容长度: ${result3.cleanContent.length}`);
      } else {
        results.push("❌ 无思维链内容处理错误");
      }

      // 测试4: 关闭思维模式
      results.push("\n🧪 测试4: 关闭思维模式");
      const result4 = (aiService as any).parseThinkingChain(deepseekResponse, "什么是React？", false);
      
      if (!result4.thinkingChain && result4.cleanContent) {
        results.push("✅ 关闭思维模式处理正确");
        results.push(`   只返回最终答案，长度: ${result4.cleanContent.length}`);
      } else {
        results.push("❌ 关闭思维模式处理错误");
      }

      results.push("\n🎉 所有测试完成！");

    } catch (error) {
      results.push(`❌ 测试过程中出错: ${error instanceof Error ? error.message : String(error)}`);
    }

    setTestResults(results);
    setIsRunning(false);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={2}>🧪 思维链XML标签解析测试</Title>

      <Alert
        message="测试说明"
        description="此测试页面用于验证优化后的XML标签格式解析功能。现在系统只使用科学的XML标签格式（<thinking> 和 <think>）进行思维链解析，移除了不稳定的流式标识符解析。"
        type="info"
        showIcon
        style={{ marginBottom: "20px" }}
      />

      <Card style={{ marginBottom: "20px" }}>
        <CardSectionTitle icon={<ExperimentOutlined />}>
          🎯 XML标签格式解析测试
        </CardSectionTitle>
        
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text>
            测试内容包括：
          </Text>
          <ul>
            <li>✅ DeepSeek <code>&lt;think&gt;</code> 格式解析</li>
            <li>✅ 通用 <code>&lt;thinking&gt;</code> 格式解析</li>
            <li>✅ 无思维链内容的处理</li>
            <li>✅ 关闭思维模式时的行为</li>
          </ul>
          
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />}
            loading={isRunning}
            onClick={runXMLParsingTests}
          >
            {isRunning ? "测试运行中..." : "开始测试"}
          </Button>
        </Space>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardSectionTitle icon={<CheckCircleOutlined />}>
            📋 测试结果
          </CardSectionTitle>
          <div
            style={{
              background: "#f5f5f5",
              padding: "16px",
              borderRadius: "6px",
              fontFamily: "monospace",
              whiteSpace: "pre-line",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            {testResults.join("\n")}
          </div>
        </Card>
      )}

      <Card style={{ marginTop: "20px" }}>
        <CardSectionTitle icon={<ExperimentOutlined />}>
          📝 优化说明
        </CardSectionTitle>
        <Space direction="vertical">
          <Paragraph>
            <Text strong>优化前的问题：</Text>
          </Paragraph>
          <ul>
            <li>❌ 依赖前端UI标识符（"🤔 **AI正在思考中...**"、"## ✨ 最终答案"）</li>
            <li>❌ 将UI显示逻辑混入数据解析逻辑</li>
            <li>❌ 解析结果不稳定，依赖前端实现细节</li>
          </ul>
          
          <Paragraph>
            <Text strong>优化后的改进：</Text>
          </Paragraph>
          <ul>
            <li>✅ 只使用科学的XML标签格式解析</li>
            <li>✅ 基于AI模型原生输出格式，稳定可靠</li>
            <li>✅ 支持多种AI模型的标准输出格式</li>
            <li>✅ 数据解析逻辑与UI显示逻辑完全分离</li>
          </ul>
        </Space>
      </Card>
    </div>
  );
};

export default ThinkingChainXMLTest;
