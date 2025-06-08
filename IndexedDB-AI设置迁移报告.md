# IndexedDB 升级: AI 设置迁移

## 升级内容

本次升级将 AI 设置从 localStorage 迁移至 IndexedDB 数据库，实现了以下改进：

1. **统一数据存储方式**：所有应用数据（包括用户数据、画布数据、便签数据和 AI 设置）现在都存储在 IndexedDB 中，实现了统一的数据管理。

2. **自动数据迁移**：添加了从 localStorage 到 IndexedDB 的自动迁移逻辑，确保用户已有的 AI 设置不会丢失。

3. **数据库版本升级**：将数据库版本从 1 升级到 2，增加了新的 `ai_settings` 表。

4. **扩展性改进**：为未来扩展多用户支持打下基础，`ai_settings` 表包含 `user_id` 字段。

## 技术细节

### 1. 数据库表结构

新增 `ai_settings` 表，结构如下：

```javascript
{
  id: "ai-settings", // 固定 ID，方便查询
  user_id: "default", // 用户 ID，支持多用户
  enableAI: true, // 是否启用 AI 功能
  apiKey: "...", // 加密后的 API 密钥
  apiUrl: "...", // API 服务地址
  aiModel: "...", // AI 模型名称
  temperature: 0.7, // 温度参数
  maxTokens: 1000, // 最大 token 数
  updated_at: "2025-06-08T10:00:00.000Z" // 更新时间
}
```

### 2. 迁移策略

应用启动时，会尝试从 IndexedDB 加载 AI 设置。如果加载失败或未找到，会自动从 localStorage 迁移数据：

1. 从 localStorage 读取旧数据
2. 判断是否为默认配置（无实际配置内容）
3. 如果不是默认配置，则保存到 IndexedDB
4. 返回加载的配置

### 3. 安全考虑

与之前相同，API 密钥经过简单加密后再存储，避免明文存储。

## 升级检查

1. AI 设置保存后能正确在页面刷新后重新加载
2. 现有 AI 功能（如 AI 生成便签）能正常工作
3. 未来系统迁移到在线数据库时，将更容易整合 AI 设置数据

## 日期

完成时间：2025 年 6 月 8 日
