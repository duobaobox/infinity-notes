// AI配置管理工具 - 统一处理配置同步和事件
import type { AIConfig } from "../services/ai/aiService";
import type { AIConfigUpdateEvent } from "../types/ai";
import { getAIService } from "../services/ai/aiService";

/**
 * AI配置管理器 - 统一处理配置更新和状态同步
 */
export class AIConfigManager {
  private static instance: AIConfigManager | null = null;
  private listeners: Set<(config: AIConfig) => void> = new Set();

  private constructor() {}

  static getInstance(): AIConfigManager {
    if (!AIConfigManager.instance) {
      AIConfigManager.instance = new AIConfigManager();
    }
    return AIConfigManager.instance;
  }

  /**
   * 订阅配置更新
   */
  subscribe(listener: (config: AIConfig) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知配置更新
   */
  notifyConfigUpdate(config: AIConfig, source: AIConfigUpdateEvent['source']): void {
    console.log(`🔄 AIConfigManager: 配置更新通知`, { source, hasListeners: this.listeners.size });
    
    // 更新AI服务
    try {
      getAIService(config);
      console.log(`🔄 AIConfigManager: AI服务已更新`);
    } catch (error) {
      console.warn(`🔄 AIConfigManager: 更新AI服务失败`, error);
    }

    // 通知所有监听器
    this.listeners.forEach(listener => {
      try {
        listener(config);
      } catch (error) {
        console.error(`🔄 AIConfigManager: 监听器执行失败`, error);
      }
    });

    // 兼容现有的事件系统（逐步迁移）
    window.dispatchEvent(
      new CustomEvent("ai-config-updated", {
        detail: { config, source },
      })
    );
  }

  /**
   * 检查配置是否有效
   */
  static isValidConfig(config: AIConfig): boolean {
    return !!(config.apiKey && config.apiUrl && config.aiModel);
  }

  /**
   * 获取配置的显示信息（隐藏敏感信息）
   */
  static getConfigDisplayInfo(config: AIConfig) {
    return {
      ...config,
      apiKey: config.apiKey ? "******" : "",
    };
  }
}

// 导出单例实例
export const aiConfigManager = AIConfigManager.getInstance();
