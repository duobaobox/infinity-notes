# 无限便签 - 智能无限画布思维整理工具

一个基于 React + TypeScript + Vite 构建的现代化无限便签应用，支持在无限画布上创建、连接和整理想法，并提供强大的 AI 智能汇总功能。

## ✨ 核心特性

### 🎨 无限画布体验

- **无边界画布** - 在无限大的画布上自由创作，支持平滑缩放和拖拽
- **网格背景** - 精美的网格背景辅助对齐和定位
- **多级缩放** - 支持精确缩放控制，适应不同工作场景
- **高性能渲染** - 优化的渲染机制，流畅的交互体验

### 📝 智能便签系统

- **丰富编辑器** - 支持 Markdown 格式，实时预览
- **多种颜色主题** - 8 种预设颜色，支持自定义配色
- **灵活尺寸调整** - 可自由调整便签大小，适应不同内容
- **拖拽移动** - 流畅的拖拽体验，精确定位
- **虚拟化渲染** - 大内容自动虚拟化，保持性能

### 🤖 AI 智能功能

- **流式生成** - 实时流式显示 AI 生成内容，体验流畅
- **智能汇总** - 选择多个便签，AI 自动汇总要点生成新便签
- **思维链显示** - 支持显示 AI 思考过程，了解推理路径
- **多种 AI 模式** - 支持工作、学习、生活等多种专业模式
- **溯源追踪** - 完整的便签生成溯源，包括替换模式支持

### 🔗 连接与关系

- **可视化连接** - 用连接线将相关便签串联，构建思维导图
- **智能连接点** - 自动计算最佳连接位置
- **溯源连接** - 查看便签的生成来源和依赖关系
- **连接状态指示** - 清晰的视觉反馈，了解便签连接状态

### 💾 数据管理

- **本地存储** - 基于 IndexedDB 的本地存储，数据安全可靠
- **实时同步** - 自动保存，防止数据丢失
- **撤销重做** - 完整的操作历史记录，支持撤销重做
- **性能监控** - 内置性能监控，优化用户体验

### ⚡ 操作体验

- **丰富快捷键** - 完整的键盘快捷键支持，提升操作效率
- **智能搜索** - 快速搜索便签内容
- **批量操作** - 支持多选和批量处理
- **上下文菜单** - 右键菜单快速访问功能

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 开发环境

```bash
# 克隆项目
git clone https://github.com/your-username/infinite-notes.git
cd infinite-notes

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 生产构建

```bash
# 构建项目
npm run build

# 预览构建结果
npm run preview

