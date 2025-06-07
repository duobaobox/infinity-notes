import type { Database } from "sql.js";

// 定义 User 和 Tag 类型，因为 DatabaseService 不再使用
export interface User {
  id: string;
  username: string;
  email?: string;
  display_name?: string;
  created_at?: string;
  updated_at?: string;
  // 根据需要添加其他 User 相关的属性
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  // 根据需要添加其他 Tag 相关的属性
}

export type Canvas = {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  is_default?: number;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
};

export type StickyNote = {
  id: string;
  canvas_id: string;
  title: string;
  content: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  z_index: number;
  color: string;
  font_size: number;
  created_at: string;
  updated_at: string;
};

/**
 * 浏览器兼容的数据库服务类
 * 使用 SQL.js 替代 better-sqlite3，适用于浏览器环境
 */
export class BrowserDatabaseService {
  private db: Database | null = null;
  private static instance: BrowserDatabaseService;
  private initialized = false;

  private constructor() {
    // 私有构造函数，确保单例模式
  }

  /**
   * 获取数据库服务单例
   */
  public static getInstance(): BrowserDatabaseService {
    if (!BrowserDatabaseService.instance) {
      BrowserDatabaseService.instance = new BrowserDatabaseService();
    }
    return BrowserDatabaseService.instance;
  }

