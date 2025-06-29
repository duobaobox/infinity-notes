import { cacheManager, CacheManager } from "./CacheManager";
import type { Canvas, DbStickyNote as StickyNote, Tag, User } from "./index";
import { performanceMonitor } from "./PerformanceMonitor";

/**
 * IndexedDB 数据库服务类
 * 替代 SQL.js + localStorage 方案，提供更好的性能和存储容量
 */
export class IndexedDBService {
  private db: IDBDatabase | null = null;
  private static instance: IndexedDBService;
  private initialized = false;
  private readonly dbName = "StickyNotesDB";
  private readonly dbVersion = 6; // AI供应商配置：新增多供应商配置表

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
   * 优化索引设计，提升查询性能
   */
  private createSchema(db: IDBDatabase): void {
    // 用户表 - 优化索引设计
    if (!db.objectStoreNames.contains("users")) {
      const userStore = db.createObjectStore("users", { keyPath: "id" });
      userStore.createIndex("username", "username", { unique: true });
      userStore.createIndex("email", "email", { unique: false });
      userStore.createIndex("created_at", "created_at", { unique: false }); // 新增：按创建时间查询
    }

    // 画布表 - 优化索引，支持复合查询
    if (!db.objectStoreNames.contains("canvases")) {
      const canvasStore = db.createObjectStore("canvases", { keyPath: "id" });
      canvasStore.createIndex("user_id", "user_id", { unique: false });
      canvasStore.createIndex("is_default", "is_default", { unique: false });
      canvasStore.createIndex("updated_at", "updated_at", { unique: false });
      canvasStore.createIndex("last_accessed", "last_accessed", {
        unique: false,
      }); // 新增：最近访问时间索引
      canvasStore.createIndex("user_updated", ["user_id", "updated_at"], {
        unique: false,
      }); // 新增：复合索引，提升用户画布查询性能
    }

    // AI设置表 - 优化用户设置查询
    if (!db.objectStoreNames.contains("ai_settings")) {
      const aiSettingsStore = db.createObjectStore("ai_settings", {
        keyPath: "id",
      });
      aiSettingsStore.createIndex("user_id", "user_id", { unique: false });
      aiSettingsStore.createIndex("updated_at", "updated_at", {
        unique: false,
      });
    }

    // 便签表 - 优化索引，支持全文搜索和性能查询
    if (!db.objectStoreNames.contains("sticky_notes")) {
      const noteStore = db.createObjectStore("sticky_notes", { keyPath: "id" });
      noteStore.createIndex("canvas_id", "canvas_id", { unique: false });
      noteStore.createIndex("updated_at", "updated_at", { unique: false });
      noteStore.createIndex("created_at", "created_at", { unique: false }); // 新增：创建时间索引
      noteStore.createIndex("title", "title", { unique: false });
      noteStore.createIndex("content", "content", { unique: false });
      noteStore.createIndex("color", "color", { unique: false }); // 新增：按颜色分类查询
      noteStore.createIndex("z_index", "z_index", { unique: false }); // 新增：层级索引
      noteStore.createIndex("canvas_updated", ["canvas_id", "updated_at"], {
        unique: false,
      }); // 新增：复合索引，提升画布便签查询性能
      noteStore.createIndex("position_x", "position_x", { unique: false }); // 新增：位置索引，支持空间查询
      noteStore.createIndex("position_y", "position_y", { unique: false }); // 新增：位置索引，支持空间查询
    }

    // 标签表 - 优化标签管理
    if (!db.objectStoreNames.contains("tags")) {
      const tagStore = db.createObjectStore("tags", { keyPath: "id" });
      tagStore.createIndex("user_id", "user_id", { unique: false });
      tagStore.createIndex("name", "name", { unique: false });
      tagStore.createIndex("color", "color", { unique: false }); // 新增：按颜色分类
      tagStore.createIndex("user_name", ["user_id", "name"], { unique: true }); // 新增：确保用户内标签名唯一
    }

    // UI设置表 - 优化设置查询
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
      uiSettingsStore.createIndex("user_setting", ["user_id", "setting_type"], {
        unique: true,
      }); // 新增：确保用户设置类型唯一
    }

