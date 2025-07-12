import { Button, Card, Space, Typography } from "antd";
import React, { useState } from "react";
import VirtualizedMarkdown from "../components/notes/VirtualizedMarkdown";

const { Title, Text } = Typography;

/**
 * Markdown列表渲染测试页面
 * 用于测试各种列表格式的渲染效果
 */
const MarkdownListTest: React.FC = () => {
  const [testContent, setTestContent] = useState("");

  // 生成测试内容
  const generateTestContent = () => {
    const content = `# Markdown列表渲染测试

## 1. 标准嵌套列表（您的示例）

1.  **明确项目目标：**
    *   **为什么做？** 清晰定义项目的**目的**和**商业价值**（解决什么问题？带来什么收益？）。
    *   **做什么？** 定义项目的**具体范围**和要交付的**最终成果**。
    *   **SMART原则：** 确保目标是**具体、可衡量、可达成、相关、有时限**的。
    *   **关键问题：** 项目成功是什么样子？如何衡量成功？

2.  **识别关键干系人：**
    *   找出所有受项目影响或能影响项目的人（发起人、客户、用户、团队成员、管理层、供应商、监管机构等）。
    *   分析他们的**需求、期望、影响力、关注点**。
    *   制定**干系人沟通管理计划**（谁需要什么信息、何时需要、以什么方式提供）。

3.  **制定项目章程：**
    *   一份正式文件，授权项目启动。
    *   包含：项目目标、高层级范围、主要可交付成果、关键里程碑、主要风险、项目发起人、项目经理、初步预算和资源、高层级时间表、成功标准。
    *   获得关键干系人（尤其是发起人）的正式批准。

## 2. 其他列表格式测试

### 纯无序列表
* 第一项
* 第二项
  * 嵌套项目1
  * 嵌套项目2
    * 更深层嵌套
* 第三项

### 纯有序列表
1. 第一步
2. 第二步
   1. 子步骤1
   2. 子步骤2
      1. 更深层步骤
3. 第三步

### 混合列表（不同缩进）
1. 有序列表项
   - 无序子项
   - 另一个无序子项
     1. 嵌套有序项
     2. 另一个嵌套有序项
2. 另一个有序列表项

### 深层嵌套测试
1. 第一级有序列表
   * 第二级无序列表
     1. 第三级有序列表
        * 第四级无序列表
          1. 第五级有序列表
   * 回到第二级无序列表
2. 回到第一级有序列表

### 长内容列表项测试
1. **这是一个很长的列表项**，包含多行内容和各种格式。这里有**粗体文本**、*斜体文本*，以及一些\`代码片段\`。
   * 这是一个嵌套的无序列表项，同样包含很长的内容和各种格式。
   * 另一个嵌套项目，测试渲染效果。
2. 第二个主要列表项，继续测试。`;

    setTestContent(content);
  };

  // 清空内容
  const clearContent = () => {
    setTestContent("");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={2}>📝 Markdown列表渲染测试</Title>

      <Card style={{ marginBottom: "20px" }}>
        <Space>
          <Button type="primary" onClick={generateTestContent}>
            生成测试内容
          </Button>
          <Button onClick={clearContent}>清空内容</Button>
        </Space>
      </Card>

      {testContent && (
        <Card title="📋 渲染效果预览" style={{ marginTop: "20px" }}>
          <div
            style={{
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
              padding: "16px",
              backgroundColor: "#fafafa",
            }}
          >
            <VirtualizedMarkdown
              content={testContent}
              containerRef={{ current: null }}
              enableVirtualization={false}
            />
          </div>
        </Card>
      )}

      <Card title="📋 测试说明" style={{ marginTop: "20px" }}>
        <ul>
          <li>✅ 标准Markdown列表应该正确渲染</li>
          <li>✅ 有序列表和无序列表的嵌套应该正常显示</li>
          <li>✅ 不同缩进级别应该正确识别</li>
          <li>✅ 深层嵌套（5级以上）应该正常工作</li>
          <li>✅ 粗体、斜体、代码等内联格式应该正常工作</li>
          <li>✅ 长内容列表项应该正确换行和显示</li>
        </ul>
      </Card>
    </div>
  );
};

export default MarkdownListTest;
