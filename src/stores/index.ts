// 全局状态管理入口文件
// 导出所有Store和相关类型

export { useStickyNotesStore } from './stickyNotesStore';
export { useCanvasStore } from './canvasStore';
export { useAIStore } from './aiStore';
export { useUIStore } from './uiStore';
export { useConnectionStore } from './connectionStore';

// 导出Store相关类型
export type { StickyNotesState, StickyNotesActions } from './stickyNotesStore';
export type { CanvasState, CanvasActions } from './canvasStore';
export type { AIState, AIActions } from './aiStore';
export type { UIState, UIActions } from './uiStore';
export type { ConnectionState, ConnectionActions } from './connectionStore';
