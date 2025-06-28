import {
  DatabaseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileTextOutlined,
  HddOutlined,
  InfoCircleOutlined,
  RobotOutlined,
  SafetyOutlined,
  SkinOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  ColorPicker,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Select,
  Slider,
  Space,
  Spin,
  Statistic,
  Switch,
  Tabs,
  Typography,
  Upload,
  type TabsProps,
} from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useDatabase } from "../../database";
import { useAIPromptSettings } from "../../hooks/ai/useAIPromptSettings";
import { useAISettings } from "../../hooks/ai/useAISettings";
import { useAIStore, useStickyNotesStore, useUserStore } from "../../stores";
import { PRESET_THEMES, useUIStore } from "../../stores/uiStore";
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
  defaultActiveTab = "appearance",
}) => {
  const [aiForm] = Form.useForm();
  const [appearanceForm] = Form.useForm();
  const [userForm] = Form.useForm();
  const [testingConnection, setTestingConnection] = useState(false);

  // 数据管理相关状态
  const [dataStats, setDataStats] = useState<{
    notesCount: number;
    canvasesCount: number;
    storageUsed: number;
    storageTotal: number;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  // 使用UIStore获取和设置外观设置
  const { appearance, setAppearance, applyPresetTheme } = useUIStore();

  // 使用UserStore获取和设置用户信息
  const {
    currentUser,
    loading: userLoading,
    error: userError,
    updateUserProfile,
    loadCurrentUser,
  } = useUserStore();

  const {
    config: aiConfig,
    loading: aiLoading,
    error: aiError,
    saveConfig: saveAIConfig,
    testConnection,
    hasValidConfig,
  } = useAISettings();

  // 数据库操作Hook
  const { exportData, importData, getStorageInfo, getStats, clearDatabase } =
    useDatabase();

  // 便签状态管理
  const { loadNotes } = useStickyNotesStore();

  // AI状态管理 - 仅用于状态同步，不用于保存
  const {
    saveConfig: saveAIStoreConfig,
    savePromptConfig: saveAIStorePromptConfig,
  } = useAIStore();

  // AI提示词设置Hook
  const {
    promptConfig,
    loading: promptLoading,
    error: promptError,
    savePromptConfig,
    canConfigurePrompt,
  } = useAIPromptSettings(hasValidConfig);

  // 总是创建promptForm，但只在canConfigurePrompt为true时使用
  const [promptForm] = Form.useForm();

  // 加载数据统计信息
  const loadDataStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const [stats, storageInfo] = await Promise.all([
        getStats(),
        getStorageInfo(),
      ]);

      setDataStats({
        notesCount: stats.totalNotes,
        canvasesCount: stats.notesByCanvas?.length || 0,
        storageUsed: storageInfo.used,
        storageTotal: storageInfo.total,
      });
    } catch (error) {
      console.error("加载数据统计失败:", error);
      message.error("加载数据统计失败");
    } finally {
      setLoadingStats(false);
    }
  }, []); // 空依赖数组，因为函数内部没有依赖外部变量

  // 导出数据
  const handleExportData = async () => {
    try {
      setExportLoading(true);
      await exportData();
      message.success("数据导出成功！");
    } catch (error) {
      console.error("导出数据失败:", error);
      message.error("导出数据失败");
    } finally {
      setExportLoading(false);
    }
  };

  // 导入数据
  const handleImportData = async (file: File) => {
    try {
      setImportLoading(true);

      // 验证文件类型
      if (!file.name.endsWith(".json")) {
        throw new Error("请选择JSON格式的文件");
      }

      // 验证文件大小（限制为10MB）
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("文件大小不能超过10MB");
      }

      await importData(file);

      // 重新加载便签数据到状态管理中
      await loadNotes();

      message.success("数据导入成功！便签已更新显示。");

      // 重新加载统计信息
      await loadDataStats();
    } catch (error) {
      console.error("导入数据失败:", error);
      const errorMessage =
        error instanceof Error ? error.message : "导入数据失败，请检查文件格式";
      message.error(errorMessage);
    } finally {
      setImportLoading(false);
    }
  };

  // 清空所有数据
  const handleClearAllData = async () => {
    try {
      await clearDatabase();

      // 重新加载便签数据到状态管理中
      await loadNotes();

      message.success("所有数据已清空！");
      // 重新加载统计信息
      await loadDataStats();
    } catch (error) {
      console.error("清空数据失败:", error);
      message.error("清空数据失败");
    }
  };

  // 当模态框打开时加载数据统计
  useEffect(() => {
    if (open) {
      loadDataStats();
    }
  }, [open, loadDataStats]);

  // 当aiConfig变化时，更新AI基础配置表单的值（只在模态框打开时）
  React.useEffect(() => {
    if (open && aiConfig) {
      try {
        // 只设置基础AI配置，不包括systemPrompt
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { systemPrompt, ...basicAIConfig } = aiConfig;
        // systemPrompt 被故意忽略，不设置到表单中
        aiForm.setFieldsValue(basicAIConfig);
        console.log("🔧 SettingsModal: 更新AI表单值", {
          ...basicAIConfig,
          apiKey: basicAIConfig.apiKey ? "******" : "",
        });
      } catch (error) {
        console.warn("更新AI表单值失败", error);
      }
    }
  }, [aiConfig, open, aiForm]);

  // 当promptConfig变化时，更新提示词表单的值（只在模态框打开时）
  React.useEffect(() => {
    if (open && promptConfig && canConfigurePrompt) {
      // 使用setTimeout确保Form组件已经渲染
      const timer = setTimeout(() => {
        try {
          promptForm.setFieldsValue(promptConfig);
          console.log("🔧 SettingsModal: 更新AI提示词表单值", promptConfig);
        } catch (error) {
          console.warn("🔧 SettingsModal: 更新提示词表单值失败", error);
        }
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [promptConfig, open, promptForm, canConfigurePrompt]);

  // 当模态框打开或状态变化时，同步表单值
  React.useEffect(() => {
    if (open) {
      // 同步外观设置表单
      appearanceForm.setFieldsValue(appearance);
    }
  }, [open, appearance, appearanceForm]);

  // 当模态框打开时加载用户信息
  React.useEffect(() => {
    if (open) {
      loadCurrentUser();
    }
  }, [open, loadCurrentUser]);

  // 当用户信息变化时，更新用户表单的值
  React.useEffect(() => {
    if (open && currentUser) {
      userForm.setFieldsValue({
        username: currentUser.username,
        email: currentUser.email,
      });
    }
  }, [open, currentUser, userForm]);

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
      console.error("测试连接失败:", error);
      message.error("请先完善配置信息");
    } finally {
      setTestingConnection(false);
    }
  };

  // 保存AI提示词配置 - 简化版本，只使用主要的保存方法
  const handleSavePromptConfig = async () => {
    try {
      console.log("🔧 SettingsModal: 开始保存AI提示词配置");

      const values = await promptForm.validateFields();
      console.log("🔧 SettingsModal: 提示词表单验证通过", values);

      // 使用 useAIPromptSettings Hook 进行保存，配置管理器会自动同步所有状态
      const success = await savePromptConfig(values);

      if (success) {
        message.success("AI提示词设置保存成功！现在可以使用自定义提示词了。");
        console.log("🔧 SettingsModal: AI提示词配置保存完成");
      } else {
        throw new Error("配置保存失败");
      }
    } catch (error) {
      console.error("🔧 SettingsModal: 保存提示词配置失败:", error);

      // 提供更具体的错误信息
      if (error instanceof Error) {
        message.error(`保存失败：${error.message}`);
      } else {
        message.error("保存提示词配置时发生未知错误");
      }
    }
  };

  // 重置提示词为正常对话模式 - 简化版本
  const handleResetPromptToDefault = async () => {
    try {
      console.log("🔧 SettingsModal: 开始重置AI提示词为正常对话模式");

      // 直接设置为空字符串（正常对话模式）
      promptForm.setFieldsValue({ systemPrompt: "" });

      const resetConfig = { systemPrompt: "" };

      // 使用 useAIPromptSettings Hook 进行保存，配置管理器会自动同步所有状态
      const success = await savePromptConfig(resetConfig);

      if (success) {
        message.success("已重置为正常对话模式");
        console.log("🔧 SettingsModal: AI提示词重置完成");
      } else {
        throw new Error("重置失败");
      }
    } catch (error) {
      console.error("🔧 SettingsModal: 重置提示词失败:", error);

      // 提供更具体的错误信息
      if (error instanceof Error) {
        message.error(`重置失败：${error.message}`);
      } else {
        message.error("重置提示词时发生未知错误");
      }
    }
  };

  // 保存AI基础配置（不包括systemPrompt）
  const handleSaveAIConfig = async () => {
    try {
      console.log("🔧 SettingsModal: 开始保存AI配置");

      // 验证表单字段
      const values = await aiForm.validateFields();
      console.log("🔧 SettingsModal: 表单验证通过", {
        ...values,
        apiKey: values.apiKey ? "******" : "",
      });

      // 保留现有的systemPrompt，只更新基础AI配置
      const configToSave = {
        ...aiConfig,
        ...values,
        enableAI: true, // 自动启用AI功能
        systemPrompt: aiConfig.systemPrompt, // 保留现有的systemPrompt
      };

      console.log("🔧 SettingsModal: 准备保存的配置", {
        ...configToSave,
        apiKey: configToSave.apiKey ? "******" : "",
      });

      // 使用 useAISettings Hook 进行保存，配置管理器会自动同步所有状态
      const success = await saveAIConfig(configToSave);

      if (success) {
        message.success("AI配置保存成功！现在可以使用AI功能了。");
        console.log("🔧 SettingsModal: AI配置保存完成");
      } else {
        throw new Error("配置保存失败");
      }
    } catch (error) {
      console.error("🔧 SettingsModal: 保存AI配置失败:", error);

      // 提供更具体的错误信息
      if (error instanceof Error) {
        if (error.message.includes("请输入")) {
          message.error(`配置验证失败：${error.message}`);
        } else if (error.message.includes("URL")) {
          message.error("API地址格式不正确，请输入有效的URL地址");
        } else {
          message.error(`保存失败：${error.message}`);
        }
      } else {
        message.error("保存配置时发生未知错误，请检查配置信息");
      }
    }
  };

  // 处理颜色值转换的辅助函数
  const convertColorValue = React.useCallback((colorValue: unknown): string => {
    if (!colorValue) return "#000000";

    // 如果是字符串，直接返回
    if (typeof colorValue === "string") {
      return colorValue;
    }

    // 如果是对象（ColorPicker的Color对象）
    if (typeof colorValue === "object" && colorValue !== null) {
      try {
        const colorObj = colorValue as Record<string, unknown>;
        // 尝试调用toHexString方法
        if (typeof colorObj.toHexString === "function") {
          return (colorObj.toHexString as () => string)();
        }
        // 尝试调用toHex方法
        if (typeof colorObj.toHex === "function") {
          return (colorObj.toHex as () => string)();
        }
        // 如果有hex属性
        if (typeof colorObj.hex === "string") {
          return colorObj.hex;
        }
        // 如果有value属性
        if (typeof colorObj.value === "string") {
          return colorObj.value;
        }
      } catch (error) {
        console.warn("颜色值转换失败:", error);
      }
    }

    return "#000000";
  }, []);

  // 处理外观设置变化
  const handleAppearanceChange = React.useCallback(
    (
      _changedFields: Record<string, unknown>,
      allFields: Record<string, unknown>
    ) => {
      // 处理ColorPicker的值转换
      const processedFields = { ...allFields };

      // 转换所有颜色字段
      const colorFields = ["canvasBackground", "gridColor", "gridMajorColor"];
      colorFields.forEach((field) => {
        if (processedFields[field]) {
          processedFields[field] = convertColorValue(processedFields[field]);
        }
      });

      // 实时保存外观设置
      setAppearance(processedFields);
    },
    [convertColorValue, setAppearance]
  );

  // 处理预制主题应用
  const handleApplyPresetTheme = React.useCallback(
    (themeId: string, themeName: string) => {
      try {
        applyPresetTheme(themeId);
        message.success(`已应用 ${themeName} 主题`);
      } catch (error) {
        console.error("应用主题失败:", error);
        message.error(`应用主题失败`);
      }
    },
    [applyPresetTheme]
  );

  // 处理用户信息更新
  const handleUserProfileUpdate = React.useCallback(
    async (values: any) => {
      try {
        await updateUserProfile({
          username: values.username,
          email: values.email,
        });
        message.success("用户信息更新成功");
      } catch (error) {
        console.error("更新用户信息失败:", error);
        message.error("更新用户信息失败");
      }
    },
    [updateUserProfile]
  );

  // 动态生成标签页项目，根据AI配置状态决定是否显示AI提示词标签页
  const getTabItems = React.useMemo(() => {
    const baseItems = [
      {
        key: "user",
        label: (
          <span>
            <UserOutlined />
            用户设置
          </span>
        ),
        children: (
          <div className="settings-modal-content">
            <Form
              form={userForm}
              layout="vertical"
              onFinish={handleUserProfileUpdate}
              initialValues={{
                username: currentUser?.username || "",
                email: currentUser?.email || "",
              }}
            >
              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5} style={{ margin: "0 0 16px 0" }}>
                  👤 个人信息
                </Title>
                <Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 16 }}
                >
                  管理您的个人资料信息，这些信息将用于个性化您的使用体验
                </Text>

                <Form.Item
                  label="用户名"
                  name="username"
                  rules={[
                    { required: true, message: "请输入用户名" },
                    { min: 2, message: "用户名至少2个字符" },
                    { max: 20, message: "用户名最多20个字符" },
                  ]}
                >
                  <Input placeholder="请输入用户名" />
                </Form.Item>

                <Form.Item
                  label="邮箱地址"
                  name="email"
                  rules={[{ type: "email", message: "请输入有效的邮箱地址" }]}
                >
                  <Input placeholder="请输入邮箱地址（可选）" />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={userLoading}
                    style={{ marginRight: 8 }}
                  >
                    保存更改
                  </Button>
                  <Button onClick={() => userForm.resetFields()}>重置</Button>
                </Form.Item>

                {userError && (
                  <Alert
                    message="错误"
                    description={userError}
                    type="error"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
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
                <Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 16 }}
                >
                  选择一个预制主题快速应用美观的配色方案，点击即可立即应用
                </Text>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
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
                        borderColor:
                          appearance.canvasBackground ===
                          theme.colors.canvasBackground
                            ? "#1677ff"
                            : "#f0f0f0",
                        borderRadius: "12px",
                        backgroundColor: "#fafafa",
                        transition: "border-color 0.2s ease",
                        textAlign: "center",
                      }}
                      onClick={() =>
                        handleApplyPresetTheme(theme.id, theme.name)
                      }
                      onMouseEnter={(e) => {
                        if (
                          appearance.canvasBackground !==
                          theme.colors.canvasBackground
                        ) {
                          e.currentTarget.style.borderColor = "#1677ff";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (
                          appearance.canvasBackground !==
                          theme.colors.canvasBackground
                        ) {
                          e.currentTarget.style.borderColor = "#f0f0f0";
                        }
                      }}
                    >
                      <span style={{ fontSize: "24px", lineHeight: 1 }}>
                        {theme.icon}
                      </span>
                      <div>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#262626",
                          }}
                        >
                          {theme.name}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#8c8c8c",
                            marginTop: "2px",
                          }}
                        >
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
            </Form>
          </div>
        ),
      },
      {
        key: "data",
        label: (
          <span>
            <DatabaseOutlined />
            数据管理
          </span>
        ),
        children: (
          <div className="settings-modal-content">
            <Spin spinning={loadingStats}>
              {/* 数据统计信息 */}
              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5} style={{ margin: "0 0 16px 0" }}>
                  <HddOutlined style={{ marginRight: 8 }} />
                  数据统计
                </Title>
                {dataStats && (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="便签数量"
                        value={dataStats.notesCount}
                        prefix={<FileTextOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="画布数量"
                        value={dataStats.canvasesCount}
                        prefix={<SafetyOutlined />}
                      />
                    </Col>
                  </Row>
                )}

                {dataStats && dataStats.storageTotal > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Text type="secondary">存储使用情况</Text>
                    <Progress
                      percent={Math.round(
                        (dataStats.storageUsed / dataStats.storageTotal) * 100
                      )}
                      format={() =>
                        `${(dataStats.storageUsed / 1024 / 1024).toFixed(2)} MB`
                      }
                      style={{ marginTop: 8 }}
                    />
                  </div>
                )}
              </Card>

              {/* 数据操作 */}
              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5} style={{ margin: "0 0 16px 0" }}>
                  数据操作
                </Title>
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size="middle"
                >
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExportData}
                    loading={exportLoading}
                    style={{ width: "100%" }}
                  >
                    导出所有数据
                  </Button>

                  <Upload
                    accept=".json"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      handleImportData(file);
                      return false; // 阻止自动上传
                    }}
                    disabled={importLoading}
                  >
                    <Button
                      icon={<UploadOutlined />}
                      loading={importLoading}
                      style={{ width: "100%" }}
                    >
                      导入数据
                    </Button>
                  </Upload>

                  <Divider style={{ margin: "8px 0" }} />

                  <Popconfirm
                    title="确认清空所有数据？"
                    description="此操作将删除所有便签、画布和设置，且不可恢复！"
                    onConfirm={handleClearAllData}
                    okText="确认清空"
                    cancelText="取消"
                    okType="danger"
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      style={{ width: "100%" }}
                    >
                      清空所有数据
                    </Button>
                  </Popconfirm>
                </Space>

                <Alert
                  message="数据说明"
                  description="• 导出：将所有数据保存为JSON文件到本地
