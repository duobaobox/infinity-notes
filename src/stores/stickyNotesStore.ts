// 便签状态管理Store
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import type { StickyNote } from "../components/types";
import type { Canvas } from "../database";
import { getDatabaseAdapter, initializeDatabase } from "../database";
import { cacheManager } from "../database/CacheManager";
import { connectionLineManager } from "../utils/connectionLineManager";
import { useCanvasStore } from "./canvasStore";
import { useConnectionStore } from "./connectionStore";
import { useUIStore } from "./uiStore";

// 便签状态接口
export interface StickyNotesState {
  // 便签数据
  notes: StickyNote[];
  loading: boolean; // 初始化加载状态
  operationLoading: boolean; // 操作加载状态（添加、删除等）
  error: string | null;

  // 流式便签状态
  streamingNotes: Map<
    string,
    {
      note: StickyNote;
      streamingContent: string;
      isStreaming: boolean;
    }
  >;

  // 选中状态管理
  selectedNoteId: string | null; // 当前选中的便签ID

  // 画布管理
  currentCanvasId: string | null;
  canvases: Canvas[];
  canvasLoading: boolean;
}

// 便签操作接口
export interface StickyNotesActions {
  // 基础CRUD操作
  addNote: (
    note: Partial<Omit<StickyNote, "id" | "createdAt" | "updatedAt">> &
      Pick<StickyNote, "x" | "y" | "content">,
    noteType?: "manual" | "ai" // 便签类型，用于确定默认尺寸
  ) => Promise<StickyNote>;
  updateNote: (id: string, updates: Partial<StickyNote>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  bringNoteToFront: (id: string) => Promise<void>;

  // 批量操作
  clearAllNotes: () => Promise<void>;
  loadNotes: () => Promise<void>;

  // 流式便签操作
  startStreamingNote: (noteId: string, note: StickyNote) => void;
  updateStreamingContent: (noteId: string, content: string) => void;
  finishStreamingNote: (noteId: string, finalContent: string) => Promise<void>;
  cancelStreamingNote: (noteId: string) => void;

  // 画布操作
  loadCanvases: () => Promise<void>;
  switchCanvas: (canvasId: string) => Promise<void>;
  createCanvas: (name: string, description?: string) => Promise<string>;
  updateCanvas: (
    canvasId: string,
    updates: { name?: string; description?: string }
  ) => Promise<void>;
  deleteCanvas: (canvasId: string) => Promise<void>;

  // 状态管理
  setLoading: (loading: boolean) => void;
  setOperationLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 选中状态操作
  selectNote: (id: string) => void; // 选中便签
  clearSelection: () => void; // 清除选中状态
  isNoteSelected: (id: string) => boolean; // 检查便签是否被选中

  // 便签统计
  getCanvasNotesCount: (canvasId: string) => Promise<number>;

  // 初始化
  initialize: () => Promise<void>;
}

// 创建便签Store
export const useStickyNotesStore = create<
  StickyNotesState & StickyNotesActions
>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // 初始状态
      notes: [],
      loading: false, // 初始化加载状态
      operationLoading: false, // 操作加载状态
      error: null,
      streamingNotes: new Map(),
      selectedNoteId: null, // 初始化选中状态
      currentCanvasId: null,
      canvases: [],
      canvasLoading: false,

