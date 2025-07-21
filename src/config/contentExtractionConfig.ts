// 内容提取配置文件
// 集中管理内容提取相关的参数和规则

/**
 * 简化的内容提取配置接口
 * 🎯 基于1000字阈值策略，大幅简化配置复杂度
 */
export interface ContentExtractionConfig {
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
 * 简化的默认内容提取配置
 * 🎯 基于1000字阈值策略
 */
export const defaultContentExtractionConfig: ContentExtractionConfig = {
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
 * 内容提取配置管理器
 */
export class ContentExtractionConfigManager {
  private static instance: ContentExtractionConfigManager;
  private config: ContentExtractionConfig;

  private constructor() {
    this.config = { ...defaultContentExtractionConfig };
  }

  static getInstance(): ContentExtractionConfigManager {
    if (!ContentExtractionConfigManager.instance) {
      ContentExtractionConfigManager.instance =
        new ContentExtractionConfigManager();
    }
    return ContentExtractionConfigManager.instance;
  }

  /**
   * 获取当前配置
   */
  getConfig(): ContentExtractionConfig {
    return { ...this.config };
  }

  /**
   * 更新配置（简化版）
   */
  updateConfig(newConfig: Partial<ContentExtractionConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      // 深度合并嵌套对象
      longNoteExtraction: {
        ...this.config.longNoteExtraction,
        ...newConfig.longNoteExtraction,
      },
      patterns: {
        ...this.config.patterns,
        ...newConfig.patterns,
      },
    };

    console.log("📋 配置已更新:", this.config);
  }

  /**
   * 重置为默认配置
   */
  resetToDefault(): void {
    this.config = { ...defaultContentExtractionConfig };
    console.log("📋 配置已重置为默认值");
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
 * 获取内容提取配置的便捷函数
 */
export const getContentExtractionConfig = (): ContentExtractionConfig => {
  return ContentExtractionConfigManager.getInstance().getConfig();
};

/**
 * 便捷函数：检查是否为长便签
 */
export const isLongNote = (content: string): boolean => {
  const threshold =
    ContentExtractionConfigManager.getInstance().getLengthThreshold();
  return content.length > threshold;
};

/**
 * 便捷函数：检查是否为短便签
 */
export const isShortNote = (content: string): boolean => {
  return !isLongNote(content);
};
