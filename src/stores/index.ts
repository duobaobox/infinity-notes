// 全局状态管理入口文件
// 导出所有Store和相关类型

export { useAIStore } from "./aiStore";
export { useCanvasStore } from "./canvasStore";
export { useConnectionStore } from "./connectionStore";
export { useStickyNotesStore } from "./stickyNotesStore";
export { useUIStore } from "./uiStore";
export { initializeUserStore, useUserStore } from "./userStore";

// 导出Store相关类型
export type { AIActions, AIState } from "./aiStore";
export type { CanvasActions, CanvasState } from "./canvasStore";
export type { ConnectionActions, ConnectionState } from "./connectionStore";
export type { StickyNotesActions, StickyNotesState } from "./stickyNotesStore";
export type { UIActions, UIState } from "./uiStore";
export type { UserActions, UserState } from "./userStore";
