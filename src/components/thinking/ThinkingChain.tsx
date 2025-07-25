import {
  BulbOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Tag, Typography } from "antd";
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
  inNote?: boolean; // 是否在便签中显示
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
  inNote = false,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  // 渲染思维链步骤列表
  const renderThinkingSteps = () => {
    return (
      <div className="thinking-steps-list">
        {thinkingChain.steps.map((step) => {
          const { icon, color } = getStepIcon(step.stepType);

          return (
            <div key={step.id} className="thinking-step-item">
              {/* 步骤头部：包含图标的标签和时间 */}
              <div className="thinking-step-header">
                <div
                  className="thinking-step-tag-with-icon"
                  style={{ color: color }}
                >
                  <span style={{ color: color }}>{icon}</span>
                  <span style={{ color: color }}>
                    {getStepTypeLabel(step.stepType)}
                  </span>
                </div>
                <Text type="secondary" className="thinking-step-time">
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {(() => {
                    try {
                      // 确保timestamp是Date对象，如果不是则转换
                      const timestamp =
                        step.timestamp instanceof Date
                          ? step.timestamp
                          : new Date(step.timestamp);
                      return timestamp.toLocaleTimeString();
                    } catch (error) {
                      console.warn("时间戳格式化失败:", error);
                      return "时间未知";
                    }
                  })()}
                </Text>
              </div>

              {/* 步骤内容 */}
              <div className="thinking-step-content">
                <Paragraph
                  className="thinking-step-text"
                  style={{ marginBottom: 0 }}
                >
                  {step.content}
                </Paragraph>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 切换展开/折叠状态
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // 渲染思维链统计信息
  const renderThinkingStats = () => {
    const stepCounts = thinkingChain.steps.reduce((acc, step) => {
      acc[step.stepType] = (acc[step.stepType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="thinking-stats">
        {Object.entries(stepCounts).map(([type, count]) => {
          const { color } = getStepIcon(type as ThinkingStep["stepType"]);
          return (
            <Tag key={type} color={color}>
              {getStepTypeLabel(type as ThinkingStep["stepType"])} {count}
            </Tag>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`thinking-chain-container ${compact ? "compact" : ""} ${
        inNote ? "thinking-chain-in-note" : ""
      }`}
    >
      {/* 思维链头部 - 可点击展开/折叠 */}
      <div className="thinking-header" onClick={toggleExpanded}>
        <div className="thinking-title">
          <ExperimentOutlined style={{ marginRight: 8, color: "#1890ff" }} />
          <Text strong>AI思考过程</Text>
          <Tag color="blue" style={{ marginLeft: 8 }}>
            {thinkingChain.steps.length}步
          </Tag>
          {!compact && (
            <Text type="secondary" className="thinking-time">
              {formatThinkingTime(thinkingChain.totalThinkingTime)}
            </Text>
          )}
        </div>
        <div className="thinking-expand-icon">{isExpanded ? "▼" : "▶"}</div>
      </div>

      {/* 思维链统计信息 */}
      {isExpanded && !compact && renderThinkingStats()}

      {/* 思维过程内容区域 */}
      {isExpanded && (
        <div className="thinking-process-section">{renderThinkingSteps()}</div>
      )}
    </div>
  );
};

export default ThinkingChain;
