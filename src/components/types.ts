// 源便签内容类型定义（用于替换模式溯源）
export interface SourceNoteContent {
  id: string; // 原始便签ID
  title: string; // 原始便签标题
  content: string; // 原始便签内容
  color: "yellow" | "blue" | "green" | "pink" | "purple"; // 原始便签颜色
  createdAt: Date; // 原始便签创建时间
  deletedAt: Date; // 便签被删除的时间（替换时间）
}

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
  // 连接相关属性
  isConnected?: boolean; // 是否已连接到插槽
  connectionIndex?: number; // 在插槽中的连接索引
  // 汇总溯源相关属性
  sourceNoteIds?: string[]; // 汇总生成便签的源便签ID列表，用于溯源功能
  // 替换模式溯源相关属性
  sourceNotesContent?: SourceNoteContent[]; // 替换模式下保存的原始便签内容，用于溯源查看
  generationMode?: "summary" | "replace"; // 便签生成模式：汇总模式或替换模式
}

// 便签属性接口
export interface StickyNoteProps {
  note: StickyNote;
  onUpdate: (id: string, updates: Partial<StickyNote>) => void;
  onDelete: (id: string) => void;
  onBringToFront: (id: string) => void; // 新增：置顶功能
  canvasScale: number;
  canvasOffset: { x: number; y: number }; // 新增：画布偏移量
  // 流式相关属性
  isStreaming?: boolean;
  streamingContent?: string;
  onStreamingComplete?: () => void;
  // 连接相关属性
  onConnect?: (note: StickyNote) => void; // 连接便签回调
  isConnected?: boolean; // 是否已连接
}
