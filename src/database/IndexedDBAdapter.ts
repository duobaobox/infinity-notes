import type { StickyNote as ComponentStickyNote } from "../components/types";
import { IndexedDBService } from "./IndexedDBService";
import type { Canvas as DbCanvas, DbStickyNote } from "./index";

/**
 * IndexedDB 数据库适配器
 * 负责在 IndexedDB 数据库接口和组件接口之间进行转换
 * 保持与 BrowserDatabaseAdapter 相同的 API
 */
export class IndexedDBAdapter {
  private dbService: IndexedDBService;
  private currentUserId: string;
  private currentCanvasId: string | null = null;

  constructor(dbService: IndexedDBService, userId: string) {
    this.dbService = dbService;
    this.currentUserId = userId;
  }

  /**
   * 设置当前画布
   */
  setCurrentCanvas(canvasId: string): void {
    console.log(
      `🎨 IndexedDBAdapter: 设置当前画布 ${this.currentCanvasId} -> ${canvasId}`
    );
    this.currentCanvasId = canvasId;
    // 更新画布访问时间
    this.dbService.updateCanvasLastAccessed(canvasId);
  }

  /**
   * 获取当前画布ID
   */
  getCurrentCanvasId(): string | null {
    return this.currentCanvasId;
  }

  /**
   * 将数据库便签格式转换为组件便签格式
   */
  private dbNoteToComponentNote(dbNote: DbStickyNote): ComponentStickyNote {
    return {
      id: dbNote.id,
      x: dbNote.position_x,
      y: dbNote.position_y,
      width: dbNote.width,
      height: dbNote.height,
      content: dbNote.content,
      title: dbNote.title,
      isEditing: false, // 这些状态不存储在数据库中
      isTitleEditing: false,
      isNew: false,
      color: (["yellow", "blue", "green", "pink", "purple"].includes(
        dbNote.color
      )
        ? dbNote.color
        : "yellow") as "yellow" | "blue" | "green" | "pink" | "purple",
      zIndex: dbNote.z_index || 1,
      createdAt: new Date(dbNote.created_at),
      updatedAt: new Date(dbNote.updated_at),
      // 处理溯源便签ID列表
      sourceNoteIds: dbNote.source_note_ids
        ? JSON.parse(dbNote.source_note_ids)
        : undefined,
      // 处理原始便签内容（替换模式溯源用）
      sourceNotesContent: dbNote.source_notes_content
        ? JSON.parse(dbNote.source_notes_content).map((source: any) => ({
            ...source,
            createdAt: new Date(source.createdAt),
            deletedAt: new Date(source.deletedAt),
          }))
        : undefined,
      // 处理便签生成模式
      generationMode: dbNote.generation_mode as
        | "summary"
        | "replace"
        | undefined,
      // 处理思维链数据（新增）
      thinkingChain: dbNote.thinking_chain
        ? JSON.parse(dbNote.thinking_chain)
        : undefined,
      hasThinking: dbNote.has_thinking || false,
    };
  }

  /**
   * 将组件便签格式转换为数据库便签格式
   */
  private componentNoteToDbNote(
    note: ComponentStickyNote
  ): Omit<DbStickyNote, "created_at" | "updated_at"> {
    if (!this.currentCanvasId) {
      throw new Error("No canvas selected");
    }

    const dbNote: any = {
      id: note.id,
      canvas_id: this.currentCanvasId,
      position_x: note.x,
      position_y: note.y,
      width: note.width,
      height: note.height,
      content: note.content,
      title: note.title,
      color: note.color,
      font_size: 14, // 默认字体大小
      z_index: note.zIndex || 1,
    };

    // 处理溯源便签ID列表
    if (note.sourceNoteIds && note.sourceNoteIds.length > 0) {
      dbNote.source_note_ids = JSON.stringify(note.sourceNoteIds);
    }

    // 处理原始便签内容（替换模式溯源用）
    if (note.sourceNotesContent && note.sourceNotesContent.length > 0) {
      dbNote.source_notes_content = JSON.stringify(note.sourceNotesContent);
    }

    // 处理便签生成模式
    if (note.generationMode) {
      dbNote.generation_mode = note.generationMode;
    }

    // 处理思维链数据（新增）
    if (note.thinkingChain) {
      dbNote.thinking_chain = JSON.stringify(note.thinkingChain);
      dbNote.has_thinking = true;
    } else {
      dbNote.has_thinking = false;
    }

    return dbNote;
  }

