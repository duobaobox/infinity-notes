#!/bin/bash

# 网页版发布脚本
set -e

echo "🚀 开始发布网页版到 Gitee..."

# 1. 运行部署脚本（构建和打包）
echo "📦 构建和打包网页版..."
./scripts/deploy-web.sh

# 2. 提交代码到 Gitee
echo "📤 推送代码到 Gitee..."
git add .
git commit -m "Publish web version"
git push gitee main

echo "✅ 网页版发布准备完成！"
echo "请访问 https://gitee.com/duobaow/infinity-notes/releases/new 创建新发布"
echo "并将以下文件上传到发布中："
echo "  - infinity-notes-web-$(node -p "require('./package.json').version").zip"