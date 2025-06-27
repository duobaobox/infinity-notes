# 开发指南

本文档为开发者提供详细的开发环境搭建和开发流程指导。

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0
- **浏览器**: 支持ES2020的现代浏览器

### 克隆项目

```bash
git clone https://github.com/your-username/infinite-notes.git
cd infinite-notes
```

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用。

## 📁 项目架构

### 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **UI组件**: Ant Design 5
- **状态管理**: Zustand
- **数据存储**: IndexedDB
- **样式方案**: CSS + CSS Modules
- **代码规范**: ESLint + TypeScript

### 目录结构说明

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
```

## 🔧 开发工具

### 推荐的VSCode扩展

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### 代码格式化

项目使用ESLint进行代码检查：

```bash
npm run lint          # 检查代码规范
npm run lint:fix      # 自动修复可修复的问题
```

### 类型检查

```bash
npm run type-check    # TypeScript类型检查
```

## 🏗️ 构建和部署

### 开发构建

```bash
npm run build         # 生产构建
npm run preview       # 预览构建结果
```

### 使用部署脚本

```bash
./scripts/deploy.sh build    # 构建
./scripts/deploy.sh serve    # 构建并预览
./scripts/deploy.sh clean    # 清理构建文件
```

## 🧪 测试

### 测试结构

```
tests/
├── utils/             # 测试工具
│   ├── traceabilityTest.ts
│   └── replaceModeTraceabilityTest.ts
└── README.md          # 测试说明
```

### 运行测试

```bash
# 目前项目主要使用手动测试
# 可以在浏览器控制台中运行测试工具
```

## 📝 开发规范

### 代码风格

1. **命名规范**
   - 组件: PascalCase (例: `StickyNote`)
   - 函数/变量: camelCase (例: `createNote`)
   - 常量: UPPER_SNAKE_CASE (例: `CANVAS_CONSTANTS`)
   - 文件名: camelCase或kebab-case

2. **组件规范**
   - 使用函数组件和Hooks
   - Props接口以组件名+Props命名
   - 导出组件使用default export
   - 工具函数使用named export

3. **类型定义**
   - 所有组件Props都要有类型定义
   - 复杂对象使用interface
   - 简单类型使用type alias
   - 类型文件统一放在types目录

### Git提交规范

使用[Conventional Commits](https://www.conventionalcommits.org/)规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

类型说明：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建工具或辅助工具的变动

示例：
```
feat(canvas): 添加无限画布缩放功能

- 支持鼠标滚轮缩放
- 添加缩放限制
- 优化缩放性能

Closes #123
```

## 🔍 调试技巧

### 浏览器开发者工具

1. **React DevTools**: 调试React组件状态
2. **Redux DevTools**: 查看Zustand状态变化
3. **Application面板**: 查看IndexedDB数据
4. **Performance面板**: 分析性能问题

### 常用调试方法

```typescript
// 1. 使用console.log调试
console.log('Debug info:', data);

// 2. 使用debugger断点
debugger;

// 3. 使用React DevTools Profiler
// 在组件中添加displayName
MyComponent.displayName = 'MyComponent';
```

### 性能调试

```typescript
// 性能监控
console.time('operation');
// ... 执行操作
console.timeEnd('operation');

// 内存使用监控
console.log('Memory usage:', performance.memory);
```

## 🚨 常见问题

### 开发环境问题

1. **端口被占用**
   ```bash
   # 查找占用端口的进程
   lsof -i :5173
   # 杀死进程
   kill -9 <PID>
   ```

2. **依赖安装失败**
   ```bash
   # 清理缓存重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **TypeScript错误**
   ```bash
   # 重启TypeScript服务
   # 在VSCode中: Ctrl+Shift+P -> TypeScript: Restart TS Server
   ```

### 构建问题

1. **内存不足**
   ```bash
   # 增加Node.js内存限制
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run build
   ```

2. **路径问题**
   - 确保使用相对路径
   - 检查Vite配置中的base路径

## 📚 学习资源

### 官方文档

- [React文档](https://react.dev/)
- [TypeScript文档](https://www.typescriptlang.org/docs/)
- [Vite文档](https://vitejs.dev/)
- [Ant Design文档](https://ant.design/)
- [Zustand文档](https://zustand-demo.pmnd.rs/)

### 项目相关

- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Web Performance](https://web.dev/performance/)

## 🤝 贡献流程

1. Fork项目
2. 创建功能分支
3. 开发和测试
4. 提交代码
5. 创建Pull Request
6. 代码审查
7. 合并代码

详细流程请参考[贡献指南](../CONTRIBUTING.md)。
