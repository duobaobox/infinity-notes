# API文档

本文档描述了无限便签项目的主要API接口和数据结构。

## 📋 数据模型

### StickyNote (便签)

```typescript
interface StickyNote {
  id: string;                    // 唯一标识符
  title: string;                 // 便签标题
  content: string;               // 便签内容（支持Markdown）
  x: number;                     // X坐标位置
  y: number;                     // Y坐标位置
  width: number;                 // 宽度
  height: number;                // 高度
  color: NoteColor;              // 便签颜色
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
  sourceNoteIds?: string[];      // 源便签ID列表（用于溯源）
  zIndex: number;                // 层级索引
}
```

### NoteColor (便签颜色)

```typescript
type NoteColor = 
  | 'yellow'    // 黄色
  | 'blue'      // 蓝色
  | 'green'     // 绿色
  | 'pink'      // 粉色
  | 'purple'    // 紫色
  | 'orange'    // 橙色
  | 'gray';     // 灰色
```

### Connection (连接)

```typescript
interface Connection {
  id: string;                    // 连接ID
  sourceId: string;              // 源便签ID
  targetId: string;              // 目标便签ID
  type: 'source' | 'reference'; // 连接类型
  createdAt: Date;               // 创建时间
}
```

### CanvasState (画布状态)

```typescript
interface CanvasState {
  scale: number;                 // 缩放比例
  offsetX: number;               // X轴偏移
  offsetY: number;               // Y轴偏移
  isDragging: boolean;           // 是否正在拖拽
  selectedNoteIds: string[];     // 选中的便签ID列表
}
```

## 🏪 Store API

### StickyNotesStore (便签状态管理)

#### 状态属性

```typescript
interface StickyNotesState {
  notes: StickyNote[];           // 便签列表
  loading: boolean;              // 加载状态
  operationLoading: boolean;     // 操作加载状态
  error: string | null;          // 错误信息
  lastSaved: Date | null;        // 最后保存时间
}
```

#### 主要方法

```typescript
// 初始化
initialize(): Promise<void>

// 便签操作
addNote(noteData: Partial<StickyNote>): Promise<StickyNote>
updateNote(id: string, updates: Partial<StickyNote>): Promise<void>
deleteNote(id: string): Promise<void>
deleteNotes(ids: string[]): Promise<void>

// 批量操作
batchUpdate(updates: Array<{id: string, updates: Partial<StickyNote>}>): Promise<void>

// 查询操作
getNoteById(id: string): StickyNote | undefined
searchNotes(query: string): StickyNote[]

// 位置操作
bringToFront(id: string): void
updateNotePosition(id: string, x: number, y: number): Promise<void>
updateNoteSize(id: string, width: number, height: number): Promise<void>

// 撤销重做
undo(): void
redo(): void
canUndo(): boolean
canRedo(): boolean

// 数据管理
saveAllNotes(): Promise<void>
exportNotes(): string
importNotes(data: string): Promise<void>
clearAllNotes(): Promise<void>
```

### CanvasStore (画布状态管理)

#### 状态属性

```typescript
interface CanvasState {
  scale: number;                 // 缩放比例 (0.1 - 3.0)
  offsetX: number;               // X轴偏移
  offsetY: number;               // Y轴偏移
  isDragging: boolean;           // 拖拽状态
  selectedNoteIds: string[];     // 选中便签
  viewportWidth: number;         // 视口宽度
  viewportHeight: number;        // 视口高度
}
```

#### 主要方法

```typescript
// 缩放操作
setScale(scale: number): void
zoomIn(): void
zoomOut(): void
resetZoom(): void

// 平移操作
setOffset(x: number, y: number): void
panBy(deltaX: number, deltaY: number): void
centerView(): void

// 选择操作
selectNote(id: string): void
selectNotes(ids: string[]): void
deselectAll(): void
toggleNoteSelection(id: string): void

// 视口操作
setViewportSize(width: number, height: number): void
getVisibleArea(): {x: number, y: number, width: number, height: number}

// 坐标转换
screenToCanvas(screenX: number, screenY: number): {x: number, y: number}
canvasToScreen(canvasX: number, canvasY: number): {x: number, y: number}
```

### AIStore (AI功能状态管理)

#### 状态属性

```typescript
interface AIState {
  loading: boolean;              // AI处理状态
  config: AIConfig;              // AI配置
  streamingNotes: Map<string, StreamingData>; // 流式输出数据
  error: string | null;          // 错误信息
}
```

#### 主要方法

