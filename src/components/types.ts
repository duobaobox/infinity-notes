// 便签数据类型定义
export interface StickyNote {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  title: string; // 新增：便签标题
  isEditing: boolean;
  isTitleEditing: boolean; // 新增：标题编辑状态
  color: "yellow" | "blue" | "green" | "pink" | "purple";
  isNew: boolean;
  zIndex: number; // 新增：Z 索引用于层级管理
  createdAt: Date;
  updatedAt: Date;
}

// 便签属性接口
export interface StickyNoteProps {
  note: StickyNote;
  onUpdate: (id: string, updates: Partial<StickyNote>) => void;
  onDelete: (id: string) => void;
  onBringToFront: (id: string) => void; // 新增：置顶功能
  canvasScale: number;
  canvasOffset: { x: number; y: number }; // 新增：画布偏移量
}
