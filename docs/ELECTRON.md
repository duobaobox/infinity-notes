# Infinity Notes - Electron 多平台开发指南

## 🎯 项目概览

Infinity Notes 现在已经成功配置为 Electron 多平台桌面应用！这是一个基于 React + TypeScript + Vite + Electron 的现代化无限画布思维整理工具。

## 📁 项目结构

```
infinity-notes/
├── electron/                    # Electron 主进程文件
│   ├── main.cjs                # 主进程入口文件 (CommonJS)
│   └── preload.cjs             # 预加载脚本 (CommonJS)
├── dist/                       # Web 应用构建输出
├── dist-electron/              # Electron 应用构建输出
│   ├── *.dmg                   # macOS DMG 安装包
│   ├── *.zip                   # macOS ZIP 包
│   ├── mac/                    # macOS 应用目录
│   └── mac-arm64/              # macOS ARM64 应用目录
├── src/                        # React 应用源代码
└── package.json               # 项目配置文件
```

## � 开发配置

### .gitignore 更新

项目的 `.gitignore` 文件已更新，新增以下 Electron 相关忽略规则：

```gitignore
# Electron 构建产物
dist-electron
out/
release/
app/dist/
app/node_modules/

# Electron 打包文件
*.dmg
*.pkg
*.deb
*.rpm
*.tar.gz
*.zip
*.exe
*.msi
*.AppImage

# Electron 开发文件
.electron/
electron-dist/
build/
*.blockmap

# 代码签名文件
*.p12
*.cer
*.provisionprofile

# Electron Builder 缓存
.electron-builder/
```

这确保了构建产物和临时文件不会被提交到版本控制系统。

### 环境变量配置

开发时可以设置环境变量：

```bash
# 开发模式
NODE_ENV=development npm run electron:dev

# 生产模式
NODE_ENV=production npm run electron
```

## �🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- macOS (用于 macOS 构建)

### 安装依赖

```bash
npm install
```

### 开发模式

#### 1. Web 应用开发

```bash
npm run dev
# 访问 http://localhost:5173
```

#### 2. Electron 应用开发

```bash
# 方式一：同时启动 Web 服务和 Electron
npm run electron:dev

# 方式二：分别启动
npm run dev        # 终端 1: 启动 Web 服务
npm run electron   # 终端 2: 启动 Electron
```

### 构建与打包

#### 1. 构建 Web 应用

```bash
npm run build
```

#### 2. 构建多平台 Electron 应用

```bash
# 构建所有平台
npm run dist

# 构建特定平台
npm run dist:mac     # macOS (DMG + ZIP)
npm run dist:win     # Windows (NSIS + Portable)
npm run dist:linux   # Linux (AppImage + DEB)
```

## 📦 构建产物

### macOS 构建成功的文件：

- `Infinity Notes-0.1.0.dmg` - Intel macOS 安装包
- `Infinity Notes-0.1.0-arm64.dmg` - Apple Silicon macOS 安装包
- `Infinity Notes-0.1.0-mac.zip` - Intel macOS 压缩包
- `Infinity Notes-0.1.0-arm64-mac.zip` - Apple Silicon macOS 压缩包

## ⚙️ Electron 配置详解

### 主进程 (main.cjs)

```javascript
// 主要功能
- 创建 BrowserWindow
- 处理应用生命周期
- 管理菜单和快捷键
- 处理 IPC 通信
- 加载 Web 应用
```

### 预加载脚本 (preload.cjs)

```javascript
// 安全的 API 暴露
- contextBridge 安全桥接
- 菜单事件监听
- 平台信息获取
- 应用版本信息
```

### package.json 配置

```json
{
  "main": "electron/main.cjs",
  "scripts": {
    "electron": "electron .",
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",
    "dist": "npm run build && electron-builder",
    "dist:mac": "npm run build && electron-builder --mac"
  },
  "build": {
    "appId": "com.duobaobox.infinity-notes",
    "productName": "Infinity Notes",
    "directories": {
      "output": "dist-electron"
    }
  }
}
```

## 🔧 技术架构

### 前端技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite 6** - 构建工具
- **Ant Design 5** - UI 组件库
- **Zustand** - 状态管理

### Electron 集成

- **主进程** - Node.js 环境，管理应用生命周期
- **渲染进程** - Chromium 环境，运行 React 应用
- **预加载脚本** - 安全的 API 桥接
- **IPC 通信** - 主进程与渲染进程通信

### 数据存储

- **IndexedDB** - 本地数据存储
- **localStorage** - 用户设置
- **sessionStorage** - 会话数据

## 🎨 应用特性

### 核心功能

- **无限画布** - 自由创作空间
- **智能便签** - Markdown 支持
- **AI 集成** - 智能汇总功能
- **连接线** - 思维导图连接
- **多平台** - Windows、macOS、Linux

### Electron 增强

- **原生菜单** - 系统级菜单栏
- **快捷键** - 全局快捷键支持
- **文件关联** - 支持文件类型关联
- **系统托盘** - 后台运行（可选）
- **自动更新** - 应用更新机制（可配置）

## 🛠️ 开发工作流

### 1. 开发阶段

```bash
npm run electron:dev  # 热重载开发
```

### 2. 测试阶段

```bash
npm run build        # 构建 Web 应用
npm run electron     # 测试 Electron 应用
```

### 3. 发布阶段

```bash
npm run dist:mac     # 构建 macOS 版本
npm run dist:win     # 构建 Windows 版本
npm run dist:linux   # 构建 Linux 版本
```

## 📱 多平台支持

### macOS

- ✅ Intel (x64) 支持
- ✅ Apple Silicon (arm64) 支持
- ✅ DMG 安装包
- ✅ ZIP 便携包
- ✅ 代码签名 (需要证书)

### Windows

- ✅ x64 架构支持
- ✅ x32 架构支持
- ✅ NSIS 安装程序
- ✅ 便携版本

### Linux

- ✅ x64 架构支持
- ✅ AppImage 格式
- ✅ DEB 软件包

## 🚨 注意事项

### 代码签名

- **macOS**: 需要 Apple Developer 证书
- **Windows**: 需要代码签名证书
- **当前状态**: 使用默认配置，未签名

### 图标配置

- 当前使用 Electron 默认图标
- 建议创建 512x512 或更大的应用图标
- 支持 .icns (macOS)、.ico (Windows)、.png (Linux)

### 性能优化

- Web 应用已优化打包体积
- Electron 应用包含完整 Chromium，体积较大
- 可通过 asar 打包减小体积

## 🔮 下一步计划

### 功能增强

- [ ] 添加系统托盘功能
- [ ] 实现文件拖拽支持
- [ ] 添加全屏模式
- [ ] 集成系统通知

### 构建优化

- [ ] 配置应用图标
- [ ] 添加代码签名
- [ ] 实现自动更新
- [ ] 优化打包体积

### 平台特性

- [ ] macOS 触控板手势
- [ ] Windows 任务栏集成
- [ ] Linux 桌面集成

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [React](https://reactjs.org/) - 用户界面库
- [Vite](https://vitejs.dev/) - 现代前端构建工具
- [Ant Design](https://ant.design/) - 企业级 UI 设计语言

---

🎉 **恭喜！你的 Infinity Notes 项目现在已经成功配置为多平台 Electron 应用！**
