/**
 * 简化版内容提取设置组件
 * 🎯 基于1000字阈值策略，只提供必要的设置选项
 */
import React, { useState, useEffect } from "react";
import {
  Card,
  Space,
  Typography,
  InputNumber,
  Switch,
  Button,
  message,
  Collapse,
  Divider,
} from "antd";
import {
  SettingOutlined,
  InfoCircleOutlined,
  ExperimentOutlined,
  ReloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  getSimpleConfig,
  setLengthThreshold,
  getLengthThreshold,
  SimpleConfigManager,
} from "../../config/simpleContentExtractionConfig";
import CardSectionTitle from "../common/CardSectionTitle";
import SmartExtractionDemo from "./SmartExtractionDemo";

const { Text } = Typography;
const { Panel } = Collapse;

interface SimpleExtractionSettingsProps {
  showAdvanced?: boolean; // 是否显示高级设置
  showDemo?: boolean; // 是否显示功能演示
}

/**
 * 简化版内容提取设置组件
 */
export const SimpleExtractionSettings: React.FC<
  SimpleExtractionSettingsProps
> = ({ showAdvanced = false, showDemo = false }) => {
  const [threshold, setThreshold] = useState<number>(1000);
  const [maxLength, setMaxLength] = useState<number>(300);
  const [enableSmartTruncation, setEnableSmartTruncation] =
    useState<boolean>(true);
  const [loading, setLoading] = useState(false);

  // 初始化配置
  useEffect(() => {
    const config = getSimpleConfig();
    setThreshold(config.lengthThreshold);
    setMaxLength(config.longNoteExtraction.maxLength);
    setEnableSmartTruncation(config.longNoteExtraction.enableSmartTruncation);
  }, []);

  // 保存配置
  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const configManager = SimpleConfigManager.getInstance();

      // 更新配置
      configManager.updateConfig({
        lengthThreshold: threshold,
        longNoteExtraction: {
          maxLength,
          enableSmartTruncation,
        },
      });

      message.success("配置已保存");
    } catch (error) {
      console.error("保存配置失败:", error);
      message.error("保存配置失败");
    } finally {
      setLoading(false);
    }
  };

  // 重置为默认配置
  const handleReset = () => {
    setThreshold(1000);
    setMaxLength(300);
    setEnableSmartTruncation(true);
    message.info("已重置为默认配置");
  };

  // 用户价值展示
  const UserValueDisplay = () => (
    <div
      style={{
        padding: "16px",
        background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
        borderRadius: "8px",
        border: "1px solid #bae6fd",
        marginBottom: 20,
      }}
    >
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            🧠
          </div>
          <div>
            <Text strong style={{ color: "#1e40af", fontSize: "15px" }}>
              AI链接优化已开启
            </Text>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: 2 }}>
              自动优化便签内容，提升AI对话效率
            </div>
          </div>
        </div>
      </Space>
    </div>
  );

  // 高级设置面板
  const AdvancedSettings = () => (
    <Collapse ghost>
      <Panel
        header={
          <Space>
            <ExperimentOutlined />
            <Text>AI链接优化设置（可选）</Text>
          </Space>
        }
        key="advanced"
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          {/* 智能处理触发条件 */}
          <div>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              🎯 什么时候开始Token优化？
            </Text>
            <div style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: "13px", color: "#6b7280" }}>
                当便签内容超过这个长度时，自动提取要点发送给AI
              </Text>
            </div>
            <Space align="center">
              <InputNumber
                value={threshold}
                onChange={(value) => setThreshold(value || 1000)}
                min={100}
                max={5000}
                step={100}
                style={{ width: 120 }}
                addonAfter="字符"
              />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                默认1000字，平衡Token消耗和信息完整性
              </Text>
            </Space>
          </div>

          {/* 提取结果长度 */}
          <div>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              ✂️ 提取后发送多少内容给AI？
            </Text>
            <div style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: "13px", color: "#6b7280" }}>
                智能提取后发送给AI的内容长度，平衡信息完整性和Token消耗
              </Text>
            </div>
            <Space align="center">
              <InputNumber
                value={maxLength}
                onChange={(value) => setMaxLength(value || 300)}
                min={100}
                max={1000}
                step={50}
                style={{ width: 120 }}
                addonAfter="字符"
              />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                默认300字，保留核心信息，大幅节省Token
              </Text>
            </Space>
          </div>

          {/* 智能截断开关 */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text strong>🧠 智能断句</Text>
              <Switch
                checked={enableSmartTruncation}
                onChange={setEnableSmartTruncation}
                size="small"
              />
            </div>
            <Text style={{ fontSize: "13px", color: "#6b7280" }}>
              在句号、段落等自然位置结束，确保发送给AI的内容完整
            </Text>
          </div>

          <Divider style={{ margin: "12px 0" }} />

          {/* 操作按钮 */}
          <Space>
            <Button
              type="primary"
              onClick={handleSaveConfig}
              loading={loading}
              size="small"
            >
              保存配置
            </Button>
            <Button
              onClick={handleReset}
              icon={<ReloadOutlined />}
              size="small"
            >
              重置默认
            </Button>
          </Space>
        </Space>
      </Panel>
    </Collapse>
  );

  return (
    <>
      {/* 功能演示（可选） */}
      {showDemo && <SmartExtractionDemo />}

      <Card size="small" style={{ marginBottom: 16 }}>
        <CardSectionTitle icon={<SettingOutlined />}>
          AI链接优化
        </CardSectionTitle>

        {/* 用户价值展示 */}
        <UserValueDisplay />

        {/* 工作原理可视化 */}
        <div style={{ marginBottom: 20 }}>
          <Text
            strong
            style={{ display: "block", marginBottom: 12, color: "#374151" }}
          >
            🔗 AI链接时的优化原理
          </Text>

          {/* 短便签示例 */}
          <div
            style={{
              padding: "12px",
              background: "#f8fafc",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "4px",
                  background: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                }}
              >
                📝
              </div>
              <Text style={{ fontSize: "13px", fontWeight: 500 }}>
                短便签（≤1000字）
              </Text>
            </div>
            <Text style={{ fontSize: "12px", color: "#6b7280" }}>
              完整发送给AI → Token消耗可控，保证信息完整性
            </Text>
          </div>

          {/* 长便签示例 */}
          <div
            style={{
              padding: "12px",
              background: "#f8fafc",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "4px",
                  background: "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                }}
              >
                📄
              </div>
              <Text style={{ fontSize: "13px", fontWeight: 500 }}>
                长便签（>1000字）
              </Text>
            </div>
            <Text style={{ fontSize: "12px", color: "#6b7280" }}>
              智能提取要点后发送 → 大幅减少Token消耗，避免超限
            </Text>
          </div>
        </div>

        {/* 高级设置（可选） */}
        {showAdvanced && <AdvancedSettings />}

        {/* 用户价值提示 */}
        <div
          style={{
            marginTop: 20,
            padding: "14px 16px",
            background: "#fefce8",
            borderRadius: "8px",
            border: "1px solid #fde047",
          }}
        >
          <div style={{ display: "flex", alignItems: "start", gap: 12 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#eab308",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                marginTop: 2,
              }}
            >
              💡
            </div>
            <div>
              <Text
                strong
                style={{
                  color: "#a16207",
                  fontSize: "13px",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                为什么需要AI链接优化？
              </Text>
              <Text
                style={{
                  fontSize: "12px",
                  color: "#a16207",
                  lineHeight: "1.5",
                }}
              >
                长便签在AI对话中会消耗大量Token，增加成本并可能超出限制。
                智能优化帮您保留核心信息的同时大幅节省Token消耗。
              </Text>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};

export default SimpleExtractionSettings;
