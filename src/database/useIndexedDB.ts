import { useCallback, useEffect, useState } from "react";
import type { StickyNote } from "../components/types";
import { IndexedDBAdapter } from "./IndexedDBAdapter";
import { IndexedDBService } from "./IndexedDBService";

// 创建事件系统来同步数据
class DatabaseEventEmitter {
  private listeners: { [key: string]: ((...args: unknown[]) => void)[] } = {};

  on(event: string, callback: (...args: unknown[]) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: (...args: unknown[]) => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  emit(event: string, ...args: unknown[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(...args));
    }
  }
}

// 创建全局事件实例
const databaseEvents = new DatabaseEventEmitter();

/**
 * 导出数据库事件系统供其他组件使用
 */
export { databaseEvents };

// 全局服务实例
let globalDbService: IndexedDBService | null = null;
let globalDbAdapter: IndexedDBAdapter | null = null;

/**
 * 获取 IndexedDB 服务实例
 */
export function getDatabaseService(): IndexedDBService {
  if (!globalDbService) {
    globalDbService = IndexedDBService.getInstance();
  }
  return globalDbService;
}

/**
 * 获取 IndexedDB 适配器实例
 */
export function getDatabaseAdapter(): IndexedDBAdapter {
  if (!globalDbAdapter) {
    const dbService = getDatabaseService();
    const userId = "default_user"; // 在实际应用中，这应该来自用户认证
    globalDbAdapter = new IndexedDBAdapter(dbService, userId);
  }
  return globalDbAdapter;
}

/**
 * 检查数据库是否已初始化
 */
export function isDatabaseInitialized(): boolean {
  const dbService = getDatabaseService();
  return dbService.isInitialized();
}

/**
 * 初始化数据库
 */
export async function initializeDatabase(): Promise<void> {
  const dbService = getDatabaseService();

  try {
    await dbService.initialize();

    // 检查默认用户是否存在，如果不存在才创建
    let defaultUser = null;
    try {
      defaultUser = await dbService.getUserById("default_user");
    } catch (error) {
      console.log("检查默认用户时出错，可能是首次运行:", error);
    }

    if (!defaultUser) {
      try {
        await dbService.createUser({
          id: "default_user",
          username: "user",
          email: "user@example.com",
          // display_name: "用户", // 移除不存在的属性
        });
      } catch (error) {
        // 如果用户已存在，忽略错误
        if (
          !(error instanceof Error) ||
          !error.message.includes("already exists")
        ) {
          throw error;
        }
      }
    }

    // 确保默认画布存在
    const adapter = getDatabaseAdapter();
    await adapter.ensureDefaultCanvas();
  } catch (error) {
    console.error("数据库初始化过程中出错:", error);
    throw error;
  }
}

/**
 * 重置数据库
 */
export async function resetDatabase(): Promise<void> {
  const dbService = getDatabaseService();
  await dbService.reset();

  // 重置全局实例
  globalDbService = null;
  globalDbAdapter = null;

  // 重新初始化
  await initializeDatabase();
}

/**
 * 数据库Hook - 提供便签的CRUD操作
 */
