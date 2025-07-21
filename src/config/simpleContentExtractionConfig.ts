// 简化的内容提取配置文件
// 🎯 基于1000字阈值策略，彻底简化配置复杂度

/**
 * 简化的内容提取配置接口
 * 只保留最核心的配置项
 */
export interface SimpleContentExtractionConfig {
  // 核心阈值配置
  lengthThreshold: number; // 长短便签的分界线（默认1000字）
  
  // 长便签提取配置（仅在超过阈值时使用）
  longNoteExtraction: {
    maxLength: number; // 提取结果的最大长度
    enableSmartTruncation: boolean; // 是否启用智能截断
  };

  // 正则表达式模式（用于长便签的智能提取）
  patterns: {
    finalAnswerPatterns: RegExp[]; // 最终答案匹配模式
    detailsPatterns: RegExp[]; // Details标签匹配模式
    titleCleanupPatterns: RegExp[]; // 标题清理模式
  };
}

/**
 * 简化的默认配置
 * 🎯 基于1000字阈值策略
 */
export const defaultSimpleConfig: SimpleContentExtractionConfig = {
  // 核心阈值：1000字分界线
  lengthThreshold: 1000,
  
  // 长便签提取配置
  longNoteExtraction: {
    maxLength: 300, // 长便签提取后的最大长度
    enableSmartTruncation: true, // 启用智能截断
  },

  // 正则表达式模式（仅用于长便签智能提取）
  patterns: {
    finalAnswerPatterns: [
      /## ✨ 最终答案\s*\n\n([\s\S]*?)(?=\n##|$)/i, // 标准格式
      /##\s*最终答案\s*\n\n([\s\S]*?)(?=\n##|$)/i, // 无emoji格式
      /## Final Answer\s*\n\n([\s\S]*?)(?=\n##|$)/i, // 英文格式
      /##\s*答案\s*\n\n([\s\S]*?)(?=\n##|$)/i, // 简化格式
      /## ✨ 结论\s*\n\n([\s\S]*?)(?=\n##|$)/i, // 结论格式
      /## 💡 总结\s*\n\n([\s\S]*?)(?=\n##|$)/i, // 总结格式
    ],

    detailsPatterns: [
      /<\/details>\s*\n+---\s*\n+([\s\S]*?)$/i, // 标准格式
      /<\/details>\s*\n+([\s\S]*?)$/i, // 无分隔线格式
      /<\/details>\s*\n+.*?答案.*?\n+([\s\S]*?)$/i, // 带答案标题格式
    ],

    titleCleanupPatterns: [
      /^##\s*✨\s*最终答案\s*\n+/i,
      /^##\s*最终答案\s*\n+/i,
      /^##\s*Final Answer\s*\n+/i,
      /^##\s*答案\s*\n+/i,
      /^##\s*结论\s*\n+/i,
      /^##\s*总结\s*\n+/i,
    ],
  },
};

/**
 * 简化的配置管理器
 * 🎯 只提供最基本的配置功能，无复杂的模式切换
 */
export class SimpleConfigManager {
  private static instance: SimpleConfigManager;
  private config: SimpleContentExtractionConfig;

  private constructor() {
    this.config = { ...defaultSimpleConfig };
  }

  /**
   * 获取单例实例
   */
  static getInstance(): SimpleConfigManager {
    if (!SimpleConfigManager.instance) {
      SimpleConfigManager.instance = new SimpleConfigManager();
    }
    return SimpleConfigManager.instance;
  }

  /**
   * 获取当前配置
   */
  getConfig(): SimpleContentExtractionConfig {
    return { ...this.config };
  }

  /**
   * 更新配置（简化版）
   */
  updateConfig(newConfig: Partial<SimpleContentExtractionConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      // 深度合并嵌套对象
      longNoteExtraction: { 
        ...this.config.longNoteExtraction, 
        ...newConfig.longNoteExtraction 
      },
      patterns: { 
        ...this.config.patterns, 
        ...newConfig.patterns 
      },
    };

    console.log("📋 简化配置已更新:", this.config);
  }

  /**
   * 重置为默认配置
   */
  resetToDefault(): void {
    this.config = { ...defaultSimpleConfig };
    console.log("📋 配置已重置为默认值");
  }

  /**
   * 简化的配置验证
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证阈值
    if (this.config.lengthThreshold <= 0) {
      errors.push("长度阈值必须大于0");
    }

    // 验证最大长度
    if (this.config.longNoteExtraction.maxLength <= 0) {
      errors.push("长便签最大长度必须大于0");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取阈值（最常用的配置项）
   */
  getLengthThreshold(): number {
    return this.config.lengthThreshold;
  }

  /**
   * 设置阈值（最常用的配置项）
   */
  setLengthThreshold(threshold: number): void {
    if (threshold > 0) {
      this.config.lengthThreshold = threshold;
      console.log(`📏 长度阈值已设置为: ${threshold}字`);
    }
  }
}

/**
 * 便捷函数：获取配置
 */
export const getSimpleConfig = (): SimpleContentExtractionConfig => {
  return SimpleConfigManager.getInstance().getConfig();
};

/**
 * 便捷函数：获取阈值
 */
export const getLengthThreshold = (): number => {
  return SimpleConfigManager.getInstance().getLengthThreshold();
};

/**
 * 便捷函数：设置阈值
 */
export const setLengthThreshold = (threshold: number): void => {
  SimpleConfigManager.getInstance().setLengthThreshold(threshold);
};

/**
 * 便捷函数：检查是否为长便签
 */
export const isLongNote = (content: string): boolean => {
  const threshold = getLengthThreshold();
  return content.length > threshold;
};

/**
 * 便捷函数：检查是否为短便签
 */
export const isShortNote = (content: string): boolean => {
  return !isLongNote(content);
};
