# 内容提取配置管理

## 概述

内容提取配置管理系统提供了灵活的参数调整功能，允许用户根据不同场景优化便签内容提取的准确性和性能。

## 功能特性

### 🎯 场景优化模式

#### 速度优先模式 (`speed`)

- **适用场景**：大量便签批处理
- **特点**：
  - 禁用质量评估
  - 禁用智能截断
  - 最快的处理速度
  - 较低的资源消耗

#### 准确性优先模式 (`accuracy`)

- **适用场景**：重要内容处理
- **特点**：
  - 启用所有功能
  - 增加长度限制
  - 最高的提取准确性
  - 更多的资源消耗

#### 平衡模式 (`balanced`)

- **适用场景**：日常使用
- **特点**：
  - 平衡速度和准确性
  - 适中的资源消耗
  - 默认推荐模式

### ⚙️ 可配置参数

#### 长度限制 (`lengthLimits`)

```typescript
{
  finalAnswerOnly: 200,    // "仅最终答案"模式的最大字符数
  full: 100,               // "完整内容"模式的最大字符数
  qualityBonus: 50,        // 高质量内容的额外字符配额
}
```

#### 质量评估 (`qualityAssessment`)

```typescript
{
  enabled: true,           // 是否启用质量评估
  lengthWeight: 0.2,       // 长度因子权重
  structureWeight: 0.3,    // 结构因子权重
  densityWeight: 0.3,      // 信息密度权重
  keywordWeight: 0.2,      // 关键词权重
  qualityThreshold: 0.7,   // 高质量内容阈值
}
```

#### 智能截断 (`smartTruncation`)

```typescript
{
  enabled: true,           // 是否启用智能截断
  searchRangeRatio: 0.2,   // 搜索范围比例
  maxSearchRange: 50,      // 最大搜索范围
}
```

#### 调试选项 (`debug`)

```typescript
{
  enabled: false,          // 是否启用调试日志
  showQualityScores: false, // 是否显示质量分数
  logExtractionSteps: false, // 是否记录提取步骤
}
```

## 使用方法

### 1. 通过 Store API 使用

```typescript
import { useConnectionStore } from "../stores/connectionStore";

const {
  getExtractionConfig, // 获取当前配置
  updateExtractionConfig, // 更新配置
  resetExtractionConfig, // 重置为默认配置
  setExtractionScenario, // 设置优化场景
} = useConnectionStore();

// 切换到速度优先模式
setExtractionScenario("speed");

// 自定义配置
updateExtractionConfig({
  lengthLimits: {
    finalAnswerOnly: 300,
  },
  qualityAssessment: {
    enabled: false,
  },
});

// 重置配置
resetExtractionConfig();
```

### 2. 通过 UI 组件使用

在 AI 设置页面中，您可以找到"内容提取优化"区域，提供了简洁的配置界面：

- **场景选择**：三种预设优化模式（速度优先、平衡模式、准确性优先）
- **一键切换**：点击卡片即可切换模式
- **状态显示**：实时显示当前模式和说明
- **默认推荐**：系统默认使用平衡模式

**使用步骤**：

1. 打开设置 → AI 设置标签页
2. 找到"内容提取优化"区域
3. 点击相应的模式卡片
4. 配置立即生效

### 3. 配置验证

系统会自动验证配置的有效性：

```typescript
const configManager = ContentExtractionConfigManager.getInstance();
const validation = configManager.validateConfig();

if (!validation.isValid) {
  console.error("配置错误:", validation.errors);
}
```

## 配置影响

### 内容提取准确性

1. **正则匹配模式**：使用配置中的匹配模式数组
2. **智能分析**：基于配置的关键词过滤
3. **质量评估**：根据配置权重计算内容质量
4. **长度控制**：动态调整截断长度

### 性能优化

1. **速度模式**：跳过复杂计算，直接截断
2. **准确性模式**：启用所有分析功能
3. **平衡模式**：选择性启用功能

## 最佳实践

### 1. 场景选择建议

- **大批量处理**：使用速度优先模式
- **重要文档**：使用准确性优先模式
- **日常使用**：使用平衡模式

### 2. 参数调优建议

- **长度限制**：根据实际需求调整，避免过短或过长
- **质量权重**：确保总和为 1.0，重点关注结构和密度
- **质量阈值**：建议设置在 0.6-0.8 之间

### 3. 调试建议

- **开发阶段**：启用调试模式，观察提取效果
- **生产环境**：关闭调试模式，提高性能
- **问题排查**：临时启用日志记录

## 示例配置

### 高精度配置

```typescript
{
  lengthLimits: {
    finalAnswerOnly: 400,
    full: 200,
    qualityBonus: 100,
  },
  qualityAssessment: {
    enabled: true,
    structureWeight: 0.4,
    densityWeight: 0.4,
    lengthWeight: 0.1,
    keywordWeight: 0.1,
    qualityThreshold: 0.8,
  },
  smartTruncation: {
    enabled: true,
    searchRangeRatio: 0.3,
    maxSearchRange: 80,
  },
}
```

### 高速度配置

```typescript
{
  lengthLimits: {
    finalAnswerOnly: 150,
    full: 80,
    qualityBonus: 0,
  },
  qualityAssessment: {
    enabled: false,
  },
  smartTruncation: {
    enabled: false,
  },
  debug: {
    enabled: false,
    showQualityScores: false,
    logExtractionSteps: false,
  },
}
```

## 注意事项

1. **配置持久化**：配置更改会立即生效，但不会自动保存到本地存储
2. **性能影响**：启用所有功能会增加处理时间和资源消耗
3. **兼容性**：确保权重总和为 1.0，避免配置冲突
4. **测试验证**：更改配置后建议进行测试验证

## 故障排除

### 常见问题

1. **提取内容过短**：增加长度限制或降低质量阈值
2. **提取速度慢**：切换到速度模式或禁用部分功能
3. **质量分数异常**：检查权重配置是否正确
4. **配置不生效**：确认是否正确调用了更新方法

### 调试方法

1. 启用调试模式查看详细日志
2. 使用配置验证功能检查参数
3. 通过演示组件测试不同配置效果
4. 查看浏览器控制台的错误信息
