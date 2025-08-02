import React, { useState } from "react";
import WysiwygEditor from "../components/notes/WysiwygEditor";

const TableMarkdownTest: React.FC = () => {
  const [content, setContent] = useState(`# 表格测试

以下是Markdown表格语法测试：

| 表头1     | 表头2     | 表头3     |
|-----------|-----------|-----------|
| 单元格1   | 单元格2   | 单元格3   |
| 单元格4   | 单元格5   | 单元格6   |

这个表格应该能正确渲染为HTML表格。

## 另一个表格示例

| 功能     | 状态      | 备注      |
|----------|----------|-----------|
| 基础编辑  | ✅ 完成   | 正常工作   |
| 表格支持  | 🔄 进行中 | 正在测试   |
| 样式美化  | ⏳ 待开始 | 计划中     |`);

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Markdown表格转换测试</h1>

      <div style={{ marginBottom: "20px" }}>
        <h3>当前内容（Markdown格式）：</h3>
        <pre
          style={{
            background: "#f5f5f5",
            padding: "10px",
            borderRadius: "4px",
            fontSize: "12px",
            overflow: "auto",
          }}
        >
          {content}
        </pre>
      </div>

      <div>
        <h3>编辑器渲染效果：</h3>
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: "10px",
            minHeight: "300px",
          }}
        >
          <WysiwygEditor
            content={content}
            onChange={setContent}
            placeholder="在这里测试表格功能..."
            autoFocus={false}
          />
        </div>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>编辑后的Markdown内容：</h3>
        <pre
          style={{
            background: "#f0f8ff",
            padding: "10px",
            borderRadius: "4px",
            fontSize: "12px",
            overflow: "auto",
            whiteSpace: "pre-wrap",
          }}
        >
          {content}
        </pre>
      </div>
    </div>
  );
};

export default TableMarkdownTest;