    // 新增：便签连接关系表 - 支持便签之间的连接关系
    if (!db.objectStoreNames.contains("note_connections")) {
      const connectionStore = db.createObjectStore("note_connections", {
        keyPath: "id",
      });
      connectionStore.createIndex("source_note_id", "source_note_id", {
        unique: false,
      });
      connectionStore.createIndex("target_note_id", "target_note_id", {
        unique: false,
      });
      connectionStore.createIndex("canvas_id", "canvas_id", { unique: false });
      connectionStore.createIndex("connection_type", "connection_type", {
        unique: false,
      }); // 连接类型：line, arrow等
      connectionStore.createIndex("created_at", "created_at", {
        unique: false,
      });
    }

    // 新增：便签历史版本表 - 支持版本控制和回滚
    if (!db.objectStoreNames.contains("note_versions")) {
      const versionStore = db.createObjectStore("note_versions", {
        keyPath: "id",
      });
      versionStore.createIndex("note_id", "note_id", { unique: false });
      versionStore.createIndex("version_number", "version_number", {
        unique: false,
      });
      versionStore.createIndex("created_at", "created_at", { unique: false });
      versionStore.createIndex("note_version", ["note_id", "version_number"], {
        unique: true,
      }); // 确保便签版本号唯一
    }

    // 新增：工作区表 - 组织多个相关画布
    if (!db.objectStoreNames.contains("workspaces")) {
      const workspaceStore = db.createObjectStore("workspaces", {
        keyPath: "id",
      });
      workspaceStore.createIndex("user_id", "user_id", { unique: false });
      workspaceStore.createIndex("is_default", "is_default", { unique: false });
      workspaceStore.createIndex("updated_at", "updated_at", { unique: false });
      workspaceStore.createIndex("last_accessed", "last_accessed", {
        unique: false,
      });
    }

    // 新增：画布模板表 - 预定义的画布布局
    if (!db.objectStoreNames.contains("canvas_templates")) {
      const templateStore = db.createObjectStore("canvas_templates", {
        keyPath: "id",
      });
      templateStore.createIndex("category", "category", { unique: false });
      templateStore.createIndex("is_public", "is_public", { unique: false });
      templateStore.createIndex("creator_id", "creator_id", { unique: false });
      templateStore.createIndex("usage_count", "usage_count", {
        unique: false,
      });
      templateStore.createIndex("rating", "rating", { unique: false });
      templateStore.createIndex("created_at", "created_at", { unique: false });
    }

    // 新增：画布快照表 - 用于备份和恢复
    if (!db.objectStoreNames.contains("canvas_snapshots")) {
      const snapshotStore = db.createObjectStore("canvas_snapshots", {
        keyPath: "id",
      });
      snapshotStore.createIndex("canvas_id", "canvas_id", { unique: false });
      snapshotStore.createIndex("created_by", "created_by", { unique: false });
      snapshotStore.createIndex("created_at", "created_at", { unique: false });
    }

