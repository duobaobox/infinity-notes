/**
 * AI链接优化演示组件
 * 🎨 用直观的方式展示Token优化效果
 */
import React, { useState } from "react";
import { Card, Button, Space, Typography, Divider } from "antd";
import { PlayCircleOutlined, EyeOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface SmartExtractionDemoProps {
  onClose?: () => void;
}

/**
 * 智能提取演示组件
 */
export const SmartExtractionDemo: React.FC<SmartExtractionDemoProps> = ({
  onClose: _onClose,
}) => {
  const [currentDemo, setCurrentDemo] = useState<"short" | "long" | null>(null);

  // 短便签示例
  const shortNoteExample = {
    original: `今天的会议要点：
1. 项目进度正常
2. 预算需要调整
3. 下周开始新活动
4. 联系供应商确认时间`,
    processed: "完整发送给AI（约150 tokens）",
    explanation: "短便签Token消耗可控，完整发送保证信息完整性",
  };

  // 长便签示例
  const longNoteExample = {
    original: `## 市场分析报告

### 背景
在当前经济环境下，我们需要重新评估市场策略。经过深入调研，发现以下几个关键趋势...

### 详细分析
首先，消费者行为发生了显著变化。数据显示，线上购买比例增加了35%，同时对产品质量的要求也在提升。其次，竞争对手采取了更激进的定价策略，我们需要相应调整。

### 具体建议
1. 优化产品线，专注高价值产品
2. 加强线上渠道建设
3. 提升客户服务质量
4. 调整定价策略以保持竞争力

### 实施计划
第一阶段：产品优化（1-2个月）
第二阶段：渠道建设（2-3个月）
第三阶段：全面推广（3-6个月）

### 预期效果
预计实施后，销售额将提升20-30%，客户满意度提升15%，市场份额增加5%。`,
    processed: `## 核心要点

**市场趋势：**
- 线上购买增加35%
- 产品质量要求提升
- 竞争加剧需调整策略

**主要建议：**
1. 优化产品线，专注高价值产品
2. 加强线上渠道建设
3. 提升客户服务质量
4. 调整定价策略

**预期效果：**
销售额提升20-30%，客户满意度提升15%

发送给AI（约400 tokens，节省约85%）`,
    explanation: "长便签智能提取要点，大幅减少Token消耗",
  };

  const DemoCard = ({
    title,
    example,
    type,
  }: {
    title: string;
    example: typeof shortNoteExample;
    type: "short" | "long";
  }) => (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Text strong style={{ color: "#374151" }}>
          {title}
        </Text>
        <Button
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={() => setCurrentDemo(currentDemo === type ? null : type)}
        >
          {currentDemo === type ? "收起" : "查看效果"}
        </Button>
      </div>

      {currentDemo === type && (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {/* 原始内容 */}
          <div style={{ padding: "12px", background: "#f9fafb" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#6b7280",
                }}
              />
              <Text style={{ fontSize: "12px", color: "#6b7280" }}>
                原始便签内容
              </Text>
            </div>
            <div
              style={{
                fontSize: "12px",
                lineHeight: "1.4",
                color: "#374151",
                maxHeight: "120px",
                overflow: "auto",
                whiteSpace: "pre-line",
              }}
            >
              {example.original}
            </div>
          </div>

          <Divider style={{ margin: 0 }} />

          {/* 处理结果 */}
          <div style={{ padding: "12px", background: "#ffffff" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: type === "short" ? "#10b981" : "#3b82f6",
                }}
              />
              <Text style={{ fontSize: "12px", color: "#6b7280" }}>
                发送给AI的内容
              </Text>
            </div>
            <div
              style={{
                fontSize: "12px",
                lineHeight: "1.4",
                color: "#374151",
                whiteSpace: "pre-line",
              }}
            >
              {example.processed}
            </div>
            <div
              style={{
                marginTop: 8,
                padding: "6px 8px",
                background: "#f0f9ff",
                borderRadius: "4px",
                fontSize: "11px",
                color: "#0369a1",
              }}
            >
              💡 {example.explanation}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Card
      size="small"
      title={
        <Space>
          <EyeOutlined />
          <span>功能演示</span>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <div style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: "13px", color: "#6b7280" }}>
          通过实际例子了解AI链接时的Token优化效果
        </Text>
      </div>

      <DemoCard
        title="📝 短便签AI链接"
        example={shortNoteExample}
        type="short"
      />

      <DemoCard title="📄 长便签AI链接" example={longNoteExample} type="long" />

      <div
        style={{
          marginTop: 16,
          padding: "10px 12px",
          background: "#f0fdf4",
          borderRadius: "6px",
          border: "1px solid #bbf7d0",
        }}
      >
        <Text style={{ fontSize: "12px", color: "#166534" }}>
          ✨ <strong>智能优化：</strong>
          系统会自动识别便签长度，无需手动选择，自动优化Token使用
        </Text>
      </div>
    </Card>
  );
};

export default SmartExtractionDemo;
