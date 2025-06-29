// AI提示词模板选择组件
import { Card, Col, Row, Tooltip, Typography } from "antd";
import React from "react";
import type { AIPromptTemplate } from "../../services/ai/aiService";
import { systemPromptTemplates } from "../../services/ai/aiService";
import "./AIProviderSelector.css"; // 复用AI厂商选择器的样式

const { Text, Title } = Typography;

interface AIPromptTemplateSelectorProps {
  selectedTemplate?: AIPromptTemplate;
  currentPrompt?: string; // 当前使用的提示词内容
  onTemplateSelect: (template: AIPromptTemplate) => void;
  disabled?: boolean;
}

/**
 * AI提示词模板选择组件 - 简化版本
 * 参考AI厂商选择器的设计，提供简洁的卡片式选择界面
 */
export const AIPromptTemplateSelector: React.FC<
  AIPromptTemplateSelectorProps
> = ({
  selectedTemplate,
  currentPrompt = "",
  onTemplateSelect,
  disabled = false,
}) => {
  /**
   * 检查是否为当前使用的模板
   */
  const isCurrentTemplate = (template: AIPromptTemplate): boolean => {
    return currentPrompt === template.prompt;
  };

  return (
    <Row gutter={[12, 12]}>
      {systemPromptTemplates.map((template) => {
        const isSelected = selectedTemplate?.id === template.id;
        const isCurrent = isCurrentTemplate(template);

        return (
          <Col xs={24} sm={12} md={8} lg={6} key={template.id}>
            <div style={{ position: "relative" }}>
              {/* 当前使用指示器 */}
              {isCurrent && (
                <Tooltip title="当前正在使用的AI角色模板">
                  <div
                    className="provider-current-indicator"
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      zIndex: 10,
                      backgroundColor: "#1890ff",
                      color: "white",
                      fontSize: "9px",
                      padding: "1px 4px",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      boxShadow: "0 1px 3px rgba(24, 144, 255, 0.3)",
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
                onClick={() => !disabled && onTemplateSelect(template)}
                styles={{ body: { padding: "16px" } }}
              >
                <div
                  className="provider-card-content"
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  {/* 模板头部 */}
                  <div
                    className="provider-header"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      className="provider-logo"
                      style={{
                        fontSize: "18px",
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      {template.icon}
                    </div>
                    <div
                      className="provider-info"
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      <Title
                        level={5}
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          fontWeight: 600,
                          lineHeight: "1.3",
                          color: "#262626",
                        }}
                      >
                        {template.name}
                      </Title>
                    </div>
                  </div>

                  {/* 模板描述 */}
                  <div style={{ flex: 1 }}>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: "11px",
                        lineHeight: "1.4",
                        color: "#8c8c8c",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        wordBreak: "break-word",
                      }}
                    >
                      {template.description}
                    </Text>
                  </div>
                </div>
              </Card>
            </div>
          </Col>
        );
      })}
    </Row>
  );
};

export default AIPromptTemplateSelector;
