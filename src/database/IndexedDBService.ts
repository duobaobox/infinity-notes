import type { User, Canvas, DbStickyNote as StickyNote, Tag } from "./index";

/**
 * IndexedDB 数据库服务类
 * 替代 SQL.js + localStorage 方案，提供更好的性能和存储容量
 */
export class IndexedDBService {
  private db: IDBDatabase | null = null;
  private static instance: IndexedDBService;
  private initialized = false;
  private readonly dbName = "StickyNotesDB";
  private readonly dbVersion = 3; // 增加版本号，确保新表被创建

  private constructor() {
    // 私有构造函数，确保单例模式
  }

  /**
   * 获取数据库服务单例
   */
  public static getInstance(): IndexedDBService {
    if (!IndexedDBService.instance) {
      IndexedDBService.instance = new IndexedDBService();
    }
    return IndexedDBService.instance;
  }

  /**
   * 检查数据库是否已初始化
   */
  public isInitialized(): boolean {
    return this.initialized && this.db !== null;
  }

  /**
   * 初始化数据库
   */
  public async initialize(): Promise<void> {
    if (this.initialized && this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error("IndexedDB 初始化失败:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        console.log("IndexedDB 初始化成功");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createSchema(db);
      };
    });
  }

  /**
   * 创建数据库架构
   */
  private createSchema(db: IDBDatabase): void {
    // 用户表
    if (!db.objectStoreNames.contains("users")) {
      const userStore = db.createObjectStore("users", { keyPath: "id" });
      userStore.createIndex("username", "username", { unique: true });
      userStore.createIndex("email", "email", { unique: false });
    }

    // 画布表
    if (!db.objectStoreNames.contains("canvases")) {
      const canvasStore = db.createObjectStore("canvases", { keyPath: "id" });
      canvasStore.createIndex("user_id", "user_id", { unique: false });
      canvasStore.createIndex("is_default", "is_default", { unique: false });
      canvasStore.createIndex("updated_at", "updated_at", { unique: false });
    }

    // AI设置表
    if (!db.objectStoreNames.contains("ai_settings")) {
      const aiSettingsStore = db.createObjectStore("ai_settings", {
        keyPath: "id",
      });
      aiSettingsStore.createIndex("user_id", "user_id", { unique: false });
      aiSettingsStore.createIndex("updated_at", "updated_at", {
        unique: false,
      });
    }

    // 便签表
    if (!db.objectStoreNames.contains("sticky_notes")) {
      const noteStore = db.createObjectStore("sticky_notes", { keyPath: "id" });
      noteStore.createIndex("canvas_id", "canvas_id", { unique: false });
      noteStore.createIndex("updated_at", "updated_at", { unique: false });
      noteStore.createIndex("title", "title", { unique: false });
      noteStore.createIndex("content", "content", { unique: false });
    } // 标签表
    if (!db.objectStoreNames.contains("tags")) {
      const tagStore = db.createObjectStore("tags", { keyPath: "id" });
      tagStore.createIndex("user_id", "user_id", { unique: false });
      tagStore.createIndex("name", "name", { unique: false });
    }

    // UI设置表
    if (!db.objectStoreNames.contains("ui_settings")) {
      const uiSettingsStore = db.createObjectStore("ui_settings", {
        keyPath: "id",
      });
      uiSettingsStore.createIndex("user_id", "user_id", { unique: false });
      uiSettingsStore.createIndex("setting_type", "setting_type", {
        unique: false,
      });
      uiSettingsStore.createIndex("updated_at", "updated_at", {
        unique: false,
      });
    }
  }

  /**
   * 通用的数据库操作方法
   */
  private async performTransaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    if (!this.db) {
      throw new Error("数据库未初始化");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);

      // 添加事务级别的错误处理
      transaction.onerror = (event) => {
        const error = (event.target as IDBTransaction).error;
        console.error(`事务执行失败 (${storeName}):`, error);
        reject(error);
      };

      transaction.onabort = (event) => {
        const error = (event.target as IDBTransaction).error;
        console.error(`事务被中止 (${storeName}):`, error);
        reject(error);
      };

      try {
        const request = operation(store);

        request.onsuccess = () => {
          try {
            resolve(request.result);
          } catch (error) {
            console.error(`处理请求结果时出错 (${storeName}):`, error);
            reject(error);
          }
        };

        request.onerror = () => {
          console.error(`数据库操作失败 (${storeName}):`, request.error);
          reject(request.error);
        };
      } catch (error) {
        console.error(`执行数据库操作时出错 (${storeName}):`, error);
        reject(error);
      }
    });
  }

  /**
   * 通用的查询方法
   */
  private async queryByIndex<T>(
    storeName: string,
    indexName: string,
    value: any
  ): Promise<T[]> {
    if (!this.db) {
      throw new Error("数据库未初始化");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);

      try {
        const index = store.index(indexName);
        const request = index.getAll(value);

        transaction.onerror = (event) => {
          const error = (event.target as IDBTransaction).error;
          console.error(`查询事务失败 (${storeName}.${indexName}):`, error);
          reject(error);
        };

        transaction.onabort = (event) => {
          const error = (event.target as IDBTransaction).error;
          console.error(`查询事务被中止 (${storeName}.${indexName}):`, error);
          reject(error);
        };

        request.onsuccess = () => {
          try {
            resolve(request.result || []);
          } catch (error) {
            console.error(
              `处理查询结果时出错 (${storeName}.${indexName}):`,
              error
            );
            reject(error);
          }
        };

        request.onerror = () => {
          console.error(
            `查询操作失败 (${storeName}.${indexName}):`,
            request.error
          );
          reject(request.error);
        };
      } catch (error) {
        console.error(`执行查询操作时出错 (${storeName}.${indexName}):`, error);
        reject(error);
      }
    });
  }

  // ===== 用户相关方法 =====

  async createUser(
    userData: Omit<User, "created_at" | "updated_at">
  ): Promise<User> {
    const now = new Date().toISOString();
    const user: User = {
      ...userData,
      created_at: now,
      updated_at: now,
    };

    await this.performTransaction("users", "readwrite", (store) =>
      store.add(user)
    );
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const result = await this.performTransaction(
        "users",
        "readonly",
        (store) => store.get(id)
      );
      return result || null;
    } catch {
      return null;
    }
  }

  // ===== 画布相关方法 =====

  async createCanvas(
    canvasData: Omit<Canvas, "created_at" | "updated_at" | "last_accessed">
  ): Promise<Canvas> {
    const now = new Date().toISOString();
    const canvas: Canvas = {
      ...canvasData,
      created_at: now,
      updated_at: now,
      last_accessed: now,
    };

    await this.performTransaction("canvases", "readwrite", (store) =>
      store.add(canvas)
    );
    return canvas;
  }

  async getCanvasById(id: string): Promise<Canvas | null> {
    try {
      const result = await this.performTransaction(
        "canvases",
        "readonly",
        (store) => store.get(id)
      );
      return result || null;
    } catch {
      return null;
    }
  }

  async getCanvasesByUser(userId: string): Promise<Canvas[]> {
    const canvases = await this.queryByIndex<Canvas>(
      "canvases",
      "user_id",
      userId
    );
    return canvases.sort((a, b) => {
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return dateB - dateA;
    });
  }

  async updateCanvasLastAccessed(id: string): Promise<void> {
    const canvas = await this.getCanvasById(id);
    if (canvas) {
      canvas.last_accessed = new Date().toISOString();
      await this.performTransaction("canvases", "readwrite", (store) =>
        store.put(canvas)
      );
    }
  }

  async deleteCanvas(id: string): Promise<boolean> {
    try {
      // 先删除画布下的所有便签
      const notes = await this.getNotesByCanvas(id);
      for (const note of notes) {
        await this.deleteNote(note.id);
      }

      // 删除画布
      await this.performTransaction("canvases", "readwrite", (store) =>
        store.delete(id)
      );
      return true;
    } catch (error) {
      console.error("删除画布失败:", error);
      return false;
    }
  }

  // ===== 通用 CRUD 方法 =====

  // 获取指定存储区域中的项目
  async getItem<T>(storeName: string, id: string): Promise<T | null> {
    console.log(`🗄️ IndexedDBService: 从 ${storeName} 获取数据，ID=${id}`);

    try {
      const result = await this.performTransaction(
        storeName,
        "readonly",
        (store) => store.get(id)
      );

      console.log(`🗄️ IndexedDBService: 从 ${storeName} 获取的结果`, result);
      return result || null;
    } catch (error) {
      console.error(
        `🗄️ IndexedDBService: 获取${storeName}中的项目失败:`,
        error
      );
      return null;
    }
  }

  // 向指定存储区域添加或更新项目
  async putItem<T extends { id: string }>(
    storeName: string,
    item: T
  ): Promise<T> {
    console.log(`🗄️ IndexedDBService: 向 ${storeName} 存储数据`, item);

    await this.performTransaction(storeName, "readwrite", (store) =>
      store.put(item)
    );

    console.log(`🗄️ IndexedDBService: 数据成功存储到 ${storeName}`);
    return item;
  }

  // 从指定存储区域删除项目
  async deleteItem(storeName: string, id: string): Promise<boolean> {
    try {
      await this.performTransaction(storeName, "readwrite", (store) =>
        store.delete(id)
      );
      return true;
    } catch (error) {
      console.error(`删除${storeName}中的项目失败:`, error);
      return false;
    }
  }

  // ===== 便签相关方法 =====

  async createNote(
    noteData: Omit<StickyNote, "created_at" | "updated_at">
  ): Promise<StickyNote> {
    const now = new Date().toISOString();
    const note: StickyNote = {
      ...noteData,
      title: noteData.title || "新便签",
      content: noteData.content || "",
      width: noteData.width || 250,
      height: noteData.height || 200,
      z_index: noteData.z_index || 1,
      color: noteData.color || "yellow",
      font_size: noteData.font_size || 14,
      created_at: now,
      updated_at: now,
    };

    await this.performTransaction("sticky_notes", "readwrite", (store) =>
      store.add(note)
    );
    return note;
  }

  async getNoteById(id: string): Promise<StickyNote | null> {
    try {
      const result = await this.performTransaction(
        "sticky_notes",
        "readonly",
        (store) => store.get(id)
      );
      return result || null;
    } catch {
      return null;
    }
  }

  async getNotesByCanvas(canvasId: string): Promise<StickyNote[]> {
    const notes = await this.queryByIndex<StickyNote>(
      "sticky_notes",
      "canvas_id",
      canvasId
    );
    return notes.sort((a, b) => {
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return dateB - dateA;
    });
  }

  async updateNote(
    id: string,
    updates: Partial<StickyNote>
  ): Promise<StickyNote | null> {
    const existingNote = await this.getNoteById(id);
    if (!existingNote) {
      return null;
    }

    const updatedNote: StickyNote = {
      ...existingNote,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await this.performTransaction("sticky_notes", "readwrite", (store) =>
      store.put(updatedNote)
    );
    return updatedNote;
  }

  async deleteNote(noteId: string): Promise<boolean> {
    try {
      await this.performTransaction("sticky_notes", "readwrite", (store) =>
        store.delete(noteId)
      );
      return true;
    } catch (error) {
      console.error("删除便签失败:", error);
      return false;
    }
  }

  async updateNotePosition(
    noteId: string,
    x: number,
    y: number
  ): Promise<boolean> {
    try {
      const note = await this.getNoteById(noteId);
      if (note) {
        await this.updateNote(noteId, {
          position_x: x,
          position_y: y,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("更新便签位置失败:", error);
      return false;
    }
  }

  // ===== 数据库管理方法 =====

  async reset(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initialized = false;

    // 删除现有数据库
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(this.dbName);
      deleteRequest.onsuccess = () => {
        console.log("数据库已重置");
        resolve();
      };
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }

  /**
   * 获取数据库大小估算
   */
  async getStorageInfo(): Promise<{ used: number; total: number }> {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        total: estimate.quota || 0,
      };
    }
    return { used: 0, total: 0 };
  }

  /**
   * 导出所有数据
   */
  async exportData(): Promise<{
    users: User[];
    canvases: Canvas[];
    notes: StickyNote[];
    tags: Tag[];
  }> {
    if (!this.db) {
      throw new Error("数据库未初始化");
    }

    const [users, canvases, notes, tags] = await Promise.all([
      this.performTransaction("users", "readonly", (store) => store.getAll()),
      this.performTransaction("canvases", "readonly", (store) =>
        store.getAll()
      ),
      this.performTransaction("sticky_notes", "readonly", (store) =>
        store.getAll()
      ),
      this.performTransaction("tags", "readonly", (store) => store.getAll()),
    ]);

    return { users, canvases, notes, tags };
  }

  /**
   * 导入数据
   */
  async importData(data: {
    users?: User[];
    canvases?: Canvas[];
    notes?: StickyNote[];
    tags?: Tag[];
  }): Promise<void> {
    if (!this.db) {
      throw new Error("数据库未初始化");
    }

    const transaction = this.db.transaction(
      ["users", "canvases", "sticky_notes", "tags"],
      "readwrite"
    );

    try {
      // 导入用户
      if (data.users) {
        const userStore = transaction.objectStore("users");
        for (const user of data.users) {
          await new Promise((resolve, reject) => {
            const request = userStore.put(user);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        }
      }

      // 导入画布
      if (data.canvases) {
        const canvasStore = transaction.objectStore("canvases");
        for (const canvas of data.canvases) {
          await new Promise((resolve, reject) => {
            const request = canvasStore.put(canvas);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        }
      }

      // 导入便签
      if (data.notes) {
        const noteStore = transaction.objectStore("sticky_notes");
        for (const note of data.notes) {
          await new Promise((resolve, reject) => {
            const request = noteStore.put(note);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        }
      }

      // 导入标签
      if (data.tags) {
        const tagStore = transaction.objectStore("tags");
        for (const tag of data.tags) {
          await new Promise((resolve, reject) => {
            const request = tagStore.put(tag);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        }
      }

      console.log("数据导入完成");
    } catch (error) {
      console.error("数据导入失败:", error);
      throw error;
    }
  }

  /**
   * 清空数据库 - 直接删除整个数据库（简单暴力，适合开发测试）
   * 警告：此操作会完全删除数据库，让项目回到最初状态
   */
  public async clearDatabase(): Promise<void> {
    console.log("🗑️ 开始删除整个数据库...");

    // 关闭当前数据库连接
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initialized = false;

    // 直接删除整个数据库
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(this.dbName);

      deleteRequest.onsuccess = () => {
        console.log("🗑️ 数据库已完全删除，项目已回到最初状态");
        resolve();
      };

      deleteRequest.onerror = () => {
        console.error("🗑️ 删除数据库失败:", deleteRequest.error);
        reject(deleteRequest.error);
      };

      deleteRequest.onblocked = () => {
        console.warn("🗑️ 数据库删除被阻塞，可能有其他连接正在使用");
        // 继续等待，通常会自动解决
      };
    });
  }
}
