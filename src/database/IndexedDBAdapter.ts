import { IndexedDBService } from "./IndexedDBService";
import type { DbStickyNote, Canvas as DbCanvas } from "./index";
import type { StickyNote as ComponentStickyNote } from "../components/types";

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
      sourceNoteIds: (dbNote as any).source_note_ids
        ? JSON.parse((dbNote as any).source_note_ids)
        : undefined,
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

    return dbNote;
  }

  /**
   * 创建或获取默认画布
   */
  async ensureDefaultCanvas(): Promise<string> {
    try {
      // 尝试获取用户的画布
      const canvases = await this.dbService.getCanvasesByUser(
        this.currentUserId
      );

      if (canvases.length > 0) {
        // 如果已有画布，使用第一个画布
        this.currentCanvasId = canvases[0].id;
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
      return [];
    }

    const dbNotes = await this.dbService.getNotesByCanvas(this.currentCanvasId);
    return dbNotes.map((note) => this.dbNoteToComponentNote(note));
  }

  /**
   * 添加便签
   */
  async addNote(note: ComponentStickyNote): Promise<void> {
    await this.ensureDefaultCanvas();

    const dbNote = this.componentNoteToDbNote(note);
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
   * 获取用户的所有画布
   */
  async getUserCanvases(): Promise<DbCanvas[]> {
    return await this.dbService.getCanvasesByUser(this.currentUserId);
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
   * 搜索便签
   */
  async searchNotes(keyword: string): Promise<ComponentStickyNote[]> {
    if (!this.currentCanvasId) {
      await this.ensureDefaultCanvas();
    }

    if (!this.currentCanvasId) {
      return [];
    }

    const dbNotes = await this.dbService.searchNotes(
      keyword,
      this.currentCanvasId
    );
    return dbNotes.map((note) => this.dbNoteToComponentNote(note));
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
