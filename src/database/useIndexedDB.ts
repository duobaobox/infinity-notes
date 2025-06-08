import { useState, useEffect, useCallback } from "react";
import { IndexedDBService } from "./IndexedDBService";
import { IndexedDBAdapter } from "./IndexedDBAdapter";
import type { StickyNote } from "../components/types";

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
 * 初始化数据库
 */
async function initializeDatabase(): Promise<void> {
  const dbService = getDatabaseService();
  await dbService.initialize();

  // 确保有默认用户
  const defaultUser = await dbService.getUserById("default_user");
  if (!defaultUser) {
    await dbService.createUser({
      id: "default_user",
      username: "user",
      email: "user@example.com",
      display_name: "用户",
    });
  }

  // 确保默认画布
  const adapter = getDatabaseAdapter();
  await adapter.ensureDefaultCanvas();
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
        return await adapter.searchNotes(keyword);
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

  // 清空数据库
  const clearDatabase = useCallback(async (): Promise<void> => {
    try {
      const adapter = getDatabaseAdapter();
      await adapter.clearDatabase();

      // 重置状态
      setNotes([]);
      setCurrentCanvasId(null);
      setLoading(false);
      setError(null);

      // 重新初始化
      const init = async () => {
        try {
          setLoading(true);
          await initializeDatabase();
          const adapter = getDatabaseAdapter();
          await adapter.ensureDefaultCanvas();
          const currentId = adapter.getCurrentCanvasId();
          if (currentId) {
            setCurrentCanvasId(currentId);
            const dbNotes = await adapter.getAllNotes();
            setNotes(dbNotes);
          }
          setLoading(false);
        } catch (err) {
          console.error("数据库初始化失败:", err);
          setError(err instanceof Error ? err.message : "数据库初始化失败");
          setLoading(false);
        }
      };

      // 执行初始化
      await init();

      console.log("数据库已清空并重新初始化");
    } catch (err) {
      console.error("清空数据库失败:", err);
      setError(err instanceof Error ? err.message : "清空数据库失败");
      throw err;
    }
  }, []);

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
    },
    isLoading: loading,
  };
}

// 文件结束
