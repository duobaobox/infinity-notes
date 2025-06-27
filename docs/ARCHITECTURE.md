# 项目架构文档

本文档详细介绍了无限便签项目的整体架构、模块设计和开发规范。

## 📁 项目结构概览

```
src/
├── components/        # React组件
│   ├── canvas/        # 画布相关组件
│   ├── notes/         # 便签组件
│   ├── modals/        # 模态框组件
│   ├── layout/        # 布局组件
│   └── utils/         # 组件工具函数
├── stores/            # Zustand状态管理
├── database/          # IndexedDB数据层
├── services/          # 业务逻辑服务
├── hooks/             # 自定义React Hooks
├── utils/             # 通用工具函数
├── types/             # TypeScript类型定义
└── assets/            # 静态资源

tests/                 # 测试文件目录
docs/                  # 项目文档
scripts/               # 构建和部署脚本
```

## 🧩 组件架构 (components/)

### 目录结构
```
components/
├── index.ts                     # 组件统一导出文件
├── types.ts                     # 组件相关类型定义
├── SearchModal.css              # 搜索模态框样式
├── canvas/                      # 画布相关组件
│   ├── CanvasConsole.tsx        # 画布控制台组件
│   ├── CanvasConsole.css        # 控制台样式
│   ├── CanvasConstants.ts       # 画布常量定义
│   ├── CanvasGrid.tsx           # 画布网格组件
│   ├── CanvasToolbar.tsx        # 画布工具栏组件
│   ├── InfiniteCanvas.css       # 画布样式文件
│   ├── InfiniteCanvasNew.tsx    # 主画布组件
│   ├── StickyNoteSlots.tsx      # 便签插槽组件
│   └── StickyNoteSlots.css      # 插槽样式
├── layout/                      # 布局组件
│   └── Sidebar.tsx              # 侧边栏组件
├── modals/                      # 模态框组件
│   ├── SettingsModal.tsx        # 设置模态框
│   ├── SettingsModal.css        # 设置模态框样式
│   ├── SourceNotesModal.tsx     # 源便签模态框
│   └── SourceNotesModal.css     # 源便签模态框样式
├── notes/                       # 便签相关组件
│   ├── StickyNote.tsx           # 便签组件
│   └── StickyNote.css           # 便签样式
└── utils/                       # 组件工具函数
    └── HighDPIUtils.ts          # 高DPI显示工具
```

### 组件分类

#### 画布组件 (canvas/)
- **InfiniteCanvasNew.tsx**: 主画布组件，支持无限滚动、缩放、拖拽
- **CanvasGrid.tsx**: 网格背景组件
- **CanvasToolbar.tsx**: 画布工具栏，包含缩放、设置等功能
- **CanvasConsole.tsx**: 画布控制台，用于快速操作
- **StickyNoteSlots.tsx**: 便签插槽管理组件

#### 便签组件 (notes/)
- **StickyNote.tsx**: 便签组件，支持编辑、拖拽、连接、AI汇总等功能

#### 布局组件 (layout/)
- **Sidebar.tsx**: 侧边栏组件，显示便签列表和操作

#### 模态框组件 (modals/)
- **SettingsModal.tsx**: 设置模态框，包含外观、AI等设置
- **SourceNotesModal.tsx**: 源便签查看模态框，用于溯源功能

#### 工具组件 (utils/)
- **HighDPIUtils.ts**: 高DPI显示适配工具函数

### 使用规范

所有组件都通过 `index.ts` 统一导出：

```typescript
import { InfiniteCanvas, StickyNote, SettingsModal } from './components';
```

## 🏪 状态管理 (stores/)

### 目录结构
```
stores/
├── index.ts                 # Store统一导出文件
├── stickyNotesStore.ts      # 便签状态管理
├── canvasStore.ts           # 画布状态管理
├── connectionStore.ts       # 连接线状态管理
├── aiStore.ts               # AI功能状态管理
└── uiStore.ts               # UI界面状态管理
```

### Store职责

#### stickyNotesStore.ts
- 便签数据管理：增删改查
- 便签位置和大小管理
- 与IndexedDB的数据同步
- 撤销重做功能

#### canvasStore.ts
- 画布缩放级别管理
- 画布偏移位置管理
- 画布视口状态管理
- 画布交互状态管理

#### connectionStore.ts
- 便签间连接关系管理
- 连接线的创建和删除
- 溯源关系追踪

#### aiStore.ts
- AI服务配置管理
- AI汇总功能状态
- AI流式输出管理
- AI错误处理

#### uiStore.ts
- 模态框显示状态
- 全局加载状态
- 用户界面设置
- 主题和外观配置

### 数据流模式
```
UI组件 → Store Actions → State更新 → UI重新渲染
```

### 持久化策略
- 便签数据: IndexedDB
- 用户设置: localStorage
- AI配置: localStorage
- 画布状态: sessionStorage

## 🗄️ 数据库层 (database/)

### 目录结构
```
database/
├── index.ts                         # 数据库模块统一导出
├── IndexedDBService.ts              # IndexedDB核心服务
├── IndexedDBAdapter.ts              # 数据库适配器
├── useIndexedDB.ts                  # IndexedDB React Hook
├── IndexedDBAISettingsStorage.ts    # AI设置存储
├── IndexedDBUISettingsStorage.ts    # UI设置存储
├── CacheManager.ts                  # 缓存管理器
└── PerformanceMonitor.ts            # 性能监控器
```

### 模块职责