# 访问 http://localhost:4173
```

## 🎯 功能使用指南

### 基础操作

1. **创建便签**

   - 双击画布空白处
   - 使用快捷键 `Ctrl+N` (Windows) 或 `Cmd+N` (Mac)
   - 点击侧边栏的"新建便签"按钮

2. **编辑便签**

   - 双击便签内容区域进入编辑模式
   - 支持 Markdown 语法
   - 按 `Esc` 或点击外部区域退出编辑

3. **移动和调整**
   - 拖拽便签头部移动位置
   - 拖拽右下角调整大小
   - 支持精确的像素级定位

### AI 功能使用

1. **智能汇总**

   - 选择多个便签（按住 Ctrl 多选）
   - 点击 AI 汇总按钮
   - 观看实时生成过程

2. **AI 模式配置**

   - 打开设置 → AI 设置
   - 选择合适的 AI 模式（工作、学习、生活等）
   - 配置 API 密钥和模型参数

3. **查看思维链**
   - 在 AI 设置中启用"显示思维过程"
   - AI 生成时会显示完整的思考步骤

### 连接功能

1. **创建连接**

   - 点击便签右下角的连接点
   - 拖拽到目标便签建立连接
   - 支持多种连接样式

2. **溯源查看**
   - 点击便签设置按钮（三个点）
   - 选择"显示溯源连接"
   - 查看便签的生成来源

## 🛠 技术架构

### 前端技术栈

- **React 18** - 现代化的前端框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite 6** - 快速的构建工具
- **Ant Design 5** - 企业级 UI 组件库
- **Zustand** - 轻量级状态管理
- **React Markdown** - Markdown 渲染支持

### 数据存储

- **IndexedDB** - 浏览器本地数据库
- **localStorage** - 用户设置存储
- **sessionStorage** - 会话状态存储

### 性能优化

- **虚拟化渲染** - 大内容自动虚拟化
- **组件懒加载** - 按需加载组件
- **内存缓存** - 智能缓存机制
- **防抖节流** - 优化用户交互

## 📁 项目结构

```
src/
├── components/            # React 组件
│   ├── canvas/           # 画布相关组件
│   │   ├── InfiniteCanvasNew.tsx    # 主画布组件
│   │   ├── CanvasToolbar.tsx        # 工具栏组件
│   │   ├── CanvasGrid.tsx           # 网格背景
│   │   └── StickyNoteSlots.tsx      # 便签插槽
│   ├── notes/            # 便签组件
│   │   ├── StickyNote.tsx           # 便签主组件
│   │   └── VirtualizedMarkdown.tsx  # 虚拟化Markdown
│   ├── modals/           # 模态框组件
│   │   ├── SettingsModal.tsx        # 设置模态框
│   │   └── SourceNotesModal.tsx     # 溯源模态框
│   ├── layout/           # 布局组件
│   │   └── Sidebar.tsx              # 侧边栏
│   └── ai/               # AI 相关组件
│       ├── AIModelSelector.tsx      # AI 模型选择器
│       └── AIPromptTemplateSelector.tsx  # AI 提示模板选择器
├── stores/               # 状态管理
│   ├── stickyNotesStore.ts     # 便签状态
│   ├── canvasStore.ts          # 画布状态
│   ├── connectionStore.ts      # 连接状态
│   ├── aiStore.ts              # AI 状态
│   └── uiStore.ts              # UI 状态
├── database/             # 数据库层
│   ├── IndexedDBService.ts     # 数据库服务
│   ├── IndexedDBAdapter.ts     # 适配器
│   └── CacheManager.ts         # 缓存管理
├── services/             # 业务逻辑
│   └── ai/
│       └── aiService.ts        # AI 服务
├── hooks/                # 自定义 Hooks
│   ├── useKeyboardShortcuts.ts # 快捷键 Hook
│   └── ai/
│       └── useAISettings.ts    # AI 设置 Hook
├── utils/                # 工具函数
│   ├── connectionLineManager.ts # 连接线管理
│   └── aiConfigManager.ts       # AI 配置管理
└── types/                # 类型定义
    ├── ai.ts                   # AI 相关类型
    └── aiProviders.ts          # AI 提供商类型
```

## 🌐 多页面架构

项目采用创新的多页面架构设计：

- **index.html** - 智能路由分发器，首次访问显示官网，后续直接进入应用
- **landing.html** - 现代化的官网引导页面，采用 Notion 风格设计
- **app.html** - 应用主界面，包含完整的便签功能

## ⌨️ 快捷键列表

| 快捷键             | 功能       | 说明                   |
| ------------------ | ---------- | ---------------------- |
| `Ctrl+N` / `Cmd+N` | 创建便签   | 在画布中心创建新便签   |
| `Ctrl+S` / `Cmd+S` | 保存       | 保存所有便签           |
| `Ctrl+Z` / `Cmd+Z` | 撤销       | 撤销上一步操作         |
| `Ctrl+Y` / `Cmd+Y` | 重做       | 重做上一步操作         |
| `Ctrl++` / `Cmd++` | 放大       | 放大画布               |
| `Ctrl+-` / `Cmd+-` | 缩小       | 缩小画布               |
| `Ctrl+0` / `Cmd+0` | 重置缩放   | 重置画布缩放到 100%    |
| `Ctrl+,` / `Cmd+,` | 设置       | 打开设置面板           |
| `Esc`              | 退出编辑   | 退出便签编辑模式       |
| `Ctrl+Enter`       | 保存并退出 | 保存便签内容并退出编辑 |

## 🔧 配置说明

### AI 配置

1. 打开设置面板 → AI 设置
2. 配置 API 信息：
   - API 地址：如 `https://api.openai.com/v1`
   - API 密钥：您的 API 密钥
   - 模型选择：如 `gpt-4o-mini`
