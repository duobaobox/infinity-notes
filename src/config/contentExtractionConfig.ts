// 内容提取配置文件
// 集中管理内容提取相关的参数和规则

/**
 * 内容提取模式常量
 */
export const ExtractionMode = {
  PRECISE: "precise", // 精准模式：直接使用原始内容，不进行智能提取
  SMART: "smart", // 智能模式：使用智能算法提取核心内容
} as const;

export type ExtractionMode =
  (typeof ExtractionMode)[keyof typeof ExtractionMode];

/**
 * 极简化的内容提取配置接口
 * 🎯 只保留两种模式：精准模式和智能模式
 */
export interface ContentExtractionConfig {
  // 核心阈值配置：超过此字数自动切换到智能模式
  lengthThreshold: number; // 默认1000字

  // 智能模式配置（仅在超过阈值时使用）
  smartMode: {
    maxLength: number; // 智能提取后的最大长度
    enableSmartTruncation: boolean; // 是否启用智能截断
  };

  // 正则表达式模式（用于智能模式的内容提取）
  patterns: {
    finalAnswerPatterns: RegExp[]; // 最终答案匹配模式
    detailsPatterns: RegExp[]; // Details标签匹配模式
    titleCleanupPatterns: RegExp[]; // 标题清理模式
  };
}

/**
 * 极简化的默认内容提取配置
 * 🎯 默认精准模式，超过1000字自动切换智能模式
 */
export const defaultContentExtractionConfig: ContentExtractionConfig = {
  // 核心阈值：1000字分界线
  lengthThreshold: 1000,

  // 智能模式配置（仅在超过阈值时使用）
  smartMode: {
    maxLength: 300, // 智能提取后的最大长度
    enableSmartTruncation: true, // 启用智能截断
  },

  // 正则表达式模式（仅用于智能模式的内容提取）
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
   * 更新配置（极简化版）
   */
  updateConfig(newConfig: Partial<ContentExtractionConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      // 深度合并嵌套对象
      smartMode: {
        ...this.config.smartMode,
        ...newConfig.smartMode,
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

  /**
   * 根据总字数判断应该使用的模式
   * @param totalLength 所有连接便签的总字数
   * @returns 提取模式
   */
  getExtractionMode(totalLength: number): ExtractionMode {
    const mode =
      totalLength > this.config.lengthThreshold
        ? ExtractionMode.SMART
        : ExtractionMode.PRECISE;

    console.log(
      `📊 字数检测: ${totalLength}字 -> ${
        mode === ExtractionMode.SMART ? "智能模式" : "精准模式"
      }`
    );
    return mode;
  }
}

/**
 * 获取内容提取配置的便捷函数
 */
export const getContentExtractionConfig = (): ContentExtractionConfig => {
  return ContentExtractionConfigManager.getInstance().getConfig();
};

/**
 * 便捷函数：根据总字数获取提取模式
 * @param totalLength 总字数
 * @returns 提取模式
 */
export const getExtractionModeForLength = (
  totalLength: number
): ExtractionMode => {
  return ContentExtractionConfigManager.getInstance().getExtractionMode(
    totalLength
  );
};

/**
 * 获取配置的便捷函数
 */
export const getConfig = (): ContentExtractionConfig => {
  return ContentExtractionConfigManager.getInstance().getConfig();
};

/**
 * 获取长度阈值的便捷函数
 */
export const getLengthThreshold = (): number => {
  return ContentExtractionConfigManager.getInstance().getLengthThreshold();
};

/**
 * 设置长度阈值的便捷函数
 */
export const setLengthThreshold = (threshold: number): void => {
  ContentExtractionConfigManager.getInstance().setLengthThreshold(threshold);
};

/**
 * 判断是否为短便签的便捷函数
 */
export const isShortNote = (length: number): boolean => {
  return length <= getLengthThreshold();
};

/**
 * 判断是否为长便签的便捷函数
 */
export const isLongNote = (length: number): boolean => {
  return length > getLengthThreshold();
};
