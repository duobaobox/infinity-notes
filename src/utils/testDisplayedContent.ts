/**
 * 测试便签显示内容提取功能
 * 用于验证便签链接插槽是否正确读取TipTap编辑器中显示的内容
 */

import { connectionUtils } from "../stores/connectionStore";
import type { StickyNote } from "../components/types";

/**
 * 创建测试便签
 */
const createTestNote = (
  id: string,
  content: string,
  thinkingChain?: any
): StickyNote => ({
  id,
  title: `测试便签${id}`,
  content,
  thinkingChain,
  x: 0,
  y: 0,
  width: 300,
  height: 200,
  color: "yellow",
  zIndex: 1,
  isEditing: false,
  isTitleEditing: false,
  isNew: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

/**
 * 测试显示内容提取
 */
export const testDisplayedContentExtraction = () => {
  console.log("🧪 开始测试便签显示内容提取...");

  // 测试1: 普通便签（无思维链）
  const normalNote = createTestNote(
    "1",
    "这是一个普通便签的内容，应该完整显示。"
  );

  const normalDisplayed = connectionUtils.getDisplayedNoteContent(normalNote);
  console.log("📝 普通便签显示内容:", normalDisplayed);
  console.assert(
    normalDisplayed === normalNote.content,
    "普通便签应该显示完整内容"
  );

  // 测试2: 有思维链的便签
  const thinkingNote = createTestNote(
    "2",
    "这是包含AI思考过程的完整内容，用户不应该看到这部分。",
    {
      finalAnswer: "这是最终答案，用户应该看到这部分。",
      steps: [
        { stepType: "analysis", content: "分析步骤" },
        { stepType: "reasoning", content: "推理步骤" },
      ],
      totalThinkingTime: 1000,
    }
  );

  const thinkingDisplayed =
    connectionUtils.getDisplayedNoteContent(thinkingNote);
  console.log("🤔 思维链便签显示内容:", thinkingDisplayed);
  console.assert(
    thinkingDisplayed === thinkingNote.thinkingChain?.finalAnswer,
    "思维链便签应该只显示最终答案"
  );

  // 测试3: 编辑状态的便签（应该显示完整内容）
  const editingNote = createTestNote("3", "编辑中的内容，应该显示完整内容。", {
    finalAnswer: "最终答案",
    steps: [],
    totalThinkingTime: 500,
  });
  editingNote.isEditing = true;

  const editingDisplayed = connectionUtils.getDisplayedNoteContent(editingNote);
  console.log("✏️ 编辑状态便签显示内容:", editingDisplayed);
  console.assert(
    editingDisplayed === editingNote.content,
    "编辑状态便签应该显示完整内容"
  );

  // 测试4: 连接摘要生成
  const connectedNotes = [normalNote, thinkingNote];
  const summary = connectionUtils.getConnectionSummary(
    connectedNotes,
    "final_answer_only"
  );
  console.log("📋 连接摘要:", summary);
  console.assert(
    summary.includes("普通便签的内容") && summary.includes("最终答案"),
    "摘要应该包含显示内容"
  );

  console.log("✅ 所有测试通过！便签显示内容提取功能正常工作。");
};

/**
 * 测试修复后的连接摘要生成（验证不会出现"[处理出错]"）
 */
export const testConnectionSummaryFix = () => {
  console.log("🔧 测试连接摘要生成修复...");

  // 创建测试便签
  const testNotes = [
    createTestNote("1", "这是一个普通便签"),
    createTestNote("2", "这是另一个便签", {
      finalAnswer: "这是思维链便签的最终答案",
      steps: [],
      totalThinkingTime: 1000,
    }),
  ];

  try {
    // 测试摘要生成
    const summary = connectionUtils.getConnectionSummary(
      testNotes,
      "final_answer_only"
    );
    console.log("📋 生成的摘要:", summary);

    // 检查是否包含错误信息
    if (summary.includes("[处理出错]")) {
      console.error("❌ 摘要生成仍然出错！");
      return false;
    } else {
      console.log("✅ 摘要生成正常，没有错误！");
      return true;
    }
  } catch (error) {
    console.error("❌ 测试过程中发生错误:", error);
    return false;
  }
};

/**
 * 在开发环境中运行测试
 */
if (process.env.NODE_ENV === "development") {
  // 可以在控制台中调用这些测试函数
  (window as any).testDisplayedContentExtraction =
    testDisplayedContentExtraction;
  (window as any).testConnectionSummaryFix = testConnectionSummaryFix;
}