  /**
   * 创建或获取默认画布
   */
  async ensureDefaultCanvas(): Promise<string> {
    try {
      // 如果已经有当前画布，直接返回
      if (this.currentCanvasId) {
        console.log(
          `🎨 IndexedDBAdapter: 已有当前画布 ${this.currentCanvasId}，直接返回`
        );
        return this.currentCanvasId;
      }

      console.log("🎨 IndexedDBAdapter: 没有当前画布，开始确保默认画布存在");

      // 尝试获取用户的画布（已按最近访问时间排序）
      const canvases = await this.dbService.getCanvasesByUser(
        this.currentUserId
      );

      if (canvases.length > 0) {
        // 如果已有画布，使用第一个画布（最近访问的画布）
        // 这样页面刷新后会恢复到用户最后访问的画布，而不是最新更新的画布
        this.currentCanvasId = canvases[0].id;
        console.log(
          `🎨 IndexedDBAdapter: 选择最近访问的画布 ${canvases[0].id} (${canvases[0].name})`
        );
        return canvases[0].id;
      }

      // 如果没有画布，检查是否已经存在默认画布
      const defaultCanvasId = `canvas_${this.currentUserId}_default`;
      try {
        const existingCanvas = await this.dbService.getCanvasById(
          defaultCanvasId
        );
        if (existingCanvas) {
          this.currentCanvasId = existingCanvas.id;
          return existingCanvas.id;
        }
      } catch (error) {
        // 如果画布不存在，忽略错误，继续创建新画布
        console.log("检查默认画布时出错，将创建新画布:", error);
      }

      // 创建默认画布
      try {
        await this.dbService.createCanvas({
          id: defaultCanvasId,
          user_id: this.currentUserId,
          name: "默认画布",
          description: "我的便签画布",
          is_default: true,
        });

        this.currentCanvasId = defaultCanvasId;
        return defaultCanvasId;
      } catch (error) {
        if (error instanceof Error && error.name === "ConstraintError") {
          // 如果创建失败（可能是并发操作导致的），尝试再次获取
          const canvas = await this.dbService.getCanvasById(defaultCanvasId);
          if (canvas) {
            this.currentCanvasId = canvas.id;
            return canvas.id;
          }
        }
        throw error;
      }
    } catch (error) {
      console.error("确保默认画布存在时出错:", error);
      throw error;
    }
  }

  /**
   * 获取所有便签
   */
  async getAllNotes(): Promise<ComponentStickyNote[]> {
    await this.ensureDefaultCanvas();

    if (!this.currentCanvasId) {
      console.log("📝 IndexedDBAdapter: 没有当前画布，返回空便签列表");
      return [];
    }

    console.log(`📝 IndexedDBAdapter: 获取画布 ${this.currentCanvasId} 的便签`);
    const dbNotes = await this.dbService.getNotesByCanvas(this.currentCanvasId);
    console.log(`📝 IndexedDBAdapter: 找到 ${dbNotes.length} 个便签`);
    return dbNotes.map((note) => this.dbNoteToComponentNote(note));
  }

  /**
   * 添加便签
   */
  async addNote(note: ComponentStickyNote): Promise<void> {
    await this.ensureDefaultCanvas();

    console.log(`📝 IndexedDBAdapter: 添加便签到画布 ${this.currentCanvasId}`);
    const dbNote = this.componentNoteToDbNote(note);
    console.log(`📝 IndexedDBAdapter: 便签数据 canvas_id=${dbNote.canvas_id}`);
    await this.dbService.createNote(dbNote);
  }

  /**
   * 更新便签
   */
  async updateNote(note: ComponentStickyNote): Promise<void> {
    if (!this.currentCanvasId) {
      throw new Error("No canvas selected");
    }

    const dbNote = this.componentNoteToDbNote(note);
    await this.dbService.updateNote(note.id, dbNote);
  }

  /**
   * 删除便签
   */
  async deleteNote(noteId: string): Promise<void> {
    await this.dbService.deleteNote(noteId);
  }

  /**
   * 批量更新便签位置
   */
  async updateNotesPositions(notes: ComponentStickyNote[]): Promise<void> {
    for (const note of notes) {
      await this.updateNote(note);
    }
  }

  /**
   * 获取用户的所有画布（按访问时间排序，用于选择逻辑）
   */
  async getUserCanvases(): Promise<DbCanvas[]> {
    return await this.dbService.getCanvasesByUser(this.currentUserId);
  }

  /**
   * 获取用户的所有画布（按创建时间排序，用于界面显示）
   */
  async getUserCanvasesForDisplay(): Promise<DbCanvas[]> {
    return await this.dbService.getCanvasesByUserForDisplay(this.currentUserId);
  }

  /**
   * 创建新画布
   */
  async createCanvas(name: string, description?: string): Promise<string> {
    const canvasId = `canvas_${Date.now()}`;
    await this.dbService.createCanvas({
      id: canvasId,
      user_id: this.currentUserId,
      name,
      description: description || "",
      is_default: false,
    });
    return canvasId;
  }

  /**
   * 更新画布信息
   */
  async updateCanvas(
    canvasId: string,
    updates: { name?: string; description?: string }
  ): Promise<void> {
    await this.dbService.updateCanvas(canvasId, updates);
  }

