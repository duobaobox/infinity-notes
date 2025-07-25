import {
  BgColorsOutlined,
  BookOutlined,
  BulbOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  GlobalOutlined,
  HddOutlined,
  InfoCircleOutlined,
  MessageOutlined,
  RobotOutlined,
  SafetyOutlined,
  SettingOutlined,
  SkinOutlined,
  TeamOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  AutoComplete,
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
  Slider,
  Space,
  Spin,
  Statistic,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
  type TabsProps,
} from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useDatabase } from "../../database";
import { IndexedDBAIProviderStorage } from "../../database/IndexedDBAIProviderStorage"; // IndexedDB AI Provider Storage - AI供应商配置存储
import { initializeDatabase } from "../../database/useIndexedDB";
import { useAIPromptSettings } from "../../hooks/ai/useAIPromptSettings";
import { useAISettings } from "../../hooks/ai/useAISettings";
import type { AIPromptTemplate } from "../../services/ai/aiService";
import { systemPromptTemplates } from "../../services/ai/aiService";
import { useStickyNotesStore, useUserStore } from "../../stores";
import { PRESET_THEMES, useUIStore } from "../../stores/uiStore";
import { AIConfigStatus } from "../ai/AIConfigStatus";
import AIPromptTemplateSelector from "../ai/AIPromptTemplateSelector";
import CardSectionTitle from "../common/CardSectionTitle";
import NoteSettings from "../notes/NoteSettings";
import "./SettingsModal.css";

/**
 * 样式常量定义
 * 统一管理组件中使用的样式对象
 */
const STYLES = {
  // 供应商卡片样式
  providerCard: {
    height: "70px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    position: "relative" as const,
  },
  providerCardBody: {
    padding: "8px",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    textAlign: "center" as const,
  },

  // 配置状态指示器样式
  configIndicator: {
    position: "absolute" as const,
    top: "4px",
    right: "4px",
    width: "8px",
    height: "8px",
    backgroundColor: "#1890ff",
    borderRadius: "50%",
    border: "1px solid white",
    boxShadow: "0 0 4px rgba(24, 144, 255, 0.6)",
  },
  // 设置变更提示样式
  changeNotification: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#fff7e6",
    border: "1px solid #ffd591",
    borderRadius: 4,
  },
} as const;

// 添加供应商卡片的CSS样式
const providerCardStyles = `
  .provider-card.ant-card {
    border-radius: 8px;
    overflow: hidden;
  }

  .provider-card.ant-card:hover {
    border-color: #1890ff !important;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
  }

  .provider-card .ant-card-body {
    position: relative;
  }
`;

// 动态注入样式
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = providerCardStyles;
  if (!document.head.querySelector("style[data-provider-cards]")) {
    styleElement.setAttribute("data-provider-cards", "true");
    document.head.appendChild(styleElement);
  }
}

const { Text } = Typography;

/**
 * AI供应商配置接口定义
 */
interface AIProvider {
  id: string;
  name: string;
  displayName: string;
  logo: React.ReactNode;
  apiUrl: string;
  description: string;
  models: Array<{
    name: string;
    displayName: string;
  }>;
}

/**
 * AI供应商配置对象接口
 */
