#!/bin/bash

# 桌面版发布脚本
set -e

echo "🚀 开始构建和发布桌面版到 Gitee..."

# 1. 安装依赖
echo "📦 安装依赖..."
npm ci

# 2. 构建所有平台的桌面应用
echo "🔨 构建 Mac 版本..."
npm run dist:mac

echo "🔨 构建 Windows 版本..."
npm run dist:win


# 3. 检查构建产物
echo "📋 检查构建产物..."
if [ ! -d "dist-electron" ]; then
    echo "❌ 构建失败，dist-electron 目录不存在"
    exit 1
fi

echo "✅ 构建成功！产物目录："
ls -la dist-electron/

# 4. 生成发布信息
echo "📄 生成发布信息..."
cat > dist-electron/RELEASE_INFO.txt <<   GITEE_RELEASE.md
EOF
项目名称: 无限便签 (Infinity Notes) 桌面版
构建时间: $(date)
版本: $(node -p "require('./package.json').version")
Git提交: $(git rev-parse --short HEAD 2>/dev/null || echo "未知")

支持平台:
- macOS (Intel 和 Apple Silicon)
- Windows (64位和32位)
- Linux (64位) - 当前版本暂未提供，将在后续版本中添加

文件说明:
macOS:
- Infinity Notes-0.1.0.dmg - Intel芯片Mac安装包
- Infinity Notes-0.1.0-arm64.dmg - Apple Silicon芯片Mac安装包
- Infinity Notes-0.1.0-mac.zip - Intel芯片Mac压缩包
- Infinity Notes-0.1.0-arm64-mac.zip - Apple Silicon芯片Mac压缩包

Windows:
- Infinity Notes Setup 0.1.0.exe - Windows安装包（推荐）
- Infinity Notes 0.1.0.exe - Windows便携版

安装说明:
macOS:
1. 下载 .dmg 文件
2. 双击打开并拖拽应用到 Applications 文件夹
3. 首次运行可能需要在系统偏好设置中允许打开

Windows:
1. 下载安装包或便携版
2. 运行安装程序并按照提示操作
3. 或直接运行便携版（无需安装）

Linux:
1. 下载 .deb 或 .AppImage 文件
2. 对于 .deb 文件，双击安装或使用命令：sudo dpkg -i 文件名.deb
3. 对于 .AppImage 文件，添加执行权限后直接运行

系统要求:
- macOS: 10.15 或更高版本
- Windows: Windows 10 或更高版本
- Linux: 支持现代桌面环境的发行版（将在后续版本完善）
EOF

# 5. 压缩打包所有平台的安装包
echo "📦 创建全平台压缩包..."
cd dist-electron
zip -r ../infinity-notes-desktop-$(node -p "require('../package.json').version").zip \
  *.dmg *.zip *.exe \
  RELEASE_INFO.txt

cd ..

echo "✅ 桌面版构建完成！"
echo "📁 构建产物位置: dist-electron/"
echo "📄 发布信息文件: dist-electron/RELEASE_INFO.txt"
echo "📦 全平台压缩包: infinity-notes-desktop-$(node -p "require('./package.json').version").zip"

# 6. 提交代码到 Gitee
echo "📤 推送代码到 Gitee..."
git add .
git commit -m "Publish desktop version v$(node -p "require('./package.json').version")"
git push gitee main

echo "✅ 桌面版发布准备完成！"
echo "请访问 https://gitee.com/duobaow/infinity-notes/releases/new 创建新发布"
echo "并将以下文件上传到发布中："
echo "  - infinity-notes-desktop-$(node -p "require('./package.json').version").zip"
echo "  - 或者分别上传各个平台的安装包"