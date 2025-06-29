// AI状态管理Store
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { IndexedDBAISettingsStorage as AISettingsStorage } from "../database/IndexedDBAISettingsStorage";
import type { AIConfig } from "../services/ai/aiService";
import { defaultAIConfig, getAIService } from "../services/ai/aiService";
import { AIConfigValidator } from "../utils/aiValidation";

// AI状态接口
export interface AIState {
  // AI配置
  config: AIConfig;

  // 状态管理
  loading: boolean;
  error: string | null;

  // AI生成状态
  isGenerating: boolean;
  generationProgress: number; // 0-100

  // 连接状态
  isConnected: boolean;
  lastTestTime: Date | null;

  // 配置验证
  hasValidConfig: boolean;
}

// AI操作接口
export interface AIActions {
  // 配置管理
  saveConfig: (config: AIConfig, saveToDatabase?: boolean) => Promise<boolean>;
  loadConfig: () => Promise<void>;
  clearConfig: () => Promise<void>;

  // 连接测试
  testConnection: () => Promise<{ success: boolean; error?: string }>;

  // AI生成控制
  startGeneration: () => void;
  updateGenerationProgress: (progress: number) => void;
  finishGeneration: () => void;
  cancelGeneration: () => void;

  // 状态管理
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 初始化
  initialize: () => Promise<void>;

  // 获取完整配置（为了向后兼容）
  getFullConfig: () => AIConfig;
}

// 创建AI Store
export const useAIStore = create<AIState & AIActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // 初始状态
      config: defaultAIConfig,
      loading: false,
      error: null,
      isGenerating: false,
      generationProgress: 0,
      isConnected: false,
      lastTestTime: null,
      hasValidConfig: false,

      // 配置管理
      saveConfig: async (newConfig, saveToDatabase = true) => {
        try {
          set({ loading: true, error: null });

          console.log("🏪 AIStore: 开始保存配置", {
            saveToDatabase,
            config: { ...newConfig, apiKey: newConfig.apiKey ? "******" : "" },
          });

          // 验证配置
          const validation = AIConfigValidator.validateConfig(newConfig);
          if (!validation.isValid) {
            const errorMsg = validation.errors.join(", ");
            console.error("🏪 AIStore: 配置验证失败", validation.errors);
            set({ error: errorMsg, loading: false });
            return false;
          }

          // 只有在需要时才保存到数据库
          if (saveToDatabase) {
            console.log("🏪 AIStore: 保存配置到数据库");
            await AISettingsStorage.saveConfig(newConfig);
          } else {
            console.log("🏪 AIStore: 跳过数据库保存，仅更新状态");
          }

          // 更新状态
          const hasValidConfig = !!(
            newConfig.apiKey &&
            newConfig.apiUrl &&
            newConfig.aiModel
          );
          set({
            config: newConfig,
            hasValidConfig,
            loading: false,
          });

          // 更新AI服务配置
          if (hasValidConfig) {
            getAIService(newConfig);
            console.log("🏪 AIStore: AI服务配置已更新");
          }

          // 🔧 关键修复：通知其他Hook配置已更新（仅在实际保存到数据库时触发）
          if (saveToDatabase) {
            window.dispatchEvent(
              new CustomEvent("ai-config-updated", {
                detail: { config: newConfig, source: "ai-store-config" },
              })
            );
          }

          console.log("🏪 AIStore: 配置保存完成");
          return true;
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "保存配置失败";
          console.error("🏪 AIStore: 保存配置失败", error);
          set({ error: errorMsg, loading: false });
          return false;
        }
      },

      loadConfig: async () => {
        try {
          set({ loading: true, error: null });

          const loadedConfig = await AISettingsStorage.loadConfig();
          const hasValidConfig = !!(
            loadedConfig.apiKey &&
            loadedConfig.apiUrl &&
            loadedConfig.aiModel
          );

          set({
            config: loadedConfig,
            hasValidConfig,
            loading: false,
          });

          // 更新AI服务配置
          if (hasValidConfig) {
            getAIService(loadedConfig);
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "加载配置失败";
          set({ error: errorMsg, loading: false });
        }
      },

      clearConfig: async () => {
        try {
          set({ loading: true, error: null });

          await AISettingsStorage.clearConfig();

          set({
            config: defaultAIConfig,
            hasValidConfig: false,
            isConnected: false,
            lastTestTime: null,
            loading: false,
          });

          // 重置AI服务
          getAIService(defaultAIConfig);
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "清除配置失败";
          set({ error: errorMsg, loading: false });
        }
      },

      // 连接测试
      testConnection: async () => {
        try {
          set({ loading: true, error: null });

          const config = get().config;

          // 检查配置完整性
          if (!config.apiKey || !config.apiUrl || !config.aiModel) {
            throw new Error("AI配置不完整");
          }

          // 获取AI服务并测试连接
          const aiService = getAIService(config);
          const testResult = await aiService.testConnection();

          set({
            isConnected: testResult.success,
            lastTestTime: new Date(),
            loading: false,
            error: testResult.success
              ? null
              : testResult.error || "连接测试失败",
          });

          return testResult;
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "连接测试失败";
          set({
            isConnected: false,
            lastTestTime: new Date(),
            error: errorMsg,
            loading: false,
          });
          return { success: false, error: errorMsg };
        }
      },

      // AI生成控制
      startGeneration: () => {
        set({
          isGenerating: true,
          generationProgress: 0,
          error: null,
        });
      },

      updateGenerationProgress: (progress) => {
        set({ generationProgress: Math.max(0, Math.min(100, progress)) });
      },

      finishGeneration: () => {
        set({
          isGenerating: false,
          generationProgress: 100,
        });

        // 延迟重置进度
        setTimeout(() => {
          set({ generationProgress: 0 });
        }, 1000);
      },

      cancelGeneration: () => {
        set({
          isGenerating: false,
          generationProgress: 0,
          error: "AI生成已取消",
        });
      },

      // 状态管理
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // 初始化
      initialize: async () => {
        try {
          // 加载AI配置
          await get().loadConfig();

          console.log("AI Store 初始化完成");
        } catch (error) {
          console.error("AI Store 初始化失败:", error);
          set({ error: "初始化失败" });
        }
      },

      // 获取完整配置（为了向后兼容）
      getFullConfig: () => {
        return get().config;
      },
    })),
    {
      name: "ai-store", // DevTools中的名称
    }
  )
);
