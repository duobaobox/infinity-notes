// AI模型选择组件 - 优化版本
import {
  DollarOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Divider, Select, Space, Tag, Tooltip, Typography } from "antd";
import React, { useMemo } from "react";
import type {
  AIModel,
  AIModelCategory,
  AIProvider,
} from "../../types/aiProviders";
import { MODEL_CATEGORY_LABELS } from "../../types/aiProviders";

const { Text } = Typography;
const { Option, OptGroup } = Select;

interface AIModelSelectorProps {
  provider?: AIProvider;
  selectedModel?: string;
  onModelSelect: (modelName: string, model?: AIModel) => void;
  placeholder?: string;
  disabled?: boolean;
  allowCustom?: boolean;
}

/**
 * AI模型选择组件
 * 根据选中的供应商动态显示对应的模型，支持分类展示和详细信息
 * 支持自定义模型名称输入
 */
export const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  provider,
  selectedModel,
  onModelSelect,
  placeholder = "请先选择AI供应商",
  disabled = false,
  allowCustom = true,
}) => {
  /**
   * 按分类组织模型数据
   */
  const modelsByCategory = useMemo(() => {
    if (!provider) return {};

    const grouped: Record<AIModelCategory, AIModel[]> = {
      flagship: [],
      balanced: [],
      economical: [],
      coding: [],
      multimodal: [],
    };

    provider.models.forEach((model) => {
      if (grouped[model.category]) {
        grouped[model.category].push(model);
      }
    });

    // 只返回有模型的分类
    return Object.fromEntries(
      Object.entries(grouped).filter(([_, models]) => models.length > 0)
    );
  }, [provider]);

  /**
   * 获取分类的排序权重
   */
  const getCategoryWeight = (category: AIModelCategory): number => {
    const weights = {
      flagship: 1,
      balanced: 2,
      economical: 3,
      coding: 4,
      multimodal: 5,
    };
    return weights[category] || 999;
  };

  /**
   * 渲染模型选项
   */
  const renderModelOption = (model: AIModel) => {
    return (
      <Option key={model.id} value={model.name}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Text strong style={{ fontSize: "14px" }}>
                {model.displayName}
              </Text>
              <Tag
                color={getCategoryColor(model.category)}
                style={{ fontSize: "10px", margin: 0 }}
              >
                {MODEL_CATEGORY_LABELS[model.category]}
              </Tag>
            </div>
            <Text
              type="secondary"
              style={{
                fontSize: "12px",
                display: "block",
                marginTop: "2px",
                lineHeight: "1.3",
              }}
            >
              {model.description}
            </Text>
            {model.pricing && (
              <div style={{ marginTop: "4px" }}>
                <Space size="small">
                  <Text style={{ fontSize: "11px", color: "#666" }}>
                    <DollarOutlined /> ¥{model.pricing.input}/1K输入
                  </Text>
                  <Text style={{ fontSize: "11px", color: "#666" }}>
                    ¥{model.pricing.output}/1K输出
                  </Text>
                </Space>
              </div>
            )}
          </div>
          {model.contextLength && (
            <Tooltip
              title={`上下文长度: ${model.contextLength.toLocaleString()} tokens`}
            >
              <div style={{ textAlign: "right", marginLeft: "8px" }}>
                <FileTextOutlined style={{ color: "#666", fontSize: "12px" }} />
                <Text
                  style={{ fontSize: "11px", color: "#666", marginLeft: "4px" }}
                >
                  {formatContextLength(model.contextLength)}
                </Text>
              </div>
            </Tooltip>
          )}
        </div>
      </Option>
    );
  };

  /**
   * 获取分类颜色
   */
  const getCategoryColor = (category: AIModelCategory): string => {
    const colors = {
      flagship: "gold",
      balanced: "blue",
      economical: "green",
      coding: "purple",
      multimodal: "orange",
    };
    return colors[category] || "default";
  };

  /**
   * 格式化上下文长度显示
   */
  const formatContextLength = (length: number): string => {
    if (length >= 1000000) {
      return `${(length / 1000000).toFixed(1)}M`;
    } else if (length >= 1000) {
      return `${(length / 1000).toFixed(0)}K`;
    }
    return length.toString();
  };

  /**
   * 处理模型选择
   */
  const handleModelChange = (modelName: string) => {
    if (!provider) return;

    const selectedModelData = provider.models.find(
      (model) => model.name === modelName
    );
    if (selectedModelData) {
      onModelSelect(modelName, selectedModelData);
    }
  };

  /**
   * 渲染选择器内容
   */
  const renderSelectContent = () => {
    if (!provider) {
      return (
        <Option value="" disabled>
          <Text type="secondary">请先选择AI供应商</Text>
        </Option>
      );
    }

    const sortedCategories = Object.keys(modelsByCategory).sort(
      (a, b) =>
        getCategoryWeight(a as AIModelCategory) -
        getCategoryWeight(b as AIModelCategory)
    );

    return (
      <>
        {sortedCategories.map((category, index) => (
          <React.Fragment key={category}>
            <OptGroup
              label={MODEL_CATEGORY_LABELS[category as AIModelCategory]}
            >
              {modelsByCategory[category as AIModelCategory].map(
                renderModelOption
              )}
            </OptGroup>
            {index < sortedCategories.length - 1 && (
              <Divider style={{ margin: "8px 0" }} />
            )}
          </React.Fragment>
        ))}

        {allowCustom && (
          <>
            <Divider style={{ margin: "8px 0" }} />
            <OptGroup label="自定义">
              <Option value="custom">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Text>⚙️ 自定义模型名称</Text>
                  <Tooltip title="选择此项可手动输入模型名称">
                    <InfoCircleOutlined
                      style={{ color: "#666", fontSize: "12px" }}
                    />
                  </Tooltip>
                </div>
              </Option>
            </OptGroup>
          </>
        )}
      </>
    );
  };

  return (
    <Select
      value={selectedModel}
      onChange={handleModelChange}
      placeholder={provider ? "选择AI模型" : placeholder}
      disabled={disabled || !provider}
      style={{ width: "100%" }}
      showSearch
      filterOption={(input, option) => {
        const model = provider?.models.find((m) => m.name === option?.value);
        if (!model) return false;

        const searchText = input.toLowerCase();
        return (
          model.displayName.toLowerCase().includes(searchText) ||
          model.name.toLowerCase().includes(searchText) ||
          model.description.toLowerCase().includes(searchText)
        );
      }}
      optionLabelProp="label"
      popupMatchSelectWidth={false}
    >
      {renderSelectContent()}
    </Select>
  );
};

export default AIModelSelector;
