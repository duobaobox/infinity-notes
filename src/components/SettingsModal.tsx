import React, { useState } from "react";
import {
  Modal,
  Tabs,
  Form,
  Switch,
  Select,
  Slider,
  ColorPicker,
  Divider,
  Space,
  Typography,
  Card,
  Radio,
  InputNumber,
  Button,
  Input,
  message,
  Spin,
  Alert,
  Dropdown,
  Tooltip,
} from "antd";
import type { MenuProps } from "antd";
import {
  UserOutlined,
  SettingOutlined,
  SkinOutlined,
  SafetyOutlined,
  BellOutlined,
  InfoCircleOutlined,
  RobotOutlined,
  DownOutlined,
  FileTextOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { useAISettings } from "../hooks/useAISettings";
import { systemPromptTemplates } from "../services/aiService";
import "./SettingsModal.css";

const { Title, Text } = Typography;
const { Option } = Select;

interface SettingsModalProps {
  open: boolean;
  onCancel: () => void;
  defaultActiveTab?: string; // 新增：默认激活的标签页
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onCancel,
  defaultActiveTab = "general",
}) => {
  const [form] = Form.useForm();
  const [aiForm] = Form.useForm();
  const [appearanceForm] = Form.useForm();
  const [dataForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [testingConnection, setTestingConnection] = useState(false);

  const {
    config: aiConfig,
    loading: aiLoading,
    error: aiError,
    saveConfig: saveAIConfig,
    testConnection,
    hasValidConfig,
  } = useAISettings();

  // 当aiConfig变化时，更新表单的值（只在模态框打开时）
  React.useEffect(() => {
    console.log("🎛️ SettingsModal: AI配置变化", { open, aiConfig });

    if (open && aiConfig) {
      // 只有当配置不是默认空配置时才更新表单值
      const hasValidData =
        aiConfig.apiKey || aiConfig.aiModel || aiConfig.apiUrl;

      if (hasValidData) {
        console.log("🎛️ SettingsModal: 更新AI表单值", aiConfig);
        try {
          aiForm.setFieldsValue(aiConfig);
          console.log("🎛️ SettingsModal: AI表单值已更新");
        } catch (error) {
          console.warn("🎛️ SettingsModal: 更新表单值失败", error);
        }
      }
    }
  }, [aiConfig, open, aiForm]);

  // 测试AI连接
  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      await aiForm.validateFields();

      const result = await testConnection();

      if (result.success) {
        message.success("连接测试成功！");
      } else {
        message.error(`连接测试失败: ${result.error}`);
      }
    } catch (error) {
      message.error("请先完善配置信息");
    } finally {
      setTestingConnection(false);
    }
  };

  // 处理系统prompt模板选择
  const handleTemplateSelect = (templatePrompt: string) => {
    aiForm.setFieldsValue({ systemPrompt: templatePrompt });
    message.success("已应用模板");
  };

  // 复制当前系统prompt
  const handleCopyPrompt = () => {
    const currentPrompt = aiForm.getFieldValue('systemPrompt');
    if (currentPrompt) {
      navigator.clipboard.writeText(currentPrompt).then(() => {
        message.success("已复制到剪贴板");
      }).catch(() => {
        message.error("复制失败");
      });
    } else {
      message.warning("没有可复制的内容");
    }
  };

  // 保存AI配置
  const handleSaveAIConfig = async () => {
    console.log("🎛️ SettingsModal: 用户点击保存AI配置");

    try {
      const values = await aiForm.validateFields();
      console.log("🎛️ SettingsModal: 表单验证通过，获取的值", values);

      // 自动启用AI功能（只要用户保存了配置就表示想要使用AI）
      const configToSave = {
        ...aiConfig,
        ...values,
        enableAI: true // 自动启用AI功能
      };
      console.log("🎛️ SettingsModal: 准备保存的完整配置", configToSave);

      const success = await saveAIConfig(configToSave);

      if (success) {
        console.log("🎛️ SettingsModal: AI配置保存成功");
        message.success("AI配置保存成功！现在可以使用AI生成便签功能了。");
      } else {
        console.error("🎛️ SettingsModal: AI配置保存失败");
      }
    } catch (error) {
      console.error("🎛️ SettingsModal: 表单验证失败或保存异常", error);
      message.error("请检查配置信息");
    }
  };

  const tabItems = [
    {
      key: "general",
      label: (
        <span>
          <SettingOutlined />
          常规设置
        </span>
      ),
      children: (
        <div className="settings-modal-content">
          <Form
            key="general-form"
            form={form}
            layout="vertical"
            initialValues={{
              autoSave: true,
              language: "zh-CN",
              theme: "light",
              autoBackup: true,
              saveInterval: 30,
              username: "用户名称",
              email: "user@example.com",
            }}
          >
            <Card size="small" style={{ marginBottom: 16 }}>
              <Title level={5} style={{ margin: "0 0 16px 0" }}>
                <UserOutlined style={{ marginRight: 8 }} />
                个人信息
              </Title>
              <Form.Item label="用户名" name="username">
                <Select style={{ width: "100%" }}>
                  <Option value="用户名称">用户名称</Option>
                </Select>
              </Form.Item>
              <Form.Item label="邮箱" name="email">
                <Select style={{ width: "100%" }}>
                  <Option value="user@example.com">user@example.com</Option>
                </Select>
              </Form.Item>
            </Card>

            <Card size="small" style={{ marginBottom: 16 }}>
              <Title level={5} style={{ margin: "0 0 16px 0" }}>
                应用设置
              </Title>
              <Form.Item
                label="语言设置"
                name="language"
                extra="更改语言需要重启应用"
              >
                <Select style={{ width: "100%" }}>
                  <Option value="zh-CN">简体中文</Option>
                  <Option value="en-US">English</Option>
                  <Option value="ja-JP">日本語</Option>
                </Select>
              </Form.Item>

              <Form.Item label="主题模式" name="theme">
                <Radio.Group>
                  <Radio value="light">浅色模式</Radio>
                  <Radio value="dark">深色模式</Radio>
                  <Radio value="auto">跟随系统</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="自动保存"
                name="autoSave"
                valuePropName="checked"
                extra="实时保存您的便签内容"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                label="保存间隔（秒）"
                name="saveInterval"
                extra="自动保存的时间间隔"
              >
                <Slider
                  min={10}
                  max={300}
                  marks={{
                    10: "10s",
                    60: "1min",
                    180: "3min",
                    300: "5min",
                  }}
                />
              </Form.Item>
            </Card>
          </Form>
        </div>
      ),
    },
    {
      key: "appearance",
      label: (
        <span>
          <SkinOutlined />
          外观设置
        </span>
      ),
      children: (
        <div className="settings-modal-content">
          <Form
            form={appearanceForm}
            layout="vertical"
            initialValues={{
              canvasBackground: "#ffffff",
              gridVisible: true,
              gridSize: 20,
              noteDefaultColor: "#fef3c7",
              fontSize: 14,
              fontFamily: "system-ui",
            }}
          >
            <Card size="small" style={{ marginBottom: 16 }}>
              <Title level={5} style={{ margin: "0 0 16px 0" }}>
                画布设置
              </Title>
              <Form.Item label="画布背景色" name="canvasBackground">
                <ColorPicker showText />
              </Form.Item>

              <Form.Item
                label="显示网格"
                name="gridVisible"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item label="网格大小" name="gridSize">
                <Slider
                  min={10}
                  max={50}
                  marks={{
                    10: "10px",
                    20: "20px",
                    30: "30px",
                    50: "50px",
                  }}
                />
              </Form.Item>
            </Card>

            <Card size="small" style={{ marginBottom: 16 }}>
              <Title level={5} style={{ margin: "0 0 16px 0" }}>
                便签样式
              </Title>
              <Form.Item label="默认便签颜色" name="noteDefaultColor">
                <ColorPicker
                  presets={[
                    {
                      label: "常用颜色",
                      colors: [
                        "#fef3c7", // yellow
                        "#dbeafe", // blue
                        "#d1fae5", // green
                        "#fce7f3", // pink
                        "#e9d5ff", // purple
                      ],
                    },
                  ]}
                  showText
                />
              </Form.Item>

              <Form.Item label="字体大小" name="fontSize">
                <InputNumber
                  min={12}
                  max={24}
                  suffix="px"
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Form.Item label="字体系列" name="fontFamily">
                <Select>
                  <Option value="system-ui">系统默认</Option>
                  <Option value="Arial">Arial</Option>
                  <Option value="Microsoft YaHei">微软雅黑</Option>
                  <Option value="PingFang SC">苹方</Option>
                </Select>
              </Form.Item>
            </Card>
          </Form>
        </div>
      ),
    },
    {
      key: "data",
      label: (
        <span>
          <SafetyOutlined />
          数据管理
        </span>
      ),
      children: (
        <div className="settings-modal-content">
          <Form
            form={dataForm}
            layout="vertical"
            initialValues={{
              autoBackup: true,
              backupFrequency: "daily",
              maxBackups: 10,
            }}
          >
            <Card size="small" style={{ marginBottom: 16 }}>
              <Title level={5} style={{ margin: "0 0 16px 0" }}>
                备份设置
              </Title>
              <Form.Item
                label="自动备份"
                name="autoBackup"
                valuePropName="checked"
                extra="定期自动备份您的数据"
              >
                <Switch />
              </Form.Item>

              <Form.Item label="备份频率" name="backupFrequency">
                <Select>
                  <Option value="realtime">实时备份</Option>
                  <Option value="daily">每日备份</Option>
                  <Option value="weekly">每周备份</Option>
                  <Option value="monthly">每月备份</Option>
                </Select>
              </Form.Item>

              <Form.Item label="最大备份数量" name="maxBackups">
                <InputNumber min={1} max={50} style={{ width: "100%" }} />
              </Form.Item>
            </Card>

            <Card size="small" style={{ marginBottom: 16 }}>
              <Title level={5} style={{ margin: "0 0 16px 0" }}>
                数据操作
              </Title>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Button type="primary" ghost style={{ width: "100%" }}>
                  导出所有数据
                </Button>
                <Button style={{ width: "100%" }}>导入数据</Button>
                <Divider />
                <Button danger style={{ width: "100%" }}>
                  清空所有数据
                </Button>
              </Space>
              <Text
                type="secondary"
                style={{ fontSize: 12, marginTop: 8, display: "block" }}
              >
                ⚠️ 清空数据操作不可恢复，请谨慎操作
              </Text>
            </Card>
          </Form>
        </div>
      ),
    },
    {
      key: "ai",
      label: (
        <span>
          <RobotOutlined />
          AI设置
        </span>
      ),
      children: (
        <div className="settings-modal-content">
          <Spin spinning={aiLoading}>
            {aiError && (
              <Alert
                message="配置错误"
                description={aiError}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            {!aiError && !hasValidConfig && (
              <Alert
                message="AI 功能未配置"
                description="请填写API地址、API密钥和AI模型名称，配置完成后即可使用AI生成便签等智能功能。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            {!aiError && hasValidConfig && (
              <Alert
                message="AI 功能已启用"
                description="AI配置完整，现在可以使用AI生成便签功能了！"
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            <Form
              form={aiForm}
              layout="vertical"
              onFinish={handleSaveAIConfig}
              preserve={true}
              initialValues={{
                apiUrl: aiConfig.apiUrl || "",
                apiKey: aiConfig.apiKey || "",
                aiModel: aiConfig.aiModel || "",
                temperature: aiConfig.temperature || 0.7,
                maxTokens: aiConfig.maxTokens || 1000,
                systemPrompt: aiConfig.systemPrompt || "",
              }}
            >
              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5} style={{ margin: "0 0 16px 0" }}>
                  <RobotOutlined style={{ marginRight: 8 }} />
                  AI模型配置
                </Title>
                <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                  配置完成后即可使用AI生成便签等智能功能
                </Text>

                <Form.Item
                  label="API地址"
                  name="apiUrl"
                  extra="AI服务的API基础地址，如：https://api.deepseek.com/v1"
                  rules={[
                    { required: true, message: "请输入API地址" },
                    { type: "url", message: "请输入有效的URL地址" },
                  ]}
                >
                  <Input
                    placeholder="https://api.deepseek.com/v1"
                    style={{ width: "100%" }}
                  />
                </Form.Item>

                <Form.Item
                  label="API密钥"
                  name="apiKey"
                  extra="请输入您的AI服务API密钥"
                  rules={[
                    { required: true, message: "请输入API密钥" },
                    { min: 10, message: "API密钥长度不能少于10个字符" },
                  ]}
                >
                  <Input.Password
                    placeholder="sk-..."
                    style={{ width: "100%" }}
                    visibilityToggle={false}
                  />
                </Form.Item>

                <Form.Item
                  label="AI模型"
                  name="aiModel"
                  extra="输入要使用的AI模型名称，如：deepseek-chat、gpt-3.5-turbo、claude-3-haiku等"
                  rules={[{ required: true, message: "请输入AI模型名称" }]}
                >
                  <Input
                    placeholder="deepseek-chat"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Card>

              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5} style={{ margin: "0 0 16px 0" }}>
                  高级设置
                </Title>

                <Form.Item
                  label="温度值"
                  name="temperature"
                  extra="控制AI回答的随机性，0-1之间，值越高越随机"
                >
                  <Slider
                    min={0}
                    max={1}
                    step={0.1}
                    marks={{
                      0: "0",
                      0.3: "0.3",
                      0.7: "0.7",
                      1: "1",
                    }}
                    tooltip={{ formatter: (value) => `${value}` }}
                  />
                </Form.Item>

                <Form.Item
                  label="最大Token数"
                  name="maxTokens"
                  extra="限制AI回答的最大长度，建议500-2000之间"
                >
                  <InputNumber
                    min={100}
                    max={4000}
                    step={100}
                    style={{ width: "100%" }}
                    placeholder="1000"
                  />
                </Form.Item>
              </Card>

              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5} style={{ margin: "0 0 16px 0" }}>
                  <FileTextOutlined style={{ marginRight: 8 }} />
                  系统提示词设置
                </Title>
                <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                  自定义AI的行为和回答风格，控制便签生成的格式和内容
                </Text>

                <Form.Item
                  label={
                    <Space>
                      <span>系统提示词</span>
                      <Dropdown
                        menu={{
                          items: systemPromptTemplates.map((template, index) => ({
                            key: index,
                            label: (
                              <div style={{ maxWidth: 300 }}>
                                <div style={{ fontWeight: 'bold' }}>{template.name}</div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                                  {template.description}
                                </div>
                              </div>
                            ),
                            onClick: () => handleTemplateSelect(template.prompt)
                          }))
                        }}
                        placement="bottomLeft"
                      >
                        <Button size="small" type="link">
                          选择模板 <DownOutlined />
                        </Button>
                      </Dropdown>
                      <Tooltip title="复制当前提示词">
                        <Button
                          size="small"
                          type="link"
                          icon={<CopyOutlined />}
                          onClick={handleCopyPrompt}
                        />
                      </Tooltip>
                    </Space>
                  }
                  name="systemPrompt"
                  extra="定义AI助手的角色和行为规则，留空将使用默认提示词"
                >
                  <Input.TextArea
                    rows={8}
                    placeholder="请输入自定义的系统提示词，或点击上方'选择模板'使用预设模板..."
                    style={{ fontFamily: 'monospace', fontSize: '13px' }}
                  />
                </Form.Item>
              </Card>

              <div className="form-actions">
                <Space>
                  <Button
                    type="primary"
                    onClick={handleTestConnection}
                    loading={testingConnection}
                    disabled={aiLoading}
                  >
                    测试连接
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleSaveAIConfig}
                    disabled={aiLoading}
                  >
                    保存配置
                  </Button>
                </Space>
              </div>
            </Form>
          </Spin>
        </div>
      ),
    },
    {
      key: "notifications",
      label: (
        <span>
          <BellOutlined />
          通知设置
        </span>
      ),
      children: (
        <div className="settings-modal-content">
          <Form
            form={notificationForm}
            layout="vertical"
            initialValues={{
              enableNotifications: true,
              notifyOnSync: true,
              notifyOnBackup: true,
              notifyOnShare: true,
              soundEnabled: true,
              notificationSound: "default",
            }}
          >
            <Card size="small" style={{ marginBottom: 16 }}>
              <Title level={5} style={{ margin: "0 0 16px 0" }}>
                通知选项
              </Title>
              <Form.Item
                label="启用通知"
                name="enableNotifications"
                valuePropName="checked"
                extra="允许应用发送系统通知"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                label="同步通知"
                name="notifyOnSync"
                valuePropName="checked"
                extra="数据同步完成时通知"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                label="备份通知"
                name="notifyOnBackup"
                valuePropName="checked"
                extra="自动备份完成时通知"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                label="分享通知"
                name="notifyOnShare"
                valuePropName="checked"
                extra="内容被分享时通知"
              >
                <Switch />
              </Form.Item>
            </Card>

            <Card size="small" style={{ marginBottom: 16 }}>
              <Title level={5} style={{ margin: "0 0 16px 0" }}>
                声音设置
              </Title>
              <Form.Item
                label="启用提示音"
                name="soundEnabled"
                valuePropName="checked"
                extra="操作时播放提示音"
              >
                <Switch />
              </Form.Item>

              <Form.Item label="提示音选择" name="notificationSound">
                <Select>
                  <Option value="default">默认提示音</Option>
                  <Option value="chime">清脆提示音</Option>
                  <Option value="bell">铃声提示音</Option>
                  <Option value="none">静音</Option>
                </Select>
              </Form.Item>
            </Card>
          </Form>
        </div>
      ),
    },
    {
      key: "about",
      label: (
        <span>
          <InfoCircleOutlined />
          关于
        </span>
      ),
      children: (
        <div className="settings-modal-content">
          <Card size="small" style={{ marginBottom: 16 }}>
            <Title level={5} style={{ margin: "0 0 16px 0" }}>
              应用信息
            </Title>
            <p>
              <strong>便签画布</strong>{" "}
              是一款创新的无限画布便签应用，让您自由组织思路和灵感。
            </p>
            <p>版本: 1.0.0</p>
            <Divider />
            <p>
              <strong>开发者:</strong> 便签画布团队
            </p>
            <p>
              <strong>联系我们:</strong> support@notes-canvas-app.example.com
            </p>
            <Divider />
            <p>© 2023 便签画布. 保留所有权利.</p>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="设置"
      open={open}
      onCancel={onCancel}
      width="70%"
      centered
      styles={{
        body: {
          height: "70vh",
          minHeight: "500px",
          overflowY: "hidden"
        }
      }}
      footer={null}
      destroyOnHidden
      className="settings-modal"
    >
      <Tabs
        defaultActiveKey={defaultActiveTab}
        items={tabItems}
        tabPosition="left"
        className="settings-tabs"
        style={{ height: "100%" }}
      />
    </Modal>
  );
};

export default SettingsModal;