export function useDatabase() {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCanvasId, setCurrentCanvasId] = useState<string | null>(null);

  // 初始化数据库并加载便签
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError(null);

        await initializeDatabase();
        const adapter = getDatabaseAdapter();
        const loadedNotes = await adapter.getAllNotes();
        setNotes(loadedNotes);

        // 获取当前画布ID
        setCurrentCanvasId(adapter.getCurrentCanvasId());
      } catch (err) {
        console.error("IndexedDB 初始化失败:", err);
        setError(err instanceof Error ? err.message : "数据库初始化失败");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // 添加便签
  const addNote = useCallback(async (note: StickyNote): Promise<void> => {
    try {
      const adapter = getDatabaseAdapter();
      await adapter.addNote(note);
      setNotes((prev) => [...prev, note]);

      // 注意：不再触发事件，使用Zustand状态管理
      // databaseEvents.emit("notesChanged");
    } catch (err) {
      console.error("添加便签失败:", err);
      setError(err instanceof Error ? err.message : "添加便签失败");
      throw err;
    }
  }, []);

  // 更新便签
  const updateNote = useCallback(
    async (updatedNote: StickyNote): Promise<void> => {
      try {
        const adapter = getDatabaseAdapter();
        await adapter.updateNote(updatedNote);
        setNotes((prev) =>
          prev.map((note) => (note.id === updatedNote.id ? updatedNote : note))
        );

        // 注意：不再触发事件，使用Zustand状态管理
        // databaseEvents.emit("notesChanged");
      } catch (err) {
        console.error("更新便签失败:", err);
        setError(err instanceof Error ? err.message : "更新便签失败");
        throw err;
      }
    },
    []
  );

  // 删除便签
  const deleteNote = useCallback(async (noteId: string): Promise<void> => {
    try {
      const adapter = getDatabaseAdapter();
      await adapter.deleteNote(noteId);
      setNotes((prev) => prev.filter((note) => note.id !== noteId));

      // 注意：不再触发事件，使用Zustand状态管理
      // databaseEvents.emit("notesChanged");
    } catch (err) {
      console.error("删除便签失败:", err);
      setError(err instanceof Error ? err.message : "删除便签失败");
      throw err;
    }
  }, []);

  // 批量更新便签位置
  const updateNotesPositions = useCallback(
    async (updatedNotes: StickyNote[]): Promise<void> => {
      try {
        const adapter = getDatabaseAdapter();
        await adapter.updateNotesPositions(updatedNotes);
        setNotes((prev) =>
          prev.map((note) => {
            const updatedNote = updatedNotes.find((u) => u.id === note.id);
            return updatedNote
              ? { ...note, x: updatedNote.x, y: updatedNote.y }
              : note;
          })
        );
      } catch (err) {
        console.error("批量更新位置失败:", err);
        setError(err instanceof Error ? err.message : "批量更新位置失败");
        throw err;
      }
    },
    []
  );

  // 搜索便签
  const searchNotes = useCallback(
    async (keyword: string): Promise<StickyNote[]> => {
      try {
        const adapter = getDatabaseAdapter();
        const dbService = getDatabaseService();
        const canvasId = adapter.getCurrentCanvasId();
        if (!canvasId) {
          console.warn("没有当前画布，无法搜索便签");
          return [];
        }
        const dbNotes = await dbService.searchNotes(canvasId, keyword);
        return dbNotes.map((note) => ({
          id: note.id,
          x: note.position_x,
          y: note.position_y,
          width: note.width,
          height: note.height,
          content: note.content,
          title: note.title,
          color:
            (note.color as "yellow" | "blue" | "green" | "pink" | "purple") ||
            "yellow",
          fontSize: note.font_size || 14,
          zIndex: note.z_index || 1,
          isEditing: false,
          isTitleEditing: false,
          isNew: false,
          createdAt: new Date(note.created_at),
          updatedAt: new Date(note.updated_at),
        }));
      } catch (err) {
        console.error("搜索便签失败:", err);
        setError(err instanceof Error ? err.message : "搜索便签失败");
        return [];
      }
    },
    []
  );

  // 获取统计信息
  const getStats = useCallback(async () => {
    try {
      // 检查数据库是否已初始化
      if (!isDatabaseInitialized()) {
        console.warn("数据库未初始化，正在初始化...");
        await initializeDatabase();
      }

      const adapter = getDatabaseAdapter();
      return await adapter.getNotesStats();
    } catch (err) {
      console.error("获取统计信息失败:", err);
      setError(err instanceof Error ? err.message : "获取统计信息失败");
      return { totalNotes: 0, notesByCanvas: [] };
    }
  }, []);

  // 刷新便签列表
  const refreshNotes = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const adapter = getDatabaseAdapter();
      const loadedNotes = await adapter.getAllNotes();
      setNotes(loadedNotes);
    } catch (err) {
      console.error("刷新便签失败:", err);
      setError(err instanceof Error ? err.message : "刷新便签失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // 导出数据
  const exportData = useCallback(async () => {
    try {
      const adapter = getDatabaseAdapter();
      const data = await adapter.exportAllData();

      // 创建下载链接
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sticky-notes-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return data;
    } catch (err) {
      console.error("导出数据失败:", err);
      setError(err instanceof Error ? err.message : "导出数据失败");
      throw err;
    }
  }, []);

  // 导入数据
  const importData = useCallback(
    async (file: File): Promise<void> => {
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        const adapter = getDatabaseAdapter();
        await adapter.importAllData(data);

        // 刷新数据
        await refreshNotes();
      } catch (err) {
        console.error("导入数据失败:", err);
        setError(err instanceof Error ? err.message : "导入数据失败");
        throw err;
      }
    },
    [refreshNotes]
  );

  // 获取存储信息
  const getStorageInfo = useCallback(async () => {
    try {
      const adapter = getDatabaseAdapter();
      return await adapter.getStorageInfo();
    } catch (err) {
      console.error("获取存储信息失败:", err);
      return { used: 0, total: 0 };
    }
  }, []);

  // 清空数据库（简单暴力版本 - 直接删除整个数据库）
  const clearDatabase = useCallback(async (): Promise<void> => {
    try {
      console.log("🗑️ 开始清空数据库（删除整个数据库）...");

      const adapter = getDatabaseAdapter();
      await adapter.clearDatabase();

      // 重置所有状态
      setNotes([]);
      setCurrentCanvasId(null);
      setLoading(false);
      setError(null);

      // 重置全局实例
      globalDbService = null;
      globalDbAdapter = null;

      // 注意：不再触发事件，使用Zustand状态管理
      // databaseEvents.emit("notesChanged");

      console.log("🗑️ 数据库已完全删除，开始重新初始化...");

      // 重新初始化数据库
      try {
        setLoading(true);
        await initializeDatabase();
        const newAdapter = getDatabaseAdapter();
        await newAdapter.ensureDefaultCanvas();
        const currentId = newAdapter.getCurrentCanvasId();
        if (currentId) {
          setCurrentCanvasId(currentId);
          const dbNotes = await newAdapter.getAllNotes();
          setNotes(dbNotes);
        }
        setLoading(false);
        console.log("✅ 数据库重新初始化完成，项目已回到最初状态");
      } catch (err) {
        console.error("❌ 数据库重新初始化失败:", err);
        setError(err instanceof Error ? err.message : "数据库重新初始化失败");
        setLoading(false);
      }
    } catch (err) {
      console.error("❌ 清空数据库失败:", err);
      setError(err instanceof Error ? err.message : "清空数据库失败");
      throw err;
    }
  }, []);

  // 注意：禁用旧的事件监听系统，避免与新的Zustand状态管理冲突
  // 现在使用Zustand Store直接管理状态，不需要事件驱动的数据刷新
  // useEffect(() => {
  //   const handleNotesChange = async () => {
  //     try {
  //       const adapter = getDatabaseAdapter();
  //       const updatedNotes = await adapter.getAllNotes();
  //       setNotes(updatedNotes);
  //     } catch (err) {
  //       console.error("刷新便签数据失败:", err);
  //     }
  //   };
  //   databaseEvents.on("notesChanged", handleNotesChange);
  //   return () => {
  //     databaseEvents.off("notesChanged", handleNotesChange);
  //   };
  // }, []);

  return {
    // 新接口
    notes,
    loading,
    error,
    addNote,
    updateNote,
    deleteNote,
    updateNotesPositions,
    searchNotes,
    getStats,
    refreshNotes,
    exportData,
    importData,
    getStorageInfo,
    clearDatabase, // 新增清空数据库接口

    // 兼容旧接口
    stickyNotes: notes,
    currentCanvasId,
    createStickyNote: addNote,
    updateStickyNote: async (noteId: string, updates: Partial<StickyNote>) => {
      const note = notes.find((n) => n.id === noteId);
      if (note) {
        const updatedNote = { ...note, ...updates, updatedAt: new Date() };
        await updateNote(updatedNote);
      }
    },
    deleteStickyNote: deleteNote,
    bringNoteToFront: async (noteId: string) => {
      const note = notes.find((n) => n.id === noteId);
      if (note) {
        const maxZIndex = Math.max(...notes.map((n) => n.zIndex), 0);
        await updateNote({ ...note, zIndex: maxZIndex + 1 });
      }
    },
    switchCanvas: async (canvasId: string) => {
      const adapter = getDatabaseAdapter();
      adapter.setCurrentCanvas(canvasId);
      setCurrentCanvasId(canvasId);
      await refreshNotes();

      // 注意：不再触发事件，使用Zustand状态管理
      // databaseEvents.emit("notesChanged");
    },
    isLoading: loading,
  };
}