interface AIProviderConfig {
  apiUrl: string;
  apiKey: string;
  aiModel: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * 预定义的AI供应商配置列表
 * 包含主流AI服务提供商的基础配置信息
 */
const DEFAULT_AI_PROVIDERS: AIProvider[] = [
  {
    id: "deepseek", // DeepSeek AI服务商ID
    name: "DeepSeek",
    displayName: "DeepSeek",
    logo: <DatabaseOutlined />,
    apiUrl: "https://api.deepseek.com/v1",
    description: "高性价比推理模型",
    models: [
      { name: "deepseek-chat", displayName: "DeepSeek Chat" }, // DeepSeek聊天模型
      { name: "deepseek-coder", displayName: "DeepSeek Coder" }, // DeepSeek编程模型
    ],
  },
  {
    id: "alibaba",
    name: "Alibaba",
    displayName: "阿里云百炼",
    logo: <BgColorsOutlined />,
    apiUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    description: "阿里云百炼智能大模型",
    models: [
      { name: "qwen-turbo", displayName: "通义千问 Turbo" }, // 通义千问快速版
      { name: "qwen-plus", displayName: "通义千问 Plus" }, // 通义千问增强版
      { name: "qwen-max", displayName: "通义千问 Max" }, // 通义千问旗舰版
    ],
  },
  {
    id: "siliconflow", // SiliconFlow硅基流动服务商ID
    name: "SiliconFlow",
    displayName: "硅基流动",
    logo: <BulbOutlined />,
    apiUrl: "https://api.siliconflow.cn/v1",
    description: "高速AI推理平台",
    models: [
      { name: "deepseek-chat", displayName: "DeepSeek Chat" }, // DeepSeek聊天模型
      { name: "Qwen/Qwen2.5-7B-Instruct", displayName: "通义千问 2.5-7B" }, // 通义千问2.5版本
      {
        name: "meta-llama/Meta-Llama-3.1-8B-Instruct", // Meta Llama模型
        displayName: "Llama 3.1 8B",
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    displayName: "OpenAI",
    logo: <RobotOutlined />,
    apiUrl: "https://api.openai.com/v1",
    description: "GPT系列模型创造者",
    models: [
      { name: "gpt-4o", displayName: "GPT-4o" },
      { name: "gpt-4o-mini", displayName: "GPT-4o Mini" },
      { name: "gpt-3.5-turbo", displayName: "GPT-3.5 Turbo" },
    ],
  },
];

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
  const [noteSettingsForm] = Form.useForm();
  const [userForm] = Form.useForm();
  const [testingConnection, setTestingConnection] = useState(false);

  /**
   * AI供应商相关状态管理
   * 用于管理AI供应商选择、配置存储等功能
   */
  // AI供应商和模型选择状态
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(
    null
  );
  const [isProviderAutoDetected, setIsProviderAutoDetected] = useState(false); // 标记是否已自动检测过供应商
  const [providerConfigs, setProviderConfigs] = useState<
    Record<string, AIProviderConfig>
  >({}); // 存储各供应商的配置

  /**
   * AI提示词模板选择状态
   * 用于管理AI角色模板的选择和应用
   */
  const [selectedTemplate, setSelectedTemplate] =
    useState<AIPromptTemplate | null>(null);

  /**
   * 加载多供应商配置
   * 从IndexedDB中加载所有AI供应商的配置信息
   */
  const loadProviderConfigs = useCallback(async () => {
    try {
      // 确保数据库已初始化
      await initializeDatabase();

      // 首先尝试从localStorage迁移数据（如果存在）
      await IndexedDBAIProviderStorage.migrateFromLocalStorage(); // IndexedDB AI Provider Storage迁移

      // 从IndexedDB加载所有供应商配置
      const configs = await IndexedDBAIProviderStorage.loadAllProviderConfigs(); // IndexedDB AI Provider Storage加载配置
      setProviderConfigs(configs);
      console.log(
        "🔧 SettingsModal: 从IndexedDB加载多供应商配置",
        Object.keys(configs)
      );
    } catch (error) {
      console.warn("🔧 SettingsModal: 加载多供应商配置失败", error);
    }
  }, []);

  /**
   * 保存单个供应商配置到IndexedDB
   * @param providerId 供应商ID
   * @param config 配置对象
   */
  const saveProviderConfig = useCallback(
    async (providerId: string, config: AIProviderConfig) => {
      try {
        await IndexedDBAIProviderStorage.saveProviderConfig(providerId, config); // IndexedDB AI Provider Storage保存配置
        console.log("🔧 SettingsModal: 保存供应商配置到IndexedDB", providerId);
      } catch (error) {
        console.warn("🔧 SettingsModal: 保存供应商配置失败", error);
      }
    },
    []
  );

  /**
   * 数据管理相关状态
   * 用于管理数据统计、导入导出等功能的状态
   */
  const [dataStats, setDataStats] = useState<{
    notesCount: number;
    canvasesCount: number;
    storageUsed: number;
    storageTotal: number;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  // 使用UIStore获取和设置外观设置和基础设置
  const {
    appearance,
    setAppearance,
    applyPresetTheme,
    basicSettings,
    setBasicSettings,
    resetNoteDefaultSizes,
  } = useUIStore();

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

  /**
   * 加载数据统计信息
   * 获取便签数量、画布数量、存储使用情况等统计数据
   */
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
  }, [getStats, getStorageInfo]); // 添加依赖项以确保正确的重新计算

  /**
   * 导出数据处理函数
   * 将所有数据导出为JSON文件
   */
  const handleExportData = useCallback(async () => {
    try {
      setExportLoading(true);
      await exportData();
      message.success("数据导出成功！文件已保存到下载文件夹。");
    } catch (error) {
      console.error("导出数据失败:", error);
      const errorMessage =
        error instanceof Error
          ? `导出失败：${error.message}`
          : "导出数据时发生未知错误，请稍后重试";
      message.error(errorMessage);
    } finally {
      setExportLoading(false);
    }
  }, [exportData]);

  /**
   * 导入数据处理函数
   * 从JSON文件导入数据并更新应用状态
   * @param file 要导入的JSON文件
   */
  const handleImportData = useCallback(
    async (file: File) => {
      try {
        setImportLoading(true);

        // 验证文件类型
        if (!file.name.endsWith(".json")) {
          throw new Error("请选择JSON格式的文件，当前文件类型不支持");
        }

        // 验证文件大小（限制为10MB）
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("文件大小不能超过10MB，请选择较小的文件");
        }

        // 验证文件是否为空
        if (file.size === 0) {
          throw new Error("文件为空，请选择有效的数据文件");
        }

        await importData(file);

        // 重新加载便签数据到状态管理中
        await loadNotes();

        message.success(
          "数据导入成功！便签已更新显示，您可以在画布中查看导入的内容。"
        );

        // 重新加载统计信息
        await loadDataStats();
      } catch (error) {
        console.error("导入数据失败:", error);
        let errorMessage = "导入数据失败，请检查文件格式";

        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === "string") {
          errorMessage = error;
        }

        message.error({
          content: errorMessage,
          duration: 5, // 显示5秒
        });
      } finally {
        setImportLoading(false);
      }
    },
    [importData, loadNotes, loadDataStats]
  );

  /**
   * 清空所有数据处理函数
   * 删除所有便签、画布和配置数据
   */
  const handleClearAllData = useCallback(async () => {
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
  }, [clearDatabase, loadNotes, loadDataStats]);

  // 当模态框打开时加载数据统计
  useEffect(() => {
    if (open) {
      loadDataStats();
    }
  }, [open, loadDataStats]);

  // 当模态框打开时，加载配置和多供应商数据
  React.useEffect(() => {
    if (open) {
      // 加载多供应商配置
      loadProviderConfigs();

      if (aiConfig) {
        // 使用setTimeout确保Form组件已经渲染
        const timer = setTimeout(() => {
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

            // 只在初次打开模态框时自动识别供应商，避免保存后重置用户选择
            if (basicAIConfig.apiUrl && !isProviderAutoDetected) {
              const matchedProvider = DEFAULT_AI_PROVIDERS.find(
                (provider) => provider.apiUrl === basicAIConfig.apiUrl
              );
              if (matchedProvider) {
                setSelectedProvider(matchedProvider);
              } else {
                // 如果没有匹配的供应商，设置为自定义配置
                setSelectedProvider({
                  id: "custom",
                  name: "自定义配置",
                  displayName: "自定义配置",
                  logo: <SettingOutlined />,
                  apiUrl: "",
                  models: [],
                  description: "手动配置API地址和模型",
                });
              }
              setIsProviderAutoDetected(true); // 标记已完成自动检测
            }
          } catch (error) {
            console.warn("更新AI表单值失败", error);
          }
        }, 0);

        return () => clearTimeout(timer);
      }
    }
  }, [aiConfig, open, aiForm, loadProviderConfigs, isProviderAutoDetected]);

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

  // 根据当前提示词内容确定选中的模板
  const getCurrentSelectedTemplate = useCallback(
    (currentPrompt: string): AIPromptTemplate | null => {
      // 直接在所有模板中查找匹配的提示词内容
      const matchingTemplate = systemPromptTemplates.find(
        (template) => template.prompt === currentPrompt
      );
      return matchingTemplate || null;
    },
    []
  );

  // 获取当前正在使用的AI提示词模板
  const getCurrentPromptTemplate = () => {
    const currentPrompt = promptConfig?.systemPrompt || "";
    if (!currentPrompt) return null;

    // 查找匹配的模板
    const matchingTemplate = systemPromptTemplates.find(
      (template) => template.prompt === currentPrompt
    );

    if (matchingTemplate) {
      return matchingTemplate;
    }

    // 如果没有匹配的模板，返回自定义模板信息
    return {
      id: "custom",
      name: "自定义提示词",
      icon: "EditOutlined",
      description: "用户自定义的AI角色设定",
      prompt: currentPrompt,
      category: "custom",
    };
  };

  // 根据当前提示词内容自动设置选中的模板
  React.useEffect(() => {
    if (open && promptConfig && canConfigurePrompt) {
      const currentPrompt = promptConfig.systemPrompt || "";

      // 查找匹配的模板
      const matchingTemplate = getCurrentSelectedTemplate(currentPrompt);
      setSelectedTemplate(matchingTemplate);
    }
  }, [open, promptConfig, canConfigurePrompt, getCurrentSelectedTemplate]);

  /**
   * 测试AI连接
   * 验证AI配置并测试连接状态
   */
  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);

      // 先验证表单字段
      await aiForm.validateFields();

      // 测试连接 - Hook层会自动处理成功/失败消息
      await testConnection();
    } catch (error) {
      console.error("测试连接失败:", error);
      // Hook层已经处理了错误消息，这里不需要重复显示
    } finally {
      setTestingConnection(false);
    }
  };

  // 处理提示词模板选择
  const handleTemplateSelect = useCallback(
    (template: AIPromptTemplate) => {
      console.log("🎯 SettingsModal: 选择提示词模板", template);

      setSelectedTemplate(template);

      // 更新表单值
      promptForm.setFieldsValue({
        systemPrompt: template.prompt,
      });
    },
    [promptForm]
  );

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

  /**
   * 处理AI供应商选择
   * @param provider 选择的AI供应商
   */
  const handleProviderSelect = async (provider: AIProvider) => {
    // 保存当前供应商的配置（如果有的话）
    if (selectedProvider && selectedProvider.id !== provider.id) {
      const currentValues = aiForm.getFieldsValue();
      if (currentValues.apiKey || currentValues.aiModel) {
        const configToSave = {
          apiUrl: currentValues.apiUrl,
          apiKey: currentValues.apiKey,
          aiModel: currentValues.aiModel,
          temperature: currentValues.temperature,
          maxTokens: currentValues.maxTokens,
        };

        // 保存到本地状态和IndexedDB
        await saveProviderConfig(selectedProvider.id, configToSave);
        setProviderConfigs((prev) => ({
          ...prev,
          [selectedProvider.id]: configToSave,
        }));
      }
    }

    setSelectedProvider(provider);

    // 恢复或初始化该供应商的配置
    const savedConfig = providerConfigs[provider.id];
    const formValues = {
      apiUrl: provider.apiUrl,
      apiKey: savedConfig?.apiKey || "",
      aiModel: savedConfig?.aiModel || "",
      temperature: savedConfig?.temperature || 0.7,
      maxTokens: savedConfig?.maxTokens || 1000,
    };

    aiForm.setFieldsValue(formValues);
  };

  /**
   * 获取当前正在使用的供应商
   * 根据AI配置判断当前使用的供应商
   */
  const getCurrentProvider = (): AIProvider | undefined => {
    // 根据当前AI配置判断使用的是哪个供应商
    if (!aiConfig.apiUrl) return undefined;

    // 检查是否匹配预制供应商
    const matchedProvider = DEFAULT_AI_PROVIDERS.find((provider) =>
      aiConfig.apiUrl?.includes(
        provider.apiUrl.replace("https://", "").replace("/v1", "")
      )
    );

    if (matchedProvider) {
      return matchedProvider;
    }

    // 如果不匹配预制供应商，则为自定义配置
    return {
      id: "custom",
      name: "自定义配置",
      displayName: "自定义配置",
      logo: <SettingOutlined />,
      apiUrl: aiConfig.apiUrl,
      models: [],
      description: "手动配置API地址和模型",
    };
  };

  // 处理自定义配置选择（简化版本）
  const handleCustomSelect = async () => {
    // 保存当前供应商的配置（如果有的话）
    if (selectedProvider && selectedProvider.id !== "custom") {
      const currentValues = aiForm.getFieldsValue();
      if (currentValues.apiKey || currentValues.aiModel) {
        const configToSave = {
          apiUrl: currentValues.apiUrl,
          apiKey: currentValues.apiKey,
          aiModel: currentValues.aiModel,
          temperature: currentValues.temperature,
          maxTokens: currentValues.maxTokens,
        };

        await saveProviderConfig(selectedProvider.id, configToSave);
        setProviderConfigs((prev) => ({
          ...prev,
          [selectedProvider.id]: configToSave,
        }));
      }
    }

    // 设置自定义配置供应商
    const customProvider: AIProvider = {
      id: "custom",
      name: "自定义配置",
      displayName: "自定义配置",
      logo: <SettingOutlined />,
      apiUrl: "",
      models: [],
      description: "手动配置API地址和模型",
    };
    setSelectedProvider(customProvider);

    // 恢复或初始化自定义配置
    const savedConfig = providerConfigs["custom"];
    const formValues = {
      apiUrl: savedConfig?.apiUrl || "",
      apiKey: savedConfig?.apiKey || "",
      aiModel: savedConfig?.aiModel || "",
      temperature: savedConfig?.temperature || 0.7,
      maxTokens: savedConfig?.maxTokens || 1000,
    };

    aiForm.setFieldsValue(formValues);
  };

  // 处理AI模型选择
  const handleModelSelect = (modelName: string) => {
    // 自动填充模型名称
    aiForm.setFieldsValue({
      aiModel: modelName,
    });
  };

  // 处理模态框关闭
  const handleModalClose = async () => {
    // 保存当前供应商的配置
    if (selectedProvider) {
      const currentValues = aiForm.getFieldsValue();
      if (currentValues.apiKey || currentValues.aiModel) {
        const newConfig = {
          apiUrl: currentValues.apiUrl,
          apiKey: currentValues.apiKey,
          aiModel: currentValues.aiModel,
          temperature: currentValues.temperature,
          maxTokens: currentValues.maxTokens,
        };

        // 保存到IndexedDB
        await saveProviderConfig(selectedProvider.id, newConfig);

        // 更新本地状态
        setProviderConfigs((prev) => ({
          ...prev,
          [selectedProvider.id]: newConfig,
        }));
      }
    }

    // 重置供应商自动检测标记，下次打开时可以重新检测
    setIsProviderAutoDetected(false);
    onClose();
  };

  /**
   * 保存AI基础配置
   * 验证并保存AI配置信息
   */
  const handleSaveAIConfig = async () => {
    try {
      // 验证表单字段
      const values = await aiForm.validateFields();

      // 保留现有的systemPrompt，只更新基础AI配置
      const configToSave = {
        ...aiConfig,
        ...values,
        enableAI: true, // 自动启用AI功能
        systemPrompt: aiConfig.systemPrompt, // 保留现有的systemPrompt
      };

      // 使用 useAISettings Hook 进行保存 - Hook层会自动处理成功/失败消息
      const success = await saveAIConfig(configToSave);
      if (!success) {
        throw new Error("配置保存失败");
      }
    } catch (error) {
      console.error("保存AI配置失败:", error);

      let errorMessage = "保存AI配置失败";

      if (error instanceof Error) {
        if (error.message.includes("validation")) {
          errorMessage = "配置验证失败，请检查输入信息";
        } else if (error.message.includes("network")) {
          errorMessage = "网络错误，请稍后重试";
        } else {
          errorMessage = `保存失败：${error.message}`;
        }
      }

      message.error({
        content: errorMessage,
        duration: 5,
      });
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

      // 排除便签尺寸设置字段，这些字段由独立的表单处理
      const noteSettingsFields = [
        "manualNoteDefaultWidth",
        "manualNoteDefaultHeight",
        "aiNoteDefaultWidth",
        "aiNoteDefaultHeight",
      ];

      const filteredFields = { ...processedFields };
      noteSettingsFields.forEach((field) => {
        delete filteredFields[field];
      });

      // 实时保存外观设置（排除便签尺寸设置）
      setAppearance(filteredFields);
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

  // 便签设置状态管理
  const [noteSettingsChanged, setNoteSettingsChanged] = useState(false);
  const [tempNoteSettings, setTempNoteSettings] = useState({
    manualNoteDefaultWidth: appearance.manualNoteDefaultWidth,
    manualNoteDefaultHeight: appearance.manualNoteDefaultHeight,
    aiNoteDefaultWidth: appearance.aiNoteDefaultWidth,
    aiNoteDefaultHeight: appearance.aiNoteDefaultHeight,
  });

  // 处理便签设置变化
  const handleNoteSettingsChange = React.useCallback(
    (changedFields: Record<string, unknown>) => {
      const newSettings = { ...tempNoteSettings, ...changedFields };
      setTempNoteSettings(newSettings);

      // 检查是否有变化
      const hasChanges =
        newSettings.manualNoteDefaultWidth !==
          appearance.manualNoteDefaultWidth ||
        newSettings.manualNoteDefaultHeight !==
          appearance.manualNoteDefaultHeight ||
        newSettings.aiNoteDefaultWidth !== appearance.aiNoteDefaultWidth ||
        newSettings.aiNoteDefaultHeight !== appearance.aiNoteDefaultHeight;

      setNoteSettingsChanged(hasChanges);
    },
    [tempNoteSettings, appearance]
  );

  /**
   * 通用表单操作处理器
   * 统一处理表单保存和重置操作的错误处理
   */
  const createFormHandler = React.useCallback(
    (
      operation: () => void | Promise<void>,
      successMessage: string,
      errorMessage: string
    ) => {
      return async () => {
        try {
          await operation();
          message.success(successMessage);
        } catch (error) {
          console.error(`${errorMessage}:`, error);
          const finalErrorMessage =
            error instanceof Error
              ? `${errorMessage}：${error.message}`
              : errorMessage;
          message.error(finalErrorMessage);
        }
      };
    },
    []
  );

  /**
   * 保存便签设置
   */
  const handleSaveNoteSettings = React.useCallback(
    createFormHandler(
      () => {
        setAppearance(tempNoteSettings);
        setNoteSettingsChanged(false);
      },
      "便签设置已保存",
      "保存便签设置失败"
    ),
    [createFormHandler, tempNoteSettings, setAppearance]
  );

  /**
   * 重置便签设置
   */
  const handleResetNoteSettings = React.useCallback(
    createFormHandler(
      () => {
        resetNoteDefaultSizes();
        // 更新临时设置为默认值
        const defaultSettings = {
          manualNoteDefaultWidth: 350,
          manualNoteDefaultHeight: 310,
          aiNoteDefaultWidth: 400,
          aiNoteDefaultHeight: 350,
        };
        setTempNoteSettings(defaultSettings);
        setNoteSettingsChanged(false);
        // 同步表单值
        appearanceForm.setFieldsValue(defaultSettings);
      },
      "便签设置已重置为默认值",
      "重置便签设置失败"
    ),
    [createFormHandler, resetNoteDefaultSizes, appearanceForm]
  );

  // 同步便签设置表单值
  React.useEffect(() => {
    if (open) {
      const currentSettings = {
        manualNoteDefaultWidth: appearance.manualNoteDefaultWidth,
        manualNoteDefaultHeight: appearance.manualNoteDefaultHeight,
        aiNoteDefaultWidth: appearance.aiNoteDefaultWidth,
        aiNoteDefaultHeight: appearance.aiNoteDefaultHeight,
      };
      setTempNoteSettings(currentSettings);
      noteSettingsForm.setFieldsValue(currentSettings);
      setNoteSettingsChanged(false);
    }
  }, [open, appearance, noteSettingsForm]);

  // 思维模式设置状态管理
  const [thinkingModeForm] = Form.useForm();
  const [thinkingModeChanged, setThinkingModeChanged] = useState(false);
  const [tempThinkingMode, setTempThinkingMode] = useState({
    showThinkingMode: basicSettings.showThinkingMode,
  });

  // 处理思维模式设置变化
  const handleThinkingModeChange = React.useCallback(
    (changedFields: Record<string, unknown>) => {
      const newSettings = { ...tempThinkingMode, ...changedFields };
      setTempThinkingMode(newSettings);

      // 检查是否有变化
      const hasChanges =
        newSettings.showThinkingMode !== basicSettings.showThinkingMode;
      setThinkingModeChanged(hasChanges);
    },
    [tempThinkingMode, basicSettings]
  );

  /**
   * 保存思维模式设置
   */
  const handleSaveThinkingMode = React.useCallback(
    createFormHandler(
      () => {
        setBasicSettings(tempThinkingMode);
        setThinkingModeChanged(false);
      },
      "思维模式设置已保存",
      "保存思维模式设置失败"
    ),
    [createFormHandler, tempThinkingMode, setBasicSettings]
  );

  /**
   * 重置思维模式设置
   */
  const handleResetThinkingMode = React.useCallback(
    createFormHandler(
      () => {
        const defaultSettings = { showThinkingMode: false };
        setBasicSettings(defaultSettings);
        setTempThinkingMode(defaultSettings);
        setThinkingModeChanged(false);
        // 同步表单值
        thinkingModeForm.setFieldsValue(defaultSettings);
      },
      "思维模式设置已重置为默认值",
      "重置思维模式设置失败"
    ),
    [createFormHandler, setBasicSettings, thinkingModeForm]
  );

  // 同步思维模式设置表单值
  React.useEffect(() => {
    if (open) {
      const currentSettings = {
        showThinkingMode: basicSettings.showThinkingMode,
      };
      setTempThinkingMode(currentSettings);
      thinkingModeForm.setFieldsValue(currentSettings);
      setThinkingModeChanged(false);
    }
  }, [open, basicSettings, thinkingModeForm]);

  /**
   * 处理用户信息更新
   * 更新用户的基本信息（用户名、邮箱等）
   * @param values 表单提交的用户信息
   */
  const handleUserProfileUpdate = React.useCallback(
    async (values: { username: string; email?: string }) => {
      try {
        // 调用用户信息更新API
        await updateUserProfile({
          username: values.username,
          email: values.email,
        });
        message.success("用户信息更新成功");
      } catch (error) {
        console.error("更新用户信息失败:", error);
        const errorMessage =
          error instanceof Error
            ? `更新失败：${error.message}`
            : "更新用户信息失败，请稍后重试";
        message.error(errorMessage);
      }
    },
    [updateUserProfile]
  );

  /**
   * 动态生成标签页项目
   * 根据AI配置状态决定是否显示AI提示词标签页
   * 这是一个复杂的渲染逻辑，包含了所有设置页面的内容
   */
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
                <CardSectionTitle icon={<UserOutlined />}>
                  个人信息
                </CardSectionTitle>
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
                <CardSectionTitle icon={<BgColorsOutlined />}>
                  主题设置
                </CardSectionTitle>
                <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
                  {PRESET_THEMES.map((theme) => {
                    const isSelected =
                      appearance.canvasBackground ===
                      theme.colors.canvasBackground;

                    return (
                      <Col xs={12} sm={8} md={6} lg={4} key={theme.id}>
                        <Card
                          hoverable={true} // 启用悬停效果
                          size="small"
                          className={`provider-card ${
                            isSelected ? "provider-card-selected" : ""
                          }`}
                          style={STYLES.providerCard}
                          styles={{
                            body: STYLES.providerCardBody,
                          }}
                          onClick={() =>
                            handleApplyPresetTheme(theme.id, theme.name)
                          }
                        >
                          <div
                            style={{ fontSize: "20px", marginBottom: "4px" }}
                          >
                            {theme.icon}
                          </div>
                          <Text
                            strong
                            style={{
                              fontSize: "12px",
                              lineHeight: "1.2",
                              color: isSelected ? "#1890ff" : "#333",
                            }}
                          >
                            {theme.name}
                          </Text>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </Card>

              <Card size="small" style={{ marginBottom: 16 }}>
                <CardSectionTitle icon={<BgColorsOutlined />}>
                  画布设置
                </CardSectionTitle>
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

            {/* 便签默认尺寸设置 */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <CardSectionTitle icon={<SettingOutlined />}>
                便签默认尺寸
              </CardSectionTitle>

              <Form
                form={noteSettingsForm}
                layout="vertical"
                onValuesChange={handleNoteSettingsChange}
                initialValues={tempNoteSettings}
              >
                {/* 手动便签尺寸设置 */}
                <div style={{ marginBottom: 20 }}>
                  <Text strong style={{ display: "block", marginBottom: 8 }}>
                    手动便签默认尺寸
                  </Text>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="宽度 (px)"
                        name="manualNoteDefaultWidth"
                        style={{ marginBottom: 8 }}
                      >
                        <InputNumber
                          min={350}
                          max={500}
                          step={10}
                          style={{ width: "100%" }}
                          placeholder="350"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="高度 (px)"
                        name="manualNoteDefaultHeight"
                        style={{ marginBottom: 8 }}
                      >
                        <InputNumber
                          min={310}
                          max={500}
                          step={10}
                          style={{ width: "100%" }}
                          placeholder="310"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                {/* AI便签尺寸设置 */}
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: "block", marginBottom: 8 }}>
                    AI便签默认尺寸
                  </Text>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="宽度 (px)"
                        name="aiNoteDefaultWidth"
                        style={{ marginBottom: 8 }}
                      >
                        <InputNumber
                          min={350}
                          max={500}
                          step={10}
                          style={{ width: "100%" }}
                          placeholder="350"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="高度 (px)"
                        name="aiNoteDefaultHeight"
                        style={{ marginBottom: 8 }}
                      >
                        <InputNumber
                          min={310}
                          max={500}
                          step={10}
                          style={{ width: "100%" }}
                          placeholder="310"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </Form>

              <Text type="secondary" style={{ fontSize: "12px" }}>
                <BulbOutlined style={{ marginRight: 4 }} />
                设置新建便签时的默认尺寸，可以根据使用习惯调整
              </Text>

              {/* 设置变更状态提示 */}
              {noteSettingsChanged && (
                <div style={STYLES.changeNotification}>
                  <Text style={{ fontSize: "12px", color: "#d46b08" }}>
                    <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                    设置已修改，请点击"保存设置"按钮保存更改
                  </Text>
                </div>
              )}

              {/* 便签设置操作按钮 */}
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                }}
              >
                <Button onClick={handleResetNoteSettings} size="small">
                  重置默认值
                </Button>
                <Button
                  type="primary"
                  onClick={handleSaveNoteSettings}
                  disabled={!noteSettingsChanged}
                  size="small"
                >
                  保存设置
                </Button>
              </div>
            </Card>
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
                <CardSectionTitle icon={<HddOutlined />}>
                  数据统计
                </CardSectionTitle>
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
                <CardSectionTitle icon={<DatabaseOutlined />}>
                  数据操作
                </CardSectionTitle>
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
                    block
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
                    style={{ width: "100%" }}
                  >
                    <Button
                      icon={<UploadOutlined />}
                      loading={importLoading}
                      block
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
                    <Button danger icon={<DeleteOutlined />} block>
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
        key: "basic",
        label: (
          <span>
            <SettingOutlined />
            基础设置
          </span>
        ),
        children: (
          <div className="settings-modal-content">
            {/* 思维模式设置 */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <CardSectionTitle icon={<RobotOutlined />} iconType="success">
                思维模式设置
              </CardSectionTitle>

              <Form
                form={thinkingModeForm}
                layout="vertical"
                onValuesChange={handleThinkingModeChange}
                initialValues={tempThinkingMode}
              >
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <Text strong>显示思维模式</Text>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginTop: 2,
                        }}
                      >
                        开启后，AI生成便签时会显示思考过程
                      </div>
                    </div>
                    <Form.Item
                      name="showThinkingMode"
                      valuePropName="checked"
                      style={{ margin: 0 }}
                    >
                      <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                    </Form.Item>
                  </div>
                </div>
              </Form>

              <Text type="secondary" style={{ fontSize: "12px" }}>
                <BulbOutlined style={{ marginRight: 4 }} />
                控制AI生成便签时是否显示思考过程，帮助您了解AI的推理逻辑
              </Text>

              {/* 设置变更状态提示 */}
              {thinkingModeChanged && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 8,
                    backgroundColor: "#fff7e6",
                    border: "1px solid #ffd591",
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ fontSize: "12px", color: "#d46b08" }}>
                    <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                    设置已修改，请点击"保存设置"按钮保存更改
                  </Text>
                </div>
              )}

              {/* 思维模式设置操作按钮 */}
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                }}
              >
                <Button onClick={handleResetThinkingMode} size="small">
                  重置默认值
                </Button>
                <Button
                  type="primary"
                  onClick={handleSaveThinkingMode}
                  disabled={!thinkingModeChanged}
                  size="small"
                >
                  保存设置
                </Button>
              </div>
            </Card>
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
              {/* 当前使用的AI供应商显示 - 移动到顶部 */}
              {getCurrentProvider() && (
                <Card
                  size="small"
                  style={{
                    marginBottom: 16,
                    background:
                      "linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)",
                    border: "1px solid #1890ff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Tag
                        color="blue"
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          marginRight: "12px",
                          borderRadius: "12px",
                        }}
                      >
                        当前使用
                      </Tag>
                      <div>
                        <Text strong style={{ color: "#1890ff" }}>
                          {getCurrentProvider()?.displayName ||
                            getCurrentProvider()?.name}
                        </Text>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#666",
                            marginTop: "2px",
                          }}
                        >
                          模型: {aiConfig.aiModel}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* 错误提示 */}
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
                form={aiForm}
                layout="vertical"
                onFinish={handleSaveAIConfig}
                preserve={true}
              >
                {/* AI供应商选择卡片 */}
                <Card size="small" style={{ marginBottom: 16 }}>
                  <CardSectionTitle icon={<RobotOutlined />} iconType="success">
                    AI供应商
                  </CardSectionTitle>

                  {/* AI供应商选择区域 - 使用网格布局展示所有可用的AI供应商 */}
                  <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
                    {DEFAULT_AI_PROVIDERS.map((provider) => {
                      // 检查当前供应商是否被选中
                      const isSelected = selectedProvider?.id === provider.id;

                      return (
                        <Col xs={12} sm={8} md={6} lg={4} key={provider.id}>
                          <Card
                            hoverable={true} // 启用悬停效果，提升用户体验
                            size="small"
                            className={`provider-card ${
                              isSelected ? "provider-card-selected" : ""
                            }`}
                            style={STYLES.providerCard}
                            styles={{
                              body: STYLES.providerCardBody,
                            }}
                            onClick={() => handleProviderSelect(provider)}
                          >
                            <div
                              style={{ fontSize: "20px", marginBottom: "4px" }}
                            >
                              {provider.logo}
                            </div>
                            <Text
                              strong
                              style={{
                                fontSize: "12px",
                                lineHeight: "1.2",
                                color: isSelected ? "#1890ff" : "#333",
                              }}
                            >
                              {provider.displayName}
                            </Text>
                            {/* 配置状态指示器 - 显示供应商是否已完成配置 */}
                            {providerConfigs[provider.id]?.apiKey &&
                              providerConfigs[provider.id]?.aiModel && (
                                <Tooltip
                                  title={`${provider.displayName} 已配置完成`}
                                  placement="top"
                                >
                                  {/* 蓝色圆点表示该供应商已配置完成 */}
                                  <div style={STYLES.configIndicator} />
                                </Tooltip>
                              )}
                          </Card>
                        </Col>
                      );
                    })}
                    {/* 自定义配置选项 - 允许用户配置其他AI服务商 */}
                    <Col xs={12} sm={8} md={6} lg={4}>
                      <Card
                        hoverable={true} // 启用悬停效果
                        size="small"
                        className={`provider-card ${
                          selectedProvider?.id === "custom"
                            ? "provider-card-selected"
                            : ""
                        }`}
                        style={STYLES.providerCard}
                        styles={{
                          body: STYLES.providerCardBody,
                        }}
                        onClick={handleCustomSelect}
                      >
                        <div style={{ fontSize: "20px", marginBottom: "4px" }}>
                          <SettingOutlined />
                        </div>
                        <Text
                          strong
                          style={{
                            fontSize: "12px",
                            lineHeight: "1.2",
                            color:
                              selectedProvider?.id === "custom"
                                ? "#1890ff"
                                : "#333",
                          }}
                        >
                          自定义
                        </Text>
                        {/* 自定义配置状态指示器 */}
                        {providerConfigs["custom"]?.apiKey &&
                          providerConfigs["custom"]?.aiModel && (
                            <Tooltip
                              title="自定义配置 已配置完成"
                              placement="top"
                            >
                              {/* 显示自定义配置已完成的状态指示器 */}
                              <div style={STYLES.configIndicator} />
                            </Tooltip>
                          )}
                      </Card>
                    </Col>
                  </Row>
                </Card>

                {/* AI配置详情卡片 - 显示具体的配置选项 */}
                <Card size="small" style={{ marginBottom: 16 }}>
                  <CardSectionTitle icon={<SettingOutlined />}>
                    配置详情
                  </CardSectionTitle>

                  {/* AI模型选择区域 - 根据选择的供应商显示不同的输入方式 */}
                  <Form.Item
                    label="AI模型"
                    name="aiModel"
                    extra={
                      selectedProvider?.id === "custom"
                        ? "请输入要使用的AI模型名称"
                        : selectedProvider
                        ? "选择预设模型或手动输入模型名称"
                        : "请先选择AI供应商"
                    }
                    rules={[{ required: true, message: "请输入AI模型名称" }]}
                  >
                    {selectedProvider?.id === "custom" ? (
                      // 自定义配置：只显示输入框
                      <Input
                        placeholder="例如：gpt-4, claude-3-sonnet, deepseek-chat" // DeepSeek聊天模型示例
                        style={{ width: "100%" }}
                      />
                    ) : selectedProvider ? (
                      // 默认供应商：使用AutoComplete支持选择和输入
                      <AutoComplete
                        placeholder="选择预设模型或输入自定义模型名称"
                        style={{ width: "100%" }}
                        onChange={(value) => {
                          if (value) {
                            handleModelSelect(value);
                          }
                        }}
                        onSelect={(value) => {
                          handleModelSelect(value);
                        }}
                        filterOption={(inputValue, option) =>
                          option?.value
                            ?.toString()
                            .toUpperCase()
                            .indexOf(inputValue.toUpperCase()) !== -1
                        }
                        options={selectedProvider?.models?.map(
                          (model: any) => ({
                            value: model.name,
                            label: (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <div>
                                  <Text strong>{model.displayName}</Text>
                                  <Text
                                    type="secondary"
                                    style={{
                                      fontSize: "11px",
                                      marginLeft: "8px",
                                    }}
                                  >
                                    推荐
                                  </Text>
                                </div>
                                <Text
                                  type="secondary"
                                  style={{ fontSize: "10px" }}
                                >
                                  {model.name}
                                </Text>
                              </div>
                            ),
                          })
                        )}
                      />
                    ) : (
                      // 未选择供应商：禁用状态
                      <Input
                        placeholder="请先选择AI供应商"
                        disabled
                        style={{ width: "100%" }}
                      />
                    )}
                  </Form.Item>

                  {/* API密钥输入 */}
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
                    />
                  </Form.Item>

                  {/* API地址配置 */}
                  <Form.Item
                    label="API地址"
                    name="apiUrl"
                    extra={
                      selectedProvider?.id === "custom"
                        ? "请输入自定义API基础地址"
                        : "当前选择供应商的API地址"
                    }
                    rules={[
                      { required: true, message: "请输入API地址" },
                      { type: "url", message: "请输入有效的URL地址" },
                    ]}
                  >
                    <Input
                      placeholder={
                        selectedProvider?.id === "custom"
                          ? "https://api.example.com/v1"
                          : "API地址将自动填充"
                      }
                      disabled={selectedProvider?.id !== "custom"}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Card>

                <Card size="small" style={{ marginBottom: 16 }}>
                  <CardSectionTitle icon={<SettingOutlined />}>
                    高级设置
                  </CardSectionTitle>

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
                      type="default"
                      onClick={handleTestConnection}
                      loading={testingConnection}
                      disabled={testingConnection}
                    >
                      测试连接
                    </Button>
                    <Button
                      type="primary"
                      onClick={handleSaveAIConfig}
                      disabled={testingConnection}
                      loading={aiLoading}
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
        key: "notes",
        label: (
          <span>
            <FileTextOutlined />
            便签设置
          </span>
        ),
        children: (
          <NoteSettings
            form={noteSettingsForm}
            onValuesChange={handleNoteSettingsChange}
            initialValues={tempNoteSettings}
            hasChanges={noteSettingsChanged}
            onSave={handleSaveNoteSettings}
            onReset={handleResetNoteSettings}
          />
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

                {/* 当前使用的AI提示词模板 */}
                {getCurrentPromptTemplate() && (
                  <Card
                    size="small"
                    style={{
                      marginBottom: 16,
                      background:
                        "linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)",
                      border: "1px solid #1890ff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <Tag
                        color="blue"
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          borderRadius: "12px",
                        }}
                      >
                        当前使用
                      </Tag>
                      <div>
                        <Text strong style={{ color: "#1890ff" }}>
                          {getCurrentPromptTemplate()?.name}
                        </Text>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#666",
                            marginTop: "2px",
                          }}
                        >
                          {getCurrentPromptTemplate()?.id === "custom"
                            ? `自定义提示词: ${getCurrentPromptTemplate()?.prompt?.slice(
                                0,
                                50
                              )}...`
                            : getCurrentPromptTemplate()?.description}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* AI提示词模板选择器 */}
                <Card size="small" style={{ marginBottom: 16 }}>
                  <CardSectionTitle icon={<TeamOutlined />} iconType="purple">
                    选择AI角色模板
                  </CardSectionTitle>
                  <AIPromptTemplateSelector
                    selectedTemplate={selectedTemplate || undefined}
                    onTemplateSelect={handleTemplateSelect}
                    disabled={promptLoading || testingConnection}
                  />
                </Card>

                <Form
                  form={promptForm}
                  layout="vertical"
                  onFinish={handleSavePromptConfig}
                  preserve={true}
                >
                  <Card size="small" style={{ marginBottom: 16 }}>
                    <CardSectionTitle icon={<EditOutlined />}>
                      AI角色设定
                    </CardSectionTitle>

                    <Form.Item
                      label="AI角色设定"
                      name="systemPrompt"
                      extra="选择上方的角色模板，或直接编辑提示词内容"
                    >
                      <Input.TextArea
                        rows={6}
                        placeholder="选择上方的角色模板，或直接输入自定义提示词..."
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
                        disabled={promptLoading || testingConnection}
                      >
                        保存设置
                      </Button>
                      <Button
                        onClick={handleResetPromptToDefault}
                        disabled={promptLoading || testingConnection}
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
              <CardSectionTitle icon={<BulbOutlined />} iconType="warning">
                无限便签
              </CardSectionTitle>
              <p>
                <strong>无限便签</strong>{" "}
                是一款创新的无限画布便签应用，支持AI智能汇总、连接线可视化和溯源追踪，让您自由组织思路和灵感。
              </p>
              <p>版本: RC1.0.0</p>
              <Divider />
              <p>
                <strong>核心功能:</strong>
              </p>
              <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                <li>
                  <BgColorsOutlined
                    style={{ marginRight: 8, color: "#1890ff" }}
                  />
                  无限画布 - 自由创作空间
                </li>
                <li>
                  <RobotOutlined style={{ marginRight: 8, color: "#52c41a" }} />
                  AI智能汇总 - 自动整理要点
                </li>
                <li>
                  <DatabaseOutlined
                    style={{ marginRight: 8, color: "#722ed1" }}
                  />
                  可视化连接 - 构建知识网络
                </li>
                <li>
                  <FileTextOutlined
                    style={{ marginRight: 8, color: "#fa8c16" }}
                  />
                  溯源追踪 - 了解想法演化
                </li>
                <li>
                  <SafetyOutlined
                    style={{ marginRight: 8, color: "#13c2c2" }}
                  />
                  本地存储 - 保护隐私安全
                </li>
              </ul>
              <Divider />
              <Space direction="vertical" style={{ width: "100%" }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => window.open("./landing.html", "_blank")}
                  block
                  icon={<GlobalOutlined />}
                >
                  访问官网了解更多
                </Button>
                <Button
                  type="default"
                  onClick={() => window.open("./app.html", "_blank")}
                  block
                  icon={<GlobalOutlined />}
                >
                  在新窗口打开应用
                </Button>
              </Space>

              <Divider />
              <div style={{ marginBottom: 16 }}>
                <CardSectionTitle icon={<BookOutlined />}>
                  使用教程
                </CardSectionTitle>
                <p
                  style={{ marginBottom: 12, color: "#666", fontSize: "14px" }}
                >
                  详细的使用教程和功能介绍，帮助您快速掌握无限便签的所有功能
                </p>
                <Button
                  type="primary"
                  onClick={() =>
                    window.open("https://kdocs.cn/l/cj6sWRtZJqcl", "_blank")
                  }
                  block
                  icon={<BookOutlined />}
                  style={{ marginBottom: 8 }}
                >
                  查看完整使用教程
                </Button>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  💡 包含基础操作、AI功能、高级技巧等详细说明
                </Text>
              </div>

              <div style={{ marginBottom: 16 }}>
                <CardSectionTitle icon={<MessageOutlined />} iconType="success">
                  问题反馈
                </CardSectionTitle>
                <p
                  style={{ marginBottom: 12, color: "#666", fontSize: "14px" }}
                >
                  遇到问题或有建议？我们很乐意听到您的反馈
                </p>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Button
                    onClick={() =>
                      window.open(
                        "https://www.kdocs.cn/wo/sl/v128c55q",
                        "_blank"
                      )
                    }
                    block
                  >
                    问卷反馈
                  </Button>
                </Space>
                <Text
                  type="secondary"
                  style={{ fontSize: "12px", marginTop: 8, display: "block" }}
                >
                  🚀 您的反馈将帮助我们不断改进产品体验
                </Text>
              </div>
              <Divider />
              <p>
                <strong>开发者:</strong> duobao {/* 开发者姓名 */}
              </p>
              <p>
                <strong> 邮箱:</strong> 2385561331@qq.com
              </p>
              <p>
                <strong> 小红书号:</strong> 7429489345
              </p>
              <p>
                <strong>数据存储:</strong> 本地 IndexedDB（保护隐私）
              </p>
              <Divider />
              <p style={{ textAlign: "center", color: "#666" }}>
                © 2025 无限便签. 专注于思维整理的便签工具.
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
      onCancel={handleModalClose}
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
