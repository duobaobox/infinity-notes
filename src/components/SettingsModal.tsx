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
} from "antd";
import {
  UserOutlined,
  SettingOutlined,
  SkinOutlined,
  SafetyOutlined,
  BellOutlined,
  InfoCircleOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { useAISettings } from "../hooks/useAISettings";
import "./SettingsModal.css";

const { Title, Text } = Typography;
const { Option } = Select;

interface SettingsModalProps {
  open: boolean;
  onCancel: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onCancel }) => {
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

  // 当模态框打开时，更新表单的值
  React.useEffect(() => {
    if (open) {
      // 重置并设置AI表单的值
      if (aiConfig) {
        // 确保表单实例已创建后再设置值
        setTimeout(() => {
          aiForm.resetFields();
          aiForm.setFieldsValue(aiConfig);
        }, 0);
      }
    } else {
      // 模态框关闭时重置表单
      aiForm.resetFields();
      form.resetFields();
      appearanceForm.resetFields();
      dataForm.resetFields();
      notificationForm.resetFields();
    }
  }, [
    open,
    aiConfig,
    aiForm,
    form,
    appearanceForm,
    dataForm,
    notificationForm,
  ]);

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

  // 保存AI配置
  const handleSaveAIConfig = async () => {
    try {
      const values = await aiForm.validateFields();
      const success = await saveAIConfig({ ...aiConfig, ...values });

      if (success) {
        message.success("AI配置保存成功！");
      }
    } catch (error) {
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
            <Form
              key="ai-form"
              form={aiForm}
              layout="vertical"
              onFinish={handleSaveAIConfig}
              preserve={false}
            >
              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5} style={{ margin: "0 0 16px 0" }}>
                  <RobotOutlined style={{ marginRight: 8 }} />
                  AI模型配置
                </Title>
                <Form.Item
                  label="启用AI功能"
                  name="enableAI"
                  valuePropName="checked"
                  extra="开启后可使用AI生成便签功能"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  label="AI模型"
                  name="aiModel"
                  extra="选择要使用的AI模型"
                  rules={[{ required: true, message: "请选择AI模型" }]}
                >
                  <Select style={{ width: "100%" }}>
                    <Option value="deepseek-chat">DeepSeek Chat</Option>
                    <Option value="deepseek-coder">DeepSeek Coder</Option>
                    <Option value="gpt-3.5-turbo">GPT-3.5 Turbo</Option>
                    <Option value="gpt-4">GPT-4</Option>
                    <Option value="claude-3-haiku">Claude 3 Haiku</Option>
                    <Option value="claude-3-sonnet">Claude 3 Sonnet</Option>
                  </Select>
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
                  label="API地址"
                  name="apiUrl"
                  extra="API服务的基础URL地址"
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
              </Card>

              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5} style={{ margin: "0 0 16px 0" }}>
                  模型参数
                </Title>
                <Form.Item
                  label="温度值"
                  name="temperature"
                  extra="控制生成内容的随机性，0-1之间，值越高越随机"
                >
                  <Slider
                    min={0}
                    max={1}
                    step={0.1}
                    marks={{
                      0: "0",
                      0.3: "0.3",
                      0.5: "0.5",
                      0.7: "0.7",
                      1: "1",
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label="最大Token数"
                  name="maxTokens"
                  extra="单次生成的最大字符数限制"
                  rules={[
                    {
                      type: "number",
                      min: 100,
                      max: 4000,
                      message: "范围：100-4000",
                    },
                  ]}
                >
                  <InputNumber
                    min={100}
                    max={4000}
                    step={100}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Card>

              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5} style={{ margin: "0 0 16px 0" }}>
                  操作
                </Title>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Button
                    type="primary"
                    ghost
                    style={{ width: "100%" }}
                    onClick={handleTestConnection}
                    loading={testingConnection}
                    disabled={!hasValidConfig}
                  >
                    {testingConnection ? "测试中..." : "测试连接"}
                  </Button>
                  <Button
                    type="primary"
                    style={{ width: "100%" }}
                    htmlType="submit"
                    loading={aiLoading}
                  >
                    保存配置
                  </Button>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    💡 提示：请确保API密钥有效且网络连接正常
                  </Text>
                </Space>
              </Card>
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
              soundEnabled: true,
              reminderEnabled: true,
              reminderTime: "09:00",
            }}
          >
            <Card size="small" style={{ marginBottom: 16 }}>
              <Title level={5} style={{ margin: "0 0 16px 0" }}>
                通知偏好
              </Title>
              <Form.Item
                label="启用通知"
                name="enableNotifications"
                valuePropName="checked"
                extra="接收应用通知"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                label="声音提示"
                name="soundEnabled"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                label="每日提醒"
                name="reminderEnabled"
                valuePropName="checked"
                extra="每日定时提醒您查看便签"
              >
                <Switch />
              </Form.Item>

              <Form.Item label="提醒时间" name="reminderTime">
                <Select>
                  <Option value="08:00">08:00</Option>
                  <Option value="09:00">09:00</Option>
                  <Option value="10:00">10:00</Option>
                  <Option value="18:00">18:00</Option>
                  <Option value="20:00">20:00</Option>
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
          <Card size="small">
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <Title level={3} style={{ marginBottom: 8 }}>
                便签应用
              </Title>
              <Text type="secondary" style={{ fontSize: 16 }}>
                版本 1.0.0
              </Text>
              <Divider />
              <Space direction="vertical" size={8}>
                <Text>一个简洁、高效的便签管理工具</Text>
                <Text type="secondary">支持多画布管理、实时保存、云端同步</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  © 2024 便签应用. 保留所有权利.
                </Text>
              </Space>
              <Divider />
              <Space>
                <Button type="link" size="small">
                  帮助文档
                </Button>
                <Button type="link" size="small">
                  反馈问题
                </Button>
                <Button type="link" size="small">
                  检查更新
                </Button>
              </Space>
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <SettingOutlined style={{ marginRight: 8 }} />
          设置
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={onCancel}>
          保存设置
        </Button>,
      ]}
      width={850}
      height={650}
      centered
      destroyOnHidden
      className="settings-modal"
      styles={{
        body: {
          height: 550,
          padding: 0,
          overflow: "hidden",
        },
      }}
    >
      <Tabs
        defaultActiveKey="general"
        items={tabItems}
        style={{ height: "100%" }}
        tabPosition="left"
      />
    </Modal>
  );
};

export default SettingsModal;
