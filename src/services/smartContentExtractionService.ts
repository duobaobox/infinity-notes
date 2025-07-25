/**
 * 智能内容提取服务
 * 为用户提供零配置的内容提取体验
 */

import { getConfig } from "../config/contentExtractionConfig";

// 移除复杂的检测器类，简化为1000字阈值策略

/**
 * 智能内容提取服务
 */
export class SmartContentExtractionService {
  private static instance: SmartContentExtractionService;

  private constructor() {}

  static getInstance(): SmartContentExtractionService {
    if (!SmartContentExtractionService.instance) {
      SmartContentExtractionService.instance =
        new SmartContentExtractionService();
    }
    return SmartContentExtractionService.instance;
  }

  /**
   * 智能提取内容 - 用户只需调用这一个方法
   * @param content 原始内容
   * @param _options 可选参数，用户通常不需要设置
   */
  async extractContent(
    content: string,
    _options?: {
      forceImportant?: boolean;
      contentType?: "ai_response" | "user_note" | "mixed";
    }
  ): Promise<{
    extracted: string;
    metadata: {
      originalLength: number;
      extractedLength: number;
      confidence: number; // 提取置信度
      processingTime: number;
    };
  }> {
    const startTime = performance.now();

    // 简化版：不再需要复杂的内容特征检测
    // 只需要获取简化配置即可

    // 获取简化配置
    const config = getConfig();

    // 执行内容提取
    const extracted = await this.performExtraction(content, config);

    const processingTime = performance.now() - startTime;

    // 计算置信度
    const confidence = this.calculateConfidence(content, extracted, config);

    return {
      extracted,
      metadata: {
        originalLength: content.length,
        extractedLength: extracted.length,
        confidence,
        processingTime,
      },
    };
  }

  /**
   * 记录用户对提取结果的使用情况（简化版）
   * 系统会自动调用，用户无需关心
   */
  recordUsage(
    extractionResult: any,
    userAction: {
      kept: boolean;
      edited: boolean;
    }
  ): void {
    // 简化版：只记录基本信息到控制台
    console.log("📊 用户使用记录:", {
      originalLength: extractionResult.metadata.originalLength,
      extractedLength: extractionResult.metadata.extractedLength,
      userKeptContent: userAction.kept,
      userEditedContent: userAction.edited,
      timestamp: Date.now(),
    });
  }

  /**
   * 执行实际的内容提取
   */
  private async performExtraction(
    content: string,
    config: any
  ): Promise<string> {
    // 这里实现实际的提取逻辑
    // 使用配置中的正则表达式和规则

    // 首先尝试最终答案提取
    for (const pattern of config.patterns.finalAnswerPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        let extracted = match[1].trim();

        // 应用长度限制
        if (extracted.length > config.smartMode.maxLength) {
          extracted = this.smartTruncate(
            extracted,
            config.smartMode.maxLength,
            config
          );
        }

        return this.cleanupContent(extracted);
      }
    }

