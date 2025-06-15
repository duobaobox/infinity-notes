import React, { useState } from "react";
import {
  Modal,
  Tabs,
  type TabsProps,
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
import { useAISettings } from "../../hooks/ai/useAISettings";
import { useAIPromptSettings } from "../../hooks/ai/useAIPromptSettings";
import { useUIStore, PRESET_THEMES } from "../../stores/uiStore";
import "./SettingsModal.css";

const { Title, Text } = Typography;
const { Option } = Select;

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  defaultActiveTab?: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  defaultActiveTab = "general",
}) => {
  const [form] = Form.useForm();
  const [aiForm] = Form.useForm();
  const [promptForm] = Form.useForm();
  const [appearanceForm] = Form.useForm();
  const [dataForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [testingConnection, setTestingConnection] = useState(false);

  // 使用UIStore获取和设置外观、通用设置
  const {
    theme,
    appearance,
    general,
    setTheme,
    setAppearance,
    setGeneral,
    applyPresetTheme,
  } = useUIStore();

  const {
    config: aiConfig,
    loading: aiLoading,
    error: aiError,
    saveConfig: saveAIConfig,
    testConnection,
    hasValidConfig,
  } = useAISettings();

  // AI提示词设置Hook
  const {
    promptConfig,
    loading: promptLoading,
    error: promptError,
    savePromptConfig,
    canConfigurePrompt,
  } = useAIPromptSettings(hasValidConfig);

  // 当aiConfig变化时，更新AI基础配置表单的值（只在模态框打开时）
  React.useEffect(() => {
    if (open && aiConfig) {
      // 只有当配置不是默认空配置时才更新表单值
      const hasValidData =
        aiConfig.apiKey || aiConfig.aiModel || aiConfig.apiUrl;

      if (hasValidData) {
        try {
          // 只设置基础AI配置，不包括systemPrompt
          const { systemPrompt, ...basicAIConfig } = aiConfig;
          aiForm.setFieldsValue(basicAIConfig);
        } catch (error) {
          console.warn("更新AI表单值失败", error);
        }
      }
    }
  }, [aiConfig, open, aiForm]);

  // 当promptConfig变化时，更新提示词表单的值（只在模态框打开时）
  React.useEffect(() => {
    if (open && promptConfig && canConfigurePrompt) {
      try {
        promptForm.setFieldsValue(promptConfig);
      } catch (error) {
        console.warn("更新提示词表单值失败", error);
      }
    }
  }, [promptConfig, open, promptForm, canConfigurePrompt]);

  // 当模态框打开或状态变化时，同步表单值
  React.useEffect(() => {
    if (open) {
      // 同步通用设置表单
      form.setFieldsValue({
        ...general,
        theme: theme.theme,
      });

      // 同步外观设置表单
      appearanceForm.setFieldsValue(appearance);
    }
  }, [open, general, theme, appearance, form, appearanceForm]);

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

  // 保存AI提示词配置
  const handleSavePromptConfig = async () => {
    try {
      const values = await promptForm.validateFields();
      const success = await savePromptConfig(values);

      if (success) {
        message.success("AI设置保存成功！");
      }
    } catch (error) {
      message.error("请检查配置信息");
    }
  };

  // 重置提示词为正常对话模式
  const handleResetPromptToDefault = async () => {
    // 直接设置为空字符串（正常对话模式）
    promptForm.setFieldsValue({ systemPrompt: "" });

    // 保存配置
    try {
      const success = await savePromptConfig({ systemPrompt: "" });
      if (success) {
        message.success("已重置为正常对话模式");
      } else {
        message.error("重置失败");
      }
    } catch (error) {
      message.error("重置失败");
    }
  };

  // 保存AI基础配置（不包括systemPrompt）
  const handleSaveAIConfig = async () => {
    try {
      const values = await aiForm.validateFields();

      // 保留现有的systemPrompt，只更新基础AI配置
      const configToSave = {
        ...aiConfig,
        ...values,
        enableAI: true, // 自动启用AI功能
        systemPrompt: aiConfig.systemPrompt // 保留现有的systemPrompt
      };

      const success = await saveAIConfig(configToSave);

      if (success) {
        message.success("AI配置保存成功！现在可以配置AI提示词了。");
      }
    } catch (error) {
      message.error("请检查AI配置信息");
    }
  };

  // 处理通用设置变化
  const handleGeneralChange = React.useCallback((_changedFields: any, allFields: any) => {
    // 实时保存通用设置
    const { theme: themeValue, ...generalSettings } = allFields;

    // 更新主题
    if (themeValue !== theme.theme) {
      setTheme(themeValue);
    }

    // 更新通用设置
    setGeneral(generalSettings);
  }, [theme.theme, setTheme, setGeneral]);

  // 处理颜色值转换的辅助函数
  const convertColorValue = React.useCallback((colorValue: any): string => {
    if (!colorValue) return '#000000';

    // 如果是字符串，直接返回
    if (typeof colorValue === 'string') {
      return colorValue;
    }

    // 如果是对象（ColorPicker的Color对象）
    if (typeof colorValue === 'object') {
      try {
        // 尝试调用toHexString方法
        if (typeof colorValue.toHexString === 'function') {
          return colorValue.toHexString();
        }
        // 尝试调用toHex方法
        if (typeof colorValue.toHex === 'function') {
          return colorValue.toHex();
        }
        // 如果有hex属性
        if (colorValue.hex) {
          return colorValue.hex;
        }
        // 如果有value属性
        if (colorValue.value) {
          return colorValue.value;
        }
      } catch (error) {

      }
    }


    return '#000000';
  }, []);

  // 处理外观设置变化
  const handleAppearanceChange = React.useCallback((_changedFields: any, allFields: any) => {
    // 处理ColorPicker的值转换
    const processedFields = { ...allFields };

    // 转换所有颜色字段
    const colorFields = ['canvasBackground', 'gridColor', 'gridMajorColor', 'noteDefaultColor'];
    colorFields.forEach(field => {
      if (processedFields[field]) {
        processedFields[field] = convertColorValue(processedFields[field]);
      }
    });

    // 实时保存外观设置
    setAppearance(processedFields);
  }, [convertColorValue, setAppearance]);

  // 处理预制主题应用
  const handleApplyPresetTheme = React.useCallback((themeId: string, themeName: string) => {
    try {
      applyPresetTheme(themeId);
      message.success(`已应用 ${themeName} 主题`);
    } catch (error) {
      message.error(`应用主题失败`);
    }
  }, [applyPresetTheme]);

  // 动态生成标签页项目，根据AI配置状态决定是否显示AI提示词标签页
  const getTabItems = React.useMemo(() => {
    const baseItems = [
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
            onValuesChange={handleGeneralChange}
            initialValues={{
              ...general,
              theme: theme.theme,
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
            onValuesChange={handleAppearanceChange}
            initialValues={appearance}
          >
            {/* 预制主题选择器 */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Title level={5} style={{ margin: "0 0 16px 0" }}>
                🎨 预制主题
              </Title>
              <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                选择一个预制主题快速应用美观的配色方案，点击即可立即应用
              </Text>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                gap: "8px",
                marginBottom: "8px"
              }}>
                {PRESET_THEMES.map((theme) => (
                  <div
                    key={theme.id}
                    style={{
                      position: "relative",
                      cursor: "pointer",
                      padding: "12px 8px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      border: "2px solid",
                      borderColor: appearance.canvasBackground === theme.colors.canvasBackground ? "#1677ff" : "#f0f0f0",
                      borderRadius: "12px",
                      backgroundColor: "#fafafa",
                      transition: "border-color 0.2s ease",
                      textAlign: "center",
                    }}
                    onClick={() => handleApplyPresetTheme(theme.id, theme.name)}
                    onMouseEnter={(e) => {
                      if (appearance.canvasBackground !== theme.colors.canvasBackground) {
                        e.currentTarget.style.borderColor = "#1677ff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (appearance.canvasBackground !== theme.colors.canvasBackground) {
                        e.currentTarget.style.borderColor = "#f0f0f0";
                      }
                    }}
                  >
                    <span style={{ fontSize: "24px", lineHeight: 1 }}>{theme.icon}</span>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#262626" }}>
                        {theme.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "#8c8c8c", marginTop: "2px" }}>
                        {theme.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

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

              <Form.Item
                label="网格线颜色"
                name="gridColor"
                extra="细网格线的颜色"
              >
                <ColorPicker
                  showText
                  presets={[
                    {
                      label: "网格颜色",
                      colors: [
                        "#e2e8f0", // 默认灰色
                        "#dbeafe", // 蓝色
                        "#d1fae5", // 绿色
                        "#fef3c7", // 黄色
                        "#fce7f3", // 粉色
                        "#e9d5ff", // 紫色
                      ],
                    },
                  ]}
                />
              </Form.Item>

              <Form.Item
                label="主网格线颜色"
                name="gridMajorColor"
                extra="粗网格线的颜色，用于突出显示"
              >
                <ColorPicker
                  showText
                  presets={[
                    {
                      label: "主网格颜色",
                      colors: [
                        "#cbd5e1", // 默认深灰
                        "#93c5fd", // 蓝色
                        "#86efac", // 绿色
                        "#fde047", // 黄色
                        "#f9a8d4", // 粉色
                        "#c4b5fd", // 紫色
                      ],
                    },
                  ]}
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
    }
    ];

    // AI提示词设置标签页（只有AI配置有效时才显示）
    const aiPromptTab = canConfigurePrompt ? {
      key: "ai-prompt",
      label: (
        <span>
          <RobotOutlined />
          AI提示词
        </span>
      ),
      children: (
        <div className="settings-modal-content">
          <Spin spinning={promptLoading}>
            {promptError && (
              <Alert
                message={promptError}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            <Form
              form={promptForm}
              layout="vertical"
              onFinish={handleSavePromptConfig}
              preserve={true}
              initialValues={{
                systemPrompt: promptConfig.systemPrompt || "",
              }}
            >
              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5} style={{ margin: "0 0 16px 0" }}>
                  AI回复设置
                </Title>

                <Form.Item
                  label="AI角色设定（可选）"
                  name="systemPrompt"
                  extra="留空：正常对话 | 填写：自定义AI角色"
                >
                  <Input.TextArea
                    rows={6}
                    placeholder="留空 = 正常AI对话&#10;填写 = 自定义AI角色&#10;&#10;例如：你是专业的工作助手..."
                    style={{
                      fontSize: '14px'
                    }}
                  />
                </Form.Item>
              </Card>

              <div className="form-actions">
                <Space>
                  <Button
                    type="primary"
                    onClick={handleSavePromptConfig}
                    disabled={promptLoading}
                  >
                    保存设置
                  </Button>
                  <Button
                    onClick={handleResetPromptToDefault}
                    disabled={promptLoading}
                  >
                    清空重置
                  </Button>
                </Space>
              </div>
            </Form>
          </Spin>
        </div>
      ),
    } : null;

    // 返回所有标签页，过滤掉null项并转换类型
    return [
      ...baseItems,
      aiPromptTab,
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
    ].filter(Boolean) as TabsProps['items']; // 添加类型断言
  }, [
    general,
    theme,
    appearance,
    handleGeneralChange,
    handleAppearanceChange,
    handleApplyPresetTheme,
    aiLoading,
    aiError,
    hasValidConfig,
    aiConfig,
    handleSaveAIConfig,
    testingConnection,
    handleTestConnection,
    promptLoading,
    promptError,
    canConfigurePrompt,
    handleSavePromptConfig,
    handleResetPromptToDefault
  ]);

  return (
    <Modal
      title="设置"
      open={open}
      onCancel={onClose}
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
        items={getTabItems}
        tabPosition="left"
        className="settings-tabs"
        style={{ height: "100%" }}
      />
    </Modal>
  );
};

export default SettingsModal;
