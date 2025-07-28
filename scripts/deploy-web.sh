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
    
    # 启用 Gzip 压缩
    gzip on;
    gzip_types text/css application/javascript application/json;
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA 路由支持
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

echo "🎉 部署准备完成！"
echo ""
echo "📁 部署文件位置: $(pwd)/dist/"
echo "🌐 本地预览: npm run preview"
echo "📋 部署信息: dist/DEPLOY_INFO.txt"
echo ""
echo "部署建议："
echo "1. 上传 dist 目录中的所有文件到您的 Web 服务器"
echo "2. 配置服务器支持 SPA 路由"
echo "3. 启用 HTTPS 和 Gzip 压缩"
echo "4. 设置适当的缓存策略"
