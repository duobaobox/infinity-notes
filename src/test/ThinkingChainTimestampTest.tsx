import { Button, Card, Space, Typography, Alert } from "antd";
import React, { useState } from "react";
import ThinkingChain from "../components/thinking/ThinkingChain";
import type { ThinkingChain as ThinkingChainType } from "../components/types";

const { Title, Text } = Typography;

/**
 * 思维链时间戳处理测试页面
 * 用于测试从数据库加载的思维链数据中时间戳字段的正确处理
 */
const ThinkingChainTimestampTest: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  // 创建模拟从数据库加载的思维链数据（时间戳为字符串格式）
  const createMockDatabaseThinkingChain = (): any => {
    return {
      id: "test-db-thinking-chain-1",
      prompt: "测试从数据库加载的思维链数据，包含多个步骤以测试滚动功能",
      steps: [
        {
          id: "step-1",
          content:
            "这是第一个思考步骤，时间戳来自数据库（字符串格式）。我们需要分析当前的问题背景和需求。",
          stepType: "analysis",
          timestamp: "2024-01-20T10:30:00.000Z",
          order: 1,
        },
        {
          id: "step-2",
          content:
            "这是第二个思考步骤，测试时间戳转换。基于前面的分析，我们可以得出一些初步的结论和推理。",
          stepType: "reasoning",
          timestamp: "2024-01-20T10:31:00.000Z",
          order: 2,
        },
        {
          id: "step-3",
          content:
            "这是第三个思考步骤，验证组件的容错性。在这个步骤中，我们需要考虑各种边界情况和异常处理。",
          stepType: "question",
          timestamp: "2024-01-20T10:32:00.000Z",
          order: 3,
        },
        {
          id: "step-4",
          content:
            "这是第四个思考步骤，提出创新的想法。我们可以尝试一些新的方法来解决这个问题。",
          stepType: "idea",
          timestamp: "2024-01-20T10:33:00.000Z",
          order: 4,
        },
        {
          id: "step-5",
          content:
            "这是第五个思考步骤，进一步分析。让我们深入研究技术细节和实现方案。",
          stepType: "analysis",
          timestamp: "2024-01-20T10:34:00.000Z",
          order: 5,
        },
        {
          id: "step-6",
          content:
            "这是第六个思考步骤，最终推理。综合前面所有的分析和思考，我们可以得出最终的结论。",
          stepType: "reasoning",
          timestamp: "2024-01-20T10:35:00.000Z",
          order: 6,
        },
        {
          id: "step-7",
          content:
            "这是最后一个思考步骤，总结结论。测试完成，思维链组件应该能够正确处理字符串格式的时间戳，并且支持滚动查看长内容。",
          stepType: "conclusion",
          timestamp: "2024-01-20T10:36:00.000Z",
          order: 7,
        },
      ],
      finalAnswer:
        "测试完成！新的思维链组件设计具有以下优势：\n\n1. **简洁的结构** - 去掉了Ant Design Collapse的依赖，使用自定义的展开/折叠逻辑\n2. **更好的滚动体验** - thinking-process-section直接作为滚动容器，避免了复杂的CSS层级\n3. **优化的空间利用** - 在便签中能够更好地适应有限的空间\n4. **美观的滚动条** - 自定义滚动条样式，提供更好的视觉体验\n5. **灵活的布局** - 支持紧凑模式和普通模式，适应不同的使用场景",
      totalThinkingTime: 7000,
      createdAt: "2024-01-20T10:30:00.000Z",
    };
  };

  // 模拟IndexedDBAdapter的数据转换过程
  const simulateDataConversion = (rawData: any): ThinkingChainType => {
    // 模拟从数据库读取并转换的过程
    const parsed = rawData;

    // 确保思维链中的时间戳字段是Date对象
    if (parsed && parsed.steps && Array.isArray(parsed.steps)) {
      parsed.steps = parsed.steps.map((step: any) => ({
        ...step,
        timestamp:
          step.timestamp instanceof Date
            ? step.timestamp
            : new Date(step.timestamp),
      }));
    }

    // 确保createdAt也是Date对象
    if (parsed && parsed.createdAt) {
      parsed.createdAt =
        parsed.createdAt instanceof Date
          ? parsed.createdAt
          : new Date(parsed.createdAt);
    }

    return parsed as ThinkingChainType;
  };

  // 测试思维链组件的时间戳处理
  const testTimestampHandling = () => {
    try {
      setError(null);
      setTestResult(null);

      // 创建模拟数据库数据
      const rawData = createMockDatabaseThinkingChain();
      console.log("原始数据库数据:", rawData);

      // 模拟数据转换过程
      const convertedData = simulateDataConversion(rawData);
      console.log("转换后的数据:", convertedData);

      // 验证转换结果
      const allTimestampsAreDate = convertedData.steps.every(
        (step) => step.timestamp instanceof Date
      );
      const createdAtIsDate = convertedData.createdAt instanceof Date;

      if (allTimestampsAreDate && createdAtIsDate) {
        setTestResult("✅ 时间戳转换成功！所有时间戳都已正确转换为Date对象");
      } else {
        setError("❌ 时间戳转换失败！部分时间戳仍为字符串格式");
      }

      // 测试组件渲染
      setTimeout(() => {
        const testElement = document.querySelector(".thinking-timeline");
        if (testElement) {
          setTestResult((prev) => prev + "\n✅ 思维链组件渲染成功！");
        }
      }, 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      setError(`❌ 测试失败: ${errorMessage}`);
      console.error("测试错误:", err);
    }
  };

  // 创建已转换的测试数据用于组件渲染
  const [testData, setTestData] = useState<ThinkingChainType | null>(null);

  const handleRunTest = () => {
    testTimestampHandling();

    // 创建用于渲染的测试数据
    const rawData = createMockDatabaseThinkingChain();
    const convertedData = simulateDataConversion(rawData);
    setTestData(convertedData);
  };

  const handleClearTest = () => {
    setError(null);
    setTestResult(null);
    setTestData(null);
  };

  return (
    <Card title="思维链时间戳处理测试" style={{ margin: 16 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <div>
          <Title level={4}>测试说明</Title>
          <Text>
            此测试用于验证思维链组件能够正确处理从数据库加载的数据中的时间戳字段。
            数据库中的时间戳通常以字符串格式存储，需要在加载时转换为Date对象。
          </Text>
        </div>

        <Space>
          <Button type="primary" onClick={handleRunTest}>
            运行时间戳处理测试
          </Button>
          <Button onClick={handleClearTest}>清除测试结果</Button>
        </Space>

        {error && (
          <Alert message="测试错误" description={error} type="error" showIcon />
        )}

        {testResult && (
          <Alert
            message="测试结果"
            description={
              <pre style={{ whiteSpace: "pre-wrap" }}>{testResult}</pre>
            }
            type="success"
            showIcon
          />
        )}

        {testData && (
          <div>
            <Title level={4}>思维链组件渲染测试</Title>

            {/* 普通模式测试 */}
            <div style={{ marginBottom: 16 }}>
              <Text strong>普通模式：</Text>
              <div
                style={{
                  border: "1px solid #d9d9d9",
                  padding: 16,
                  borderRadius: 8,
                }}
              >
                <ThinkingChain
                  thinkingChain={testData}
                  defaultExpanded={true}
                  compact={false}
                />
              </div>
            </div>

            {/* 便签中的模式测试 */}
            <div style={{ marginBottom: 16 }}>
              <Text strong>便签中的模式（带滚动）：</Text>
              <div
                style={{
                  border: "1px solid #d9d9d9",
                  padding: 16,
                  borderRadius: 8,
                  height: 300, // 模拟便签的固定高度
                  overflow: "hidden",
                  background: "#fafafa",
                }}
              >
                <ThinkingChain
                  thinkingChain={testData}
                  defaultExpanded={true}
                  compact={true}
                  inNote={true}
                />
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: 16,
            padding: 16,
            background: "#f5f5f5",
            borderRadius: 8,
          }}
        >
          <Title level={5}>测试要点：</Title>
          <ul>
            <li>验证字符串格式的时间戳能够正确转换为Date对象</li>
            <li>确保思维链组件能够正常渲染时间信息</li>
            <li>测试组件的容错性，避免因时间戳格式问题导致崩溃</li>
            <li>模拟真实的数据库数据加载场景</li>
          </ul>
        </div>
      </Space>
    </Card>
  );
};

export default ThinkingChainTimestampTest;
