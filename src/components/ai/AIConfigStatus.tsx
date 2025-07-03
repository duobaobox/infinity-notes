// AI配置状态指示器组件
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Progress, Space, Tag, Tooltip, Typography } from "antd";
import React from "react";
import type { AIConfig } from "../../services/ai/aiService";
import { AIConfigValidator } from "../../utils/aiValidation";

const { Text } = Typography;

interface AIConfigStatusProps {
  config: Partial<AIConfig>;
  showProgress?: boolean;
  showDetails?: boolean;
  size?: "small" | "default";
}

/**
 * AI配置状态指示器组件
 * 显示配置完整度、验证状态和详细信息
 */
export const AIConfigStatus: React.FC<AIConfigStatusProps> = ({
  config,
  showProgress = true,
  showDetails = false,
  size = "default",
}) => {
  // 获取配置完整度
  const completeness = AIConfigValidator.getConfigCompleteness(config);

  // 验证配置
  const validation = AIConfigValidator.validateConfig(config);

  // 检查是否完整
  const isComplete = AIConfigValidator.isConfigComplete(config);

  // 获取状态颜色
  const getStatusColor = () => {
    if (isComplete && validation.isValid) {
      return "success";
    }
    if (completeness > 0) {
      return "warning";
    }
    return "default";
  };

  // 获取状态图标
  const getStatusIcon = () => {
    if (isComplete && validation.isValid) {
      return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
    }
    if (validation.errors.length > 0) {
      return <ExclamationCircleOutlined style={{ color: "#faad14" }} />;
    }
    return <InfoCircleOutlined style={{ color: "#1890ff" }} />;
  };

  // 获取状态文本
  const getStatusText = () => {
    if (isComplete && validation.isValid) {
      return "AI功能已就绪";
    }
    if (completeness === 0) {
      return "未配置AI功能";
    }
    if (validation.errors.length > 0) {
      return `配置不完整 (${completeness}%)`;
    }
    return `配置进行中 (${completeness}%)`;
  };

  // 获取进度条颜色
  const getProgressColor = () => {
    if (completeness === 100 && validation.isValid) {
      return "#52c41a";
    }
    if (completeness >= 66) {
      return "#faad14";
    }
    if (completeness >= 33) {
      return "#1890ff";
    }
    return "#d9d9d9";
  };

  return (
    <div className="ai-config-status">
      <Space direction="vertical" size="small" style={{ width: "100%" }}>
        {/* 状态标签 */}
        <Space size="small">
          {getStatusIcon()}
          <Tag color={getStatusColor()} style={{ margin: 0 }}>
            {getStatusText()}
          </Tag>
        </Space>

        {/* 进度条 */}
        {showProgress && (
          <Progress
            percent={completeness}
            size={size === "small" ? "small" : "default"}
            strokeColor={getProgressColor()}
            showInfo={false}
            style={{ margin: 0 }}
          />
        )}

        {/* 详细信息 */}
        {showDetails && (
          <div className="ai-config-details">
            {/* 错误信息 */}
            {validation.errors.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <Text
                  type="danger"
                  style={{ fontSize: size === "small" ? 12 : 14 }}
                >
                  <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                  问题：
                </Text>
                <ul style={{ margin: "4px 0", paddingLeft: 16 }}>
                  {validation.errors.map((error, index) => (
                    <li key={index}>
                      <Text
                        type="danger"
                        style={{ fontSize: size === "small" ? 12 : 14 }}
                      >
                        {error}
                      </Text>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 警告信息 */}
            {validation.warnings && validation.warnings.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <Text
                  type="warning"
                  style={{ fontSize: size === "small" ? 12 : 14 }}
                >
                  <InfoCircleOutlined style={{ marginRight: 4 }} />
                  提醒：
                </Text>
                <ul style={{ margin: "4px 0", paddingLeft: 16 }}>
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>
                      <Text
                        type="warning"
                        style={{ fontSize: size === "small" ? 12 : 14 }}
                      >
                        {warning}
                      </Text>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 配置字段状态 */}
            <div>
              <Text
                style={{ fontSize: size === "small" ? 12 : 14, color: "#666" }}
              >
                配置状态：
              </Text>
              <Space size="small" wrap style={{ marginTop: 4 }}>
                <Tag color={config.apiKey ? "success" : "default"}>
                  API密钥 {config.apiKey ? "✓" : "✗"}
                </Tag>
                <Tag color={config.apiUrl ? "success" : "default"}>
                  API地址 {config.apiUrl ? "✓" : "✗"}
                </Tag>
                <Tag color={config.aiModel ? "success" : "default"}>
                  AI模型 {config.aiModel ? "✓" : "✗"}
                </Tag>
              </Space>
            </div>
          </div>
        )}
      </Space>
    </div>
  );
};

/**
 * 简化版本的AI配置状态组件
 * 只显示基本状态信息
 */
export const AIConfigStatusSimple: React.FC<{ config: Partial<AIConfig> }> = ({
  config,
}) => {
  const isComplete = AIConfigValidator.isConfigComplete(config);
  const validation = AIConfigValidator.validateConfig(config);

  if (isComplete && validation.isValid) {
    return (
      <Tooltip title="AI功能已就绪">
        <Tag color="success">
          <CheckCircleOutlined style={{ marginRight: 4 }} />
          已配置
        </Tag>
      </Tooltip>
    );
  }

  if (validation.errors.length > 0) {
    return (
      <Tooltip title={`配置问题：${validation.errors.join("；")}`}>
        <Tag color="warning">
          <ExclamationCircleOutlined style={{ marginRight: 4 }} />
          需要配置
        </Tag>
      </Tooltip>
    );
  }

  return (
    <Tooltip title="AI功能未配置">
      <Tag color="default">
        <InfoCircleOutlined style={{ marginRight: 4 }} />
        未配置
      </Tag>
    </Tooltip>
  );
};

export default AIConfigStatus;
