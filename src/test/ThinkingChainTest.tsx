import { Button, Card, Space, Typography } from "antd";
import { ExperimentOutlined, FileTextOutlined } from "@ant-design/icons";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import CardSectionTitle from "../components/common/CardSectionTitle";
import ThinkingChain from "../components/thinking/ThinkingChain";
import type { ThinkingChain as ThinkingChainType } from "../components/types";

const { Title, Text } = Typography;

/**
 * 思维链折叠功能测试页面
 * 用于测试 AI 思考内容的 details/summary 折叠显示效果
 */
const ThinkingChainTest: React.FC = () => {
  const [testContent, setTestContent] = useState("");
  const [showThinkingChain, setShowThinkingChain] = useState(false);

  // 创建模拟的思维链数据
  const createMockThinkingChain = (): ThinkingChainType => {
    return {
      id: "test-thinking-chain-1",
      prompt: "帮我制定一个高效的工作计划，包含优先级排序和时间安排",
      steps: [
        {
          id: "step-1",
          content:
            "首先分析工作计划的基本要素：任务列表、时间安排、优先级标记和具体步骤。一个好的工作计划应该结构化且可执行。",
          stepType: "analysis",
          timestamp: new Date(Date.now() - 5000),
          order: 1,
        },
        {
          id: "step-2",
          content:
            "考虑使用优先级矩阵来分类任务：高优先级（紧急且重要）、中优先级（重要但不紧急）、低优先级（不紧急不重要）。",
          stepType: "reasoning",
          timestamp: new Date(Date.now() - 4000),
          order: 2,
        },
        {
          id: "step-3",
          content:
            "时间管理方面，可以采用番茄工作法，将任务分解为25分钟的时间块，这样更容易专注和执行。",
          stepType: "idea",
          timestamp: new Date(Date.now() - 3000),
          order: 3,
        },
        {
          id: "step-4",
          content:
            "需要考虑任务之间的依赖关系和时间估算的准确性，避免过度乐观的时间安排。",
          stepType: "question",
          timestamp: new Date(Date.now() - 2000),
          order: 4,
        },
        {
          id: "step-5",
          content:
            "最终方案应该包含具体的时间安排、优先级分类、执行建议和灵活性考虑。",
          stepType: "conclusion",
          timestamp: new Date(Date.now() - 1000),
          order: 5,
        },
      ],
      finalAnswer: `## 📋 高效工作计划

### 🔥 高优先级任务
1. **完成项目报告** (预计2小时)
   - 整理数据分析结果
   - 撰写总结报告
   - 准备演示文稿

2. **客户会议准备** (预计1小时)
   - 回顾客户需求
   - 准备解决方案
   - 整理相关资料

### 📝 中优先级任务
1. **邮件回复** (预计30分钟)
   - 处理紧急邮件
   - 回复合作伙伴询问

2. **团队沟通** (预计45分钟)
   - 参加例会
   - 同步项目进度

### 💡 低优先级任务
1. **学习新技术** (预计1小时)
   - 阅读技术文档
   - 观看教程视频

### ⏰ 建议时间安排
- **上午 9:00-11:00**: 高优先级任务1
- **上午 11:15-12:15**: 高优先级任务2
- **下午 14:00-14:30**: 中优先级任务1
- **下午 14:45-15:30**: 中优先级任务2
- **下午 15:45-16:45**: 低优先级任务1

### 📌 执行建议
- 使用番茄工作法，每25分钟休息5分钟
- 完成每个任务后及时标记
- 保持计划的灵活性，应对突发情况`,
      totalThinkingTime: 5000,
      createdAt: new Date(),
    };
  };

  // 模拟思维链内容（使用 details/summary 标签）
  const generateTestContent = () => {
    const content = `# AI 便签生成结果

## 🤔 AI思考过程

<details>
<summary>点击展开思考过程</summary>

> 用户想要整理工作计划，这是一个常见的需求。我需要考虑工作计划的基本要素、时间管理的重要性和优先级排序的方法。
>
> 一个好的工作计划应该包含明确的任务列表、时间安排、优先级标记和可执行的具体步骤。
>
> 我应该提供一个结构化的工作计划模板，包含不同优先级的任务分类。可以使用番茄工作法的时间块来安排任务，这样更有效率。

</details>

---

## ✨ 最终答案

## 📋 今日工作计划

### 🔥 高优先级任务
1. **完成项目报告** (预计2小时)
   - 整理数据分析结果
   - 撰写总结报告
   - 准备演示文稿

2. **客户会议准备** (预计1小时)
   - 回顾客户需求
   - 准备解决方案
   - 整理相关资料

### 📝 中优先级任务
1. **邮件回复** (预计30分钟)
   - 处理紧急邮件
   - 回复合作伙伴询问

2. **团队沟通** (预计45分钟)
   - 参加例会
   - 同步项目进度

### 💡 低优先级任务
1. **学习新技术** (预计1小时)
   - 阅读技术文档
   - 观看教程视频

2. **整理工作环境** (预计20分钟)
   - 清理桌面文件
   - 更新任务清单

### ⏰ 时间安排建议
- **上午 9:00-11:00**: 高优先级任务1
- **上午 11:15-12:15**: 高优先级任务2  
- **下午 14:00-14:30**: 中优先级任务1
- **下午 14:45-15:30**: 中优先级任务2
- **下午 15:45-16:45**: 低优先级任务1
- **下午 16:45-17:05**: 低优先级任务2

### 📌 小贴士
- 使用番茄工作法，每25分钟休息5分钟
- 完成每个任务后及时标记
- 如有紧急任务插入，及时调整计划`;

    setTestContent(content);
  };

  // 生成另一个测试内容
  const generateComplexTest = () => {
    const content = `# 复杂思维链测试

<details>
<summary>点击展开思维链</summary>

**原始提示：** 分析一下如何提高团队协作效率

### 🔍 步骤 1: 问题分析

团队协作效率低下的常见原因：
- 沟通不畅
- 目标不明确
- 工具使用不当
- 流程不规范

### 💡 步骤 2: 解决方案思考

可以从以下几个维度来改善：
1. **沟通层面**：建立有效的沟通机制
2. **工具层面**：选择合适的协作工具
3. **流程层面**：制定标准化流程
4. **文化层面**：培养协作文化

### 🎯 步骤 3: 具体措施

**沟通改善**：
- 定期举行站会
- 使用统一的沟通平台
- 建立信息共享机制

**工具优化**：
- 项目管理工具（如 Jira、Trello）
- 文档协作工具（如 Notion、飞书）
- 代码协作工具（如 Git、GitHub）

### 🔄 步骤 4: 实施策略

分阶段实施：
1. **第一阶段**：统一工具和平台
2. **第二阶段**：建立流程规范
3. **第三阶段**：培养协作文化
4. **第四阶段**：持续优化改进

### 📊 步骤 5: 效果评估

设定关键指标：
- 项目交付时间
- 沟通响应速度
- 团队满意度
- 错误率降低

### 💭 步骤 6: 风险考虑

可能遇到的挑战：
- 团队成员适应新工具需要时间
- 流程变更可能带来短期效率下降
- 需要管理层的支持和推动

---

⏱️ **思考时长：** 约 8 秒

</details>

---

## ✨ 最终答案

## 🚀 团队协作效率提升方案

### 1. 🗣️ 沟通机制优化

#### 建立多层次沟通体系
- **日常沟通**：每日站会（15分钟）
- **周度沟通**：周例会总结与规划
- **月度沟通**：月度回顾与改进

#### 沟通工具统一
- **即时沟通**：企业微信/钉钉
- **项目讨论**：专用群组
- **文档共享**：统一云盘

### 2. 🛠️ 协作工具升级

#### 项目管理工具
- **任务管理**：使用看板方式可视化进度
- **时间跟踪**：记录实际工作时间
- **里程碑管理**：设置关键节点

#### 文档协作平台
- **知识库**：建立团队知识库
- **模板库**：标准化文档模板
- **版本控制**：确保文档同步

### 3. 📋 流程标准化

#### 工作流程规范
1. **需求接收** → **需求分析** → **任务分解**
2. **任务分配** → **执行跟踪** → **质量检查**
3. **交付确认** → **经验总结** → **流程优化**

#### 质量保证机制
- **代码审查**：同行评议制度
- **文档审核**：多人校对机制
- **测试验收**：标准化测试流程

### 4. 📈 实施计划

#### 第一阶段（1-2周）：工具统一
- [ ] 选定协作工具
- [ ] 团队培训
- [ ] 数据迁移

#### 第二阶段（3-4周）：流程建立
- [ ] 制定工作流程
- [ ] 建立模板库
- [ ] 试运行调整

#### 第三阶段（5-8周）：文化培养
- [ ] 定期分享会
- [ ] 最佳实践总结
- [ ] 激励机制建立

#### 第四阶段（持续）：优化改进
- [ ] 数据分析
- [ ] 反馈收集
- [ ] 持续改进

### 5. 📊 效果评估指标

| 指标类型 | 具体指标 | 目标值 |
|---------|---------|--------|
| 效率指标 | 项目交付时间 | 缩短20% |
| 质量指标 | 缺陷率 | 降低30% |
| 满意度 | 团队协作满意度 | >85% |
| 沟通效率 | 响应时间 | <2小时 |

通过以上方案的实施，预期能够显著提升团队协作效率，创造更好的工作体验。`;

    setTestContent(content);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={2}>🧪 思维链折叠功能测试</Title>

      <Card style={{ marginBottom: "20px" }}>
        <Text>
          这个测试页面用于验证 AI 思考内容使用 HTML <code>&lt;details&gt;</code>{" "}
          和 <code>&lt;summary&gt;</code> 标签实现的默认折叠效果。
          思维链显示为简洁的"点击展开思维链"格式，点击可展开查看完整思考过程。
        </Text>
      </Card>

      <Space style={{ marginBottom: "20px" }}>
        <Button type="primary" onClick={generateTestContent}>
          生成简单测试内容
        </Button>
        <Button onClick={generateComplexTest}>生成复杂测试内容</Button>
        <Button
          type="primary"
          onClick={() => setShowThinkingChain(!showThinkingChain)}
          style={{ background: "#52c41a", borderColor: "#52c41a" }}
        >
          {showThinkingChain ? "隐藏" : "显示"}新版思维链组件
        </Button>
        <Button onClick={() => setTestContent("")}>清空内容</Button>
      </Space>

      {/* 新版思维链组件测试 */}
      {showThinkingChain && (
        <Card
          style={{
            marginBottom: "20px",
            border: "2px solid #52c41a",
            borderRadius: "8px",
          }}
        >
          <CardSectionTitle icon={<ExperimentOutlined />} iconType="success">
            🎯 新版思维链组件 - 优化后的视觉效果
          </CardSectionTitle>
          <div style={{ marginBottom: "16px" }}>
            <Text type="secondary">
              ✨ 优化亮点：思维过程和最终答案现在有明显的视觉区分，更容易阅读
            </Text>
          </div>
          <ThinkingChain
            thinkingChain={createMockThinkingChain()}
            defaultExpanded={true}
            compact={false}
          />
        </Card>
      )}

      {testContent && (
        <Card style={{ marginTop: "20px" }}>
          <CardSectionTitle icon={<FileTextOutlined />}>
            📝 渲染效果预览
          </CardSectionTitle>
          <div
            style={{
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
              padding: "16px",
              backgroundColor: "#fafafa",
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              rehypePlugins={[rehypeRaw]}
            >
              {testContent}
            </ReactMarkdown>
          </div>
        </Card>
      )}

      <Card style={{ marginTop: "20px" }}>
        <CardSectionTitle icon={<FileTextOutlined />}>
          📋 测试说明
        </CardSectionTitle>
        <ul>
          <li>✅ 思考过程应该默认折叠，只显示"点击展开思维链"</li>
          <li>✅ 点击摘要行可以展开/折叠思考内容</li>
          <li>✅ 摘要行格式简洁，不显示额外信息</li>
          <li>✅ 展开后显示完整的思考过程</li>
          <li>✅ 最终答案始终可见，不受折叠影响</li>
          <li>✅ 支持嵌套的 Markdown 内容（标题、列表、表格等）</li>
        </ul>
      </Card>
    </div>
  );
};

export default ThinkingChainTest;
