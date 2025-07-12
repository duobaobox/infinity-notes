// 便签总结内容提取功能测试
import { connectionUtils } from "../../src/stores/connectionStore";
import type { StickyNote } from "../../src/components/types";

/**
 * 测试便签总结内容提取功能
 * 验证智能内容提取和思维链过滤是否正常工作
 */
describe("便签总结内容提取功能", () => {
  // 模拟包含思维链的便签
  const noteWithThinkingChain: StickyNote = {
    id: "test-note-1",
    title: "AI分析便签",
    content: `## 🤔 AI思考过程

<details>
<summary>点击展开思考过程</summary>

> 首先，我需要分析用户的需求
> 然后考虑可能的解决方案
> 最后得出结论

</details>

---

## ✨ 最终答案

这是经过深思熟虑后的最终答案，包含了具体的建议和解决方案。`,
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    color: "yellow",
    isEditing: false,
    isTitleEditing: false,
    isNew: false,
    zIndex: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 模拟普通便签
  const normalNote: StickyNote = {
    id: "test-note-2",
    title: "普通便签",
    content: "这是一个普通的便签内容，没有思维链格式。",
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    color: "blue",
    isEditing: false,
    isTitleEditing: false,
    isNew: false,
    zIndex: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 模拟包含最终答案标记的便签
  const noteWithFinalAnswer: StickyNote = {
    id: "test-note-3",
    title: "带最终答案的便签",
    content: `一些前置内容

## ✨ 最终答案

这是最终答案部分的内容，应该被正确提取。

## 其他内容

这部分不应该被包含在提取结果中。`,
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    color: "green",
    isEditing: false,
    isTitleEditing: false,
    isNew: false,
    zIndex: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  test("应该正确提取包含思维链便签的最终答案", () => {
    const extractedContent = connectionUtils.extractNoteContent(noteWithThinkingChain);
    
    // 应该只包含最终答案部分
    expect(extractedContent).toContain("这是经过深思熟虑后的最终答案");
    // 不应该包含思维链内容
    expect(extractedContent).not.toContain("首先，我需要分析用户的需求");
    expect(extractedContent).not.toContain("点击展开思考过程");
  });

  test("应该正确处理普通便签内容", () => {
    const extractedContent = connectionUtils.extractNoteContent(normalNote);
    
    // 应该返回完整的原始内容
    expect(extractedContent).toBe("这是一个普通的便签内容，没有思维链格式。");
  });

  test("应该正确提取带最终答案标记的便签内容", () => {
    const extractedContent = connectionUtils.extractNoteContent(noteWithFinalAnswer);
    
    // 应该只包含最终答案部分
    expect(extractedContent).toContain("这是最终答案部分的内容");
    // 不应该包含其他部分
    expect(extractedContent).not.toContain("一些前置内容");
    expect(extractedContent).not.toContain("这部分不应该被包含");
  });

  test("总结模式为 final_answer_only 时应该使用智能提取", () => {
    const connectedNotes = [noteWithThinkingChain, normalNote];
    const summary = connectionUtils.getConnectionSummary(connectedNotes, "final_answer_only");
    
    // 应该包含提取后的内容
    expect(summary).toContain("这是经过深思熟虑后的最终答案");
    expect(summary).toContain("这是一个普通的便签内容");
    // 不应该包含思维链格式
    expect(summary).not.toContain("点击展开思考过程");
  });

  test("总结模式为 full 时应该使用完整内容", () => {
    const connectedNotes = [noteWithThinkingChain];
    const summary = connectionUtils.getConnectionSummary(connectedNotes, "full");
    
    // 应该包含完整的原始内容（截取前100个字符）
    expect(summary).toContain("## 🤔 AI思考过程");
  });

  test("生成AI提示词时应该包含模式描述", () => {
    const connectedNotes = [noteWithThinkingChain];
    
    const promptFinalAnswerOnly = connectionUtils.generateAIPromptWithConnections(
      "请总结这些内容",
      connectedNotes,
      "final_answer_only"
    );
    
    const promptFull = connectionUtils.generateAIPromptWithConnections(
      "请总结这些内容",
      connectedNotes,
      "full"
    );
    
    // 应该包含相应的模式描述
    expect(promptFinalAnswerOnly).toContain("（已智能提取核心内容，过滤思维链）");
    expect(promptFull).toContain("（完整内容）");
  });
});

/**
 * 手动测试函数
 * 可以在浏览器控制台中调用来测试功能
 */
export const manualTestSummaryExtraction = () => {
  console.log("🧪 开始测试便签总结内容提取功能");
  
  const testNote: StickyNote = {
    id: "manual-test",
    title: "测试便签",
    content: `## 🤔 AI思考过程

<details>
<summary>点击展开思考过程</summary>

> 这是思考过程的内容
> 应该被过滤掉

</details>

---

## ✨ 最终答案

这是最终答案，应该被提取出来。`,
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    color: "yellow",
    isEditing: false,
    isTitleEditing: false,
    isNew: false,
    zIndex: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const extracted = connectionUtils.extractNoteContent(testNote);
  console.log("📝 提取结果:", extracted);
  
  const summary = connectionUtils.getConnectionSummary([testNote], "final_answer_only");
  console.log("📋 总结结果:", summary);
  
  console.log("✅ 测试完成");
};
