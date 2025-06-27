/**
 * 溯源功能测试工具
 * 用于创建测试数据和验证溯源功能
 */

import { useStickyNotesStore } from "../../src/stores/stickyNotesStore";

/**
 * 创建测试便签用于验证溯源功能
 */
export async function createTraceabilityTestData() {
  const store = useStickyNotesStore.getState();

  try {
    console.log("🧪 开始创建溯源测试数据...");

    // 创建源便签1
    const sourceNote1 = {
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      content: "这是源便签1的内容\n\n## 重要信息\n- 数据点A\n- 数据点B",
      title: "源便签1",
      color: "yellow" as const,
    };

    const createdNote1 = await store.addNote(sourceNote1);
    const sourceNote1Id = createdNote1.id;
    console.log("✅ 源便签1创建成功:", sourceNote1Id);

    // 创建源便签2
    const sourceNote2 = {
      x: 350,
      y: 100,
      width: 200,
      height: 200,
      content: "这是源便签2的内容\n\n## 分析结果\n- 结论X\n- 结论Y",
      title: "源便签2",
      color: "blue" as const,
    };

    const createdNote2 = await store.addNote(sourceNote2);
    const sourceNote2Id = createdNote2.id;
    console.log("✅ 源便签2创建成功:", sourceNote2Id);

    // 等待一秒确保便签创建完成
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 创建汇总便签（带溯源）
    const summaryNote = {
      x: 225,
      y: 350,
      width: 250,
      height: 220,
      content:
        "# AI汇总便签\n\n这是基于源便签1和源便签2的汇总内容。\n\n## 汇总要点\n- 来自源便签1的数据点A和B\n- 来自源便签2的结论X和Y\n\n## 综合分析\n通过对两个源便签的分析，可以得出...",
      title: "AI汇总便签",
      color: "green" as const,
      sourceNoteIds: [sourceNote1Id, sourceNote2Id],
    };

    const createdSummaryNote = await store.addNote(summaryNote);
    const summaryNoteId = createdSummaryNote.id;
    console.log("✅ 汇总便签创建成功:", summaryNoteId);
    console.log("📋 溯源便签ID列表:", [sourceNote1Id, sourceNote2Id]);

    // 验证溯源数据是否正确保存
    await new Promise((resolve) => setTimeout(resolve, 500));
    const savedSummaryNote = store.notes.find(
      (note) => note.id === summaryNoteId
    );

    if (savedSummaryNote && savedSummaryNote.sourceNoteIds) {
      console.log("✅ 溯源数据验证成功！");
      console.log("📊 溯源信息:", {
        noteId: savedSummaryNote.id,
        title: savedSummaryNote.title,
        sourceNoteIds: savedSummaryNote.sourceNoteIds,
        sourceCount: savedSummaryNote.sourceNoteIds.length,
      });

      return {
        success: true,
        summaryNoteId,
        sourceNoteIds: [sourceNote1Id, sourceNote2Id],
        savedSourceNoteIds: savedSummaryNote.sourceNoteIds,
      };
    } else {
      console.error("❌ 溯源数据验证失败！");
      console.log("保存的便签:", savedSummaryNote);

      return {
        success: false,
        error: "溯源数据未正确保存",
        summaryNoteId,
        sourceNoteIds: [sourceNote1Id, sourceNote2Id],
      };
    }
  } catch (error) {
    console.error("❌ 创建测试数据失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 验证溯源数据持久化
 */
export async function verifyTraceabilityPersistence() {
  const store = useStickyNotesStore.getState();

  console.log("🔍 验证溯源数据持久化...");

  // 强制重新加载数据
  await store.loadNotes();

  // 查找带有溯源的便签
  const traceableNotes = store.notes.filter(
    (note) => note.sourceNoteIds && note.sourceNoteIds.length > 0
  );

  if (traceableNotes.length > 0) {
    console.log("✅ 找到溯源便签:", traceableNotes.length, "个");
    traceableNotes.forEach((note) => {
      console.log(`📋 便签 "${note.title}":`);
      console.log(`   - ID: ${note.id}`);
      console.log(`   - 源便签数量: ${note.sourceNoteIds!.length}`);
      console.log(`   - 源便签ID: ${note.sourceNoteIds!.join(", ")}`);
    });

    return {
      success: true,
      traceableNotes: traceableNotes.map((note) => ({
        id: note.id,
        title: note.title,
        sourceNoteIds: note.sourceNoteIds!,
      })),
    };
  } else {
    console.log("❌ 未找到任何溯源便签");
    return {
      success: false,
      error: "未找到溯源便签",
    };
  }
}

// 导出到全局窗口对象，方便在浏览器控制台中调用
if (typeof window !== "undefined") {
  (window as any).__TRACEABILITY_TEST__ = {
    createTestData: createTraceabilityTestData,
    verifyPersistence: verifyTraceabilityPersistence,
  };
}
