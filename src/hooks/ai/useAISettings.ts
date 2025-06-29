// AI设置管理Hook - 优化版本
import { useCallback, useEffect, useState } from "react";
import { IndexedDBAISettingsStorage as AISettingsStorage } from "../../database/IndexedDBAISettingsStorage";
import type { AIConfig } from "../../services/ai/aiService";
import { defaultAIConfig, getAIService } from "../../services/ai/aiService";
import type { UseAISettingsReturn } from "../../types/ai";
import { AIConfigManager } from "../../utils/aiConfigManager";
import { handleAIError, showAISuccess } from "../../utils/aiErrorHandler";

/**
 * AI设置管理Hook
 * 提供AI配置的加载、保存、验证等功能
 */
export const useAISettings = (): UseAISettingsReturn => {
  const [config, setConfig] = useState<AIConfig>(defaultAIConfig);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 计算是否有有效配置
  const hasValidConfig = AIConfigManager.isValidConfig(config);

  // 更新配置和服务的工具函数
  const updateConfigAndService = useCallback((newConfig: AIConfig) => {
    setConfig(newConfig);
    // 只在配置有效时更新AI服务
    if (AIConfigManager.isValidConfig(newConfig)) {
      getAIService(newConfig);
    }
  }, []);

  // 加载配置
  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const loadedConfig = await AISettingsStorage.loadConfig();
      updateConfigAndService(loadedConfig);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "加载配置失败";
      setError(errorMessage);
      // 加载失败时使用默认配置
      updateConfigAndService(defaultAIConfig);
    } finally {
      setLoading(false);
    }
  }, [updateConfigAndService]);

  // 保存配置
  const saveConfig = useCallback(
    async (newConfig: AIConfig): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        // 验证配置
        const validation = AISettingsStorage.validateConfig(newConfig);
        if (!validation.isValid) {
          const errorMessage = validation.errors.join(", ");
          setError(errorMessage);
          handleAIError(new Error(errorMessage), "配置验证");
          return false;
        }

        // 保存配置到数据库
        await AISettingsStorage.saveConfig(newConfig);

        // 立即更新本地状态和AI服务
        updateConfigAndService(newConfig);

        // 通知其他组件配置已更新
        AIConfigManager.getInstance().notifyConfigUpdate(
          newConfig,
          "ai-settings"
        );

        // 显示成功消息
        showAISuccess("AI配置保存成功！现在可以使用AI功能了");

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "保存配置失败";
        setError(errorMessage);
        handleAIError(err, "保存AI配置");
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
      const error = "配置信息不完整，请先完善AI配置";
      handleAIError(new Error(error), "连接测试");
      return { success: false, error };
    }

    setLoading(true);
    setError(null);

    try {
      const aiService = getAIService(config);
      const result = await aiService.testConnection();

      if (result.success) {
        showAISuccess("连接测试成功！AI服务可以正常使用");
      } else {
        const errorMessage = result.error || "连接测试失败";
        setError(errorMessage);
        handleAIError(new Error(errorMessage), "连接测试");
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "连接测试失败";
      setError(errorMessage);
      handleAIError(err, "连接测试");
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

      // 重置为默认配置
      updateConfigAndService(defaultAIConfig);

      // 通知其他组件配置已清除
      AIConfigManager.getInstance().notifyConfigUpdate(
        defaultAIConfig,
        "ai-settings"
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "清除配置失败";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [updateConfigAndService]);

  // 组件挂载时加载配置
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // 监听配置更新事件（简化版本）
  useEffect(() => {
    const unsubscribe = AIConfigManager.getInstance().subscribe(
      (updatedConfig) => {
        // 只有当配置真正发生变化时才更新
        if (JSON.stringify(updatedConfig) !== JSON.stringify(config)) {
          updateConfigAndService(updatedConfig);
        }
      }
    );

    return unsubscribe;
  }, [config, updateConfigAndService]);

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
