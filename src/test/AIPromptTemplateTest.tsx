// AI提示词模板功能测试组件
import { Button, Card, Input, Space, Typography } from "antd";
import React, { useState } from "react";
import AIPromptTemplateSelector from "../components/ai/AIPromptTemplateSelector";
import type { AIPromptTemplate } from "../services/ai/aiService";
import {
  findPromptTemplateById,
  getPopularPromptTemplates,
  systemPromptTemplates,
} from "../services/ai/aiService";

const { Title, Text, Paragraph } = Typography;

/**
 * AI提示词模板功能测试组件
 * 用于测试和演示新的提示词模板选择功能
 */
const AIPromptTemplateTest: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<
    AIPromptTemplate | undefined
  >();
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  // 处理模板选择
  const handleTemplateSelect = (template: AIPromptTemplate) => {
    console.log("选择模板:", template);
    setSelectedTemplate(template);
    setCurrentPrompt(template.prompt);
    setIsCustomMode(false);
  };

  // 测试函数
  const runTests = () => {
    console.log("=== AI提示词模板功能测试 ===");

    // 测试1: 获取所有模板
    console.log("1. 所有模板:", systemPromptTemplates);

    // 测试2: 获取热门模板
    console.log("2. 热门模板:", getPopularPromptTemplates());

    // 测试3: 根据ID查找模板
    console.log("3. 查找正常对话模式:", findPromptTemplateById("normal"));
    console.log("4. 查找工作助手:", findPromptTemplateById("work-assistant"));

    // 测试4: 查找不存在的模板
    console.log("5. 查找不存在的模板:", findPromptTemplateById("non-existent"));
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={2}>🎭 AI提示词模板功能测试</Title>

      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* 测试按钮 */}
        <Card>
          <Space>
            <Button type="primary" onClick={runTests}>
              运行控制台测试
            </Button>
            <Text type="secondary">打开浏览器控制台查看测试结果</Text>
          </Space>
        </Card>

        {/* 模板选择器测试 */}
        <Card
          title="模板选择器测试"
          extra={
            <Space>
              <Button
                size="small"
                onClick={() => {
                  setSelectedTemplate(undefined);
                  setCurrentPrompt("");
                  setIsCustomMode(false);
                }}
              >
                重置
              </Button>
              <Button
                size="small"
                type="primary"
                onClick={() => {
                  const template = systemPromptTemplates.find(
                    (t) => t.id === "work-assistant"
                  );
                  if (template) handleTemplateSelect(template);
                }}
              >
                快速选择工作助手
              </Button>
            </Space>
          }
        >
          <AIPromptTemplateSelector
            selectedTemplate={selectedTemplate}
            currentPrompt={currentPrompt}
            onTemplateSelect={handleTemplateSelect}
          />
        </Card>

        {/* 提示词编辑器测试 */}
        <Card
          title="提示词编辑器"
          extra={
            <Space>
              <Button size="small" onClick={() => setCurrentPrompt("")}>
                清空
              </Button>
              <Button
                size="small"
                type="primary"
                onClick={() => {
                  if (selectedTemplate) {
                    setCurrentPrompt(selectedTemplate.prompt);
                  }
                }}
                disabled={!selectedTemplate}
              >
                恢复模板
              </Button>
            </Space>
          }
        >
          <Input.TextArea
            rows={6}
            value={currentPrompt}
            onChange={(e) => {
              setCurrentPrompt(e.target.value);
              // 模拟检测是否修改了模板内容
              if (
                selectedTemplate &&
                e.target.value !== selectedTemplate.prompt
              ) {
                setIsCustomMode(true);
              }
            }}
            placeholder="在此编辑提示词内容..."
            style={{ fontSize: "14px" }}
          />
        </Card>

        {/* 当前状态显示 */}
        <Card title="当前状态">
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <Text strong>选中的模板: </Text>
              <Text>{selectedTemplate ? selectedTemplate.name : "无"}</Text>
              {selectedTemplate && (
                <Text type="secondary" style={{ marginLeft: "8px" }}>
                  ({selectedTemplate.id})
                </Text>
              )}
            </div>
            <div>
              <Text strong>是否自定义模式: </Text>
              <Text type={isCustomMode ? "warning" : "success"}>
                {isCustomMode ? "是" : "否"}
              </Text>
            </div>
            <div>
              <Text strong>提示词长度: </Text>
              <Text>{currentPrompt.length} 字符</Text>
            </div>
            <div>
              <Text strong>是否与模板匹配: </Text>
              <Text
                type={
                  selectedTemplate && currentPrompt === selectedTemplate.prompt
                    ? "success"
                    : "warning"
                }
              >
                {selectedTemplate && currentPrompt === selectedTemplate.prompt
                  ? "匹配"
                  : "不匹配"}
              </Text>
            </div>
          </Space>
        </Card>

        {/* 模板信息展示 */}
        <Card title="所有可用模板">
          <Space direction="vertical" style={{ width: "100%" }}>
            {systemPromptTemplates.map((template) => (
              <Card
                key={template.id}
                size="small"
                style={{
                  backgroundColor:
                    selectedTemplate?.id === template.id
                      ? "#f6ffed"
                      : undefined,
                }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div>
                    <Text strong>
                      {template.icon} {template.name}
                    </Text>
                    {template.popular && (
                      <Text type="warning" style={{ marginLeft: "8px" }}>
                        [热门]
                      </Text>
                    )}
                    {template.category && (
                      <Text type="secondary" style={{ marginLeft: "8px" }}>
                        [{template.category}]
                      </Text>
                    )}
                  </div>
                  <Text type="secondary">{template.description}</Text>
                  {template.prompt && (
                    <Paragraph
                      style={{
                        backgroundColor: "#fafafa",
                        padding: "6px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        maxHeight: "100px",
                        overflow: "auto",
                      }}
                    >
                      {template.prompt.length > 100
                        ? `${template.prompt.substring(0, 100)}...`
                        : template.prompt || "（无提示词内容）"}
                    </Paragraph>
                  )}
                </Space>
              </Card>
            ))}
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default AIPromptTemplateTest;