• 导入：从JSON文件恢复数据（会覆盖现有数据）
• 清空：删除所有数据，恢复到初始状态"
                  type="info"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              </Card>
            </Spin>
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
              >
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Title level={5} style={{ margin: "0 0 16px 0" }}>
                    <RobotOutlined style={{ marginRight: 8 }} />
                    AI模型配置
                  </Title>
                  <Text
                    type="secondary"
                    style={{ display: "block", marginBottom: 16 }}
                  >
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
      },
    ];

    // AI提示词设置标签页（只有AI配置有效时才显示）
    const aiPromptTab = canConfigurePrompt
      ? {
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
                          fontSize: "14px",
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
        }
      : null;

    // 返回所有标签页，过滤掉null项并转换类型
    return [
      ...baseItems,
      aiPromptTab,
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
                无限便签 - 思维整理的AI工作空间
              </Title>
              <p>
                <strong>无限便签</strong>{" "}
                是一款创新的无限画布便签应用，支持AI智能汇总、连接线可视化和溯源追踪，让您自由组织思路和灵感。
              </p>
              <p>版本: 1.0.0</p>
              <Divider />
              <p>
                <strong>核心功能:</strong>
              </p>
              <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                <li>🎨 无限画布 - 自由创作空间</li>
                <li>🤖 AI智能汇总 - 自动整理要点</li>
                <li>🔗 可视化连接 - 构建知识网络</li>
                <li>🎯 溯源追踪 - 了解想法演化</li>
                <li>💾 本地存储 - 保护隐私安全</li>
              </ul>
              <Divider />
              <Space direction="vertical" style={{ width: "100%" }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => window.open("./landing.html", "_blank")}
                  style={{ width: "100%" }}
                >
                  🌐 访问官网了解更多
                </Button>
                <Button
                  type="default"
                  onClick={() => window.open("./app.html", "_blank")}
                  style={{ width: "100%" }}
                >
                  🚀 在新窗口打开应用
                </Button>
              </Space>
              <Divider />
              <p>
                <strong>开发者:</strong> duobao
              </p>
              <p>
                <strong> 联系方式:</strong> 2385561331@qq.com
              </p>
              <p>
                <strong>数据存储:</strong> 本地 IndexedDB（保护隐私）
              </p>
              <Divider />
              <p style={{ textAlign: "center", color: "#666" }}>
                © 2025 无限便签. 专注于思维整理的创新工具.
              </p>
            </Card>
          </div>
        ),
      },
    ].filter(Boolean) as TabsProps["items"]; // 添加类型断言
  }, [
    appearance,
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
    handleResetPromptToDefault,
    // 数据管理相关依赖
    dataStats,
    loadingStats,
    exportLoading,
    importLoading,
    handleExportData,
    handleImportData,
    handleClearAllData,
    // 表单实例
    aiForm,
    promptForm,
    appearanceForm,
    // 提示词配置
    promptConfig.systemPrompt,
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
          overflowY: "hidden",
        },
      }}
      footer={null}
      destroyOnHidden
      className="settings-modal"
      zIndex={1010} // 确保设置弹窗在侧边栏按钮之上
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
