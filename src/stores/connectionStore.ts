// 便签连接状态管理Store
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { StickyNote } from "../components/types";
import { ConnectionMode } from "../components/canvas/StickyNoteSlots";
import {
  getContentExtractionConfig,
  ContentExtractionConfigManager,
  type ContentExtractionConfig,
} from "../config/contentExtractionConfig";

// 连接模式类型
type ConnectionModeType = (typeof ConnectionMode)[keyof typeof ConnectionMode];
import { connectionLineManager } from "../utils/connectionLineManager";

// 连接状态接口
export interface ConnectionState {
  // 连接数据
  connectedNotes: StickyNote[]; // 已连接的便签列表
  connectionMode: ConnectionModeType; // 连接模式
  maxConnections: number; // 最大连接数量

  // 状态标识
  isVisible: boolean; // 插槽容器是否可见
}

// 连接操作接口
export interface ConnectionActions {
  // 连接操作
  addConnection: (note: StickyNote) => boolean; // 添加连接，返回是否成功
  removeConnection: (noteId: string) => void; // 移除连接
  clearAllConnections: () => void; // 清空所有连接

  // 模式管理
  setConnectionMode: (mode: ConnectionModeType) => void; // 设置连接模式

  // 可见性管理
  setVisible: (visible: boolean) => void; // 设置可见性

  // 工具方法
  isNoteConnected: (noteId: string) => boolean; // 检查便签是否已连接
  getConnectionIndex: (noteId: string) => number; // 获取便签在连接列表中的索引
  canAddConnection: () => boolean; // 检查是否可以添加更多连接
  updateConnectionLines: () => void; // 更新所有连接线位置
  updateNoteConnectionLines: (noteId: string) => void; // 更新特定便签的连接线位置
  updateNoteConnectionLinesImmediate: (noteId: string) => void; // 立即更新特定便签的连接线位置
  updateConnectionLinesImmediate: () => void; // 立即更新所有连接线位置

  // 配置管理
  updateExtractionConfig: (config: Partial<ContentExtractionConfig>) => void; // 更新内容提取配置
  resetExtractionConfig: () => void; // 重置配置为默认值
  getExtractionConfig: () => ContentExtractionConfig; // 获取当前配置
  setExtractionScenario: (scenario: "speed" | "accuracy" | "balanced") => void; // 设置优化场景
}