    // 新增：AI供应商配置表 - 支持多供应商配置管理
    if (!db.objectStoreNames.contains("ai_provider_configs")) {
      const providerConfigStore = db.createObjectStore("ai_provider_configs", {
        keyPath: "id",
      });
      providerConfigStore.createIndex("user_id", "user_id", { unique: false });
      providerConfigStore.createIndex("updated_at", "updated_at", {
        unique: false,
      });
      providerConfigStore.createIndex("created_at", "created_at", {
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

  async updateUser(userData: User): Promise<User> {
    const updatedUser: User = {
      ...userData,
      updated_at: new Date().toISOString(),
    };

    await this.performTransaction("users", "readwrite", (store) =>
      store.put(updatedUser)
    );
    return updatedUser;
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

  /**
   * 更新画布信息
   * @param id 画布ID
   * @param updates 要更新的画布数据
   * @returns 更新后的画布对象，如果画布不存在则返回null
   */
  async updateCanvas(
    id: string,
    updates: Partial<Omit<Canvas, "id" | "created_at" | "updated_at">>
  ): Promise<Canvas | null> {
    const existingCanvas = await this.getCanvasById(id);
    if (!existingCanvas) {
      return null;
    }

    const updatedCanvas: Canvas = {
      ...existingCanvas,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await this.performTransaction("canvases", "readwrite", (store) =>
      store.put(updatedCanvas)
    );
    return updatedCanvas;
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
    // 尝试从缓存获取
    const cacheKey = CacheManager.generateKey("notes_by_canvas", canvasId);
    const cached = cacheManager.get<StickyNote[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // 使用性能监控
    const notes = await performanceMonitor.monitor(
      "getNotesByCanvas",
      async () => {
        const result = await this.queryByIndex<StickyNote>(
          "sticky_notes",
          "canvas_id",
          canvasId
        );
        return result.sort((a, b) => {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateB - dateA;
        });
      }
    );

    // 缓存结果（2分钟过期）
    cacheManager.set(cacheKey, notes, 2 * 60 * 1000);
    return notes;
  }

  async updateNote(
    id: string,
    updates: Partial<StickyNote>
  ): Promise<StickyNote | null> {
    const result = await performanceMonitor.monitor("updateNote", async () => {
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

      // 清除相关缓存
      cacheManager.deleteByPrefix("notes_by_canvas");
      cacheManager.delete(CacheManager.generateKey("note_by_id", id));

      return updatedNote;
    });

    return result;
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

  // ===== 高级查询方法 =====

  /**
   * 按颜色查询便签
   */
  async getNotesByColor(
    canvasId: string,
    color: string
  ): Promise<StickyNote[]> {
    const allNotes = await this.getNotesByCanvas(canvasId);
    return allNotes.filter((note) => note.color === color);
  }

  /**
   * 按时间范围查询便签
   */
  async getNotesByDateRange(
    canvasId: string,
    startDate: string,
    endDate: string
  ): Promise<StickyNote[]> {
    const allNotes = await this.getNotesByCanvas(canvasId);
    return allNotes.filter((note) => {
      const noteDate = note.updated_at || note.created_at;
      return noteDate >= startDate && noteDate <= endDate;
    });
  }

  /**
   * 空间查询：获取指定区域内的便签
   */
  async getNotesInRegion(
    canvasId: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): Promise<StickyNote[]> {
    const allNotes = await this.getNotesByCanvas(canvasId);
    return allNotes.filter((note) => {
      return (
        note.position_x >= Math.min(x1, x2) &&
        note.position_x <= Math.max(x1, x2) &&
        note.position_y >= Math.min(y1, y2) &&
        note.position_y <= Math.max(y1, y2)
      );
    });
  }

  /**
   * 全文搜索便签（标题和内容）
   */
  async searchNotes(
    canvasId: string,
    searchTerm: string
  ): Promise<StickyNote[]> {
    const allNotes = await this.getNotesByCanvas(canvasId);
    const lowerSearchTerm = searchTerm.toLowerCase();

    return allNotes.filter((note) => {
      const titleMatch = note.title.toLowerCase().includes(lowerSearchTerm);
      const contentMatch = note.content.toLowerCase().includes(lowerSearchTerm);
      return titleMatch || contentMatch;
    });
  }

  /**
   * 获取便签统计信息
   */
  async getNotesStats(canvasId: string): Promise<{
    total: number;
    byColor: Record<string, number>;
    byDate: Record<string, number>;
    averageSize: { width: number; height: number };
  }> {
    const notes = await this.getNotesByCanvas(canvasId);

    const byColor: Record<string, number> = {};
    const byDate: Record<string, number> = {};
    let totalWidth = 0;
    let totalHeight = 0;

    notes.forEach((note) => {
      // 按颜色统计
      byColor[note.color] = (byColor[note.color] || 0) + 1;

      // 按日期统计（按天）
      const date = new Date(note.created_at).toISOString().split("T")[0];
      byDate[date] = (byDate[date] || 0) + 1;

      // 尺寸统计
      totalWidth += note.width;
      totalHeight += note.height;
    });

    return {
      total: notes.length,
      byColor,
      byDate,
      averageSize: {
        width: notes.length > 0 ? totalWidth / notes.length : 0,
        height: notes.length > 0 ? totalHeight / notes.length : 0,
      },
    };
  }

  /**
   * 批量操作：批量更新便签位置（性能优化）
   */
  async batchUpdateNotePositions(
    updates: Array<{
      id: string;
      position_x: number;
      position_y: number;
    }>
  ): Promise<void> {
    if (!this.db) {
      throw new Error("数据库未初始化");
    }

    const transaction = this.db.transaction(["sticky_notes"], "readwrite");
    const store = transaction.objectStore("sticky_notes");

    const promises = updates.map((update) => {
      return new Promise<void>((resolve, reject) => {
        const getRequest = store.get(update.id);

        getRequest.onsuccess = () => {
          const note = getRequest.result;
          if (note) {
            note.position_x = update.position_x;
            note.position_y = update.position_y;
            note.updated_at = new Date().toISOString();

            const putRequest = store.put(note);
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
          } else {
            resolve(); // 便签不存在，跳过
          }
        };

        getRequest.onerror = () => reject(getRequest.error);
      });
    });

    await Promise.all(promises);
  }
}
