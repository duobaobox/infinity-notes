// 内容提取配置文件
// 集中管理内容提取相关的参数和规则

/**
 * 内容提取配置接口
 */
export interface ContentExtractionConfig {
  // 长度限制配置
  lengthLimits: {
    finalAnswerOnly: number; // "仅最终答案"模式的最大长度
    full: number; // "完整内容"模式的最大长度
    qualityBonus: number; // 高质量内容的额外长度奖励
  };

  // 质量评估配置
  qualityAssessment: {
    enabled: boolean; // 是否启用质量评估
    lengthWeight: number; // 长度因子权重 (0-1)
    structureWeight: number; // 结构因子权重 (0-1)
    densityWeight: number; // 信息密度权重 (0-1)
    keywordWeight: number; // 关键词权重 (0-1)
    qualityThreshold: number; // 高质量内容阈值
  };

  // 智能截断配置
  smartTruncation: {
    enabled: boolean; // 是否启用智能截断
    searchRangeRatio: number; // 搜索范围比例 (0-1)
    maxSearchRange: number; // 最大搜索范围
  };

  // 正则表达式模式配置
  patterns: {
    finalAnswerPatterns: RegExp[]; // 最终答案匹配模式
    detailsPatterns: RegExp[]; // Details标签匹配模式
    titleCleanupPatterns: RegExp[]; // 标题清理模式
    thinkingKeywords: string[]; // 思维过程关键词
  };

  // 调试和日志配置
  debug: {
    enabled: boolean; // 是否启用调试日志
    showQualityScores: boolean; // 是否显示质量分数
    logExtractionSteps: boolean; // 是否记录提取步骤
  };
}

/**
 * 默认内容提取配置
 */
export const defaultContentExtractionConfig: ContentExtractionConfig = {
  lengthLimits: {
    finalAnswerOnly: 200,
    full: 100,
    qualityBonus: 50,
  },

  qualityAssessment: {
    enabled: true,
    lengthWeight: 0.2,
    structureWeight: 0.3,
    densityWeight: 0.3,
    keywordWeight: 0.2,
    qualityThreshold: 0.7,
  },

  smartTruncation: {
    enabled: true,
    searchRangeRatio: 0.2,
    maxSearchRange: 50,
  },

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

    thinkingKeywords: [
      "首先",
      "然后",
      "接下来",
      "考虑",
      "分析",
      "思考",
      "first",
      "then",
      "next",
      "consider",
      "analyze",
      "think",
      "让我",
      "我需要",
      "我认为",
      "我觉得",
      "let me",
      "i need",
      "i think",
      "i believe",
    ],
  },

  debug: {
    enabled: false, // 默认关闭调试模式，避免影响用户体验
    showQualityScores: false, // 默认关闭质量分数显示
    logExtractionSteps: false, // 默认关闭，避免日志过多
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
   * 更新配置
   */
  updateConfig(newConfig: Partial<ContentExtractionConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      // 深度合并嵌套对象
      lengthLimits: { ...this.config.lengthLimits, ...newConfig.lengthLimits },
      qualityAssessment: {
        ...this.config.qualityAssessment,
        ...newConfig.qualityAssessment,
      },
      smartTruncation: {
        ...this.config.smartTruncation,
        ...newConfig.smartTruncation,
      },
      patterns: { ...this.config.patterns, ...newConfig.patterns },
      debug: { ...this.config.debug, ...newConfig.debug },
    };

    if (this.config.debug.enabled) {
      console.log("📋 内容提取配置已更新:", this.config);
    }
  }

  /**
   * 重置为默认配置
   */
  resetToDefault(): void {
    this.config = { ...defaultContentExtractionConfig };
    console.log("📋 内容提取配置已重置为默认值");
  }

  /**
   * 验证配置的有效性
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证长度限制
    if (this.config.lengthLimits.finalAnswerOnly <= 0) {
      errors.push("finalAnswerOnly长度限制必须大于0");
    }
    if (this.config.lengthLimits.full <= 0) {
      errors.push("full长度限制必须大于0");
    }

    // 验证权重总和
    const totalWeight =
      this.config.qualityAssessment.lengthWeight +
      this.config.qualityAssessment.structureWeight +
      this.config.qualityAssessment.densityWeight +
      this.config.qualityAssessment.keywordWeight;

    if (Math.abs(totalWeight - 1.0) > 0.01) {
      errors.push(`质量评估权重总和应为1.0，当前为${totalWeight.toFixed(2)}`);
    }

    // 验证阈值范围
    if (
      this.config.qualityAssessment.qualityThreshold < 0 ||
      this.config.qualityAssessment.qualityThreshold > 1
    ) {
      errors.push("质量阈值必须在0-1之间");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取针对特定场景优化的配置
   */
  getOptimizedConfig(
    scenario: "speed" | "accuracy" | "balanced"
  ): ContentExtractionConfig {
    const baseConfig = { ...this.config };

    switch (scenario) {
      case "speed":
        // 速度优先：简化处理，减少计算
        return {
          ...baseConfig,
          qualityAssessment: {
            ...baseConfig.qualityAssessment,
            enabled: false,
          },
          smartTruncation: { ...baseConfig.smartTruncation, enabled: false },
          debug: {
            ...baseConfig.debug,
            enabled: false,
            showQualityScores: false,
          },
        };

      case "accuracy":
        // 准确性优先：启用所有功能，增加长度限制
        return {
          ...baseConfig,
          lengthLimits: {
            ...baseConfig.lengthLimits,
            finalAnswerOnly: 300,
            full: 150,
            qualityBonus: 100,
          },
          qualityAssessment: { ...baseConfig.qualityAssessment, enabled: true },
          smartTruncation: { ...baseConfig.smartTruncation, enabled: true },
        };

      case "balanced":
      default:
        // 平衡模式：使用默认配置
        return baseConfig;
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
 * 更新内容提取配置的便捷函数
 */
export const updateContentExtractionConfig = (
  config: Partial<ContentExtractionConfig>
): void => {
  ContentExtractionConfigManager.getInstance().updateConfig(config);
};