```typescript
// 配置管理
updateConfig(config: Partial<AIConfig>): void
validateConfig(): boolean

// AI汇总
summarizeNotes(noteIds: string[], options: SummaryOptions): Promise<StickyNote>
streamSummary(noteIds: string[], options: StreamSummaryOptions): Promise<void>

// 流式输出控制
startStreaming(noteId: string): void
updateStreamingContent(noteId: string, content: string): void
stopStreaming(noteId: string): void
```

## 🗄️ Database API

### IndexedDBService

#### 主要方法

```typescript
// 初始化
initialize(): Promise<void>
close(): void

// 便签操作
createNote(note: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<StickyNote>
updateNote(id: string, updates: Partial<StickyNote>): Promise<void>
deleteNote(id: string): Promise<void>
getNote(id: string): Promise<StickyNote | undefined>
getAllNotes(): Promise<StickyNote[]>

// 批量操作
batchCreate(notes: Array<Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>>): Promise<StickyNote[]>
batchUpdate(updates: Array<{id: string, updates: Partial<StickyNote>}>): Promise<void>
batchDelete(ids: string[]): Promise<void>

// 查询操作
searchNotes(query: string): Promise<StickyNote[]>
getNotesInArea(x: number, y: number, width: number, height: number): Promise<StickyNote[]>

// 设置管理
getSetting(key: string): Promise<any>
setSetting(key: string, value: any): Promise<void>
deleteSetting(key: string): Promise<void>
```

## 🎣 Hooks API

### useKeyboardShortcuts

```typescript
interface KeyboardShortcutsOptions {
  onCreateNote?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onOpenSettings?: () => void;
  onFocusConsole?: () => void;
  enabled?: boolean;
}

function useKeyboardShortcuts(options: KeyboardShortcutsOptions): void
```

## 🔧 Utils API

### connectionLineManager

```typescript
// 连接线管理
createConnection(options: ConnectionOptions): string
updateConnection(id: string, updates: Partial<ConnectionOptions>): void
removeConnection(id: string): void
removeAllConnections(): void

// 批量操作
batchUpdate(updates: Array<{id: string, updates: Partial<ConnectionOptions>}>): void
getConnectionsForNote(noteId: string): Connection[]

// 事件监听
on(event: string, callback: Function): void
off(event: string, callback: Function): void
```

## 📡 Events API

### 事件类型

```typescript
// 便签事件
'note:created'    // 便签创建
'note:updated'    // 便签更新
'note:deleted'    // 便签删除
'note:selected'   // 便签选中
'note:deselected' // 便签取消选中

// 画布事件
'canvas:zoom'     // 画布缩放
'canvas:pan'      // 画布平移
'canvas:reset'    // 画布重置

// AI事件
'ai:start'        // AI开始处理
'ai:progress'     // AI处理进度
'ai:complete'     // AI处理完成
'ai:error'        // AI处理错误

// 连接事件
'connection:created'  // 连接创建
'connection:removed'  // 连接删除
```

### 事件监听

```typescript
// 监听事件
eventBus.on('note:created', (note: StickyNote) => {
  console.log('新便签创建:', note);
});

// 取消监听
eventBus.off('note:created', callback);

// 触发事件
eventBus.emit('note:created', note);
```

## 🔒 错误处理

### 错误类型

```typescript
interface AppError {
  code: string;                  // 错误代码
  message: string;               // 错误信息
  details?: any;                 // 错误详情
  timestamp: Date;               // 错误时间
}

// 常见错误代码
'DB_INIT_FAILED'              // 数据库初始化失败
'NOTE_NOT_FOUND'              // 便签不存在
'INVALID_NOTE_DATA'           // 无效便签数据
'AI_SERVICE_ERROR'            // AI服务错误
'NETWORK_ERROR'               // 网络错误
'PERMISSION_DENIED'           // 权限拒绝
```

### 错误处理示例

```typescript
try {
  await stickyNotesStore.addNote(noteData);
} catch (error) {
  if (error.code === 'INVALID_NOTE_DATA') {
    message.error('便签数据格式错误');
  } else {
    message.error('创建便签失败');
  }
}
```

## 📊 性能监控

### 性能指标

```typescript
interface PerformanceMetrics {
  renderTime: number;            // 渲染时间
  dbOperationTime: number;       // 数据库操作时间
  memoryUsage: number;           // 内存使用量
  noteCount: number;             // 便签数量
  connectionCount: number;       // 连接数量
}
```

### 监控API

```typescript
// 获取性能指标
getPerformanceMetrics(): PerformanceMetrics

// 开始性能监控
startPerformanceMonitoring(): void

// 停止性能监控
stopPerformanceMonitoring(): void
```
