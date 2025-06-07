import { useState, useEffect, useCallback } from "react";
import { BrowserDatabaseService } from "./BrowserDatabaseService";
import { BrowserDatabaseAdapter } from "./BrowserDatabaseAdapter";
import type { StickyNote } from "../components/types";

// 全局服务实例
let globalDbService: BrowserDatabaseService | null = null;
let globalDbAdapter: BrowserDatabaseAdapter | null = null;

/**
 * 获取数据库服务实例
 */
export function getDatabaseService(): BrowserDatabaseService {
  if (!globalDbService) {
    globalDbService = BrowserDatabaseService.getInstance();
  }
  return globalDbService;
}

/**
 * 获取数据库适配器实例
 */
export function getDatabaseAdapter(): BrowserDatabaseAdapter {
  if (!globalDbAdapter) {
    const dbService = getDatabaseService();
    const userId = "default_user"; // 在实际应用中，这应该来自用户认证
    globalDbAdapter = new BrowserDatabaseAdapter(dbService, userId);
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
  const defaultUser = dbService.getUserById("default_user");
  if (!defaultUser) {
    dbService.createUser({
      id: "default_user",
      username: "user",
      email: "user@example.com",
      display_name: "用户",
    });
  }

  // 执行数据迁移
  const adapter = getDatabaseAdapter();
  await adapter.migrateFromLocalStorage();
}

/**
 * 重置数据库
 */
export async function resetDatabase(): Promise<void> {
  const dbService = getDatabaseService();
  await dbService.reset();
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
        console.error("数据库初始化失败:", err);
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

/**
 * 画布管理Hook
 */
export function useCanvas() {
  const [canvases, setCanvases] = useState<any[]>([]);
  const [currentCanvasId, setCurrentCanvasId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载画布列表
  useEffect(() => {
    async function loadCanvases() {
      try {
        setLoading(true);
        await initializeDatabase();
        const adapter = getDatabaseAdapter();
        const userCanvases = await adapter.getUserCanvases();
        setCanvases(userCanvases);

        // 设置当前画布
        if (userCanvases.length > 0 && !currentCanvasId) {
          const defaultCanvas =
            userCanvases.find((c) => c.is_default) || userCanvases[0];
          setCurrentCanvasId(defaultCanvas.id);
          adapter.setCurrentCanvas(defaultCanvas.id);
        }
      } catch (err) {
        console.error("加载画布失败:", err);
        setError(err instanceof Error ? err.message : "加载画布失败");
      } finally {
        setLoading(false);
      }
    }

    loadCanvases();
  }, [currentCanvasId]);

  // 切换画布
  const switchCanvas = useCallback(async (canvasId: string): Promise<void> => {
    try {
      const adapter = getDatabaseAdapter();
      adapter.setCurrentCanvas(canvasId);
      setCurrentCanvasId(canvasId);
    } catch (err) {
      console.error("切换画布失败:", err);
      setError(err instanceof Error ? err.message : "切换画布失败");
    }
  }, []);

  // 创建画布
  const createCanvas = useCallback(
    async (name: string, description?: string): Promise<string> => {
      try {
        const adapter = getDatabaseAdapter();
        const canvasId = await adapter.createCanvas(name, description);

        // 刷新画布列表
        const userCanvases = await adapter.getUserCanvases();
        setCanvases(userCanvases);

        return canvasId;
      } catch (err) {
        console.error("创建画布失败:", err);
        setError(err instanceof Error ? err.message : "创建画布失败");
        throw err;
      }
    },
    []
  );

  // 删除画布
  const deleteCanvas = useCallback(
    async (canvasId: string): Promise<void> => {
      try {
        const adapter = getDatabaseAdapter();
        await adapter.deleteCanvas(canvasId);

        // 刷新画布列表
        const userCanvases = await adapter.getUserCanvases();
        setCanvases(userCanvases);

        // 如果删除的是当前画布，切换到其他画布
        if (currentCanvasId === canvasId && userCanvases.length > 0) {
          await switchCanvas(userCanvases[0].id);
        }
      } catch (err) {
        console.error("删除画布失败:", err);
        setError(err instanceof Error ? err.message : "删除画布失败");
        throw err;
      }
    },
    [currentCanvasId, switchCanvas]
  );

  return {
    canvases,
    currentCanvasId,
    loading,
    error,
    switchCanvas,
    createCanvas,
    deleteCanvas,

    // 兼容旧接口
    isLoading: loading,
  };
}
