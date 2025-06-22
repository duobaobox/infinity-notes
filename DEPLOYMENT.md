# 🚀 项目部署指南

## 📋 目录

- [本地测试](#本地测试)
- [内网测试](#内网测试)
- [生产部署](#生产部署)
- [常见问题](#常见问题)

## 🔧 本地测试

### 1. 开发环境测试

```bash
# 启动开发服务器（热重载）
npm run dev

# 访问地址：http://localhost:5173
# 内网访问：http://[你的IP]:5173
```

### 2. 生产环境测试

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 访问地址：http://localhost:4173
# 内网访问：http://[你的IP]:4173
```

### 3. 一键构建并预览

```bash
# 构建并启动预览服务器
npm run serve
```

## 🌐 内网测试

### 获取本机 IP 地址

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr "IPv4"
```

### 内网访问地址

- 开发环境：`http://[你的IP]:5173`
- 生产预览：`http://[你的IP]:4173`

### 防火墙设置

确保防火墙允许相应端口访问：

```bash
# macOS 临时开放端口（需要管理员权限）
sudo pfctl -f /etc/pf.conf

# Linux (Ubuntu/Debian)
sudo ufw allow 5173
sudo ufw allow 4173
```

## 🏭 生产部署

### 方案一：静态文件服务器部署

#### 1. 构建项目

```bash
npm run build
```

#### 2. 部署到 Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/your/project/dist;
    index index.html;

    # 处理 SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### 3. 部署到 Apache

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/your/project/dist

    # 处理 SPA 路由
    <Directory "/path/to/your/project/dist">
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

### 方案二：Node.js 服务器部署

#### 1. 安装 serve

```bash
npm install -g serve
```

#### 2. 启动服务

```bash
# 构建项目
npm run build

# 启动服务器
serve -s dist -l 3000

# 或者指定端口和主机
serve -s dist -l tcp://0.0.0.0:3000
```

### 方案三：Docker 部署

#### 1. 创建 Dockerfile

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 2. 构建和运行

```bash
# 构建镜像
docker build -t antd-demo .

# 运行容器
docker run -d -p 80:80 antd-demo
```

## 🔍 性能优化

### 1. 构建优化

```bash
# 构建生产版本
npm run build
```

### 2. 代码检查

```bash
# 类型检查
npm run type-check

# 代码规范检查
npm run lint

# 自动修复代码规范问题
npm run lint:fix
```

### 3. 清理构建文件

```bash
npm run clean
```

## ❓ 常见问题

### Q: 内网无法访问怎么办？

A: 检查以下几点：

1. 确认 `host: '0.0.0.0'` 配置正确
2. 检查防火墙设置
3. 确认 IP 地址获取正确

### Q: 构建后页面空白？

A: 检查以下几点：

1. 确认路由配置正确
2. 检查静态资源路径
3. 查看浏览器控制台错误信息

### Q: 如何配置 HTTPS？

A: 在 vite.config.ts 中添加：

```typescript
server: {
  https: true, // 或者指定证书文件
  // https: {
  //   key: fs.readFileSync('path/to/key.pem'),
  //   cert: fs.readFileSync('path/to/cert.pem')
  // }
}
```

### Q: 如何配置环境变量？

A: 创建 `.env` 文件：

```bash
# .env.local (本地开发)
VITE_API_URL=http://localhost:3001

# .env.production (生产环境)
VITE_API_URL=https://api.yourdomain.com
```

## 📞 技术支持

如果遇到部署问题，请检查：

1. Node.js 版本 >= 18
2. npm 版本 >= 8
3. 网络连接正常
4. 端口未被占用

---

**祝您部署顺利！** 🎉
