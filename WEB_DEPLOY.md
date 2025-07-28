# 无限便签 - 网页版部署指南

## 概述

无限便签（Infinity Notes）的网页版已成功构建，可以部署到任何支持静态文件托管的 Web 服务器上。

## 快速开始

### 1. 构建网页版

```bash
# 安装依赖
npm install

# 构建网页版
npm run build

# 本地预览
npm run preview
```

### 2. 使用部署脚本

```bash
# 运行部署脚本（推荐）
./scripts/deploy-web.sh
```

## 部署选项

### 选项 1：静态文件托管

适用于：Nginx、Apache、IIS 等 Web 服务器

1. 将 `dist` 目录中的所有文件上传到服务器
2. 配置服务器支持 SPA 路由
3. 启用 HTTPS 和 Gzip 压缩

### 选项 2：CDN 部署

适用于：阿里云 OSS、腾讯云 COS、AWS S3 等

1. 上传 `dist` 目录内容到 CDN
2. 配置自定义域名
3. 设置默认首页为 `index.html`

### 选项 3：云平台部署

适用于：Vercel、Netlify、GitHub Pages 等

1. 连接 Git 仓库
2. 设置构建命令：`npm run build`
3. 设置输出目录：`dist`

## 服务器配置

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    # 启用 Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Apache 配置示例

创建 `.htaccess` 文件：

```apache
RewriteEngine On
RewriteBase /

# SPA 路由支持
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# 启用压缩
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# 缓存设置
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/ico "access plus 1 year"
    ExpiresByType image/icon "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

## 页面结构

网页版包含三个主要页面：

- **index.html** - 入口页面，处理路由分发
- **landing.html** - 产品介绍页面（首次访问显示）
- **app.html** - 应用主界面

## 功能特性

✅ **完整功能**：包含桌面版的所有核心功能
✅ **响应式设计**：适配不同屏幕尺寸
✅ **离线支持**：使用 IndexedDB 本地存储
✅ **PWA 就绪**：可安装为桌面应用
✅ **SEO 友好**：支持搜索引擎优化

## 性能优化

- 代码分割和懒加载
- 静态资源压缩
- 缓存策略优化
- Bundle 大小优化

## 浏览器兼容性

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

## 域名和 HTTPS

建议使用 HTTPS 协议部署，这样可以：

1. 提高安全性
2. 支持 PWA 功能
3. 改善搜索引擎排名
4. 启用现代 Web API

## 监控和分析

建议集成以下服务：

- Google Analytics - 用户行为分析
- Sentry - 错误监控
- Web Vitals - 性能监控

## 故障排除

### 常见问题

1. **页面空白**：检查控制台错误，通常是路径问题
2. **路由不工作**：确保服务器配置了 SPA 支持
3. **静态资源 404**：检查 base 路径配置
4. **功能异常**：确保启用了 HTTPS（某些 API 需要）

### 日志查看

打开浏览器开发者工具 → Console 查看详细错误信息。

## 技术支持

如需技术支持，请：

1. 查看浏览器控制台错误
2. 检查网络请求状态
3. 确认服务器配置正确
4. 提供详细的错误信息

---

🎉 恭喜！您的无限便签网页版已准备就绪！
