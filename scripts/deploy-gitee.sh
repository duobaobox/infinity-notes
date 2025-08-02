#!/bin/bash

# Gitee 发布脚本
set -e

echo "🚀 开始构建和发布到 Gitee..."

# 1. 安装依赖
echo "📦 安装依赖..."
npm ci

# 2. 构建 Electron 应用
echo "🔨 构建 Electron 应用..."
npm run dist

# 3. 检查构建产物
echo "📋 检查构建产物..."
if [ ! -d "dist-electron" ]; then
    echo "❌ 构建失败，dist-electron 目录不存在"
    exit 1
fi

echo "✅ 构建成功！产物目录："
ls -la dist-electron/

# 4. 提交代码到 Gitee
echo "📤 推送代码到 Gitee..."
git add .
git commit -m "Release new version"
git push gitee main

echo "📄 Gitee 发布准备完成"
echo "请访问 https://gitee.com/duobaow/infinity-notes/releases/new 创建新发布"
echo "并将 dist-electron 目录中的安装包上传到发布中"