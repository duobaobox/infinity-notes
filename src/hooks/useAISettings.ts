// AI设置管理Hook
import { useState, useEffect, useCallback } from "react";
import type { AIConfig } from "../services/aiService";
import { defaultAIConfig, getAIService } from "../services/aiService";
import { AISettingsStorage } from "../services/aiSettingsStorage";

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

  // 计算是否有有效配置
  const hasValidConfig = Boolean(
    config.enableAI && config.apiKey && config.apiUrl && config.aiModel
  );

  // 加载配置
  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const loadedConfig = await AISettingsStorage.loadConfig();
      setConfig(loadedConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载配置失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // 保存配置
  const saveConfig = useCallback(
    async (newConfig: AIConfig): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        // 验证配置
        const validation = AISettingsStorage.validateConfig(newConfig);
        if (!validation.isValid) {
          setError(validation.errors.join(", "));
          return false;
        }

        // 保存配置
        await AISettingsStorage.saveConfig(newConfig);
        setConfig(newConfig);

        // 更新AI服务配置
        if (newConfig.enableAI) {
          getAIService(newConfig);
        }

        return true;
      } catch (err) {
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
    if (!hasValidConfig) {
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
