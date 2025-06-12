// AI提示词设置管理Hook
import { useState, useEffect, useCallback } from "react";
import type { AIConfig } from "../services/aiService";
import { IndexedDBAISettingsStorage as AISettingsStorage } from "../database/IndexedDBAISettingsStorage";

export interface AIPromptConfig {
  systemPrompt: string;
  enableSystemPrompt?: boolean; // 保留字段以兼容旧配置，但不再使用
}

export interface UseAIPromptSettingsReturn {
  promptConfig: AIPromptConfig;
  loading: boolean;
  error: string | null;
  savePromptConfig: (promptConfig: AIPromptConfig) => Promise<boolean>;
  loadPromptConfig: () => Promise<void>;
  resetToDefault: () => Promise<boolean>;
  canConfigurePrompt: boolean; // 是否可以配置提示词（依赖于AI配置是否有效）
}

export const useAIPromptSettings = (hasValidAIConfig: boolean): UseAIPromptSettingsReturn => {
  const [promptConfig, setPromptConfig] = useState<AIPromptConfig>({
    systemPrompt: "", // 默认为无提示词模式
    enableSystemPrompt: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 是否可以配置提示词（只有AI配置有效时才能配置）
  const canConfigurePrompt = hasValidAIConfig;

  // 加载提示词配置
  const loadPromptConfig = useCallback(async () => {
    if (!hasValidAIConfig) {
      console.log("🎯 AI配置无效，跳过提示词加载");
      return;
    }

    setLoading(true);
    setError(null);

    console.log("🎯 useAIPromptSettings: 开始加载提示词配置");

    try {
      // 从完整的AI配置中提取提示词部分
      const fullConfig = await AISettingsStorage.loadConfig();
      console.log("🎯 useAIPromptSettings: 完整配置加载成功", fullConfig);

      const extractedPromptConfig: AIPromptConfig = {
        systemPrompt: fullConfig.systemPrompt || "", // 默认为空，表示无提示词模式
        enableSystemPrompt: true, // 始终启用，通过systemPrompt内容控制模式
      };

      setPromptConfig(extractedPromptConfig);
      console.log("🎯 useAIPromptSettings: 提示词配置设置完成", extractedPromptConfig);
    } catch (err) {
      console.error("🎯 useAIPromptSettings: 加载提示词配置失败", err);
      setError(err instanceof Error ? err.message : "加载提示词配置失败");
      // 加载失败时使用默认配置（无提示词模式）
      setPromptConfig({ systemPrompt: "", enableSystemPrompt: true });
    } finally {
      setLoading(false);
    }
  }, [hasValidAIConfig]);

  // 保存提示词配置
  const savePromptConfig = useCallback(
    async (newPromptConfig: AIPromptConfig): Promise<boolean> => {
      if (!hasValidAIConfig) {
        setError("请先配置AI基础设置");
        return false;
      }

      setLoading(true);
      setError(null);

      console.log("🎯 useAIPromptSettings: 开始保存提示词配置", newPromptConfig);

      try {
        // 先加载完整的AI配置
        const fullConfig = await AISettingsStorage.loadConfig();
        console.log("🎯 useAIPromptSettings: 当前完整配置", fullConfig);

        // 更新提示词部分
        const updatedConfig: AIConfig = {
          ...fullConfig,
          systemPrompt: newPromptConfig.systemPrompt,
          enableSystemPrompt: newPromptConfig.enableSystemPrompt,
        };

        console.log("🎯 useAIPromptSettings: 准备保存的完整配置", updatedConfig);

        // 保存完整配置
        await AISettingsStorage.saveConfig(updatedConfig);
        console.log("🎯 useAIPromptSettings: 提示词配置保存成功");

        // 立即更新本地状态，确保UI能立即反映最新配置
        setPromptConfig(newPromptConfig);

        // 重新加载配置以确保数据一致性（异步执行，不影响返回结果）
        setTimeout(() => {
          loadPromptConfig();
        }, 100);

        return true;
      } catch (err) {
        console.error("🎯 useAIPromptSettings: 保存提示词配置失败", err);
        setError(err instanceof Error ? err.message : "保存提示词配置失败");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [hasValidAIConfig, loadPromptConfig]
  );

  // 重置为无提示词模式
  const resetToDefault = useCallback(async (): Promise<boolean> => {
    const defaultConfig: AIPromptConfig = {
      systemPrompt: "", // 重置为无提示词模式
      enableSystemPrompt: true,
    };
    return await savePromptConfig(defaultConfig);
  }, [savePromptConfig]);

  // 当AI配置状态变化时，重新加载提示词配置
  useEffect(() => {
    if (hasValidAIConfig) {
      loadPromptConfig();
    } else {
      // AI配置无效时，重置为无提示词模式
      setPromptConfig({
        systemPrompt: "", // 重置为无提示词模式
        enableSystemPrompt: true
      });
      setError(null);
    }
  }, [hasValidAIConfig, loadPromptConfig]);

  return {
    promptConfig,
    loading,
    error,
    savePromptConfig,
    loadPromptConfig,
    resetToDefault,
    canConfigurePrompt,
  };
};
