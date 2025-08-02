#!/bin/bash

# 网页版部署脚本
set -e

echo "🚀 开始构建和部署网页版..."

# 1. 安装依赖
echo "📦 安装依赖..."
npm ci

# 2. 构建项目
echo "🔨 构建项目..."
npm run build

# 3. 检查构建产物
echo "📋 检查构建产物..."
if [ ! -d "dist" ]; then
    echo "❌ 构建失败，dist 目录不存在"
    exit 1
fi

echo "✅ 构建成功！产物目录："
ls -la dist/

# 4. 生成部署信息
echo "📄 生成部署信息..."
cat > dist/DEPLOY_INFO.txt << EOF
项目名称: 无限便签 (Infinity Notes)
构建时间: $(date)
版本: $(node -p "require('./package.json').version")
Git提交: $(git rev-parse --short HEAD 2>/dev/null || echo "未知")

入口文件:
- index.html - 主入口（路由分发）
- landing.html - 官网介绍页
- app.html - 应用主页面

部署说明:
1. 将 dist 目录中的所有文件上传到您的 Web 服务器
2. 确保服务器支持单页应用路由 (SPA)
3. 推荐使用 HTTPS 协议
4. 建议配置 Gzip 压缩以提高加载速度

NGINX 配置示例:
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;
    
    # 静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA 路由支持
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# 5. 压缩打包
echo "📦 创建压缩包..."
cd dist
zip -r ../infinity-notes-web-$(node -p "require('../package.json').version").zip .
cd ..

echo "✅ 网页版构建完成！"
echo "📁 构建产物位置: dist/"
echo "📦 压缩包位置: infinity-notes-web-$(node -p "require('./package.json').version").zip"
echo "📄 部署信息文件: dist/DEPLOY_INFO.txt"