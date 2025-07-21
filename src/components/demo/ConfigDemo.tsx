// 配置管理演示组件
import React, { useState } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  message,
  Row,
  Col,
  Tag,
  Divider,
  Alert,
} from "antd";
import {
  PlayCircleOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  AimOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useConnectionStore } from "../../stores/connectionStore";
import type { StickyNote } from "../types";

const { Title, Text, Paragraph } = Typography;

/**
 * 配置管理演示组件
 * 展示不同配置场景下的内容提取效果
 */
export const ConfigDemo: React.FC = () => {
  const [demoResult, setDemoResult] = useState<string>("");
  const [currentScenario, setCurrentScenario] = useState<string>("balanced");

  const {
    getExtractionConfig,
    setExtractionScenario,
    updateExtractionConfig,
    resetExtractionConfig,
  } = useConnectionStore();

  // 模拟便签数据
  const mockNotes: StickyNote[] = [
    {
      id: "demo-1",
      title: "思维链便签",
      content: `首先，我需要分析这个问题的核心要素。

让我思考一下可能的解决方案：
1. 方案A：直接处理
2. 方案B：分步处理
3. 方案C：延迟处理

经过深入分析，我认为最佳方案是采用分步处理策略。

## ✨ 最终答案

采用分步处理策略，先进行数据预处理，然后执行核心算法，最后进行结果验证。这种方法具有可控性强、错误率低、可维护性好的优势。`,
      x: 0,
      y: 0,
      width: 300,
      height: 200,
      color: "blue",
      isEditing: false,
      isTitleEditing: false,
      isNew: false,
      zIndex: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "demo-2",
      title: "长内容便签",
      content: `这是一个包含大量详细信息的便签内容。它包含了项目的完整背景介绍、需求分析、技术选型、实施方案、风险评估、时间规划等多个方面的内容。在项目背景方面，我们需要考虑市场环境、用户需求、竞争对手分析等因素。在技术选型上，我们评估了多种技术栈的优缺点，最终选择了最适合当前项目需求的技术组合。实施方案包括了详细的开发流程、测试策略、部署方案等。风险评估涵盖了技术风险、进度风险、资源风险等多个维度。`,
      x: 0,
      y: 0,
      width: 300,
      height: 200,
      color: "green",
      isEditing: false,
      isTitleEditing: false,
      isNew: false,
      zIndex: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "demo-3",
      title: "简短便签",
      content: "这是一个简短的便签内容。",
      x: 0,
      y: 0,
      width: 300,
      height: 200,
      color: "yellow",
      isEditing: false,
      isTitleEditing: false,
      isNew: false,
      zIndex: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // 演示不同场景的配置效果
  const demonstrateScenario = async (
    scenario: "speed" | "accuracy" | "balanced"
  ) => {
    try {
      // 切换到指定场景
      setExtractionScenario(scenario);
      setCurrentScenario(scenario);

      // 获取当前配置
      const config = getExtractionConfig();

      // 模拟内容提取
      const { connectionUtils } = useConnectionStore.getState();
      const extractedContents = mockNotes.map((note) => {
        const extracted = connectionUtils.extractNoteContent(note);
        const quality = connectionUtils.assessContentQuality(extracted);
        return {
          title: note.title,
          original: note.content,
          extracted,
          quality: (quality * 100).toFixed(0),
        };
      });

      // 生成摘要
      const summary = connectionUtils.getConnectionSummary(
        mockNotes,
        "final_answer_only"
      );

      const result = `
🎯 场景: ${
        scenario === "speed"
          ? "速度优先"
          : scenario === "accuracy"
          ? "准确性优先"
          : "平衡模式"
      }

📋 当前配置:
- 长度限制: ${config.lengthLimits.finalAnswerOnly} / ${config.lengthLimits.full}
- 质量评估: ${config.qualityAssessment.enabled ? "启用" : "禁用"}
- 智能截断: ${config.smartTruncation.enabled ? "启用" : "禁用"}

📝 提取结果:
${extractedContents
  .map(
    (item, index) => `
${index + 1}. ${item.title} (质量: ${item.quality}%)
   原始长度: ${item.original.length} 字符
   提取长度: ${item.extracted.length} 字符
   提取内容: ${item.extracted.substring(0, 100)}${
      item.extracted.length > 100 ? "..." : ""
    }
`
  )
  .join("")}

🔗 连接摘要:
${summary}
      `;

      setDemoResult(result);
      message.success(
        `已切换到${
          scenario === "speed"
            ? "速度"
            : scenario === "accuracy"
            ? "准确性"
            : "平衡"
        }优先模式`
      );
    } catch (error) {
      message.error("演示失败: " + error);
    }
  };

  // 自定义配置演示
  const demonstrateCustomConfig = () => {
    try {
      // 应用自定义配置
      updateExtractionConfig({
        lengthLimits: {
          finalAnswerOnly: 150,
          full: 80,
          qualityBonus: 30,
        },
        qualityAssessment: {
          enabled: true,
          lengthWeight: 0.1,
          structureWeight: 0.4,
          densityWeight: 0.3,
          keywordWeight: 0.2,
          qualityThreshold: 0.8,
        },
        debug: {
          enabled: true,
          showQualityScores: true,
          logExtractionSteps: true,
        },
      });

      setCurrentScenario("custom");
      message.success("已应用自定义配置");

      // 重新演示
      demonstrateScenario("balanced");
    } catch (error) {
      message.error("应用自定义配置失败: " + error);
    }
  };

  // 重置配置
  const handleReset = () => {
    try {
      resetExtractionConfig();
      setCurrentScenario("balanced");
      setDemoResult("");
      message.success("配置已重置");
    } catch (error) {
      message.error("重置失败: " + error);
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title={
          <Space>
            <SettingOutlined />
            <span>内容提取配置管理演示</span>
          </Space>
        }
        extra={
          <Button onClick={handleReset} size="small">
            重置配置
          </Button>
        }
      >
        <Alert
          message="配置管理功能说明"
          description="此演示展示了如何通过配置管理来优化内容提取的准确性和性能。您可以选择不同的优化场景，或者自定义配置参数。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {/* 场景选择 */}
        <Title level={4}>优化场景</Title>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card
              hoverable
              onClick={() => demonstrateScenario("speed")}
              style={{
                border:
                  currentScenario === "speed"
                    ? "2px solid #1890ff"
                    : "1px solid #d9d9d9",
                cursor: "pointer",
              }}
            >
              <Space
                direction="vertical"
                align="center"
                style={{ width: "100%" }}
              >
                <ThunderboltOutlined
                  style={{ fontSize: 32, color: "#52c41a" }}
                />
                <Title level={5}>速度优先</Title>
                <Text type="secondary">
                  禁用质量评估和智能截断，最快处理速度
                </Text>
                <Tag color="green">推荐：大量便签处理</Tag>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              hoverable
              onClick={() => demonstrateScenario("accuracy")}
              style={{
                border:
                  currentScenario === "accuracy"
                    ? "2px solid #1890ff"
                    : "1px solid #d9d9d9",
                cursor: "pointer",
              }}
            >
              <Space
                direction="vertical"
                align="center"
                style={{ width: "100%" }}
              >
                <AimOutlined style={{ fontSize: 32, color: "#1890ff" }} />
                <Title level={5}>准确性优先</Title>
                <Text type="secondary">
                  启用所有功能，增加长度限制，最高准确性
                </Text>
                <Tag color="blue">推荐：重要内容处理</Tag>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              hoverable
              onClick={() => demonstrateScenario("balanced")}
              style={{
                border:
                  currentScenario === "balanced"
                    ? "2px solid #1890ff"
                    : "1px solid #d9d9d9",
                cursor: "pointer",
              }}
            >
              <Space
                direction="vertical"
                align="center"
                style={{ width: "100%" }}
              >
                <SyncOutlined style={{ fontSize: 32, color: "#fa8c16" }} />
                <Title level={5}>平衡模式</Title>
                <Text type="secondary">平衡速度和准确性，适合日常使用</Text>
                <Tag color="orange">推荐：一般场景</Tag>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 自定义配置 */}
        <Divider />
        <Title level={4}>自定义配置</Title>
        <Paragraph>
          您也可以通过AI设置页面进行详细的参数调整，或者点击下面的按钮应用一个示例自定义配置：
        </Paragraph>
        <Button
          icon={<PlayCircleOutlined />}
          onClick={demonstrateCustomConfig}
          style={{ marginBottom: 24 }}
        >
          应用示例自定义配置
        </Button>

        {/* 演示结果 */}
        {demoResult && (
          <>
            <Divider />
            <Title level={4}>演示结果</Title>
            <div
              style={{
                background: "#f5f5f5",
                padding: "16px",
                borderRadius: "6px",
                fontFamily: "monospace",
                fontSize: "12px",
                whiteSpace: "pre-line",
              }}
            >
              {demoResult}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default ConfigDemo;
