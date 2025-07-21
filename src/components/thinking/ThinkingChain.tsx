import {
  BulbOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownOutlined,
  ExperimentOutlined,
  QuestionCircleOutlined,
  RightOutlined,
  SearchOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Card, Collapse, Divider, Tag, Timeline, Typography } from "antd";
import type { CollapseProps } from "antd";
import React from "react";
import type {
  ThinkingChain as ThinkingChainType,
  ThinkingStep,
} from "../types";
import "./ThinkingChain.css";

const { Text, Paragraph } = Typography;

// 思维链组件属性接口
interface ThinkingChainProps {
  thinkingChain: ThinkingChainType; // 思维链数据
  defaultExpanded?: boolean; // 默认是否展开
  compact?: boolean; // 紧凑模式
}

// 根据步骤类型获取对应的图标和颜色
const getStepIcon = (stepType: ThinkingStep["stepType"]) => {
  switch (stepType) {
    case "analysis":
      return { icon: <SearchOutlined />, color: "#1890ff" };
    case "reasoning":
      return { icon: <ExperimentOutlined />, color: "#52c41a" };
    case "conclusion":
      return { icon: <TrophyOutlined />, color: "#fa8c16" };
    case "question":
      return { icon: <QuestionCircleOutlined />, color: "#eb2f96" };
    case "idea":
      return { icon: <BulbOutlined />, color: "#722ed1" };
    default:
      return { icon: <ExperimentOutlined />, color: "#52c41a" };
  }
};

// 获取步骤类型的中文标签
const getStepTypeLabel = (stepType: ThinkingStep["stepType"]) => {
  switch (stepType) {
    case "analysis":
      return "分析";
    case "reasoning":
      return "推理";
    case "conclusion":
      return "结论";
    case "question":
      return "疑问";
    case "idea":
      return "想法";
    default:
      return "思考";
  }
};

// 格式化思考时间
const formatThinkingTime = (milliseconds: number) => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  } else {
    return `${(milliseconds / 60000).toFixed(1)}min`;
  }
};

/**
 * 思维链展示组件
 * 用于显示AI生成便签时的思考过程
 * 支持折叠/展开、紧凑模式等功能
 */
const ThinkingChain: React.FC<ThinkingChainProps> = ({
  thinkingChain,
  defaultExpanded = false,
  compact = false,
}) => {
  // 渲染思维链步骤时间线
  const renderThinkingSteps = () => {
    return (
      <Timeline
        mode="left"
        className={`thinking-timeline ${compact ? "compact" : ""}`}
      >
        {thinkingChain.steps.map((step) => {
          const { icon, color } = getStepIcon(step.stepType);

          return (
            <Timeline.Item
              key={step.id}
              dot={
                <div
                  className="thinking-step-icon"
                  style={{ backgroundColor: color }}
                >
                  {icon}
                </div>
              }
              color={color}
            >
              <div className="thinking-step-content">
                <div className="thinking-step-header">
                  <Tag color={color} className="thinking-step-tag">
                    {getStepTypeLabel(step.stepType)}
                  </Tag>
                  <Text type="secondary" className="thinking-step-time">
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {step.timestamp.toLocaleTimeString()}
                  </Text>
                </div>
                <Paragraph
                  className="thinking-step-text"
                  style={{ marginBottom: 0 }}
                >
                  {step.content}
                </Paragraph>
              </div>
            </Timeline.Item>
          );
        })}
      </Timeline>
    );
  };

  // 渲染思维链统计信息
  const renderThinkingStats = () => {
    const stepCounts = thinkingChain.steps.reduce((acc, step) => {
      acc[step.stepType] = (acc[step.stepType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="thinking-stats">
        <div className="thinking-stats-item">
          <Text strong>思考步骤：</Text>
          <Text>{thinkingChain.steps.length}</Text>
        </div>
        <div className="thinking-stats-item">
          <Text strong>思考时间：</Text>
          <Text>{formatThinkingTime(thinkingChain.totalThinkingTime)}</Text>
        </div>
        <div className="thinking-stats-tags">
          {Object.entries(stepCounts).map(([type, count]) => {
            const { color } = getStepIcon(type as ThinkingStep["stepType"]);
            return (
              <Tag key={type} color={color}>
                {getStepTypeLabel(type as ThinkingStep["stepType"])} {count}
              </Tag>
            );
          })}
        </div>
      </div>
    );
  };

  // 定义 Collapse 的 items 配置
  const collapseItems: CollapseProps["items"] = [
    {
      key: "thinking",
      label: (
        <div className="thinking-header">
          <div className="thinking-title">
            <ExperimentOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            <Text strong>AI思考过程</Text>
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {thinkingChain.steps.length}步
            </Tag>
          </div>
          {!compact && (
            <Text type="secondary" className="thinking-time">
              {formatThinkingTime(thinkingChain.totalThinkingTime)}
            </Text>
          )}
        </div>
      ),
      children: (
        <div className="thinking-content">
          {/* 原始提示词 */}
          {thinkingChain.prompt && (
            <Card size="small" className="thinking-prompt-card">
              <Text strong>原始提示：</Text>
              <Paragraph
                style={{ marginBottom: 0, marginTop: 8 }}
                type="secondary"
              >
                {thinkingChain.prompt}
              </Paragraph>
            </Card>
          )}

          {/* 思维链统计 */}
          {!compact && renderThinkingStats()}

          {/* 思考步骤时间线 */}
          <div className="thinking-process-section">
            {renderThinkingSteps()}
          </div>

          {/* 分隔线 - 区分思维过程和最终答案 */}
          <Divider
            style={{
              margin: "24px 0 20px 0",
              borderColor: "#52c41a",
              borderWidth: "2px",
            }}
          >
            <CheckCircleOutlined
              style={{ color: "#52c41a", fontSize: "16px" }}
            />
          </Divider>

          {/* 最终答案区域 */}
          <div className="thinking-final-section">
            <Card size="small" className="thinking-final-answer">
              <div className="thinking-final-header">
                <CheckCircleOutlined
                  style={{
                    marginRight: 8,
                    color: "#52c41a",
                    fontSize: "16px",
                  }}
                />
                <Text strong style={{ color: "#52c41a", fontSize: "16px" }}>
                  最终答案
                </Text>
              </div>
              <Paragraph
                style={{
                  marginBottom: 0,
                  marginTop: 12,
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                {thinkingChain.finalAnswer}
              </Paragraph>
            </Card>
          </div>
        </div>
      ),
      className: "thinking-panel",
    },
  ];

  return (
    <div className={`thinking-chain-container ${compact ? "compact" : ""}`}>
      <Collapse
        defaultActiveKey={defaultExpanded ? ["thinking"] : []}
        ghost
        expandIcon={({ isActive }) =>
          isActive ? <DownOutlined /> : <RightOutlined />
        }
        className="thinking-collapse"
        items={collapseItems}
      />
    </div>
  );
};

export default ThinkingChain;