#### IndexedDBService.ts
- 数据库初始化和版本管理
- 便签数据的CRUD操作
- 事务管理和错误处理

#### IndexedDBAdapter.ts
- 统一数据库操作接口
- 数据格式转换和验证
- 批量操作优化

#### useIndexedDB.ts
- 提供React组件友好的数据库操作接口
- 自动处理加载状态和错误状态

#### 存储模块
- **IndexedDBAISettingsStorage.ts**: AI配置的持久化存储
- **IndexedDBUISettingsStorage.ts**: 用户界面偏好设置

#### 性能模块
- **CacheManager.ts**: 内存缓存管理
- **PerformanceMonitor.ts**: 数据库操作性能监控

### 数据模型

```typescript
interface StickyNote {
  id: string;
  title: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  sourceNoteIds?: string[];
}
```

## 🔧 服务层 (services/)

### 目录结构
```
services/
├── index.ts                 # 服务统一导出文件
├── aiService.ts             # AI服务主文件
└── ai/                      # AI相关服务
    └── (AI子服务文件)
```

### 服务职责

#### aiService.ts
- AI模型接口调用
- 便签内容智能汇总
- 流式输出处理
- AI响应解析和格式化
- 错误处理和重试机制

#### AI功能
- **智能汇总**: 多便签内容合并汇总
- **流式输出**: 实时显示AI生成内容
- **内容优化**: 便签内容智能优化

### 服务架构
```
UI组件 → Store → Service → 外部API
```

## 🎣 自定义Hooks (hooks/)

### 目录结构
```
hooks/
├── index.ts                     # Hooks统一导出文件
├── useKeyboardShortcuts.ts      # 键盘快捷键Hook
└── ai/                          # AI相关Hooks
    └── (AI相关Hook文件)
```

### Hooks功能

#### useKeyboardShortcuts.ts
- 全局快捷键监听
- 快捷键组合处理
- 上下文相关的快捷键

#### 快捷键列表
- `Ctrl+N`: 创建新便签
- `Ctrl+S`: 保存所有便签
- `Ctrl+Z`: 撤销
- `Ctrl+Y`: 重做
- `Ctrl++`: 放大画布
- `Ctrl+-`: 缩小画布
- `Ctrl+0`: 重置缩放

### Hook设计原则
- 单一职责
- 可复用性
- 类型安全
- 性能优化

## 🛠️ 工具函数 (utils/)

### 目录结构
```
utils/
└── connectionLineManager.ts    # 连接线管理工具
```

### 工具功能

#### connectionLineManager.ts
- 便签连接线管理工具
- 连接线的创建和销毁
- 连接线的视觉效果管理
- 连接线的交互处理
- 连接线的性能优化

### 连接线功能
- 支持便签间的可视化连接
- 自动计算最佳连接路径
- 支持多种连接线样式
- 响应式连接点定位

## 🧪 测试架构 (tests/)

### 目录结构
```
tests/
├── utils/                              # 测试工具
│   ├── traceabilityTest.ts             # 溯源功能测试工具
│   └── replaceModeTraceabilityTest.ts  # 替换模式溯源测试工具
```

### 测试工具

#### traceabilityTest.ts
- 溯源功能测试工具
- 创建测试数据和验证便签溯源功能

#### replaceModeTraceabilityTest.ts  
- 替换模式溯源功能测试工具
- 验证替换模式下的溯源功能

### 使用方法
```javascript
// 示例：创建溯源测试数据
import { createTraceabilityTestData } from './tests/utils/traceabilityTest';
await createTraceabilityTestData();
```

## 📝 开发规范

### 代码风格
- 使用TypeScript进行开发
- 遵循ESLint配置的代码规范
- 使用有意义的变量和函数名
- 添加必要的注释

### 命名规范
- 组件: PascalCase (例: `StickyNote`)
- 函数/变量: camelCase (例: `createNote`)
- 常量: UPPER_SNAKE_CASE (例: `CANVAS_CONSTANTS`)
- 文件名: camelCase或kebab-case

### 文件组织
- 新组件放在对应的子目录中
- 工具函数放在utils目录
- 类型定义放在types目录
- 保持模块的单一职责

### 性能考虑
- 使用React.memo优化组件渲染
- 使用useCallback和useMemo优化性能
- 避免在render中创建新对象
- 合理使用状态管理，避免过度渲染

## 🔄 数据流

### 整体数据流
```
用户交互 → 组件事件 → Store Action → 状态更新 → 组件重渲染
                                ↓
                           数据库持久化
```

### 便签操作流程
```
用户创建便签 → StickyNote组件 → stickyNotesStore.addNote() 
            → IndexedDBService.createNote() → 数据库存储
            → 状态更新 → UI重新渲染
```

### AI汇总流程
```
用户选择便签 → AI汇总按钮 → aiStore.summarizeNotes() 
            → aiService.summarizeNotes() → AI API调用
            → 流式输出 → 新便签创建 → 溯源关系建立
```

## 🚀 扩展指南

### 添加新组件
1. 在对应目录创建组件文件
2. 添加TypeScript类型定义
3. 在index.ts中导出
4. 编写组件文档

### 添加新Store
1. 创建Store文件
2. 定义状态接口
3. 实现状态管理逻辑
4. 在index.ts中导出

### 添加新服务
1. 在services目录创建服务文件
2. 实现业务逻辑
3. 添加错误处理
4. 编写服务文档

这个架构设计确保了代码的可维护性、可扩展性和团队协作的效率。每个模块都有明确的职责边界，便于理解和修改。
