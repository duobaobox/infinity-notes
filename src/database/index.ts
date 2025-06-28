// 数据库模块入口文件
// 提供便签应用的完整数据库解决方案
// 当前使用 IndexedDB 版本（浏览器原生高性能存储）

// IndexedDB 适配器和钩子 - 新的高性能数据库解决方案
export { IndexedDBAdapter } from "./IndexedDBAdapter.js";
export {
  databaseEvents,
  getDatabaseAdapter,
  getDatabaseService,
  initializeDatabase,
  resetDatabase,
  useCanvas,
  useDatabase,
} from "./useIndexedDB.js";

// IndexedDB 服务层（用于高级功能）
export { IndexedDBService } from "./IndexedDBService.js";

// 类型导出
export type { StickyNote } from "../components/types";

// 定义必要的数据库类型
export interface User {
  id: string;
  username: string; // 用户名（唯一标识和显示名称）
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Canvas {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
  last_accessed?: string;
  // 新增：画布配置信息
  settings?: {
    background_color?: string;
    grid_visible?: boolean;
    grid_size?: number;
    zoom_level?: number;
    center_x?: number;
    center_y?: number;
  };
  // 新增：画布统计信息
  stats?: {
    note_count?: number;
    connection_count?: number;
    last_note_created?: string;
  };
  // 新增：画布标签和分类
  tags?: string[];
  category?: string;
  // 新增：画布共享设置
  sharing?: {
    is_public?: boolean;
    share_token?: string;
    permissions?: "read" | "write" | "admin";
  };
}

export interface DbStickyNote {
  id: string;
  canvas_id: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  content: string;
  title: string;
  color: string;
  font_size?: number;
  z_index?: number;
  source_note_ids?: string; // 新增：存储源便签ID列表，JSON字符串格式
  source_notes_content?: string; // 新增：存储原始便签内容，JSON字符串格式（替换模式溯源用）
  generation_mode?: string; // 新增：便签生成模式（summary/replace）
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

// 新增：便签连接关系接口
export interface NoteConnection {
  id: string;
  source_note_id: string;
  target_note_id: string;
  canvas_id: string;
  connection_type: "line" | "arrow" | "curve"; // 连接类型
  style?: {
    color?: string;
    width?: number;
    dashArray?: string;
  };
  created_at: string;
  updated_at?: string;
}

// 新增：便签版本历史接口
export interface NoteVersion {
  id: string;
  note_id: string;
  version_number: number;
  title: string;
  content: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  color: string;
  font_size?: number;
  change_description?: string; // 变更描述
  created_at: string;
}

// 新增：工作区接口 - 组织多个相关画布
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  color?: string;
  icon?: string;
  is_default?: boolean;
  canvas_ids: string[]; // 包含的画布ID列表
  created_at: string;
  updated_at: string;
  last_accessed?: string;
}

// 新增：画布模板接口 - 预定义的画布布局
export interface CanvasTemplate {
  id: string;
  name: string;
  description?: string;
  category: "business" | "education" | "personal" | "creative" | "other";
  thumbnail?: string; // 模板缩略图
  is_public: boolean;
  creator_id?: string;
  template_data: {
    settings: Canvas["settings"];
    notes: Array<
      Omit<DbStickyNote, "id" | "canvas_id" | "created_at" | "updated_at">
    >;
    connections?: Array<
      Omit<NoteConnection, "id" | "canvas_id" | "created_at" | "updated_at">
    >;
  };
  usage_count?: number;
  rating?: number;
  created_at: string;
  updated_at: string;
}

// 新增：画布快照接口 - 用于备份和恢复
export interface CanvasSnapshot {
  id: string;
  canvas_id: string;
  name: string;
  description?: string;
  snapshot_data: {
    canvas: Canvas;
    notes: DbStickyNote[];
    connections: NoteConnection[];
  };
  created_by: string;
  created_at: string;
}
