# 部署指南

本文档提供了无限便签项目的详细部署指导，包括开发环境、生产环境和各种部署平台的配置。

## 🚀 快速部署

### 使用自动化脚本

项目提供了便捷的部署脚本：

```bash
# 开发环境
./scripts/deploy.sh dev

# 生产构建
./scripts/deploy.sh build

# 构建并预览
./scripts/deploy.sh serve

# 清理构建文件
./scripts/deploy.sh clean
```

### 手动部署

```bash
# 1. 安装依赖
npm install

# 2. 构建项目
npm run build

# 3. 预览构建结果
npm run preview
```

## 🌐 生产环境部署

### 静态文件服务器

#### Nginx 配置

使用项目提供的 Nginx 配置模板：

```bash
# 复制配置文件
cp nginx.conf /etc/nginx/sites-available/infinity-notes

# 修改配置中的域名和路径
sudo nano /etc/nginx/sites-available/infinity-notes

# 启用站点
sudo ln -s /etc/nginx/sites-available/infinity-notes /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

#### Apache 配置

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/infinite-notes/dist

    # 启用压缩
    LoadModule deflate_module modules/mod_deflate.so
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \
            \.(?:gif|jpe?g|png)$ no-gzip dont-vary
        SetEnvIfNoCase Request_URI \
            \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    </Location>

    # 处理SPA路由
    <Directory "/path/to/infinite-notes/dist">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted

        # 重写规则
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # 缓存策略
    <FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </FilesMatch>
</VirtualHost>
```

### CDN 部署

#### 阿里云 OSS + CDN

```bash
# 1. 安装阿里云CLI工具
npm install -g @alicloud/cli

# 2. 配置访问密钥
aliyun configure

# 3. 上传到OSS
aliyun oss cp dist/ oss://your-bucket-name/ --recursive

# 4. 配置CDN加速
# 在阿里云控制台配置CDN域名和缓存规则
```

#### 腾讯云 COS + CDN

```bash
# 1. 安装腾讯云CLI工具
pip install coscmd

# 2. 配置访问密钥
coscmd config -a your-secret-id -s your-secret-key -b your-bucket -r your-region

# 3. 上传文件
coscmd upload -r dist/ /
```

## ☁️ 云平台部署

### Vercel 部署

1. **连接 GitHub 仓库**

   - 访问 [Vercel](https://vercel.com)
   - 导入 GitHub 仓库
   - 选择无限便签项目

2. **配置构建设置**

   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "installCommand": "npm install"
   }
   ```

3. **环境变量配置**
   - 在 Vercel 控制台设置环境变量
   - 配置自定义域名（可选）

### Netlify 部署

1. **连接仓库**

   - 访问 [Netlify](https://netlify.com)
   - 连接 GitHub 仓库

2. **构建配置**
   创建 `netlify.toml` 文件：

   ```toml
   [build]
     publish = "dist"
     command = "npm run build"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200

   [build.environment]
     NODE_VERSION = "18"
   ```

### GitHub Pages 部署

1. **创建 GitHub Actions 工作流**
   创建 `.github/workflows/deploy.yml`：

   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [main]

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3

         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: "18"
             cache: "npm"

         - name: Install dependencies
           run: npm ci

         - name: Build
           run: npm run build

         - name: Deploy to GitHub Pages
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

2. **配置 GitHub Pages**
   - 在仓库设置中启用 GitHub Pages
   - 选择 gh-pages 分支作为源

## 🐳 Docker 部署

### Dockerfile

```dockerfile
# 构建阶段
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
version: "3.8"

services:
  infinity-notes:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped

  # 可选：添加SSL终端
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
      - ./nginx-ssl.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - infinity-notes
```

### 构建和运行

```bash
# 构建镜像
docker build -t infinity-notes .

# 运行容器
docker run -d -p 80:80 --name infinity-notes infinity-notes

# 使用Docker Compose
docker-compose up -d
```

## 🔧 环境配置

### 环境变量

创建 `.env.production` 文件：

```env
# 应用配置
VITE_APP_TITLE=无限便签
VITE_APP_VERSION=0.1.0

# API配置（如果需要）
VITE_API_BASE_URL=https://api.your-domain.com

# 分析工具（可选）
VITE_GOOGLE_ANALYTICS_ID=your-ga-id
```

### 构建优化

在 `vite.config.ts` 中配置生产优化：

```typescript
export default defineConfig({
  build: {
    // 启用压缩
    minify: "esbuild",

    // 生成source map（可选）
    sourcemap: false,

    // 分包策略
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          antd: ["antd"],
          utils: ["lodash", "uuid"],
        },
      },
    },

    // 压缩选项
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

## 📊 性能优化

### 资源优化

1. **图片优化**

   ```bash
   # 压缩图片
   npm install -g imagemin-cli
   imagemin public/images/* --out-dir=public/images/optimized
   ```

2. **字体优化**

   - 使用 Web 字体子集
   - 启用字体预加载

3. **代码分割**
   - 路由级别的代码分割
   - 组件级别的懒加载

### 缓存策略

```nginx
# 静态资源缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary "Accept-Encoding";
}

# HTML文件不缓存
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

## 🔍 监控和分析

### 性能监控

1. **Google Analytics**

   ```typescript
   // 在main.tsx中添加
   import { gtag } from "./utils/analytics";

   gtag("config", "GA_MEASUREMENT_ID");
   ```

2. **错误监控**
   ```typescript
   // 错误边界组件
   class ErrorBoundary extends React.Component {
     componentDidCatch(error, errorInfo) {
       // 发送错误到监控服务
       console.error("Application error:", error, errorInfo);
     }
   }
   ```

### 日志收集

```nginx
# Nginx访问日志
access_log /var/log/nginx/infinite-notes.access.log combined;
error_log /var/log/nginx/infinite-notes.error.log;
```

## 🔒 安全配置

### HTTPS 配置

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL证书
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # 安全头部
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 防火墙配置

```bash
# UFW防火墙配置
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 🚨 故障排除

### 常见问题

1. **构建失败**

   ```bash
   # 清理缓存
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **路由问题**

   - 确保服务器配置了 SPA 路由重写
   - 检查 base 路径配置

3. **资源加载失败**
   - 检查资源路径配置
   - 验证 CDN 配置

### 日志分析

```bash
# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 查看访问日志
sudo tail -f /var/log/nginx/access.log
```

## 📝 部署检查清单

- [ ] 代码构建成功
- [ ] 所有测试通过
- [ ] 静态资源正确加载
- [ ] 路由功能正常
- [ ] 数据存储功能正常
- [ ] AI 功能配置正确
- [ ] 性能指标达标
- [ ] 安全配置完成
- [ ] 监控系统配置
- [ ] 备份策略制定
- [ ] 域名和 SSL 证书配置
- [ ] CDN 配置（如果使用）

## 📞 技术支持

如果在部署过程中遇到问题，请：

1. 查看项目文档
2. 检查 GitHub Issues
3. 创建新的 Issue 报告问题
4. 联系项目维护者

部署成功后，记得定期更新项目版本和依赖包，保持系统安全性和稳定性。