// 创建连接Store
export const useConnectionStore = create<ConnectionState & ConnectionActions>()(
  devtools(
    (set, get) => ({
      // 初始状态
      connectedNotes: [],
      connectionMode: ConnectionMode.SUMMARY, // 默认汇总模式
      maxConnections: 10, // 最大连接10个便签
      isVisible: false,

      // 连接操作
      addConnection: (note: StickyNote) => {
        const state = get();

        // 检查是否已连接
        if (state.isNoteConnected(note.id)) {
          return false;
        }

        // 检查是否超过最大连接数
        if (!state.canAddConnection()) {
          return false;
        }

        // 计算新的连接索引
        const newIndex = state.connectedNotes.length + 1;

        // 添加连接
        const updatedNote = {
          ...note,
          isConnected: true,
          connectionIndex: newIndex,
        };

        set({
          connectedNotes: [...state.connectedNotes, updatedNote],
          isVisible: true, // 有连接时显示插槽容器
        });

        // 使用requestAnimationFrame确保DOM已更新，减少延迟
        requestAnimationFrame(async () => {
          await connectionLineManager.createConnection(updatedNote, newIndex);
        });

        return true;
      },

      removeConnection: (noteId: string) => {
        const state = get();

        // 移除连接线
        connectionLineManager.removeConnection(noteId);

        const updatedNotes = state.connectedNotes.filter(
          (note) => note.id !== noteId
        );

        // 重新分配连接索引
        const reindexedNotes = updatedNotes.map((note, index) => ({
          ...note,
          connectionIndex: index + 1,
        }));

        set({
          connectedNotes: reindexedNotes,
          isVisible: reindexedNotes.length > 0, // 没有连接时隐藏插槽容器
        });

        // 使用requestAnimationFrame重新创建剩余连接线，减少延迟
        requestAnimationFrame(async () => {
          for (const note of reindexedNotes) {
            await connectionLineManager.createConnection(
              note,
              note.connectionIndex!
            );
          }
        });
      },

      clearAllConnections: () => {
        try {
          // 获取当前状态
          const state = get();
          const noteIds = state.connectedNotes.map((note) => note.id);

          console.log(
            "🔗 ConnectionStore: 清空所有连接，当前连接数:",
            noteIds.length
          );

          // 清空所有连接线（只清空普通连接线，保留溯源连接线）
          connectionLineManager.clearAllConnections();

          // 重置状态
          set({
            connectedNotes: [], // 清空连接的便签列表
            isVisible: false, // 隐藏插槽容器
          });

          console.log("✅ ConnectionStore: 连接状态已清空");
        } catch (error) {
          console.error("❌ ConnectionStore: 清空连接失败:", error);
          // 即使出错也尝试重置状态
          set({
            connectedNotes: [],
            isVisible: false,
          });
        }
      },

      // 模式管理
      setConnectionMode: (mode: ConnectionModeType) => {
        set({ connectionMode: mode });
      },

      // 可见性管理
      setVisible: (visible: boolean) => {
        set({ isVisible: visible });
      },

      // 工具方法
      isNoteConnected: (noteId: string) => {
        const state = get();
        return state.connectedNotes.some((note) => note.id === noteId);
      },

      getConnectionIndex: (noteId: string) => {
        const state = get();
        const note = state.connectedNotes.find((note) => note.id === noteId);
        return note?.connectionIndex || -1;
      },

      canAddConnection: () => {
        const state = get();
        return state.connectedNotes.length < state.maxConnections;
      },

      // 连接线管理
      updateConnectionLines: () => {
        connectionLineManager.updateConnectionPositions();
      },

      updateNoteConnectionLines: (noteId: string) => {
        connectionLineManager.updateNoteConnections(noteId);
      },

      updateNoteConnectionLinesImmediate: (noteId: string) => {
        connectionLineManager.updateNoteConnectionsImmediate(noteId);
      },

      updateConnectionLinesImmediate: () => {
        connectionLineManager.updateConnectionPositionsImmediate();
      },

      // 配置管理方法
      updateExtractionConfig: (config: Partial<ContentExtractionConfig>) => {
        const configManager = ContentExtractionConfigManager.getInstance();
        configManager.updateConfig(config);
        console.log("📋 内容提取配置已更新");
      },

      resetExtractionConfig: () => {
        const configManager = ContentExtractionConfigManager.getInstance();
        configManager.resetToDefault();
        console.log("📋 内容提取配置已重置为默认值");
      },

      getExtractionConfig: () => {
        return getContentExtractionConfig();
      },

      setExtractionScenario: (scenario: "speed" | "accuracy" | "balanced") => {
        const configManager = ContentExtractionConfigManager.getInstance();
        const optimizedConfig = configManager.getOptimizedConfig(scenario);
        configManager.updateConfig(optimizedConfig);
        console.log(`📋 已切换到 ${scenario} 优化模式`);
      },
    }),
    {
      name: "connection-store", // DevTools中的名称
      onRehydrateStorage: () => (state) => {
        // Store恢复后，确保使用平衡模式作为默认配置
        if (state) {
          const configManager = ContentExtractionConfigManager.getInstance();
          const balancedConfig = configManager.getOptimizedConfig("balanced");
          configManager.updateConfig(balancedConfig);
          console.log("📋 Store恢复完成，已设置为平衡模式");
        }
      },
    }
  )
);

