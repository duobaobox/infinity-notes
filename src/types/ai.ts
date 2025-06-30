// AI相关的共享类型定义
import type { AIConfig } from "../services/ai/aiService";

// AI配置更新事件详情
export interface AIConfigUpdateEvent {
  config: AIConfig;
  source:
    | "ai-settings"
    | "prompt-settings"
    | "ai-store-config"
    | "ai-store-prompt";
}

// AI设置Hook返回类型
export interface UseAISettingsReturn {
  config: AIConfig;
  loading: boolean;
  error: string | null;
  saveConfig: (newConfig: AIConfig) => Promise<boolean>;
  loadConfig: () => Promise<void>;
  testConnection: () => Promise<{ success: boolean; error?: string }>;
  testThinkingChain: () => Promise<{
    success: boolean;
    hasThinking?: boolean;
    thinkingSteps?: number;
    error?: string;
  }>;
  hasValidConfig: boolean;
  clearConfig: () => Promise<void>;
}

// 配置验证结果
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  correctedConfig?: Partial<AIConfig>;
}