/**
 * Canvas 管理 Hook - 提供画布的 CRUD 操作
 */
export function useCanvas() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取用户的所有画布
  const getUserCanvases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 检查数据库是否已初始化
      if (!isDatabaseInitialized()) {
        throw new Error("数据库未初始化");
      }

      const adapter = getDatabaseAdapter();
      const canvases = await adapter.getUserCanvases();
      return canvases;
    } catch (err) {
      console.error("获取画布列表失败:", err);
      setError(err instanceof Error ? err.message : "获取画布列表失败");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建新画布
  const createCanvas = useCallback(
    async (name: string, description?: string) => {
      try {
        setLoading(true);
        setError(null);

        // 检查数据库是否已初始化
        if (!isDatabaseInitialized()) {
          throw new Error("数据库未初始化");
        }

        const adapter = getDatabaseAdapter();
        const canvasId = await adapter.createCanvas(name, description);
        return canvasId;
      } catch (err) {
        console.error("创建画布失败:", err);
        setError(err instanceof Error ? err.message : "创建画布失败");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 更新画布
  const updateCanvas = useCallback(
    async (
      canvasId: string,
      updates: { name?: string; description?: string }
    ) => {
      try {
        setLoading(true);
        setError(null);

        // 检查数据库是否已初始化
        if (!isDatabaseInitialized()) {
          throw new Error("数据库未初始化");
        }

        const adapter = getDatabaseAdapter();
        await adapter.updateCanvas(canvasId, updates);
      } catch (err) {
        console.error("更新画布失败:", err);
        setError(err instanceof Error ? err.message : "更新画布失败");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 切换画布
  const switchCanvas = useCallback(async (canvasId: string) => {
    try {
      setError(null);

      // 检查数据库是否已初始化
      if (!isDatabaseInitialized()) {
        throw new Error("数据库未初始化");
      }

      const adapter = getDatabaseAdapter();
      adapter.setCurrentCanvas(canvasId);
    } catch (err) {
      console.error("切换画布失败:", err);
      setError(err instanceof Error ? err.message : "切换画布失败");
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    getUserCanvases,
    createCanvas,
    updateCanvas,
    switchCanvas,
  };
}

// 文件结束