// 导出便签连接相关的工具函数
export const connectionUtils = {
  /**
   * 智能提取便签的核心内容
   * 优先提取最终答案部分，过滤思维链内容
   * 增强版：使用配置化的匹配模式和错误恢复机制
   */
  extractNoteContent: (note: StickyNote): string => {
    const content = note.content;
    const config = getContentExtractionConfig();

    // 输入验证
    if (!content || typeof content !== "string") {
      if (config.debug.enabled) {
        console.warn(`⚠️ 便签 "${note.title}" 内容无效，返回空字符串`);
      }
      return "";
    }

    try {
      // 使用配置中的最终答案匹配模式
      const finalAnswerPatterns = config.patterns.finalAnswerPatterns;

      // 尝试匹配最终答案模式
      for (const pattern of finalAnswerPatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          const finalAnswer = match[1].trim();
          if (finalAnswer.length > 0) {
            if (config.debug.logExtractionSteps) {
              console.log(
                `📝 从便签 "${note.title}" 提取最终答案内容 (模式匹配):`,
                finalAnswer.substring(0, 50) + "..."
              );
            }
            return finalAnswer;
          }
        }
      }

      // 使用配置中的details标签匹配模式
      const detailsPatterns = config.patterns.detailsPatterns;

      for (const pattern of detailsPatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          let afterDetails = match[1].trim();

          // 使用配置中的标题清理模式
          const titlePatterns = config.patterns.titleCleanupPatterns;

          for (const titlePattern of titlePatterns) {
            afterDetails = afterDetails.replace(titlePattern, "").trim();
          }

          if (afterDetails.length > 0) {
            if (config.debug.logExtractionSteps) {
              console.log(
                `📝 从便签 "${note.title}" 提取折叠后内容:`,
                afterDetails.substring(0, 50) + "..."
              );
            }
            return afterDetails;
          }
        }
      }

      // 智能内容分析：尝试识别结构化内容的核心部分
      const intelligentExtraction =
        connectionUtils.intelligentContentExtraction(content);
      if (intelligentExtraction && intelligentExtraction !== content) {
        if (config.debug.logExtractionSteps) {
          console.log(
            `📝 从便签 "${note.title}" 智能提取核心内容:`,
            intelligentExtraction.substring(0, 50) + "..."
          );
        }
        return intelligentExtraction;
      }

      // 如果没有思维链格式，直接返回原内容
      if (config.debug.logExtractionSteps) {
        console.log(`📝 便签 "${note.title}" 无特殊格式，使用原始内容`);
      }
      return content;
    } catch (error) {
      console.error(`❌ 提取便签 "${note.title}" 内容时发生错误:`, error);
      // 错误恢复：返回原始内容
      return content;
    }
  },

  /**
   * 智能内容提取：基于内容结构和语义分析提取核心信息
   * 作为正则匹配失败时的备选方案，使用配置化的关键词过滤
   */
  intelligentContentExtraction: (content: string): string => {
    const config = getContentExtractionConfig();

    try {
      // 按段落分割内容
      const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim());

      if (paragraphs.length <= 1) {
        return content; // 内容太短，直接返回
      }

      // 查找可能的核心段落（通常在后半部分）
      const coreStartIndex = Math.floor(paragraphs.length * 0.4); // 从40%位置开始查找
      const coreParagraphs = paragraphs.slice(coreStartIndex);

      // 使用配置中的思维关键词进行过滤
      const filteredParagraphs = coreParagraphs.filter((paragraph) => {
        const lowerParagraph = paragraph.toLowerCase();

        // 使用配置中的思维过程关键词
        const thinkingKeywords = config.patterns.thinkingKeywords;

        const hasThinkingKeywords = thinkingKeywords.some((keyword) =>
          lowerParagraph.includes(keyword.toLowerCase())
        );

        // 排除过短的段落（可能是标题或分隔符）
        const isTooShort = paragraph.trim().length < 20;

        // 排除明显的标题格式
        const isTitle = /^#{1,6}\s/.test(paragraph.trim());

        return !hasThinkingKeywords && !isTooShort && !isTitle;
      });

      if (filteredParagraphs.length > 0) {
        return filteredParagraphs.join("\n\n").trim();
      }

      // 如果过滤后没有内容，返回最后几个段落
      const lastParagraphs = paragraphs.slice(-2);
      return lastParagraphs.join("\n\n").trim();
    } catch (error) {
      if (config.debug.enabled) {
        console.warn("智能内容提取失败:", error);
      }
      return content;
    }
  },

  /**
   * 获取连接的便签内容摘要
   * 增强版：使用配置化的长度限制和质量评估
   */
  getConnectionSummary: (
    connectedNotes: StickyNote[],
    summaryMode: "full" | "final_answer_only" = "final_answer_only"
  ): string => {
    if (connectedNotes.length === 0) return "";

    const config = getContentExtractionConfig();

    // 验证输入数据
    const validNotes = connectedNotes.filter((note) =>
      connectionUtils.validateSingleConnection(note)
    );

    if (validNotes.length === 0) {
      if (config.debug.enabled) {
        console.warn("⚠️ 没有有效的连接便签");
      }
      return "";
    }

    if (validNotes.length !== connectedNotes.length && config.debug.enabled) {
      console.warn(
        `⚠️ ${connectedNotes.length - validNotes.length} 个便签数据无效，已过滤`
      );
    }

    return validNotes
      .map((note, index) => {
        try {
          // 根据配置决定内容提取方式
          const coreContent =
            summaryMode === "final_answer_only"
              ? connectionUtils.extractNoteContent(note)
              : note.content; // 完整模式直接使用原内容

          // 使用配置中的长度限制
          const baseMaxLength =
            summaryMode === "final_answer_only"
              ? config.lengthLimits.finalAnswerOnly
              : config.lengthLimits.full;

          let maxLength = baseMaxLength;

          // 如果启用质量评估，进行动态调整
          if (config.qualityAssessment.enabled) {
            const qualityScore =
              connectionUtils.assessContentQuality(coreContent);

            // 高质量内容获得额外长度配额
            if (qualityScore > config.qualityAssessment.qualityThreshold) {
              maxLength += config.lengthLimits.qualityBonus;
            }

            const truncatedContent =
              coreContent.length > maxLength
                ? config.smartTruncation.enabled
                  ? connectionUtils.smartTruncate(coreContent, maxLength)
                  : coreContent.substring(0, maxLength) + "..."
                : coreContent;

            // 只在控制台输出质量指示器，不添加到便签文本中
            if (config.debug.showQualityScores) {
              console.log(
                `📊 便签 "${note.title}" 质量评估: ${(
                  qualityScore * 100
                ).toFixed(0)}%`
              );
            }

            return `${index + 1}. ${
              note.title || "无标题"
            }: ${truncatedContent}`;
          } else {
            // 不启用质量评估时的简化处理
            const truncatedContent =
              coreContent.length > maxLength
                ? config.smartTruncation.enabled
                  ? connectionUtils.smartTruncate(coreContent, maxLength)
                  : coreContent.substring(0, maxLength) + "..."
                : coreContent;

            return `${index + 1}. ${
              note.title || "无标题"
            }: ${truncatedContent}`;
          }
        } catch (error) {
          console.error(`❌ 处理便签 "${note.title}" 时出错:`, error);
          // 错误恢复：使用基本格式
          const fallbackContent = note.content.substring(0, 50) + "...";
          return `${index + 1}. ${
            note.title || "无标题"
          } [处理出错]: ${fallbackContent}`;
        }
      })
      .join("\n\n");
  },

  /**
   * 智能截断：在合适的位置截断文本，避免截断到句子中间
   * 使用配置化的搜索范围参数
   */
  smartTruncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) {
      return text;
    }

    const config = getContentExtractionConfig();

    // 使用配置中的搜索范围参数
    const searchRange = Math.min(
      config.smartTruncation.maxSearchRange,
      Math.floor(maxLength * config.smartTruncation.searchRangeRatio)
    );
    const idealCutPoint = maxLength - searchRange;

    // 寻找句号、问号、感叹号等句子结束标记
    const sentenceEnders = /[。！？.!?]/g;
    let match;
    let lastGoodCutPoint = idealCutPoint;

    while ((match = sentenceEnders.exec(text)) !== null) {
      if (match.index >= idealCutPoint && match.index <= maxLength) {
        lastGoodCutPoint = match.index + 1;
        break;
      }
      if (match.index < idealCutPoint) {
        lastGoodCutPoint = match.index + 1;
      }
    }

    // 如果没找到合适的句子结束点，寻找逗号、分号等
    if (lastGoodCutPoint === idealCutPoint) {
      const phraseEnders = /[，；,;]/g;
      while ((match = phraseEnders.exec(text)) !== null) {
        if (match.index >= idealCutPoint && match.index <= maxLength) {
          lastGoodCutPoint = match.index + 1;
          break;
        }
        if (match.index < idealCutPoint) {
          lastGoodCutPoint = match.index + 1;
        }
      }
    }

    // 如果还是没找到，寻找空格
    if (lastGoodCutPoint === idealCutPoint) {
      const spaceIndex = text.lastIndexOf(" ", maxLength);
      if (spaceIndex > idealCutPoint) {
        lastGoodCutPoint = spaceIndex;
      }
    }

    return text.substring(0, lastGoodCutPoint).trim() + "...";
  },

  /**
   * 评估内容质量：基于多个维度评估提取内容的质量
   * 使用配置化的权重和调试设置
   * 返回0-1之间的分数，1表示质量最高
   */
  assessContentQuality: (content: string): number => {
    if (!content || typeof content !== "string") {
      return 0;
    }

    const config = getContentExtractionConfig();

    // 如果质量评估被禁用，返回默认分数
    if (!config.qualityAssessment.enabled) {
      return 0.5; // 中等质量分数
    }

    let score = 0;
    const factors = [];

    // 1. 长度适中性
    const length = content.trim().length;
    if (length >= 20 && length <= 500) {
      const lengthScore =
        Math.min(1, length / 200) * config.qualityAssessment.lengthWeight;
      score += lengthScore;
      factors.push(`长度: ${lengthScore.toFixed(2)}`);
    }

    // 2. 结构完整性
    const hasCompleteStructure = /[。！？.!?]$/.test(content.trim());
    const hasProperCapitalization = /^[A-Z\u4e00-\u9fff]/.test(content.trim());
    const structureScore =
      ((hasCompleteStructure ? 0.7 : 0) + (hasProperCapitalization ? 0.3 : 0)) *
      config.qualityAssessment.structureWeight;
    score += structureScore;
    factors.push(`结构: ${structureScore.toFixed(2)}`);

    // 3. 信息密度
    const sentences = content
      .split(/[。！？.!?]/)
      .filter((s) => s.trim().length > 0);
    const avgSentenceLength =
      sentences.length > 0 ? content.length / sentences.length : 0;
    const densityScore =
      (avgSentenceLength > 10 && avgSentenceLength < 100 ? 1 : 0.3) *
      config.qualityAssessment.densityWeight;
    score += densityScore;
    factors.push(`密度: ${densityScore.toFixed(2)}`);

    // 4. 关键词丰富度
    const keywordPatterns = [
      /\b(解决|方案|建议|结论|总结|分析|评估)\b/g,
      /\b(因为|所以|因此|由于|导致|结果)\b/g,
      /\b(首先|其次|最后|总之|综上)\b/g,
    ];

    let keywordCount = 0;
    keywordPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      keywordCount += matches ? matches.length : 0;
    });

    const keywordScore =
      Math.min(1, keywordCount * 0.25) * config.qualityAssessment.keywordWeight;
    score += keywordScore;
    factors.push(`关键词: ${keywordScore.toFixed(2)}`);

    if (config.debug.enabled && config.debug.showQualityScores) {
      console.log(
        `📊 内容质量评估: ${score.toFixed(2)} (${factors.join(", ")})`
      );
    }

    return Math.min(1, score);
  },

  /**
   * 验证单个便签连接的有效性
   */
  validateSingleConnection: (note: StickyNote): boolean => {
    if (!note) {
      console.warn("⚠️ 便签对象为空");
      return false;
    }

    if (!note.id || typeof note.id !== "string") {
      console.warn("⚠️ 便签ID无效:", note.id);
      return false;
    }

    if (typeof note.content !== "string") {
      console.warn("⚠️ 便签内容类型无效:", typeof note.content);
      return false;
    }

    if (typeof note.title !== "string") {
      console.warn("⚠️ 便签标题类型无效:", typeof note.title);
      return false;
    }

    if (note.content.trim().length === 0) {
      console.warn("⚠️ 便签内容为空:", note.id);
      return false;
    }

    return true;
  },

  /**
   * 生成AI提示词，包含连接的便签内容
   * 支持配置驱动的内容提取模式
   */
  generateAIPromptWithConnections: (
    userPrompt: string,
    connectedNotes: StickyNote[],
    summaryMode: "full" | "final_answer_only" = "final_answer_only"
  ): string => {
    if (connectedNotes.length === 0) return userPrompt;

    const connectionSummary = connectionUtils.getConnectionSummary(
      connectedNotes,
      summaryMode
    );

    const modeDescription =
      summaryMode === "final_answer_only"
        ? "（已智能提取核心内容，过滤思维链）"
        : "（完整内容）";

    return `基于以下已连接的便签内容${modeDescription}：

${connectionSummary}

用户请求：${userPrompt}

请根据上述便签内容和用户请求，生成相关的便签内容。`;
  },

  /**
   * 验证连接的便签是否有效
   */
  validateConnections: (connectedNotes: StickyNote[]): boolean => {
    return connectedNotes.every(
      (note) =>
        note.id &&
        typeof note.content === "string" &&
        typeof note.title === "string"
    );
  },
};
