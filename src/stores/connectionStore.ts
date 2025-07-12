// 便签连接状态管理Store
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { StickyNote } from "../components/types";
import { ConnectionMode } from "../components/canvas/StickyNoteSlots";

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
    }),
    {
      name: "connection-store", // DevTools中的名称
    }
  )
);

// 导出便签连接相关的工具函数
export const connectionUtils = {
  /**
   * 智能提取便签的核心内容
   * 优先提取最终答案部分，过滤思维链内容
   */
  extractNoteContent: (note: StickyNote): string => {
    const content = note.content;

    // 检查是否包含思维链格式的内容
    const finalAnswerMatch = content.match(
      /## ✨ 最终答案\s*\n\n([\s\S]*?)(?=\n##|$)/
    );
    if (finalAnswerMatch) {
      // 提取最终答案部分，去除多余的换行和空格
      const finalAnswer = finalAnswerMatch[1].trim();
      console.log(
        `📝 从便签 "${note.title}" 提取最终答案内容:`,
        finalAnswer.substring(0, 50) + "..."
      );
      return finalAnswer;
    }

    // 检查是否包含折叠的思维链（details标签）
    const detailsMatch = content.match(/<\/details>\s*\n+---\s*\n+([\s\S]*?)$/);
    if (detailsMatch) {
      // 提取details标签后的内容（通常是最终答案）
      const afterDetails = detailsMatch[1].trim();
      // 移除可能的"## ✨ 最终答案"标题
      const cleanContent = afterDetails
        .replace(/^## ✨ 最终答案\s*\n+/, "")
        .trim();
      console.log(
        `📝 从便签 "${note.title}" 提取折叠后内容:`,
        cleanContent.substring(0, 50) + "..."
      );
      return cleanContent;
    }

    // 如果没有思维链格式，直接返回原内容
    console.log(`📝 便签 "${note.title}" 无思维链格式，使用原始内容`);
    return content;
  },

  /**
   * 获取连接的便签内容摘要
   * 优化版：智能提取核心内容，过滤思维链
   */
  getConnectionSummary: (
    connectedNotes: StickyNote[],
    summaryMode: "full" | "final_answer_only" = "final_answer_only"
  ): string => {
    if (connectedNotes.length === 0) return "";

    return connectedNotes
      .map((note, index) => {
        // 根据配置决定内容提取方式
        const coreContent =
          summaryMode === "final_answer_only"
            ? connectionUtils.extractNoteContent(note)
            : note.content; // 完整模式直接使用原内容

        // 限制长度，避免提示词过长
        const maxLength = summaryMode === "final_answer_only" ? 200 : 100;
        const truncatedContent =
          coreContent.length > maxLength
            ? coreContent.substring(0, maxLength) + "..."
            : coreContent;

        return `${index + 1}. ${note.title || "无标题"}: ${truncatedContent}`;
      })
      .join("\n\n");
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
