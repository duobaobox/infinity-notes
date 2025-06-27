# 无限便签 - 无限画布思维整理工具

一个基于 React + TypeScript + Vite 构建的无限便签应用，支持在无限画布上创建、连接和整理想法，并提供 AI 智能汇总功能。

## ✨ 主要特性

- 🎨 **无限画布** - 在无边界的画布上自由创作，支持缩放、拖拽
- 🔗 **智能连接** - 用连接线将相关便签串联，构建清晰的思维脉络
- 🤖 **AI 智能汇总** - 选择多个便签，AI 自动汇总要点生成新便签
- 💾 **本地存储** - 数据存储在本地浏览器，保护隐私安全
- ⚡ **快捷操作** - 丰富的键盘快捷键，提升操作效率
- 🎯 **溯源追踪** - 追踪便签生成来源，了解想法演化过程

## 🚀 快速开始

### 开发环境

```bash
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

## 📁 项目结构

```
├── index.html              # 路由分发入口
├── app.html               # 应用主入口
├── landing.html           # 官网页面
├── nginx.conf             # Nginx配置文件模板
├── scripts/               # 部署和构建脚本
│   └── deploy.sh          # 自动化部署脚本
├── tests/                 # 测试文件目录
│   ├── README.md          # 测试说明文档
│   └── utils/             # 测试工具
├── src/                   # 源代码目录
│   ├── components/        # React组件
│   │   ├── canvas/        # 画布相关组件
│   │   ├── notes/         # 便签组件
│   │   ├── modals/        # 模态框组件
│   │   ├── layout/        # 布局组件
│   │   └── utils/         # 组件工具函数
│   ├── stores/            # Zustand状态管理
│   ├── database/          # IndexedDB数据层
│   ├── services/          # 业务逻辑服务
│   ├── hooks/             # 自定义React Hooks
│   ├── utils/             # 通用工具函数
│   ├── types/             # TypeScript类型定义
│   └── assets/            # 静态资源
├── public/                # 公共静态资源
└── dist/                  # 构建输出目录
```

## 🌐 多页面架构

项目采用多页面架构设计：

- **index.html** - 智能路由分发器，首次访问显示官网，后续直接进入应用
- **landing.html** - 官网引导页面，采用 Notion 风格设计
- **app.html** - 应用主界面，包含完整的便签功能

## 🛠 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **UI 组件**: Ant Design 5
- **状态管理**: Zustand
- **数据存储**: IndexedDB
- **样式方案**: CSS Modules + 原生 CSS
- **代码规范**: ESLint + TypeScript

## 📱 功能模块

### 便签管理

- 创建、编辑、删除便签
- 支持多种颜色和样式
- 实时保存，防止数据丢失

### 画布操作

- 无限滚动画布
- 缩放和平移
- 网格背景辅助

### 连接功能

- 便签间连接线
- 可视化关系展示
- 溯源连接追踪

### AI 功能

- 智能内容汇总
- 多便签合并
- 替换模式生成

## 🎯 使用说明

1. **首次访问** - 自动显示官网介绍页面
2. **创建便签** - 双击画布空白处或使用快捷键 `Ctrl+N`
3. **连接便签** - 点击便签连接点，拖拽到目标便签
4. **AI 汇总** - 选择多个便签，点击 AI 汇总按钮
5. **快捷操作** - 支持撤销重做、搜索、缩放等快捷键

## 🔧 开发指南

### 环境要求

- Node.js >= 16
- npm >= 8

### 开发命令

```bash
npm run dev          # 开发服务器
npm run build        # 生产构建
npm run preview      # 预览构建
npm run lint         # 代码检查
npm run lint:fix     # 自动修复
npm run type-check   # 类型检查
npm run clean        # 清理构建文件
```

### 快速部署

项目提供了自动化部署脚本，支持一键部署：

```bash
# 使用部署脚本
./scripts/deploy.sh dev      # 启动开发服务器
./scripts/deploy.sh build    # 构建生产版本
./scripts/deploy.sh serve    # 构建并预览
./scripts/deploy.sh clean    # 清理构建文件
```

### 项目特色

- 📂 **模块化架构**: 清晰的目录结构，详细的架构文档说明
- 🧪 **测试友好**: 独立的测试目录，包含测试工具和说明文档
- 🚀 **部署简单**: 提供自动化部署脚本和 Nginx 配置模板
- 📝 **文档完善**: 完整的开发、部署和架构文档
- 🔧 **开发体验**: 完整的 TypeScript 支持和 ESLint 配置

### 📚 文档导航

- [📖 架构文档](docs/ARCHITECTURE.md) - 详细的项目架构和模块说明
- [🔧 开发指南](docs/DEVELOPMENT.md) - 开发环境搭建和开发流程
- [🚀 部署指南](docs/DEPLOYMENT.md) - 生产环境部署和配置
- [📡 API 文档](docs/API.md) - 接口和数据结构说明
- [🤝 贡献指南](CONTRIBUTING.md) - 如何参与项目贡献
- [📋 更新日志](CHANGELOG.md) - 版本更新记录

## 📄 许可证

MIT License