  /**
   * 删除画布
   */
  async deleteCanvas(canvasId: string): Promise<void> {
    // 删除画布及其所有便签
    const notes = await this.dbService.getNotesByCanvas(canvasId);
    for (const note of notes) {
      await this.dbService.deleteNote(note.id);
    }
    await this.dbService.deleteCanvas(canvasId);

    // 如果删除的是当前画布，清除当前画布ID
    if (this.currentCanvasId === canvasId) {
      this.currentCanvasId = null;
    }
  }

  /**
   * 获取指定画布的便签数量
   */
  async getCanvasNotesCount(canvasId: string): Promise<number> {
    try {
      const notes = await this.dbService.getNotesByCanvas(canvasId);
      return notes.length;
    } catch (error) {
      console.error(`❌ 获取画布 ${canvasId} 便签数量失败:`, error);
      return 0;
    }
  }

  /**
   * 获取便签统计信息
   */
  async getNotesStats(): Promise<{
    totalNotes: number;
    notesByCanvas: { canvasName: string; count: number }[];
  }> {
    const canvases = await this.getUserCanvases();
    const notesByCanvas: { canvasName: string; count: number }[] = [];
    let totalNotes = 0;

    for (const canvas of canvases) {
      const notes = await this.dbService.getNotesByCanvas(canvas.id);
      notesByCanvas.push({
        canvasName: canvas.name,
        count: notes.length,
      });
      totalNotes += notes.length;
    }

    return {
      totalNotes,
      notesByCanvas,
    };
  }

  /**
   * 导出数据
   */
  async exportAllData(): Promise<{
    users: any[];
    canvases: DbCanvas[];
    notes: ComponentStickyNote[];
    tags: any[];
    exportDate: string;
  }> {
    const allData = await this.dbService.exportData();
    const notes = allData.notes.map((note) => this.dbNoteToComponentNote(note));

    return {
      users: allData.users,
      canvases: allData.canvases,
      notes,
      tags: allData.tags,
      exportDate: new Date().toISOString(),
    };
  }

  /**
   * 导入数据
   */
  async importAllData(data: {
    users?: any[];
    canvases?: DbCanvas[];
    notes?: ComponentStickyNote[];
    tags?: any[];
  }): Promise<void> {
    try {
      // 验证数据格式
      if (!data || typeof data !== "object") {
        throw new Error("导入数据格式无效");
      }

      // 转换便签格式
      let dbNotes: DbStickyNote[] | undefined;
      if (data.notes && Array.isArray(data.notes)) {
        dbNotes = data.notes.map((note, index) => {
          try {
            // 验证必要字段
            if (!note.id || typeof note.id !== "string") {
              throw new Error(`便签 ${index + 1} 缺少有效的ID字段`);
            }

            // 安全地处理日期字段 - 确保转换为Date对象再调用toISOString
            let createdAt: Date;
            let updatedAt: Date;

            try {
              createdAt =
                note.createdAt instanceof Date
                  ? note.createdAt
                  : new Date(note.createdAt);

              if (isNaN(createdAt.getTime())) {
                throw new Error("创建时间格式无效");
              }
            } catch (error) {
              console.warn(
                `便签 ${note.id} 的创建时间无效，使用当前时间`,
                error
              );
              createdAt = new Date();
            }

            try {
              updatedAt =
                note.updatedAt instanceof Date
                  ? note.updatedAt
                  : new Date(note.updatedAt);

              if (isNaN(updatedAt.getTime())) {
                throw new Error("更新时间格式无效");
              }
            } catch (error) {
              console.warn(
                `便签 ${note.id} 的更新时间无效，使用当前时间`,
                error
              );
              updatedAt = new Date();
            }

            return {
              ...this.componentNoteToDbNote(note),
              created_at: createdAt.toISOString(),
              updated_at: updatedAt.toISOString(),
            };
          } catch (error) {
            console.error(`处理便签 ${index + 1} 时出错:`, error);
            throw new Error(
              `便签 ${index + 1} 数据格式错误: ${
                error instanceof Error ? error.message : "未知错误"
              }`
            );
          }
        });
      }

      await this.dbService.importData({
        users: data.users,
        canvases: data.canvases,
        notes: dbNotes,
        tags: data.tags,
      });
    } catch (error) {
      console.error("导入数据失败:", error);
      throw error instanceof Error
        ? error
        : new Error("导入数据时发生未知错误");
    }
  }

  /**
   * 获取存储信息
   */
  async getStorageInfo(): Promise<{ used: number; total: number }> {
    return await this.dbService.getStorageInfo();
  }

  /**
   * 清空数据库
   * 警告：此操作会删除所有数据
   */
  async clearDatabase(): Promise<void> {
    await this.dbService.clearDatabase();
    this.currentCanvasId = null; // 重置当前画布ID
  }
}
