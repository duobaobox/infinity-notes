// 便签连接状态管理Store
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { StickyNote } from "../components/types";
import { ConnectionMode } from "../components/canvas/StickyNoteSlots";
import {
  getContentExtractionConfig,
  type ContentExtractionConfig,
  ExtractionMode,
  getExtractionModeForLength,
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
  updateConnectionLines: (immediate?: boolean) => void; // 更新所有连接线位置，支持立即更新选项
  updateNoteConnectionLines: (noteId: string, immediate?: boolean) => void; // 更新特定便签的连接线位置，支持立即更新选项

  // 简化的配置管理
  getExtractionConfig: () => ContentExtractionConfig; // 获取当前配置
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

      // 优化后的连接线管理 - 统一接口，支持立即更新选项
      updateConnectionLines: (immediate: boolean = false) => {
        if (immediate) {
          connectionLineManager.updateConnectionPositionsImmediate();
        } else {
          connectionLineManager.updateConnectionPositions();
        }
      },

      updateNoteConnectionLines: (
        noteId: string,
        immediate: boolean = false
      ) => {
        if (immediate) {
          connectionLineManager.updateNoteConnectionsImmediate(noteId);
        } else {
          connectionLineManager.updateNoteConnections(noteId);
        }
      },

      // 简化的配置管理方法
      getExtractionConfig: () => {
        return getContentExtractionConfig();
      },
    }),
    {
      name: "connection-store", // DevTools中的名称
    }
  )
);

/**
 * 便签连接线管理器
 * 负责处理便签之间的连接关系，包括可视化连接线和内容引用关系
 */
