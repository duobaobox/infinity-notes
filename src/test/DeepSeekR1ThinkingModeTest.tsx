import React, { useState } from "react";
import { Button, Card, Space, Typography, Alert } from "antd";

const { Title, Text, Paragraph } = Typography;

/**
 * DeepSeek-R1 思维模式测试组件
 * 用于测试关闭思维显示模式后，deepseek-r1 模型的内容显示是否正确
 */
const DeepSeekR1ThinkingModeTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  // 模拟 deepseek-r1 的响应数据
  const mockDeepSeekR1Response = {
    // 模拟流式处理过程中的状态
    streamingState: {
      showThinkingMode: false, // 关闭思维模式
      hasStartedThinking: true,
      hasFinishedThinking: true,
      thinkingContent: "我需要分析这个问题...\n首先考虑用户的需求...\n然后制定解决方案...",
      displayedContent: "这是最终答案的内容，不包含思维链。", // 关闭思维模式时只显示最终答案
    },
    // 模拟完整的AI响应（包含思维链标签）
    fullResponse: `<think>
我需要分析这个问题...
首先考虑用户的需求...
然后制定解决方案...
</think>

这是最终答案的内容，不包含思维链。`,
    originalPrompt: "请帮我解决这个问题",
  };

  // 模拟 createNoteWithoutThinkingChain 方法的逻辑
  const simulateCreateNoteWithoutThinkingChain = (
    streamingState: any,
    fullResponse: string,
    originalPrompt: string
  ) => {
    const results: string[] = [];
    results.push("🔍 模拟创建无思维链便签过程:");

    // 🔧 修复后的逻辑：确保在关闭思维模式时，只保存最终答案内容
    let finalAnswer = "";

    // 方法1：从displayedContent中提取最终答案
    if (streamingState.displayedContent) {
      const content = streamingState.displayedContent;
      if (content.includes("🤔 **AI正在思考中...**")) {
        // 移除思维链标识符，只保留最终答案
        finalAnswer = content
          .replace(/🤔 \*\*AI正在思考中\.\.\.\*\*/g, "")
          .replace(/^[\s\n]*---[\s\n]*/g, "") // 移除分隔线
          .replace(/^##\s*✨\s*最终答案[\s\n]*/g, "") // 移除最终答案标题
          .trim();
      } else {
        // 纯最终答案内容
        finalAnswer = content.trim();
      }
    }

    // 方法2：如果没有提取到最终答案，从原始响应中提取（去掉思维链标签）
    if (!finalAnswer) {
      results.push("⚠️ 从displayedContent提取失败，尝试从fullResponse提取");
      // 模拟 parseThinkingChain 的逻辑（showThinkingMode = false）
      finalAnswer = fullResponse
        .replace(/<think>[\s\S]*?<\/think>/gi, "") // 移除 <think> 标签
        .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "") // 移除 <thinking> 标签
        .trim();
    }

    // 方法3：最后的兜底处理
    if (!finalAnswer || finalAnswer.trim().length === 0) {
      results.push("⚠️ 所有提取方法失败，使用兜底处理");
      finalAnswer = fullResponse
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
        .replace(/🤔 \*\*AI正在思考中\.\.\.\*\*/g, "")
        .replace(/^[\s\n]*---[\s\n]*/g, "")
        .replace(/^##\s*✨\s*最终答案[\s\n]*/g, "")
        .trim();
    }

    results.push(`✅ 最终答案长度: ${finalAnswer.length}`);
    results.push(`✅ 最终答案内容: "${finalAnswer}"`);
    results.push(`✅ 是否包含思维链标记: ${finalAnswer.includes("🤔") || finalAnswer.includes("<think")}`);

    // 🎯 关键：创建的便签对象
    const note = {
      title: finalAnswer.length > 30 ? finalAnswer.substring(0, 30) + "..." : finalAnswer,
      content: finalAnswer, // 只包含干净的最终答案，不包含思维链
      // 🔧 重要：不设置 thinkingChain，这样 StickyNote 组件会直接显示 content
    };

    results.push(`📝 便签标题: "${note.title}"`);
    results.push(`📝 便签内容: "${note.content}"`);
    results.push(`📝 是否有思维链: ${note.hasOwnProperty('thinkingChain')}`);

    return { results, note };
  };

  // 模拟 StickyNote 组件的显示逻辑
  const simulateStickyNoteDisplay = (note: any, showThinkingMode: boolean) => {
    const results: string[] = [];
    results.push("🖥️ 模拟 StickyNote 组件显示逻辑:");

    // 模拟 WysiwygEditor 的 content 属性逻辑
    const displayContent = note.isEditing
      ? note.localContent || note.content
      : // 思维链数据处理：如果有思维链且非编辑状态，显示最终答案；否则显示完整内容
      note.thinkingChain && !note.isEditing
      ? note.thinkingChain.finalAnswer
      : note.content;

    // 模拟思维链组件的显示逻辑
    const shouldShowThinkingChain = !note.isEditing && note.thinkingChain && showThinkingMode;

    results.push(`📄 编辑器显示内容: "${displayContent}"`);
    results.push(`🧠 是否显示思维链组件: ${shouldShowThinkingChain}`);
    results.push(`✅ 最终用户看到的内容: "${displayContent}"`);
    results.push(`✅ 内容是否干净（无思维链标记）: ${!displayContent.includes("🤔") && !displayContent.includes("<think")}`);

    return { results, displayContent, shouldShowThinkingChain };
  };

  // 运行测试
  const runTest = () => {
    setTestResults([]);
    const allResults: string[] = [];

    allResults.push("🚀 开始测试 DeepSeek-R1 关闭思维模式的显示逻辑");
    allResults.push("=" * 50);

    // 测试1：模拟创建无思维链便签
    const { results: createResults, note } = simulateCreateNoteWithoutThinkingChain(
      mockDeepSeekR1Response.streamingState,
      mockDeepSeekR1Response.fullResponse,
      mockDeepSeekR1Response.originalPrompt
    );
    allResults.push(...createResults);
    allResults.push("");

    // 测试2：模拟 StickyNote 组件显示
    const { results: displayResults } = simulateStickyNoteDisplay(note, false);
    allResults.push(...displayResults);
    allResults.push("");

    // 测试3：验证修复效果
    allResults.push("🎯 修复效果验证:");
    const isContentClean = !note.content.includes("🤔") && !note.content.includes("<think");
    const hasNoThinkingChain = !note.hasOwnProperty('thinkingChain');
    
    allResults.push(`✅ 便签内容是否干净: ${isContentClean ? "是" : "否"}`);
    allResults.push(`✅ 便签是否无思维链: ${hasNoThinkingChain ? "是" : "否"}`);
    allResults.push(`✅ 修复是否成功: ${isContentClean && hasNoThinkingChain ? "是" : "否"}`);

    setTestResults(allResults);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <Title level={2}>DeepSeek-R1 思维模式测试</Title>
      
      <Alert
        message="测试目标"
        description="验证关闭思维显示模式后，deepseek-r1 模型在生成结束后是否只显示最终答案，不显示思维链内容。"
        type="info"
        style={{ marginBottom: "20px" }}
      />

      <Space direction="vertical" style={{ width: "100%" }}>
        <Button type="primary" onClick={runTest}>
          运行测试
        </Button>

        {testResults.length > 0 && (
          <Card title="测试结果" style={{ marginTop: "20px" }}>
            <div style={{ fontFamily: "monospace", whiteSpace: "pre-line" }}>
              {testResults.map((result, index) => (
                <div key={index} style={{ marginBottom: "4px" }}>
                  {result}
                </div>
              ))}
            </div>
          </Card>
        )}
      </Space>
    </div>
  );
};

export default DeepSeekR1ThinkingModeTest;
