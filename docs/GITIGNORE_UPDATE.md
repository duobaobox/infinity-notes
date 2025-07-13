# .gitignore 更新说明

## 📋 更新内容

本次更新为 Infinity Notes 项目的 `.gitignore` 文件添加了完整的 Electron 相关忽略规则，确保 Electron 构建产物和临时文件不会被提交到版本控制系统。

## 🔧 新增的忽略规则

### Electron 构建产物

```gitignore
dist-electron          # 主要构建输出目录
out/                   # 备用输出目录
release/               # 发布目录
app/dist/              # 应用构建目录
app/node_modules/      # 应用依赖
```

### Electron 打包文件

```gitignore
*.dmg                  # macOS 磁盘映像
*.pkg                  # macOS 安装包
*.deb                  # Debian 包
*.rpm                  # RedHat 包
*.tar.gz               # 压缩包
*.zip                  # ZIP 包
*.exe                  # Windows 可执行文件
*.msi                  # Windows 安装包
*.AppImage             # Linux AppImage
```

### Electron 开发文件

```gitignore
.electron/             # Electron 缓存
electron-dist/         # Electron 构建缓存
build/                 # 构建目录
*.blockmap             # 块映射文件
```

### Electron Builder 配置

```gitignore
.electron-builder/                    # Builder 缓存目录
electron-builder-*.yaml              # Builder 配置文件
builder-debug.yml                    # 调试配置
builder-effective-config.yaml        # 有效配置
```

### 代码签名文件

```gitignore
*.p12                  # PKCS#12 证书
*.cer                  # 证书文件
*.provisionprofile     # iOS 配置文件
entitlements.plist     # 权限文件
```

### 自动更新相关

```gitignore
latest*.yml            # 更新配置文件
*.blockmap             # 块映射文件
```

### macOS 特定文件

```gitignore
*.DS_Store             # macOS 目录元数据
.AppleDouble           # AppleDouble 文件
.LSOverride            # LaunchServices 覆盖
```

## ✅ 验证结果

通过 `git check-ignore` 命令验证，以下文件类型已被正确忽略：

- ✅ `dist-electron/` 目录
- ✅ `*.dmg` 文件
- ✅ `*.zip` 文件
- ✅ `*.exe` 文件
- ✅ `.electron-builder/` 目录

## 🎯 影响说明

### 已忽略的文件

- 所有 Electron 构建产物不会被提交
- 临时缓存文件不会污染仓库
- 代码签名证书等敏感文件被保护

### 仍会被跟踪的文件

- `electron/main.cjs` - Electron 主进程源码
- `electron/preload.cjs` - 预加载脚本源码
- `package.json` - 项目配置（包含 Electron 构建配置）

## 📚 参考

这些忽略规则基于以下最佳实践：

- [Electron 官方建议](https://www.electronjs.org/docs/latest/tutorial/quick-start)
- [electron-builder 文档](https://www.electron.build/)
- [GitHub 的 Node.js gitignore 模板](https://github.com/github/gitignore/blob/main/Node.gitignore)

## 🔄 如何应用

如果你已经有一些被跟踪的构建文件，可以运行：

```bash
# 移除已跟踪的构建文件
git rm -r --cached dist-electron/
git commit -m "Remove tracked Electron build files"
```

现在你的项目仓库将保持干净，只包含源代码而不包含构建产物！🎉
