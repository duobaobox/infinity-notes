import React from "react";
import { Button, Card, Space } from "antd";
import ThinkingChain from "./ThinkingChain";
import type { ThinkingChain as ThinkingChainType } from "../types";

/**
 * 思维链演示组件
 * 用于测试和展示思维链功能
 */
const ThinkingChainDemo: React.FC = () => {
  // 创建示例思维链数据
  const createSampleThinkingChain = (): ThinkingChainType => {
    return {
      id: `demo-thinking-${Date.now()}`,
      prompt: "请帮我分析一下如何提高工作效率",
      steps: [
        {
          id: "step-1",
          content: "首先，我需要分析当前工作效率低下的可能原因。常见的问题包括：时间管理不当、任务优先级不明确、工作环境干扰等。",
          stepType: "analysis",
          timestamp: new Date(Date.now() - 5000),
          order: 1,
        },
        {
          id: "step-2", 
          content: "基于这些分析，我认为可以从以下几个方面来改进：1) 使用时间管理工具，2) 制定明确的任务清单，3) 创造专注的工作环境。",
          stepType: "reasoning",
          timestamp: new Date(Date.now() - 4000),
          order: 2,
        },
        {
          id: "step-3",
          content: "但是，这些方法是否真的适合每个人呢？不同的工作性质和个人习惯可能需要不同的解决方案。",
          stepType: "question",
          timestamp: new Date(Date.now() - 3000),
          order: 3,
        },
        {
          id: "step-4",
          content: "我建议可以尝试番茄工作法，这是一个经过验证的时间管理技巧，可以帮助保持专注并提高效率。",
          stepType: "idea",
          timestamp: new Date(Date.now() - 2000),
          order: 4,
        },
        {
          id: "step-5",
          content: "综合以上分析，提高工作效率的关键在于找到适合自己的方法组合，并持续优化和调整。",
          stepType: "conclusion",
          timestamp: new Date(Date.now() - 1000),
          order: 5,
        },
      ],
      finalAnswer: "要提高工作效率，建议采用以下策略：\n\n1. **时间管理**：使用番茄工作法，25分钟专注工作+5分钟休息\n2. **任务规划**：每天制定优先级清单，先处理重要紧急的任务\n3. **环境优化**：创造无干扰的工作空间，关闭不必要的通知\n4. **定期回顾**：每周评估效率改进情况，调整策略\n\n记住，最重要的是找到适合自己的方法并坚持执行。",
      totalThinkingTime: 5000,
      createdAt: new Date(),
    };
  };

  const [sampleData, setSampleData] = React.useState<ThinkingChainType | null>(null);

  const handleGenerateDemo = () => {
    setSampleData(createSampleThinkingChain());
  };

  const handleClearDemo = () => {
    setSampleData(null);
  };

  return (
    <Card title="思维链功能演示" style={{ margin: 20 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Space>
          <Button type="primary" onClick={handleGenerateDemo}>
            生成示例思维链
          </Button>
          <Button onClick={handleClearDemo} disabled={!sampleData}>
            清除演示
          </Button>
        </Space>

        {sampleData && (
          <div style={{ marginTop: 16 }}>
            <h4>普通模式：</h4>
            <ThinkingChain 
              thinkingChain={sampleData} 
              defaultExpanded={false}
              compact={false}
            />
            
            <h4 style={{ marginTop: 24 }}>紧凑模式：</h4>
            <ThinkingChain 
              thinkingChain={sampleData} 
              defaultExpanded={true}
              compact={true}
            />
          </div>
        )}

        <div style={{ marginTop: 16, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
          <h4>使用说明：</h4>
          <ul>
            <li>思维链组件会自动解析AI响应中的 &lt;thinking&gt; 标签内容</li>
            <li>支持折叠/展开显示，默认折叠状态</li>
            <li>提供紧凑模式，适合在便签中显示</li>
            <li>自动识别思考步骤类型：分析、推理、结论、疑问、想法</li>
            <li>显示思考时间统计和步骤数量</li>
          </ul>
        </div>
      </Space>
    </Card>
  );
};

export default ThinkingChainDemo;
