import { ExperimentOutlined } from "@ant-design/icons";
import { Card, Typography } from "antd";
import React from "react";
import type { ThinkingChain as ThinkingChainType } from "../types";

const { Text, Paragraph } = Typography;

// 简化版思维链组件属性接口
interface ThinkingChainProps {
  thinkingChain: ThinkingChainType; // 思维链数据
  defaultExpanded?: boolean; // 默认是否展开
  compact?: boolean; // 紧凑模式
}

/**
 * 简化版思维链展示组件
 * 用于显示AI生成便签时的思考过程
 */
const ThinkingChainSimple: React.FC<ThinkingChainProps> = ({
  thinkingChain,
  // defaultExpanded = false,
  // compact = false,
}) => {
  return (
    <Card
      size="small"
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ExperimentOutlined style={{ color: "#1890ff" }} />
          <Text strong>AI思考过程</Text>
          <Text type="secondary">({thinkingChain.steps.length}步)</Text>
        </div>
      }
      style={{ margin: "8px 0" }}
    >
      {/* 原始提示词 */}
      {thinkingChain.prompt && (
        <div style={{ marginBottom: 12 }}>
          <Text strong>提示：</Text>
          <Paragraph style={{ marginBottom: 0, marginTop: 4 }} type="secondary">
            {thinkingChain.prompt}
          </Paragraph>
        </div>
      )}

      {/* 思考步骤 */}
      <div style={{ marginBottom: 12 }}>
        <Text strong>思考步骤：</Text>
        {thinkingChain.steps.map((step, index) => (
          <div
            key={step.id}
            style={{
              marginTop: 8,
              padding: 8,
              background: "#f5f5f5",
              borderRadius: 4,
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              步骤 {index + 1} - {step.stepType}
            </Text>
            <Paragraph style={{ marginBottom: 0, marginTop: 4 }}>
              {step.content}
            </Paragraph>
          </div>
        ))}
      </div>

      {/* 最终答案 */}
      <div>
        <Text strong>最终答案：</Text>
        <Paragraph style={{ marginBottom: 0, marginTop: 4 }}>
          {thinkingChain.finalAnswer}
        </Paragraph>
      </div>
    </Card>
  );
};

export default ThinkingChainSimple;
