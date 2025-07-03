// AI设置表单组件 - 简化版本
import { InfoCircleOutlined, SaveOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Space,
  Tooltip,
  Typography,
} from "antd";
import React, { useEffect } from "react";
import type { AIConfig } from "../../services/ai/aiService";
import { AIConfigValidator } from "../../utils/aiValidation";
import { AIConfigStatus } from "./AIConfigStatus";

const { Text } = Typography;

interface AISettingsFormProps {
  config: Partial<AIConfig>;
  loading?: boolean;
  onSave: (config: AIConfig) => Promise<void>;
  onTest: () => Promise<void>;
  testLoading?: boolean;
}

/**
 * AI设置表单组件
 * 提供完整的AI配置表单，包括验证、状态显示等功能
 */
export const AISettingsForm: React.FC<AISettingsFormProps> = ({
  config,
  loading = false,
  onSave,
  onTest,
  testLoading = false,
}) => {
  const [form] = Form.useForm();

  // 当配置变化时更新表单
  useEffect(() => {
    form.setFieldsValue(config);
  }, [config, form]);

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    const configToSave: AIConfig = {
      ...config,
      ...values,
      enableAI: true,
    } as AIConfig;

    await onSave(configToSave);
  };

  // 处理测试连接
  const handleTest = async () => {
    try {
      await form.validateFields(["apiUrl", "apiKey", "aiModel"]);
      await onTest();
    } catch (error) {
      console.error("表单验证失败:", error);
    }
  };

  // 实时验证字段
  const validateField = (field: keyof AIConfig, value: any) => {
    switch (field) {
      case "apiKey":
        return AIConfigValidator.validateApiKey(value);
      case "apiUrl":
        return AIConfigValidator.validateApiUrl(value);
      case "aiModel":
        return AIConfigValidator.validateAiModel(value);
      case "temperature":
        return AIConfigValidator.validateTemperature(value);
      case "maxTokens":
        return AIConfigValidator.validateMaxTokens(value);
      default:
        return { isValid: true };
    }
  };

  return (
    <div className="ai-settings-form">
      {/* 配置状态指示器 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <AIConfigStatus
          config={config}
          showProgress={true}
          showDetails={false}
        />
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={config}
        preserve={false}
      >
        {/* API地址 */}
        <Form.Item
          label={
            <Space>
              <Text>API地址</Text>
              <Tooltip title="AI服务的API接口地址，例如：https://api.openai.com/v1">
                <InfoCircleOutlined style={{ color: "#666" }} />
              </Tooltip>
            </Space>
          }
          name="apiUrl"
          rules={[
            { required: true, message: "请输入API地址" },
            {
              validator: (_, value) => {
                const result = validateField("apiUrl", value);
                if (!result.isValid) {
                  return Promise.reject(new Error(result.error));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input
            placeholder="请输入API地址，如：https://api.openai.com/v1"
            size="large"
          />
        </Form.Item>

        {/* API密钥 */}
        <Form.Item
          label={
            <Space>
              <Text>API密钥</Text>
              <Tooltip title="从AI服务提供商获取的API密钥">
                <InfoCircleOutlined style={{ color: "#666" }} />
              </Tooltip>
            </Space>
          }
          name="apiKey"
          rules={[
            { required: true, message: "请输入API密钥" },
            {
              validator: (_, value) => {
                const result = validateField("apiKey", value);
                if (!result.isValid) {
                  return Promise.reject(new Error(result.error));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input.Password
            placeholder="请输入API密钥"
            size="large"
            visibilityToggle
          />
        </Form.Item>

        {/* AI模型 */}
        <Form.Item
          label={
            <Space>
              <Text>AI模型</Text>
              <Tooltip title="选择要使用的AI模型">
                <InfoCircleOutlined style={{ color: "#666" }} />
              </Tooltip>
            </Space>
          }
          name="aiModel"
          rules={[
            { required: true, message: "请选择或输入AI模型" },
            {
              validator: (_, value) => {
                const result = validateField("aiModel", value);
                if (!result.isValid) {
                  return Promise.reject(new Error(result.error));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input
            placeholder="请输入AI模型名称，如：gpt-3.5-turbo"
            size="large"
          />
        </Form.Item>

        {/* 高级设置 */}
        <Card
          size="small"
          title="高级设置"
          style={{ marginBottom: 16 }}
          bodyStyle={{ paddingTop: 16 }}
        >
          {/* 温度参数 */}
          <Form.Item
            label={
              <Space>
                <Text>温度参数</Text>
                <Tooltip title="控制AI回复的随机性，0-2之间，值越高越随机">
                  <InfoCircleOutlined style={{ color: "#666" }} />
                </Tooltip>
              </Space>
            }
            name="temperature"
            rules={[
              {
                validator: (_, value) => {
                  const result = validateField("temperature", value);
                  if (!result.isValid) {
                    return Promise.reject(new Error(result.error));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              min={0}
              max={2}
              step={0.1}
              placeholder="0.7"
              style={{ width: "100%" }}
            />
          </Form.Item>

          {/* 最大Token数 */}
          <Form.Item
            label={
              <Space>
                <Text>最大Token数</Text>
                <Tooltip title="限制AI回复的最大长度">
                  <InfoCircleOutlined style={{ color: "#666" }} />
                </Tooltip>
              </Space>
            }
            name="maxTokens"
            rules={[
              {
                validator: (_, value) => {
                  const result = validateField("maxTokens", value);
                  if (!result.isValid) {
                    return Promise.reject(new Error(result.error));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              min={1}
              max={32000}
              placeholder="1000"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Card>

        {/* 操作按钮 */}
        <Form.Item>
          <Space>
            <Button
              icon={<InfoCircleOutlined />}
              onClick={handleTest}
              loading={testLoading}
              disabled={loading}
            >
              测试连接
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={loading}
              disabled={testLoading}
            >
              保存配置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AISettingsForm;