3. 选择 AI 模式：
   - 正常对话模式：直接与 AI 对话
   - 工作任务助手：专注工作效率
   - 学习笔记助手：优化学习内容
   - 生活规划助手：个人生活规划
   - 创意灵感助手：激发创意思维

### 外观设置

- 主题选择：浅色/深色主题
- 网格显示：开启/关闭网格背景
- 缩放限制：设置最大/最小缩放比例
- 便签默认颜色：设置新建便签的默认颜色

## 🧪 测试功能

项目包含完整的测试工具：

```bash
# 运行测试工具
npm run dev

# 访问测试页面
http://localhost:5173/?test=prompt-template
```

## 🔒 数据安全

- **本地存储**：所有数据存储在本地浏览器，不上传到服务器
- **加密保护**：敏感数据进行加密存储
- **备份机制**：支持数据导出和导入
- **隐私保护**：AI 调用时不保存用户数据

## 🌟 开发亮点

### 性能优化

- **虚拟化渲染**：大内容自动虚拟化，支持处理超长文本
- **智能缓存**：多层缓存机制，提升访问速度
- **防抖节流**：优化频繁操作，减少资源消耗
- **懒加载**：按需加载组件，减少初始加载时间

### 用户体验

- **流式输出**：AI 生成内容实时显示，不等待完整响应
- **预连接**：用户输入时预连接 AI 服务，减少等待时间
- **智能提示**：丰富的提示信息和操作指引
- **错误处理**：完善的错误处理和用户友好的错误提示

### 技术创新

- **思维链显示**：支持展示 AI 思考过程，透明化 AI 决策
- **替换模式溯源**：记录便签替换历史，支持查看原始内容
- **连接线管理**：高性能的连接线渲染和管理系统
- **多页面架构**：创新的页面路由设计，优化首次访问体验

## 📚 文档导航

- [📖 架构文档](docs/ARCHITECTURE.md) - 详细的项目架构和模块说明
- [🔧 开发指南](docs/DEVELOPMENT.md) - 开发环境搭建和开发流程
- [🚀 部署指南](docs/DEPLOYMENT.md) - 生产环境部署和配置
- [📡 API 文档](docs/API.md) - 接口和数据结构说明
- [🤝 贡献指南](CONTRIBUTING.md) - 如何参与项目贡献
- [📋 更新日志](CHANGELOG.md) - 版本更新记录

## 🚀 部署

### 自动化部署

使用内置的部署脚本：

```bash
# 开发环境
./scripts/deploy.sh dev

# 构建生产版本
./scripts/deploy.sh build

# 构建并预览
./scripts/deploy.sh serve

# 清理构建文件
./scripts/deploy.sh clean
```

### 手动部署

```bash
# 构建项目
npm run build

# 部署到静态文件服务器
# 将 dist/ 目录中的文件上传到服务器
```

### Nginx 配置

项目提供了 Nginx 配置模板 (`nginx.conf`)，支持：

- 多页面路由
- 静态文件缓存
- Gzip 压缩
- 安全头设置

## 🤝 贡献指南

欢迎参与项目贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细信息。

### 快速开始贡献

1. Fork 本项目
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

本项目使用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

感谢以下开源项目的支持：

- [React](https://reactjs.org/) - 前端框架
- [TypeScript](https://www.typescriptlang.org/) - 类型系统
- [Vite](https://vitejs.dev/) - 构建工具
- [Ant Design](https://ant.design/) - UI 组件库
- [Zustand](https://github.com/pmndrs/zustand) - 状态管理
- [React Markdown](https://github.com/remarkjs/react-markdown) - Markdown 渲染

---

<div align="center">
<p>如果这个项目对您有帮助，请给个 ⭐️ 支持一下！</p>
<p>Made with ❤️ by 无限便签项目贡献者</p>
</div>
