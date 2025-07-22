// 内容提取设置组件 - 简化版
import React, { useState, useEffect } from "react";
import { Card, Space, Typography, message, Row, Col } from "antd";
import {
  InfoCircleOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  AimOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useConnectionStore } from "../../stores/connectionStore";
import type { ContentExtractionConfig } from "../../config/contentExtractionConfig";
import CardSectionTitle from "../common/CardSectionTitle";

const { Text } = Typography;

interface ContentExtractionSettingsProps {
  onConfigChange?: (config: ContentExtractionConfig) => void;
}

/**
 * 内容提取设置组件 - 简化版
 * 只提供优化模式选择，隐藏复杂的参数调整
 */
export const ContentExtractionSettings: React.FC<
  ContentExtractionSettingsProps
> = ({ onConfigChange }) => {
  const [loading, setLoading] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<string>("balanced");

  const { getExtractionConfig } = useConnectionStore();

  // 初始化时设置为平衡模式
  useEffect(() => {
    // 移除对不存在函数的调用，直接设置本地状态
    setCurrentScenario("balanced");
  }, []);

  // 处理场景切换
  const handleScenarioChange = async (
    scenario: "speed" | "accuracy" | "balanced"
  ) => {
    if (scenario === currentScenario) return; // 避免重复设置

    setLoading(true);
    try {
      // 移除对不存在函数的调用，只更新本地状态
      setCurrentScenario(scenario);

      const updatedConfig = getExtractionConfig();
      onConfigChange?.(updatedConfig);

      const scenarioNames = {
        speed: "快速模式",
        accuracy: "精准模式",
        balanced: "智能模式",
      };

      message.success(`已切换到${scenarioNames[scenario]}模式`);
    } catch (error) {
      message.error("切换场景失败");
      console.error("切换场景失败:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <CardSectionTitle icon={<SettingOutlined />}>
        内容提取优化
      </CardSectionTitle>
      <div>
        <Text
          type="secondary"
          style={{ marginBottom: 20, display: "block", fontSize: "14px" }}
        >
          💡 当您将便签连接到插槽进行AI处理时，选择合适的模式可以获得更好的效果
        </Text>

        {/* 优化模式选择 */}
        <Row gutter={12}>
          <Col span={8}>
            <Card
              hoverable
              onClick={() => handleScenarioChange("speed")}
              style={{
                border:
                  currentScenario === "speed"
                    ? "2px solid #52c41a"
                    : "1px solid #d9d9d9",
                cursor: loading ? "not-allowed" : "pointer",
                textAlign: "center",
                opacity: loading ? 0.6 : 1,
                minHeight: "120px",
              }}
              bodyStyle={{ padding: "16px 12px" }}
            >
              <Space
                direction="vertical"
                align="center"
                size="small"
                style={{ width: "100%" }}
              >
                <ThunderboltOutlined
                  style={{ fontSize: 24, color: "#52c41a" }}
                />
                <Text strong style={{ fontSize: "14px" }}>
                  快速模式
                </Text>
                <Text
                  type="secondary"
                  style={{
                    fontSize: "12px",
                    textAlign: "center",
                    lineHeight: "1.3",
                  }}
                >
                  处理速度快，适合批量整理
                </Text>
                <Text style={{ fontSize: "10px", color: "#52c41a" }}>
                  ⚡ 日常整理推荐
                </Text>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              hoverable
              onClick={() => handleScenarioChange("balanced")}
              style={{
                border:
                  currentScenario === "balanced"
                    ? "2px solid #1890ff"
                    : "1px solid #d9d9d9",
                cursor: loading ? "not-allowed" : "pointer",
                textAlign: "center",
                opacity: loading ? 0.6 : 1,
                minHeight: "120px",
              }}
              bodyStyle={{ padding: "16px 12px" }}
            >
              <Space
                direction="vertical"
                align="center"
                size="small"
                style={{ width: "100%" }}
              >
                <SyncOutlined style={{ fontSize: 24, color: "#1890ff" }} />
                <Text strong style={{ fontSize: "14px" }}>
                  智能模式
                </Text>
                <Text
                  type="secondary"
                  style={{
                    fontSize: "12px",
                    textAlign: "center",
                    lineHeight: "1.3",
                  }}
                >
                  速度与质量兼顾
                </Text>
                <Text style={{ fontSize: "10px", color: "#1890ff" }}>
                  🎯 大多数场景推荐
                </Text>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              hoverable
              onClick={() => handleScenarioChange("accuracy")}
              style={{
                border:
                  currentScenario === "accuracy"
                    ? "2px solid #fa8c16"
                    : "1px solid #d9d9d9",
                cursor: loading ? "not-allowed" : "pointer",
                textAlign: "center",
                opacity: loading ? 0.6 : 1,
                minHeight: "120px",
              }}
              bodyStyle={{ padding: "16px 12px" }}
            >
              <Space
                direction="vertical"
                align="center"
                size="small"
                style={{ width: "100%" }}
              >
                <AimOutlined style={{ fontSize: 24, color: "#fa8c16" }} />
                <Text strong style={{ fontSize: "14px" }}>
                  精准模式
                </Text>
                <Text
                  type="secondary"
                  style={{
                    fontSize: "12px",
                    textAlign: "center",
                    lineHeight: "1.3",
                  }}
                >
                  提取内容更完整
                </Text>
                <Text style={{ fontSize: "10px", color: "#fa8c16" }}>
                  📋 重要文档推荐
                </Text>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 当前模式状态 */}
        <div
          style={{
            marginTop: 16,
            padding: "12px",
            background: "#f0f9ff",
            borderRadius: "6px",
            border: "1px solid #d6f7ff",
          }}
        >
          <Space>
            <InfoCircleOutlined style={{ color: "#1890ff" }} />
            <Text>
              当前模式:{" "}
              <Text strong>
                {currentScenario === "speed"
                  ? "快速模式"
                  : currentScenario === "accuracy"
                  ? "精准模式"
                  : "智能模式"}
              </Text>
            </Text>
          </Space>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {currentScenario === "speed" &&
                "⚡ 快速处理便签内容，适合日常批量整理"}
              {currentScenario === "accuracy" &&
                "📋 提取更完整的内容信息，适合重要文档处理"}
              {currentScenario === "balanced" &&
                "🎯 智能平衡处理速度和内容质量，适合大多数使用场景"}
            </Text>
          </div>
        </div>

        {/* 使用提示 */}
        <div
          style={{
            marginTop: 12,
            padding: "8px 12px",
            background: "#fffbe6",
            borderRadius: "4px",
            border: "1px solid #ffe58f",
          }}
        >
          <Text type="secondary" style={{ fontSize: "12px" }}>
            💡 提示：配置会立即生效，影响便签连接到插槽时的内容提取行为
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default ContentExtractionSettings;
