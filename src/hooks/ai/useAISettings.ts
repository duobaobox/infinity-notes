// AI设置管理Hook
import { useCallback, useEffect, useState } from "react";
import { IndexedDBAISettingsStorage as AISettingsStorage } from "../../database/IndexedDBAISettingsStorage";
import type { AIConfig } from "../../services/ai/aiService";
import { defaultAIConfig, getAIService } from "../../services/ai/aiService";
import type { UseAISettingsReturn } from "../../types/ai";
import { aiConfigManager, AIConfigManager } from "../../utils/aiConfigManager";

export const useAISettings = (): UseAISettingsReturn => {
  const [config, setConfig] = useState<AIConfig>(defaultAIConfig);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 计算是否有有效配置（使用统一的验证逻辑）
  const hasValidConfig = AIConfigManager.isValidConfig(config);

  // 更新配置和服务的工具函数
  const updateConfigAndService = useCallback((newConfig: AIConfig) => {
    setConfig(newConfig);
    if (newConfig.apiKey && newConfig.apiUrl && newConfig.aiModel) {
      console.log("🔧 useAISettings: 使用新配置更新AI服务");
      getAIService(newConfig);
    } else {
      console.log("🔧 useAISettings: 配置无效，使用默认配置");
      getAIService(defaultAIConfig);
    }
  }, []);

  // 加载配置
  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    console.log("🔧 useAISettings: 开始加载AI配置");

    try {
      const loadedConfig = await AISettingsStorage.loadConfig();
      console.log("🔧 useAISettings: 配置加载成功", loadedConfig);
      updateConfigAndService(loadedConfig);
    } catch (err) {
      console.error("🔧 useAISettings: 加载配置失败", err);
      setError(err instanceof Error ? err.message : "加载配置失败");
      getAIService(defaultAIConfig);
    } finally {
      setLoading(false);
    }
  }, [updateConfigAndService]);

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

        // 立即更新配置和服务
        updateConfigAndService(newConfig);

        // 🔧 优化：使用统一的配置管理器通知更新
        aiConfigManager.notifyConfigUpdate(newConfig, "ai-settings");

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
    [updateConfigAndService]
  );

  // 测试连接
  const testConnection = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
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
  }, [config]);

  // 清除配置
  const clearConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await AISettingsStorage.clearConfig();
      updateConfigAndService(defaultAIConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : "清除配置失败");
    } finally {
      setLoading(false);
    }
  }, [updateConfigAndService]);

  // 组件挂载时加载配置
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // 🔧 关键修复：监听其他组件的配置更新事件
  useEffect(() => {
    const handleConfigUpdate = (event: CustomEvent) => {
      const { config: updatedConfig, source } = event.detail;
      console.log("🔧 useAISettings: 收到配置更新事件", {
        source,
        updatedConfig,
      });

      // 更新本地配置状态，确保hasValidConfig能正确反映最新状态
      updateConfigAndService(updatedConfig);
    };

    // 监听配置更新事件
    window.addEventListener(
      "ai-config-updated",
      handleConfigUpdate as EventListener
    );

    // 清理事件监听器
    return () => {
      window.removeEventListener(
        "ai-config-updated",
        handleConfigUpdate as EventListener
      );
    };
  }, [updateConfigAndService]);

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
