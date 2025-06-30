// AI提示词模板选择组件
import {
  BookOutlined,
  BulbOutlined,
  CarryOutOutlined,
  EditOutlined,
  HomeOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { Card, Col, Row, Typography } from "antd";
import React from "react";
import type { AIPromptTemplate } from "../../services/ai/aiService";
import { systemPromptTemplates } from "../../services/ai/aiService";
import "./AIProviderSelector.css"; // 复用AI厂商选择器的样式

const { Text, Title } = Typography;

// 图标映射函数
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    MessageOutlined: <MessageOutlined />,
    EditOutlined: <EditOutlined />,
    BriefcaseOutlined: <CarryOutOutlined />, // 使用CarryOutOutlined代替BriefcaseOutlined
    BookOutlined: <BookOutlined />,
    HomeOutlined: <HomeOutlined />,
    BulbOutlined: <BulbOutlined />,
  };
  return iconMap[iconName] || <EditOutlined />; // 默认使用编辑图标
};

interface AIPromptTemplateSelectorProps {
  selectedTemplate?: AIPromptTemplate;
  onTemplateSelect: (template: AIPromptTemplate) => void;
  disabled?: boolean;
  currentPrompt?: string;
}

/**
 * AI提示词模板选择组件 - 简化版本
 * 参考AI厂商选择器的设计，提供简洁的卡片式选择界面
 */
export const AIPromptTemplateSelector: React.FC<
  AIPromptTemplateSelectorProps
> = ({ selectedTemplate, onTemplateSelect, disabled = false }) => {
  return (
    <Row gutter={[12, 12]}>
      {systemPromptTemplates.map((template) => {
        const isSelected = selectedTemplate?.id === template.id;

        return (
          <Col xs={24} sm={12} md={8} lg={6} key={template.id}>
            <Card
              hoverable
              className={`provider-card ${
                isSelected ? "provider-card-selected" : ""
              }`}
              style={{
                height: "120px",
                border: isSelected ? "1px solid #1890ff" : "1px solid #f0f0f0",
                backgroundColor: isSelected ? "#f0f9ff" : "white",
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                position: "relative",
                opacity: disabled ? 0.6 : 1,
              }}
              onClick={() => !disabled && onTemplateSelect(template)}
              styles={{ body: { padding: "16px" } }}
            >
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "20px", marginBottom: "8px" }}>
                  {getIconComponent(template.icon || "EditOutlined")}
                </div>
                <Title
                  level={5}
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    fontWeight: 600,
                    lineHeight: "1.2",
                    color: isSelected ? "#1890ff" : "#333",
                    marginBottom: "4px",
                  }}
                >
                  {template.name}
                </Title>
                <Text
                  type="secondary"
                  style={{
                    fontSize: "10px",
                    lineHeight: "1.3",
                    color: "#8c8c8c",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    wordBreak: "break-word",
                    textAlign: "center",
                  }}
                >
                  {template.description}
                </Text>
              </div>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

export default AIPromptTemplateSelector;
