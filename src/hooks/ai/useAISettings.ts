// AI设置管理Hook
import { useState, useEffect, useCallback } from "react";
import type { AIConfig } from "../../services/ai/aiService";
import { defaultAIConfig, getAIService } from "../../services/ai/aiService";
// 从 IndexedDB 导入新的 AI 设置存储服务
import { IndexedDBAISettingsStorage as AISettingsStorage } from "../../database/IndexedDBAISettingsStorage";

export interface UseAISettingsReturn {
  config: AIConfig;
  loading: boolean;
  error: string | null;
  saveConfig: (newConfig: AIConfig) => Promise<boolean>;
  loadConfig: () => Promise<void>;
  testConnection: () => Promise<{ success: boolean; error?: string }>;
  hasValidConfig: boolean;
  clearConfig: () => Promise<void>;
}

export const useAISettings = (): UseAISettingsReturn => {
  const [config, setConfig] = useState<AIConfig>(defaultAIConfig);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 计算是否有有效配置（只检查必要的配置项，不依赖enableAI）
  const hasValidConfig = Boolean(
    config.apiKey && config.apiUrl && config.aiModel
  );

  // 加载配置
  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    console.log("🔧 useAISettings: 开始加载AI配置");

    try {
      const loadedConfig = await AISettingsStorage.loadConfig();
      console.log("🔧 useAISettings: 配置加载成功", loadedConfig);

      setConfig(loadedConfig);
      // 新增：确保加载后也更新 AIService
      // 只要配置有效就更新服务，不依赖enableAI字段（enableAI只是UI控制）
      if (
        loadedConfig.apiKey &&
        loadedConfig.apiUrl &&
        loadedConfig.aiModel
      ) {
        console.log("🔧 useAISettings: 使用有效配置更新AI服务");
        getAIService(loadedConfig);
      } else {
        console.log("🔧 useAISettings: 配置无效，使用默认配置");
        // 如果加载的配置不完整，确保服务使用默认/空配置
        getAIService(defaultAIConfig);
      }
    } catch (err) {
      console.error("🔧 useAISettings: 加载配置失败", err);
      setError(err instanceof Error ? err.message : "加载配置失败");
      // 即使加载失败，也尝试用默认配置更新一次服务，以防服务持有无效配置
      getAIService(defaultAIConfig);
    } finally {
      setLoading(false);
    }
  }, []);

  // 保存配置
  const saveConfig = useCallback(
    async (newConfig: AIConfig): Promise<boolean> => {
      setLoading(true);
      setError(null);

      console.log("🔧 useAISettings: 开始保存AI配置", newConfig);

      try {
        // 验证配置
        const validation = AISettingsStorage.validateConfig(newConfig);
        if (!validation.isValid) {
          console.error("🔧 useAISettings: 配置验证失败", validation.errors);
          setError(validation.errors.join(", "));
          return false;
        }

        console.log("🔧 useAISettings: 配置验证通过，准备保存");

        // 保存配置
        await AISettingsStorage.saveConfig(newConfig);
        console.log("🔧 useAISettings: 配置保存成功，更新状态");

        setConfig(newConfig);

        // 更新AI服务配置（只要配置有效就更新，不依赖enableAI字段）
        if (newConfig.apiKey && newConfig.apiUrl && newConfig.aiModel) {
          getAIService(newConfig);
        }

        console.log("🔧 useAISettings: AI配置保存完成");
        return true;
      } catch (err) {
        console.error("🔧 useAISettings: 保存配置失败", err);
        setError(err instanceof Error ? err.message : "保存配置失败");
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 测试连接
  const testConnection = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    // 测试连接只检查必要的配置项，不检查enableAI
    if (!config.apiKey || !config.apiUrl || !config.aiModel) {
      return { success: false, error: "配置信息不完整" };
    }

    setLoading(true);
    setError(null);

    try {
      const aiService = getAIService(config);
      const result = await aiService.testConnection();

      if (!result.success && result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "连接测试失败";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [config, hasValidConfig]);

  // 清除配置
  const clearConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await AISettingsStorage.clearConfig();
      setConfig(defaultAIConfig);
      // 确保在清除配置后也更新 AIService
      getAIService(defaultAIConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : "清除配置失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // 组件挂载时加载配置
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    config,
    loading,
    error,
    saveConfig,
    loadConfig,
    testConnection,
    hasValidConfig,
    clearConfig,
  };
};
