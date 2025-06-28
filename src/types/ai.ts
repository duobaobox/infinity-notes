// AI相关的共享类型定义
import type { AIConfig } from "../services/ai/aiService";

// AI提示词配置接口
export interface AIPromptConfig {
  systemPrompt: string; // 系统提示词（空字符串=无提示词模式，有内容=自定义prompt模式）
}

// AI配置更新事件详情
export interface AIConfigUpdateEvent {
  config: AIConfig;
  source: 'ai-settings' | 'prompt-settings' | 'ai-store-config' | 'ai-store-prompt';
}

// AI设置Hook返回类型
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

// AI提示词设置Hook返回类型
export interface UseAIPromptSettingsReturn {
  promptConfig: AIPromptConfig;
  loading: boolean;
  error: string | null;
  savePromptConfig: (promptConfig: AIPromptConfig) => Promise<boolean>;
  loadPromptConfig: () => Promise<void>;
  resetToDefault: () => Promise<boolean>;
  canConfigurePrompt: boolean;
}

// 配置验证结果
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  correctedConfig?: Partial<AIConfig>;
}
