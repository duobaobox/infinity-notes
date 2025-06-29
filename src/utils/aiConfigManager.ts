// AI配置管理工具 - 优化版本
import type { AIConfig } from "../services/ai/aiService";
import { getAIService } from "../services/ai/aiService";
import type { AIConfigUpdateEvent } from "../types/ai";

/**
 * AI配置管理器 - 统一处理配置更新和状态同步
 * 使用单例模式确保全局配置状态一致性
 */
export class AIConfigManager {
  private static instance: AIConfigManager | null = null;
  private listeners: Set<(config: AIConfig) => void> = new Set();
  private currentConfig: AIConfig | null = null;

  private constructor() {}

  static getInstance(): AIConfigManager {
    if (!AIConfigManager.instance) {
      AIConfigManager.instance = new AIConfigManager();
    }
    return AIConfigManager.instance;
  }

  /**
   * 订阅配置更新
   * @param listener 配置更新回调函数
   * @returns 取消订阅的函数
   */
  subscribe(listener: (config: AIConfig) => void): () => void {
    this.listeners.add(listener);

    // 如果已有配置，立即通知新的监听器
    if (this.currentConfig) {
      try {
        listener(this.currentConfig);
      } catch (error) {
        console.error("AIConfigManager: 初始化监听器失败", error);
      }
    }

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知配置更新
   * @param config 新的配置
   * @param source 更新来源
   */
  notifyConfigUpdate(
    config: AIConfig,
    source: AIConfigUpdateEvent["source"]
  ): void {
    // 避免重复更新相同的配置
    if (
      this.currentConfig &&
      JSON.stringify(this.currentConfig) === JSON.stringify(config)
    ) {
      return;
    }

    this.currentConfig = config;

    // 更新AI服务
    try {
      if (AIConfigManager.isValidConfig(config)) {
        getAIService(config);
      }
    } catch (error) {
      console.warn("AIConfigManager: 更新AI服务失败", error);
    }

    // 通知所有监听器
    this.listeners.forEach((listener) => {
      try {
        listener(config);
      } catch (error) {
        console.error("AIConfigManager: 监听器执行失败", error);
      }
    });

    // 兼容现有的事件系统（保持向后兼容）
    window.dispatchEvent(
      new CustomEvent("ai-config-updated", {
        detail: { config, source },
      })
    );
  }

  /**
   * 检查配置是否有效
   * @param config AI配置对象
   * @returns 配置是否有效
   */
  static isValidConfig(config: AIConfig): boolean {
    return !!(config.apiKey && config.apiUrl && config.aiModel);
  }

  /**
   * 获取当前配置
   * @returns 当前配置或null
   */
  getCurrentConfig(): AIConfig | null {
    return this.currentConfig;
  }
}
