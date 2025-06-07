// 数据库模块入口文件
// 提供便签应用的完整数据库解决方案
// 当前使用 SQLite 版本（浏览器兼容）

// SQLite 适配器和钩子 (确保这些文件存在并已正确实现)
export { BrowserDatabaseAdapter } from "./BrowserDatabaseAdapter.js";
// export { useDatabaseSQLite as useDatabase } from "./useDatabaseSQLite.js"; // 假设 useDatabaseSQLite.ts 提供了 useDatabase 功能
// export { useCanvasSQLite as useCanvas } from "./useCanvasSQLite.js"; // 假设 useCanvasSQLite.ts 提供了 useCanvas 功能

// 类型导出
export type { StickyNote } from "../components/types.js";
export type {
  User,
  Canvas,
  StickyNote as DbStickyNote,
  Tag,
} from "./BrowserDatabaseService.js";

// 原始 LocalStorage 版本（注释掉或移除）
// export { LocalStorageAdapter } from "./LocalStorageAdapter";
// export { useDatabase } from "./useDatabaseLocalStorage";
// export { useCanvas } from "./useCanvasLocalStorage";

// 原始 SQLite 版本（注释掉，供将来 Node.js 环境使用）
// export { DatabaseService } from './DatabaseService';
// export { DatabaseAdapter } from './DatabaseAdapter';
// export { DatabaseInitializer, initializeDatabase, resetDatabase } from './DatabaseInitializer';
// export { useDatabase, useCanvas, getDatabaseService, getDatabaseAdapter } from './useDatabase';
// export type {
//   User,
//   Canvas,
//   StickyNote as DbStickyNote,
//   Tag,
//   NoteTag,
//   CanvasSetting,
//   NoteHistory,
//   CanvasCollaborator
// } from './DatabaseService';
// export * from './utils';
