// 数据库模块入口文件
// 提供便签应用的完整数据库解决方案
// 当前使用 IndexedDB 版本（浏览器原生高性能存储）

// IndexedDB 适配器和钩子 - 新的高性能数据库解决方案
export { IndexedDBAdapter } from "./IndexedDBAdapter.js";
export {
  useDatabase,
  getDatabaseService,
  getDatabaseAdapter,
  resetDatabase,
} from "./useIndexedDB.js";

// IndexedDB 服务层（用于高级功能）
export { IndexedDBService } from "./IndexedDBService.js";

// 类型导出
export type { StickyNote } from "../components/types.js";

// 定义必要的数据库类型
export interface User {
  id: string;
  username: string;
  email?: string;
  display_name?: string;
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