    // 尝试 details 标签提取
    for (const pattern of config.patterns.detailsPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        let extracted = match[1].trim();

        if (extracted.length > config.smartMode.maxLength) {
          extracted = this.smartTruncate(
            extracted,
            config.smartMode.maxLength,
            config
          );
        }

        return this.cleanupContent(extracted);
      }
    }

    // 基础提取：选择最有价值的部分
    const cleanContent = this.cleanupContent(content);
    const targetLength = config.smartMode.maxLength;

    if (cleanContent.length <= targetLength) {
      return cleanContent;
    }

    return this.smartTruncate(cleanContent, targetLength, config);
  }

  /**
   * 智能截断内容
   */
  private smartTruncate(
    content: string,
    maxLength: number,
    config: any
  ): string {
    if (content.length <= maxLength) return content;

    if (!config.smartTruncation.enabled) {
      return content.substring(0, maxLength) + "...";
    }

    // 寻找最佳截断点
    const searchRange = Math.min(
      Math.floor(maxLength * config.smartTruncation.searchRangeRatio),
      config.smartTruncation.maxSearchRange
    );

    const idealEnd = maxLength - 3; // 为省略号留空间
    const searchStart = Math.max(0, idealEnd - searchRange);
    const searchEnd = Math.min(content.length, idealEnd + searchRange);

    // 寻找句号、问号、感叹号等自然断点
    const breakPoints = /[。！？.!?]\s/g;
    let bestBreakPoint = idealEnd;
    let match;

    const searchText = content.substring(searchStart, searchEnd);
    while ((match = breakPoints.exec(searchText)) !== null) {
      const absolutePos = searchStart + match.index + match[0].length;
      if (absolutePos <= idealEnd) {
        bestBreakPoint = absolutePos;
      }
    }

    return content.substring(0, bestBreakPoint).trim() + "...";
  }

  /**
   * 清理内容格式
   */
  private cleanupContent(content: string): string {
    return content
      .replace(/^##\s*✨\s*最终答案\s*\n+/i, "")
      .replace(/^##\s*最终答案\s*\n+/i, "")
      .replace(/^##\s*Final Answer\s*\n+/i, "")
      .replace(/^##\s*答案\s*\n+/i, "")
      .replace(/^##\s*结论\s*\n+/i, "")
      .replace(/^##\s*总结\s*\n+/i, "")
      .replace(/\n{3,}/g, "\n\n") // 压缩多余换行
      .trim();
  }

  /**
   * 计算提取结果的置信度
   */
  private calculateConfidence(
    original: string,
    extracted: string,
    config: any
  ): number {
    if (!extracted || extracted.length === 0) return 0;

    let confidence = 0.5; // 基础置信度

    // 长度适中加分
    const lengthRatio = extracted.length / original.length;
    if (lengthRatio >= 0.1 && lengthRatio <= 0.8) {
      confidence += 0.2;
    }

    // 包含关键信息加分
    const keywordCount = config.patterns.thinkingKeywords.filter(
      (keyword: string) =>
        extracted.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    confidence += Math.min(keywordCount * 0.05, 0.2);

    // 结构完整性加分
    const hasStructure = /[。！？.!?]$/.test(extracted.trim());
    if (hasStructure) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }
}

/**
 * 全局导出的简化API
 * 用户只需要调用这个函数，无需关心复杂的配置
 *
 * 🎯 简化策略：
 * - 便签内容 ≤ 1000字：直接返回完整内容（用户期望看到全部）
 * - 便签内容 > 1000字：使用智能算法提取核心内容（避免信息过载）
 */
export const extractContentSmart = async (content: string): Promise<string> => {
  // 🚀 使用简化配置的长度判断策略
  const { isShortNote } = await import("../config/contentExtractionConfig");

  if (isShortNote(content.length)) {
    // 短便签：直接返回完整内容，无需智能处理
    return content.trim();
  }

  // 长便签：使用智能算法提取核心内容
  const result =
    await SmartContentExtractionService.getInstance().extractContent(content);
  return result.extracted;
};

/**
 * 高级API，返回详细信息（供需要的开发者使用）
 * 同样遵循1000字阈值策略
 */
export const extractContentWithMetadata = async (
  content: string,
  options?: {
    forceImportant?: boolean;
    contentType?: "ai_response" | "user_note" | "mixed";
  }
) => {
  const { isShortNote } = await import("../config/contentExtractionConfig");

  if (isShortNote(content.length)) {
    // 短便签：返回完整内容和基础元数据
    return {
      extracted: content.trim(),
      metadata: {
        originalLength: content.length,
        extractedLength: content.trim().length,
        confidence: 1.0, // 完整内容，置信度100%
        processingTime: 0, // 无需处理时间
      },
    };
  }

  // 长便签：使用智能算法
  return SmartContentExtractionService.getInstance().extractContent(
    content,
    options
  );
};