  /**
   * 初始化数据库
   */
  public async initialize(): Promise<void> {
    if (this.initialized && this.db) {
      return;
    }

    try {
      // 初始化 SQL.js - 使用动态导入
      const initSqlJs = (await import("sql.js")).default;
      const SQL = await initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`,
      });

      // 尝试从 localStorage 加载现有数据库
      const savedData = localStorage.getItem("sticky_notes_db");
      if (savedData) {
        const binaryString = atob(savedData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        this.db = new SQL.Database(bytes);
      } else {
        this.db = new SQL.Database();
      }

      // 初始化数据库架构
      await this.initializeSchema();
      this.initialized = true;

      console.log("浏览器数据库初始化成功");
    } catch (error) {
      console.error("数据库初始化失败:", error);
      throw error;
    }
  }

  /**
   * 初始化数据库架构
   */
  private async initializeSchema(): Promise<void> {
    if (!this.db) throw new Error("数据库未初始化");

    const schema = `
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE,
          display_name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS canvases (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          user_id TEXT NOT NULL,
          is_default INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sticky_notes (
          id TEXT PRIMARY KEY,
          canvas_id TEXT NOT NULL,
          title TEXT NOT NULL DEFAULT '新便签',
          content TEXT DEFAULT '',
          position_x REAL NOT NULL,
          position_y REAL NOT NULL,
          width REAL NOT NULL DEFAULT 250,
          height REAL NOT NULL DEFAULT 200,
          z_index INTEGER NOT NULL DEFAULT 1,
          color TEXT DEFAULT 'yellow',
          font_size INTEGER DEFAULT 14,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (canvas_id) REFERENCES canvases(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tags (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT DEFAULT '#1890ff',
          description TEXT,
          user_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_sticky_notes_canvas_id ON sticky_notes(canvas_id);
      CREATE INDEX IF NOT EXISTS idx_canvases_user_id ON canvases(user_id);
    `;

    this.db.exec(schema);
  }

  /**
   * 保存数据库到 localStorage
   */
  private saveToLocalStorage(): void {
    if (!this.db) return;

    try {
      const data = this.db.export();
      const binaryString = String.fromCharCode.apply(null, Array.from(data));
      const base64String = btoa(binaryString);
      localStorage.setItem("sticky_notes_db", base64String);
    } catch (error) {
      console.error("保存数据库失败:", error);
    }
  }

  /**
   * 执行 SQL 语句并保存数据库
   */
  private execAndSave(sql: string, params: any[] = []): any {
    if (!this.db) throw new Error("数据库未初始化");

    try {
      let result;
      if (params.length > 0) {
        const stmt = this.db.prepare(sql);
        result = stmt.run(params);
        stmt.free();
      } else {
        result = this.db.exec(sql);
      }

      this.saveToLocalStorage();
      return result;
    } catch (error) {
      console.error("SQL 执行失败:", error);
      throw error;
    }
  }

  /**
   * 查询 SQL 语句
   */
  private query(sql: string, params: any[] = []): any[] {
    if (!this.db) throw new Error("数据库未初始化");

    try {
      const stmt = this.db.prepare(sql);
      const results: any[] = [];

      stmt.bind(params);
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();

      return results;
    } catch (error) {
      console.error("SQL 查询失败:", error);
      throw error;
    }
  }

  // 用户相关方法
  createUser(userData: Omit<User, "created_at" | "updated_at">): User {
    this.execAndSave(
      `
      INSERT INTO users (id, username, email, display_name)
      VALUES (?, ?, ?, ?)
    `,
      [
        userData.id,
        userData.username,
        userData.email || null,
        userData.display_name || null,
      ]
    );

    return this.getUserById(userData.id)!;
  }

  getUserById(id: string): User | null {
    const results = this.query("SELECT * FROM users WHERE id = ?", [id]);
    return results.length > 0 ? (results[0] as User) : null;
  }

  // 画布相关方法
  createCanvas(
    canvasData: Omit<Canvas, "created_at" | "updated_at" | "last_accessed_at">
  ): Canvas {
    this.execAndSave(
      `
      INSERT INTO canvases (id, name, description, user_id, is_default)
      VALUES (?, ?, ?, ?, ?)
    `,
      [
        canvasData.id,
        canvasData.name,
        canvasData.description || null,
        canvasData.user_id,
        canvasData.is_default || 0,
      ]
    );

    return this.getCanvasById(canvasData.id)!;
  }

  getCanvasById(id: string): Canvas | null {
    const results = this.query("SELECT * FROM canvases WHERE id = ?", [id]);
    return results.length > 0 ? (results[0] as Canvas) : null;
  }

  getCanvasesByUserId(userId: string): Canvas[] {
    return this.query(
      "SELECT * FROM canvases WHERE user_id = ? ORDER BY updated_at DESC",
      [userId]
    ) as Canvas[];
  }

  getCanvasesByUser(userId: string): Canvas[] {
    return this.getCanvasesByUserId(userId);
  }

  updateCanvasLastAccessed(id: string): void {
    this.execAndSave(
      "UPDATE canvases SET last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );
  }

  deleteCanvas(id: string): boolean {
    try {
      this.execAndSave("DELETE FROM canvases WHERE id = ?", [id]);
      return true;
    } catch (error) {
      console.error("删除画布失败:", error);
      return false;
    }
  }

  // 便签相关方法
  getNoteById(id: string): StickyNote | null {
    const results = this.query("SELECT * FROM sticky_notes WHERE id = ?", [id]);
    return results.length > 0 ? (results[0] as StickyNote) : null;
  }

  getNotesByCanvas(canvasId: string): StickyNote[] {
    return this.query(
      "SELECT * FROM sticky_notes WHERE canvas_id = ? ORDER BY updated_at DESC",
      [canvasId]
    ) as StickyNote[];
  }

  createNote(
    noteData: Omit<StickyNote, "created_at" | "updated_at">
  ): StickyNote {
    this.execAndSave(
      `
      INSERT INTO sticky_notes (id, canvas_id, title, content, position_x, position_y, width, height, z_index, color, font_size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        noteData.id,
        noteData.canvas_id,
        noteData.title || "新便签",
        noteData.content || "",
        noteData.position_x,
        noteData.position_y,
        noteData.width || 250,
        noteData.height || 200,
        noteData.z_index || 1,
        noteData.color || "yellow",
        noteData.font_size || 14,
      ]
    );

    return this.getNoteById(noteData.id)!;
  }

  updateNote(id: string, updates: Partial<StickyNote>): StickyNote | null {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "id" && key !== "created_at") {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return this.getNoteById(id);

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    this.execAndSave(
      `UPDATE sticky_notes SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
    return this.getNoteById(id);
  }

  deleteNote(noteId: string): boolean {
    try {
      this.execAndSave("DELETE FROM sticky_notes WHERE id = ?", [noteId]);
      return true;
    } catch (error) {
      console.error("删除便签失败:", error);
      return false;
    }
  }

  updateNotePosition(noteId: string, x: number, y: number): boolean {
    try {
      this.execAndSave(
        `
        UPDATE sticky_notes 
        SET position_x = ?, position_y = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `,
        [x, y, noteId]
      );
      return true;
    } catch (error) {
      console.error("更新便签位置失败:", error);
      return false;
    }
  }

  searchNotes(keyword: string, canvasId?: string): StickyNote[] {
    let query = `
      SELECT * FROM sticky_notes 
      WHERE (title LIKE ? OR content LIKE ?)
    `;
    const params = [`%${keyword}%`, `%${keyword}%`];

    if (canvasId) {
      query += " AND canvas_id = ?";
      params.push(canvasId);
    }

    query += " ORDER BY updated_at DESC";
    return this.query(query, params) as StickyNote[];
  }

  // 数据库管理方法
  async reset(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initialized = false;
    localStorage.removeItem("sticky_notes_db");
    await this.initialize();
  }

  close(): void {
    if (this.db) {
      this.saveToLocalStorage();
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}