export const connectionUtils = {
  /**
   * 获取便签在界面上显示的实际内容
   * 这是用户在界面上看到和编辑的真实内容，根据思维模式设置决定是否包含AI思考过程
   * 🎯 核心逻辑：模拟StickyNote组件中WysiwygEditor的content属性逻辑
   * @param note 便签对象
   */
  getDisplayedNoteContent: (
    note: StickyNote
  ): string => {
    // 如果便签正在编辑，返回编辑中的内容（但连接时通常不会是编辑状态）
    if (note.isEditing) {
      console.log(`📝 便签 "${note.title}" 处于编辑状态，使用完整内容`);
      return note.content;
    }

    // 🔧 修复：如果有思维链数据且不在编辑状态，总是返回最终答案（干净内容）
    // 无论思维模式开启还是关闭，连接时都应该使用干净的内容
    if (note.thinkingChain && !note.isEditing) {
      const finalAnswer = note.thinkingChain.finalAnswer || "";

      // 如果最终答案为空，回退到完整内容
      if (!finalAnswer.trim()) {
        console.log(
          `⚠️ 便签 "${note.title}" 思维链最终答案为空，回退到完整内容`
        );
        return note.content || "";
      }

      console.log(
        `🤔 便签 "${note.title}" 有思维链，使用干净的最终答案:`,
        finalAnswer.substring(0, 50) + "..."
      );
      return finalAnswer;
    }

    // 否则返回完整内容
    console.log(
      `📄 便签 "${note.title}" 使用完整内容:`,
      (note.content || "").substring(0, 50) + "..."
    );
    return note.content || "";
  },

  /**
   * 智能提取便签的核心内容
   * 优先提取最终答案部分，过滤思维链内容
   * 增强版：使用配置化的匹配模式和错误恢复机制
   * 🔧 修改：现在基于显示内容而不是原始内容进行提取
   * @param note 便签对象
   */
  extractNoteContent: (
    note: StickyNote
  ): string => {
    // 🎯 关键修改：使用显示内容而不是原始内容
    const content = connectionUtils.getDisplayedNoteContent(note);
    const config = getContentExtractionConfig();

    // 输入验证
    if (!content || typeof content !== "string") {
      console.warn(`⚠️ 便签 "${note.title}" 显示内容无效，返回空字符串`);
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
            console.log(
              `📝 从便签 "${note.title}" 提取最终答案内容 (模式匹配):`,
              finalAnswer.substring(0, 50) + "..."
            );
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
            console.log(
              `📝 从便签 "${note.title}" 提取折叠后内容:`,
              afterDetails.substring(0, 50) + "..."
            );
            return afterDetails;
          }
        }
      }

      // 智能内容分析：尝试识别结构化内容的核心部分
      const intelligentExtraction =
        connectionUtils.intelligentContentExtraction(content);
      if (intelligentExtraction && intelligentExtraction !== content) {
        console.log(
          `📝 从便签 "${note.title}" 智能提取核心内容:`,
          intelligentExtraction.substring(0, 50) + "..."
        );
        return intelligentExtraction;
      }

      // 如果没有思维链格式，直接返回原内容
      console.log(`📝 便签 "${note.title}" 无特殊格式，使用原始内容`);
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
    try {
      // 按段落分割内容
      const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim());

      if (paragraphs.length <= 1) {
        return content; // 内容太短，直接返回
      }

      // 查找可能的核心段落（通常在后半部分）
      const coreStartIndex = Math.floor(paragraphs.length * 0.4); // 从40%位置开始查找
      const coreParagraphs = paragraphs.slice(coreStartIndex);

      // 🔧 简化版本：使用固定的思维关键词进行过滤
      const thinkingKeywords = [
        "思考",
        "分析",
        "推理",
        "考虑",
        "判断",
        "评估",
        "思路",
        "想法",
      ];

      const filteredParagraphs = coreParagraphs.filter((paragraph) => {
        const lowerParagraph = paragraph.toLowerCase();

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
      console.warn("智能内容提取失败:", error);
      return content;
    }
  },

  /**
   * 获取连接的便签内容摘要
   * 增强版：使用配置化的长度限制和质量评估
   * 🔧 修改：基于显示内容生成摘要，确保不包含AI思考过程
   * @param connectedNotes 连接的便签列表
   * @param summaryMode 摘要模式
   */
  getConnectionSummary: (
    connectedNotes: StickyNote[],
    summaryMode: "full" | "final_answer_only" = "final_answer_only"
  ): string => {
    if (connectedNotes.length === 0) return "";

    const config = getContentExtractionConfig();

    // 验证输入数据 - 检查显示内容而不是原始内容
    const validNotes = connectedNotes.filter((note) => {
      const displayedContent = connectionUtils.getDisplayedNoteContent(note);
      return (
        note.id &&
        typeof displayedContent === "string" &&
        displayedContent.trim().length > 0 &&
        typeof note.title === "string"
      );
    });

    if (validNotes.length === 0) {
      console.warn("⚠️ 没有有效的连接便签（显示内容为空）");
      return "";
    }

    if (validNotes.length !== connectedNotes.length) {
      console.warn(
        `⚠️ ${
          connectedNotes.length - validNotes.length
        } 个便签显示内容无效，已过滤`
      );
    }

    return validNotes
      .map((note, index) => {
        try {
          // 🔧 修改：根据配置决定内容提取方式，但都基于显示内容
          const coreContent =
            summaryMode === "final_answer_only"
              ? connectionUtils.extractNoteContent(note) // 这个函数内部已经使用显示内容
              : connectionUtils.getDisplayedNoteContent(note); // 完整模式使用显示内容

          // 验证提取的内容
          if (!coreContent || typeof coreContent !== "string") {
            console.warn(
              `⚠️ 便签 "${note.title}" 提取的核心内容无效:`,
              coreContent
            );
            throw new Error(`提取的核心内容无效: ${typeof coreContent}`);
          }

          // 🔧 适配简化配置：使用新的配置结构
          const maxLength = config.smartMode.maxLength;

          // 简化处理：直接使用配置的最大长度进行截断
          const truncatedContent =
            coreContent.length > maxLength
              ? config.smartMode.enableSmartTruncation
                ? connectionUtils.smartTruncate(coreContent, maxLength)
                : coreContent.substring(0, maxLength) + "..."
              : coreContent;

          return `${index + 1}. ${note.title || "无标题"}: ${truncatedContent}`;
        } catch (error) {
          console.error(`❌ 处理便签 "${note.title}" 时出错:`, error);
          // 错误恢复：使用显示内容作为基本格式
          const displayedContent =
            connectionUtils.getDisplayedNoteContent(note);
          const fallbackContent = displayedContent.substring(0, 50) + "...";
          return `${index + 1}. ${
            note.title || "无标题"
          } [处理出错]: ${fallbackContent}`;
        }
      })
      .join("\n\n");
  },

  /**
   * 智能截断：在合适的位置截断文本，避免截断到句子中间
   * 🔧 简化版本：使用固定的搜索范围参数
   */
  smartTruncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) {
      return text;
    }

    // 🔧 简化配置：使用固定的搜索范围参数
    const searchRange = Math.min(50, Math.floor(maxLength * 0.2)); // 最多搜索50字符或20%的长度
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
   * 🔧 简化版本：使用固定的评估规则
   * 返回0-1之间的分数，1表示质量最高
   */
  assessContentQuality: (content: string): number => {
    if (!content || typeof content !== "string") {
      return 0;
    }

    // 🔧 简化版本：直接返回基于长度和结构的简单评估
    const length = content.trim().length;
    if (length < 10) return 0.2; // 太短
    if (length > 1000) return 0.6; // 太长

    // 基于长度的基础分数
    const lengthScore = Math.min(1, length / 200) * 0.5;

    // 结构完整性评估
    const hasCompleteStructure = /[。！？.!?]$/.test(content.trim());
    const hasProperStart = /^[A-Z\u4e00-\u9fff]/.test(content.trim());
    const structureScore =
      (hasCompleteStructure ? 0.3 : 0) + (hasProperStart ? 0.2 : 0);

    // 最终分数
    const finalScore = Math.min(1, lengthScore + structureScore);

    return finalScore;
  },

  /**
   * 生成AI提示词，包含连接的便签内容
   * 🎯 统一函数：自动根据字数选择精准模式或智能模式，并返回详细信息
   */
  generateAIPromptWithConnections: (
    userPrompt: string,
    connectedNotes: StickyNote[]
  ): {
    prompt: string;
    mode: ExtractionMode | null;
    totalLength: number;
    noteCount: number;
  } => {
    if (connectedNotes.length === 0) {
      return {
        prompt: userPrompt,
        mode: null,
        totalLength: 0,
        noteCount: 0,
      };
    }

    // 计算总字数
    const totalLength = connectionUtils.calculateTotalLength(connectedNotes);

    // 自动选择模式
    const selectedMode = connectionUtils.getAutoExtractionMode(connectedNotes);

    // 根据模式选择处理方式
    const summaryMode =
      selectedMode === ExtractionMode.SMART ? "final_answer_only" : "full";
    const connectionSummary = connectionUtils.getConnectionSummary(
      connectedNotes,
      summaryMode
    );

    const modeDescription =
      selectedMode === ExtractionMode.SMART
        ? "（智能模式：已提取核心内容）"
        : "（精准模式：完整内容）";

    const finalPrompt = `基于以下已连接的便签内容${modeDescription}：

${connectionSummary}

用户请求：${userPrompt}

请根据上述便签内容和用户请求，生成相关的便签内容。`;

    return {
      prompt: finalPrompt,
      mode: selectedMode,
      totalLength,
      noteCount: connectedNotes.length,
    };
  },

  /**
   * 验证连接的便签是否有效
   * 🔧 修改：检查显示内容而不是原始内容
   */
  validateConnections: (connectedNotes: StickyNote[]): boolean => {
    return connectedNotes.every((note) => {
      const displayedContent = connectionUtils.getDisplayedNoteContent(note);
      return (
        note.id &&
        typeof displayedContent === "string" &&
        displayedContent.trim().length > 0 &&
        typeof note.title === "string"
      );
    });
  },

  /**
   * 验证单个便签连接是否有效
   * 🔧 修改：检查显示内容而不是原始内容
   */
  validateSingleConnection: (note: StickyNote): boolean => {
    const displayedContent = connectionUtils.getDisplayedNoteContent(note);
    return (
      !!note.id &&
      typeof displayedContent === "string" &&
      displayedContent.trim().length > 0 &&
      typeof note.title === "string"
    );
  },

  /**
   * 计算所有连接便签的总字数
   * 🎯 新功能：用于自动选择精准模式或智能模式
   * @param connectedNotes 连接的便签列表
   * @returns 总字数
   */
  calculateTotalLength: (connectedNotes: StickyNote[]): number => {
    if (connectedNotes.length === 0) return 0;

    const totalLength = connectedNotes.reduce((total, note) => {
      const displayedContent = connectionUtils.getDisplayedNoteContent(note);
      return total + displayedContent.length;
    }, 0);

    console.log(
      `📊 连接便签总字数: ${totalLength}字 (共${connectedNotes.length}个便签)`
    );
    return totalLength;
  },

  /**
   * 根据连接便签的总字数自动选择提取模式
   * 🎯 核心功能：超过1000字自动切换智能模式，否则使用精准模式
   * @param connectedNotes 连接的便签列表
   * @returns 提取模式
   */
  getAutoExtractionMode: (connectedNotes: StickyNote[]): ExtractionMode => {
    const totalLength = connectionUtils.calculateTotalLength(connectedNotes);
    const mode = getExtractionModeForLength(totalLength);

    console.log(
      `🎯 自动选择模式: ${
        mode === ExtractionMode.SMART ? "智能模式" : "精准模式"
      } (基于${totalLength}字)`
    );
    return mode;
  },
};