      // 基础CRUD操作
      addNote: async (noteData, noteType = "manual") => {
        try {
          set({ operationLoading: true, error: null });

          // 获取便签尺寸设置
          const { appearance } = useUIStore.getState();

          // 根据便签类型确定默认尺寸
          const defaultWidth =
            noteType === "ai"
              ? appearance.aiNoteDefaultWidth
              : appearance.manualNoteDefaultWidth;
          const defaultHeight =
            noteType === "ai"
              ? appearance.aiNoteDefaultHeight
              : appearance.manualNoteDefaultHeight;

          // 创建新便签对象，使用默认值和传入的数据
          const newNote: StickyNote = {
            id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            width: defaultWidth,
            height: defaultHeight,
            color: "yellow",
            title: "",
            isEditing: false,
            isTitleEditing: false,
            isNew: false,
            zIndex: 1,
            ...noteData,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // 保存到数据库
          const adapter = getDatabaseAdapter();
          await adapter.addNote(newNote);

          // 更新状态
          set((state) => ({
            notes: [...state.notes, newNote],
            operationLoading: false,
          }));

          console.log("✅ 便签添加成功:", newNote.id);
          return newNote;
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "添加便签失败";
          console.error("❌ 添加便签失败:", error);
          set({ error: errorMsg, operationLoading: false });
          throw error;
        }
      },

      updateNote: async (id, updates) => {
        try {
          set({ error: null });

          const currentNotes = get().notes;
          const noteIndex = currentNotes.findIndex((note) => note.id === id);

          if (noteIndex === -1) {
            throw new Error("便签不存在");
          }

          const updatedNote = {
            ...currentNotes[noteIndex],
            ...updates,
            updatedAt: new Date(),
          };

          // 保存到数据库
          const adapter = getDatabaseAdapter();
          await adapter.updateNote(updatedNote);

          // 更新状态
          set((state) => ({
            notes: state.notes.map((note) =>
              note.id === id ? updatedNote : note
            ),
          }));
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "更新便签失败";
          set({ error: errorMsg });
          throw error;
        }
      },

      deleteNote: async (id) => {
        try {
          set({ operationLoading: true, error: null });

          // 从连接中移除该便签
          useConnectionStore.getState().removeConnection(id);

          // 在删除之前，先查找所有引用这个便签作为源便签的其他便签
          const currentNotes = get().notes;
          const notesToUpdate = currentNotes.filter(
            (note) => note.sourceNoteIds && note.sourceNoteIds.includes(id)
          );

          // 从数据库删除目标便签
          const adapter = getDatabaseAdapter();
          await adapter.deleteNote(id);

          // 更新所有引用了被删除便签的溯源便签
          for (const noteToUpdate of notesToUpdate) {
            const updatedSourceNoteIds = noteToUpdate.sourceNoteIds!.filter(
              (sourceId) => sourceId !== id
            );

            // 更新便签的溯源信息
            const updatedNote = {
              ...noteToUpdate,
              sourceNoteIds:
                updatedSourceNoteIds.length > 0
                  ? updatedSourceNoteIds
                  : undefined,
              updatedAt: new Date(),
            };

            // 保存到数据库
            await adapter.updateNote(updatedNote);

            console.log(
              `🔗 更新便签 "${noteToUpdate.title}" 的溯源信息，移除已删除的源便签 ${id}`
            );
          }

          // 更新状态 - 删除目标便签并更新相关便签的溯源信息
          set((state) => ({
            notes: state.notes
              .filter((note) => note.id !== id) // 删除目标便签
              .map((note) => {
                // 更新其他便签的溯源信息
                if (note.sourceNoteIds && note.sourceNoteIds.includes(id)) {
                  const updatedSourceNoteIds = note.sourceNoteIds.filter(
                    (sourceId) => sourceId !== id
                  );
                  return {
                    ...note,
                    sourceNoteIds:
                      updatedSourceNoteIds.length > 0
                        ? updatedSourceNoteIds
                        : undefined,
                    updatedAt: new Date(),
                  };
                }
                return note;
              }),
            operationLoading: false,
          }));

          // 如果是流式便签，也要清理流式状态
          const streamingNotes = get().streamingNotes;
          if (streamingNotes.has(id)) {
            streamingNotes.delete(id);
            set({ streamingNotes: new Map(streamingNotes) });
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "删除便签失败";
          set({ error: errorMsg, operationLoading: false });
          throw error;
        }
      },

      bringNoteToFront: async (id) => {
        try {
          const currentNotes = get().notes;
          const note = currentNotes.find((n) => n.id === id);

          if (note) {
            const maxZIndex = Math.max(...currentNotes.map((n) => n.zIndex), 0);
            await get().updateNote(id, { zIndex: maxZIndex + 1 });
          }
        } catch (error) {
          console.error("置顶便签失败:", error);
        }
      },

      clearAllNotes: async () => {
        try {
          set({ loading: true, error: null });

          const adapter = getDatabaseAdapter();
          const notes = get().notes;

          // 批量删除所有便签（更高效的方式）
          for (const note of notes) {
            await adapter.deleteNote(note.id);
          }

          // 直接清空状态，因为所有便签都被删除了，不需要处理溯源关系
          set({
            notes: [],
            streamingNotes: new Map(),
            loading: false,
          });

          console.log(`🗑️ 已清空所有便签，共删除 ${notes.length} 个便签`);
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "清空便签失败";
          set({ error: errorMsg, loading: false });
          throw error;
        }
      },

      loadNotes: async () => {
        try {
          set({ loading: true, error: null });

          const adapter = getDatabaseAdapter();
          const loadedNotes = await adapter.getAllNotes();

          // 清理无效的溯源引用
          const noteIds = new Set(loadedNotes.map((note) => note.id));
          const notesToUpdate: typeof loadedNotes = [];
          const cleanedNotes = loadedNotes.map((note) => {
            if (note.sourceNoteIds && note.sourceNoteIds.length > 0) {
              const validSourceIds = note.sourceNoteIds.filter((id) =>
                noteIds.has(id)
              );

              if (validSourceIds.length !== note.sourceNoteIds.length) {
                const invalidIds = note.sourceNoteIds.filter(
                  (id) => !validSourceIds.includes(id)
                );
                console.warn(
                  `便签 "${note.title}" 存在无效的溯源引用: ${invalidIds.join(
                    ", "
                  )}，已自动清理`
                );

                const cleanedNote = {
                  ...note,
                  sourceNoteIds:
                    validSourceIds.length > 0 ? validSourceIds : undefined,
                  updatedAt: new Date(),
                };

                notesToUpdate.push(cleanedNote);
                return cleanedNote;
              }
            }
            return note;
          });

          // 批量更新需要清理的便签到数据库
          for (const noteToUpdate of notesToUpdate) {
            await adapter.updateNote(noteToUpdate);
          }

          if (notesToUpdate.length > 0) {
            console.log(
              `🔧 已清理 ${notesToUpdate.length} 个便签的无效溯源引用`
            );
          }

          set({
            notes: cleanedNotes,
            currentCanvasId: adapter.getCurrentCanvasId(),
            loading: false,
          });
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "加载便签失败";
          set({ error: errorMsg, loading: false });
          throw error;
        }
      },

      // 流式便签操作
      startStreamingNote: (noteId, note) => {
        const streamingNotes = get().streamingNotes;
        streamingNotes.set(noteId, {
          note,
          streamingContent: "",
          isStreaming: true,
        });
        set({ streamingNotes: new Map(streamingNotes) });
      },

      updateStreamingContent: (noteId, content) => {
        const streamingNotes = get().streamingNotes;
        const streamingNote = streamingNotes.get(noteId);

        if (streamingNote) {
          console.log("📝 更新流式内容:", {
            noteId,
            contentLength: content.length,
            contentPreview: content.substring(0, 50) + "...",
          });
          streamingNotes.set(noteId, {
            ...streamingNote,
            streamingContent: content,
          });
          set({ streamingNotes: new Map(streamingNotes) });
        } else {
          console.warn("⚠️ 未找到流式便签:", noteId);
        }
      },

      finishStreamingNote: async (noteId, finalContent) => {
        try {
          const streamingNotes = get().streamingNotes;
          const streamingNote = streamingNotes.get(noteId);

          if (streamingNote) {
            // 更新便签内容
            await get().updateNote(noteId, { content: finalContent });

            // 清理流式状态
            streamingNotes.delete(noteId);
            set({ streamingNotes: new Map(streamingNotes) });
          }
        } catch (error) {
          console.error("完成流式便签失败:", error);
          get().cancelStreamingNote(noteId);
        }
      },

      cancelStreamingNote: (noteId) => {
        const streamingNotes = get().streamingNotes;
        streamingNotes.delete(noteId);
        set({ streamingNotes: new Map(streamingNotes) });
      },

      // 画布管理操作
      loadCanvases: async () => {
        try {
          set({ canvasLoading: true, error: null });

          const adapter = getDatabaseAdapter();
          // 使用按创建时间排序的方法，用于界面显示
          const canvases = await adapter.getUserCanvasesForDisplay();

          set({
            canvases,
            canvasLoading: false,
          });

          console.log(
            "✅ 画布列表加载成功（按创建时间排序）:",
            canvases.length
          );
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "加载画布列表失败";
          console.error("❌ 加载画布列表失败:", error);
          set({ error: errorMsg, canvasLoading: false });
          throw error;
        }
      },

      switchCanvas: async (canvasId) => {
        try {
          // 不设置全局loading状态，避免侧边栏闪烁
          set({ error: null });

          const adapter = getDatabaseAdapter();
          adapter.setCurrentCanvas(canvasId);

          // 清除所有连接线（包括普通连接线和溯源连接线）
          connectionLineManager.clearAllConnectionsIncludingSource();
          console.log("🔗 已清除所有连接线");

          // 清除连接状态
          const connectionStore = useConnectionStore.getState();
          connectionStore.clearAllConnections();
          console.log("🔗 已清除连接状态");

          // 重置画布视图状态（缩放、偏移等）
          const canvasStore = useCanvasStore.getState();
          canvasStore.resetView();
          console.log("🎨 已重置画布视图状态");

          // 修复：确保画布重置后便签状态能正确同步
          // 强制触发一次状态更新，确保虚拟化逻辑能重新计算
          setTimeout(() => {
            const currentNotes = get().notes;
            // 通过重新设置notes数组来强制触发重新渲染
            set({ notes: [...currentNotes] });
            console.log("🔄 已强制更新便签状态，确保虚拟化重新计算");
          }, 50);

          // 清除相关缓存，确保加载最新数据
          cacheManager.deleteByPrefix("notes_by_canvas");
          console.log("🧹 已清除画布便签缓存");

          // 先更新当前画布ID，清除选中状态，让UI立即响应
          set({ currentCanvasId: canvasId, selectedNoteId: null });

          // 异步加载便签，使用局部loading状态
          const loadNotesWithoutGlobalLoading = async () => {
            try {
              const loadedNotes = await adapter.getAllNotes();

              // 处理便签数据
              const processedNotes = loadedNotes.map((note) => ({
                ...note,
              }));

              // 更新便签状态，不影响全局loading
              set({
                notes: processedNotes,
                streamingNotes: new Map(),
              });

              console.log(
                `📝 画布 ${canvasId} 便签加载完成:`,
                processedNotes.length
              );
            } catch (error) {
              console.error("❌ 加载便签失败:", error);
              // 只在便签加载失败时设置错误，不影响画布切换
              set({ error: "加载便签失败" });
            }
          };

          // 异步执行便签加载，不阻塞画布切换
          loadNotesWithoutGlobalLoading();

          console.log("✅ 画布切换成功:", canvasId);
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "切换画布失败";
          console.error("❌ 切换画布失败:", error);
          set({ error: errorMsg });
          throw error;
        }
      },

      createCanvas: async (name, description) => {
        try {
          set({ canvasLoading: true, error: null });

          const adapter = getDatabaseAdapter();
          const canvasId = await adapter.createCanvas(name, description);

          // 重新加载画布列表
          await get().loadCanvases();

          // 自动切换到新创建的画布
          await get().switchCanvas(canvasId);

          console.log("✅ 画布创建成功并已切换:", canvasId);
          return canvasId;
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "创建画布失败";
          console.error("❌ 创建画布失败:", error);
          set({ error: errorMsg, canvasLoading: false });
          throw error;
        } finally {
          set({ canvasLoading: false });
        }
      },

      updateCanvas: async (canvasId, updates) => {
        try {
          set({ canvasLoading: true, error: null });

          const adapter = getDatabaseAdapter();
          await adapter.updateCanvas(canvasId, updates);

          // 重新加载画布列表以更新UI
          await get().loadCanvases();

          console.log("✅ 画布更新成功:", canvasId, updates);
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "更新画布失败";
          console.error("❌ 更新画布失败:", error);
          set({ error: errorMsg, canvasLoading: false });
          throw error;
        } finally {
          set({ canvasLoading: false });
        }
      },

      deleteCanvas: async (canvasId) => {
        try {
          set({ canvasLoading: true, error: null });

          const adapter = getDatabaseAdapter();
          const canvases = get().canvases;

          // 检查是否是默认画布
          const canvasToDelete = canvases.find((c) => c.id === canvasId);
          if (canvasToDelete?.is_default) {
            throw new Error("默认画布不能被删除");
          }

          // 检查是否是最后一个画布
          if (canvases.length <= 1) {
            throw new Error("至少需要保留一个画布");
          }

          await adapter.deleteCanvas(canvasId);

          // 如果删除的是当前画布，切换到第一个可用画布
          const currentCanvasId = get().currentCanvasId;
          if (currentCanvasId === canvasId) {
            const remainingCanvases = canvases.filter((c) => c.id !== canvasId);
            if (remainingCanvases.length > 0) {
              await get().switchCanvas(remainingCanvases[0].id);
            }
          }

          // 重新加载画布列表
          await get().loadCanvases();

          console.log("✅ 画布删除成功:", canvasId);
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "删除画布失败";
          console.error("❌ 删除画布失败:", error);
          set({ error: errorMsg, canvasLoading: false });
          throw error;
        } finally {
          set({ canvasLoading: false });
        }
      },

      // 状态管理
      setLoading: (loading) => set({ loading }),
      setOperationLoading: (operationLoading) => set({ operationLoading }),
      setError: (error) => set({ error }),

      // 选中状态操作
      selectNote: (id) => {
        set({ selectedNoteId: id });
      },
      clearSelection: () => {
        set({ selectedNoteId: null });
      },
      isNoteSelected: (id) => {
        return get().selectedNoteId === id;
      },

      // 便签统计
      getCanvasNotesCount: async (canvasId) => {
        try {
          const adapter = getDatabaseAdapter();
          return await adapter.getCanvasNotesCount(canvasId);
        } catch (error) {
          console.error("❌ 获取画布便签数量失败:", error);
          return 0;
        }
      },

      // 初始化
      initialize: async () => {
        try {
          console.log("📝 便签Store: 开始初始化...");

          // 首先确保数据库已初始化
          console.log("📝 便签Store: 初始化数据库...");
          await initializeDatabase();
          console.log("📝 便签Store: 数据库初始化完成");

          // 加载画布列表
          console.log("📝 便签Store: 加载画布列表...");
          await get().loadCanvases();
          console.log("📝 便签Store: 画布列表加载完成");

          // 然后加载便签数据
          console.log("📝 便签Store: 加载便签数据...");
          await get().loadNotes();
          console.log("📝 便签Store: 便签数据加载完成");

          // 注意：不再监听 notesChanged 事件，因为我们现在直接管理状态
          // 避免重复的数据加载导致页面"刷新"感觉
          console.log("📝 便签Store: 跳过事件监听，使用直接状态管理");

          console.log("✅ 便签Store: 初始化完成");
        } catch (error) {
          console.error("❌ 便签Store: 初始化失败:", error);
          set({ error: "初始化失败" });
          throw error; // 重新抛出错误，让调用者知道初始化失败
        }
      },
    })),
    {
      name: "sticky-notes-store", // DevTools中的名称
    }
  )
);
