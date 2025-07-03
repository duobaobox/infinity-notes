// AI供应商选择组件 - 优化版本
import {
  BookOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Row, Space, Tag, Tooltip, Typography } from "antd";
import React from "react";
import type { AIProvider } from "../../types/aiProviders";
import { AI_PROVIDERS, getPopularProviders } from "../../types/aiProviders";
import "./AIProviderSelector.css";

const { Text, Title } = Typography;

interface AIProviderSelectorProps {
  selectedProvider?: AIProvider;
  currentProvider?: AIProvider; // 当前正在使用的供应商
  onProviderSelect: (provider: AIProvider) => void;
  showCustomOption?: boolean;
  onCustomSelect?: () => void;
  providerConfigs?: Record<string, any>; // 各供应商的配置状态
}

/**
 * AI供应商选择组件
 * 提供卡片式的供应商选择界面，支持热门推荐和完整列表
 */
export const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({
  selectedProvider,
  currentProvider,
  onProviderSelect,
  showCustomOption = true,
  onCustomSelect,
  providerConfigs = {},
}) => {
  const popularProviders = getPopularProviders();
  const otherProviders = AI_PROVIDERS.filter((provider) => !provider.popular);

  /**
   * 检查供应商是否已配置
   */
  const isProviderConfigured = (providerId: string): boolean => {
    const config = providerConfigs[providerId];
    return !!(config?.apiKey && config?.aiModel);
  };

  /**
   * 检查是否为当前使用的供应商
   */
  const isCurrentProvider = (providerId: string): boolean => {
    return currentProvider?.id === providerId;
  };

  /**
   * 渲染供应商卡片
   */
  const renderProviderCard = (provider: AIProvider) => {
    const isSelected = selectedProvider?.id === provider.id;
    const isConfigured = isProviderConfigured(provider.id);
    const isCurrent = isCurrentProvider(provider.id);

    return (
      <Col xs={24} sm={12} md={8} lg={6} key={provider.id}>
        <div style={{ position: "relative" }}>
          {/* 配置状态指示器 */}
          {isConfigured && (
            <Tooltip title="已配置API密钥和模型">
              <div
                className="provider-config-indicator"
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  zIndex: 10,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "#52c41a",
                  border: "2px solid white",
                  boxShadow: "0 0 6px rgba(82, 196, 26, 0.6)",
                  animation: "pulse 2s infinite",
                }}
              />
            </Tooltip>
          )}

          {/* 当前使用标识 */}
          {isCurrent && (
            <Tooltip title="当前正在使用的AI供应商">
              <div
                className="provider-current-indicator"
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  zIndex: 10,
                  background: "linear-gradient(45deg, #1890ff, #52c41a)",
                  color: "white",
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  animation: "glow 2s ease-in-out infinite alternate",
                }}
              >
                使用中
              </div>
            </Tooltip>
          )}

          <Card
            hoverable
            className={`provider-card ${
              isSelected ? "provider-card-selected" : ""
            } ${isCurrent ? "provider-card-current" : ""}`}
            onClick={() => onProviderSelect(provider)}
            styles={{ body: { padding: "16px" } }}
          >
            <div className="provider-card-content">
              {/* 供应商头部 */}
              <div className="provider-header">
                <div className="provider-logo">{provider.logo}</div>
                <div className="provider-info">
                  <Title level={5} style={{ margin: 0, fontSize: "14px" }}>
                    {provider.displayName}
                  </Title>
                  {provider.popular && (
                    <Tag
                      color="gold"
                      style={{
                        fontSize: "10px",
                        padding: "0 4px",
                        lineHeight: "16px",
                        height: "16px",
                      }}
                    >
                      热门
                    </Tag>
                  )}
                </div>
                {isSelected && (
                  <CheckCircleOutlined
                    className="provider-selected-icon"
                    style={{ color: "#52c41a", fontSize: "18px" }}
                  />
                )}
              </div>

              {/* 供应商描述 */}
              <Text
                type="secondary"
                style={{
                  fontSize: "12px",
                  display: "block",
                  marginTop: "8px",
                  lineHeight: "1.4",
                }}
              >
                {provider.description}
              </Text>

              {/* 模型数量 */}
              <div style={{ marginTop: "12px" }}>
                <Text style={{ fontSize: "12px", color: "#666" }}>
                  {provider.models.length} 个模型可用
                </Text>
              </div>

              {/* 快捷链接 */}
              <Space size="small" style={{ marginTop: "8px" }}>
                {provider.website && (
                  <Button
                    type="text"
                    size="small"
                    icon={<GlobalOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(provider.website, "_blank");
                    }}
                    style={{
                      padding: "0 4px",
                      height: "20px",
                      fontSize: "12px",
                    }}
                  >
                    官网
                  </Button>
                )}
                {provider.docUrl && (
                  <Button
                    type="text"
                    size="small"
                    icon={<BookOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(provider.docUrl, "_blank");
                    }}
                    style={{
                      padding: "0 4px",
                      height: "20px",
                      fontSize: "12px",
                    }}
                  >
                    文档
                  </Button>
                )}
              </Space>
            </div>
          </Card>
        </div>
      </Col>
    );
  };

  /**
   * 渲染自定义选项卡片
   */
  const renderCustomCard = () => {
    if (!showCustomOption) return null;

    const isSelected = selectedProvider?.id === "custom";
    const isConfigured = isProviderConfigured("custom");
    const isCurrent = isCurrentProvider("custom");

    return (
      <Col xs={24} sm={12} md={8} lg={6}>
        <div style={{ position: "relative" }}>
          {/* 配置状态指示器 */}
          {isConfigured && (
            <Tooltip title="已配置API密钥和模型">
              <div
                className="provider-config-indicator"
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  zIndex: 10,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "#52c41a",
                  border: "2px solid white",
                  boxShadow: "0 0 6px rgba(82, 196, 26, 0.6)",
                  animation: "pulse 2s infinite",
                }}
              />
            </Tooltip>
          )}

          {/* 当前使用标识 */}
          {isCurrent && (
            <Tooltip title="当前正在使用的AI供应商">
              <div
                className="provider-current-indicator"
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  zIndex: 10,
                  background: "linear-gradient(45deg, #1890ff, #52c41a)",
                  color: "white",
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  animation: "glow 2s ease-in-out infinite alternate",
                }}
              >
                使用中
              </div>
            </Tooltip>
          )}

          <Card
            hoverable
            className={`provider-card ${
              isSelected ? "provider-card-selected" : ""
            } ${isCurrent ? "provider-card-current" : ""}`}
            onClick={onCustomSelect}
            styles={{ body: { padding: "16px" } }}
          >
            <div className="provider-card-content">
              <div className="provider-header">
                <div className="provider-logo">⚙️</div>
                <div className="provider-info">
                  <Title level={5} style={{ margin: 0, fontSize: "14px" }}>
                    自定义配置
                  </Title>
                </div>
                {isSelected && (
                  <CheckCircleOutlined
                    className="provider-selected-icon"
                    style={{ color: "#52c41a", fontSize: "18px" }}
                  />
                )}
              </div>
              <Text
                type="secondary"
                style={{
                  fontSize: "12px",
                  display: "block",
                  marginTop: "8px",
                  lineHeight: "1.4",
                }}
              >
                手动配置API地址和模型，适用于其他AI服务
              </Text>
            </div>
          </Card>
        </div>
      </Col>
    );
  };

  return (
    <div className="ai-provider-selector">
      {/* 热门供应商 */}
      {popularProviders.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <Title level={5} style={{ marginBottom: "16px" }}>
            🔥 热门推荐
          </Title>
          <Row gutter={[12, 12]}>
            {popularProviders.map(renderProviderCard)}
            {renderCustomCard()}
          </Row>
        </div>
      )}

      {/* 其他供应商 */}
      {otherProviders.length > 0 && (
        <div>
          <Title level={5} style={{ marginBottom: "16px" }}>
            📋 更多选择
          </Title>
          <Row gutter={[12, 12]}>{otherProviders.map(renderProviderCard)}</Row>
        </div>
      )}
    </div>
  );
};

export default AIProviderSelector;
