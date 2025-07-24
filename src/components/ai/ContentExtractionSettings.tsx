// 内容提取设置组件 - 极简化版
import React, { useState, useEffect } from "react";
import { Card, Typography, InputNumber, Space } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { ContentExtractionConfigManager } from "../../config/contentExtractionConfig";
import CardSectionTitle from "../common/CardSectionTitle";

const { Text } = Typography;

interface ContentExtractionSettingsProps {
  // 简化后不再需要配置变更回调
}

/**
 * 内容提取设置组件 - 极简化版
 * 🎯 只显示智能切换阈值设置
 */
export const ContentExtractionSettings: React.FC<
  ContentExtractionSettingsProps
> = () => {
  const [threshold, setThreshold] = useState<number>(1000);
  const configManager = ContentExtractionConfigManager.getInstance();

  // 初始化阈值
  useEffect(() => {
    setThreshold(configManager.getLengthThreshold());
  }, []);

  // 处理阈值变更
  const handleThresholdChange = (value: number | null) => {
    if (value && value > 0) {
      setThreshold(value);
      configManager.setLengthThreshold(value);
    }
  };

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <CardSectionTitle icon={<SettingOutlined />}>
        内容提取优化
      </CardSectionTitle>

      <Space direction="vertical" style={{ width: "100%" }}>
        {/* 说明文字 */}
        <Text type="secondary" style={{ fontSize: "14px" }}>
          💡 系统会根据连接便签的总字数自动选择最佳模式
        </Text>

        {/* 阈值设置 */}
        <div>
          <Text strong style={{ marginBottom: 8, display: "block" }}>
            智能切换阈值
          </Text>
          <Space align="center">
            <Text>超过</Text>
            <InputNumber
              value={threshold}
              onChange={handleThresholdChange}
              min={100}
              max={5000}
              step={100}
              style={{ width: 100 }}
            />
            <Text>字时自动切换到智能模式</Text>
          </Space>
          <Text
            type="secondary"
            style={{ fontSize: "12px", marginTop: "8px", display: "block" }}
          >
            精准模式：使用完整内容 | 智能模式：提取核心内容
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default ContentExtractionSettings;
