/**
 * 替换模式溯源功能测试工具
 * 用于创建测试数据和验证替换模式下的溯源功能
 */

import { useStickyNotesStore } from "../../src/stores/stickyNotesStore";
import type { SourceNoteContent } from "../../src/components/types";

/**
 * 创建替换模式测试便签用于验证溯源功能
 */
export async function createReplaceModeTraceabilityTestData() {
  const store = useStickyNotesStore.getState();

  try {
    console.log("🧪 开始创建替换模式溯源测试数据...");

    // 模拟原始便签内容（这些便签在替换模式下已被删除）
    const sourceNotesContent: SourceNoteContent[] = [
      {
        id: "original-note-1",
        title: "原始便签1",
        content:
          "这是第一个原始便签的内容\n\n## 重要数据\n- 数据点A：销售额增长15%\n- 数据点B：用户满意度提升\n\n## 分析\n根据Q3数据显示...",
        color: "yellow",
        createdAt: new Date("2024-01-15T10:00:00Z"),
        deletedAt: new Date("2024-01-20T14:30:00Z"),
      },
      {
        id: "original-note-2",
        title: "原始便签2",
        content:
          "这是第二个原始便签的内容\n\n## 市场调研结果\n- 竞争对手分析\n- 目标用户画像\n- 价格策略建议\n\n## 结论\n建议采用差异化定价策略...",
        color: "blue",
        createdAt: new Date("2024-01-16T09:30:00Z"),
        deletedAt: new Date("2024-01-20T14:30:00Z"),
      },
      {
        id: "original-note-3",
        title: "原始便签3",
        content:
          "这是第三个原始便签的内容\n\n## 技术方案\n- 架构设计\n- 性能优化\n- 安全考虑\n\n## 实施计划\n分三个阶段进行开发...",
        color: "green",
        createdAt: new Date("2024-01-17T11:15:00Z"),
        deletedAt: new Date("2024-01-20T14:30:00Z"),
      },
    ];

    // 创建替换模式生成的便签（包含原始便签内容）
    const replaceModeNote = {
      x: 300,
      y: 200,
      width: 350,
      height: 280,
      content: `# AI汇总分析报告

基于三个原始便签的综合分析，我们得出以下结论：

## 核心发现
- **销售增长**：Q3销售额增长15%，用户满意度显著提升
- **市场机会**：竞争对手分析显示差异化定价策略的可行性
- **技术支撑**：三阶段技术实施方案确保项目稳步推进

## 战略建议
1. 继续保持产品质量优势
2. 实施差异化定价策略
3. 按计划推进技术升级

## 下一步行动
- 制定详细的价格调整方案
- 启动技术方案第一阶段
- 持续监控用户反馈`,
      title: "AI综合分析报告",
      color: "purple" as const,
      sourceNotesContent, // 保存原始便签内容
      generationMode: "replace" as const, // 标记为替换模式
    };

    const createdNote = await store.addNote(replaceModeNote);
    console.log("✅ 替换模式便签创建成功:", createdNote.id);

    // 等待一秒确保便签创建完成
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("🎯 替换模式溯源测试数据创建完成！");
    console.log("📋 便签信息:");
    console.log(`   - 便签ID: ${createdNote.id}`);
    console.log(`   - 便签标题: ${createdNote.title}`);
    console.log(`   - 生成模式: ${createdNote.generationMode}`);
    console.log(`   - 原始便签数量: ${sourceNotesContent.length}`);
    console.log("📝 原始便签列表:");
    sourceNotesContent.forEach((source, index) => {
      console.log(`   ${index + 1}. "${source.title}" (${source.color})`);
      console.log(`      创建时间: ${source.createdAt.toLocaleString()}`);
      console.log(`      删除时间: ${source.deletedAt.toLocaleString()}`);
    });

    return {
      success: true,
      noteId: createdNote.id,
      sourceNotesCount: sourceNotesContent.length,
    };
  } catch (error) {
    console.error("❌ 创建替换模式溯源测试数据失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

/**
 * 验证替换模式溯源数据持久化
 */
export async function verifyReplaceModeTraceabilityPersistence() {
  const store = useStickyNotesStore.getState();

  console.log("🔍 验证替换模式溯源数据持久化...");

  try {
    // 强制重新加载数据
    await store.loadNotes();

    // 查找替换模式生成的便签
    const replaceModeNotes = store.notes.filter(
      (note) =>
        note.generationMode === "replace" &&
        note.sourceNotesContent &&
        note.sourceNotesContent.length > 0
    );

    if (replaceModeNotes.length > 0) {
      console.log("✅ 找到替换模式便签:", replaceModeNotes.length, "个");

      replaceModeNotes.forEach((note) => {
        console.log(`📋 便签 "${note.title}":`);
        console.log(`   - ID: ${note.id}`);
        console.log(`   - 生成模式: ${note.generationMode}`);
        console.log(`   - 原始便签数量: ${note.sourceNotesContent!.length}`);

        note.sourceNotesContent!.forEach((source, index) => {
          console.log(`   ${index + 1}. 原始便签 "${source.title}":`);
          console.log(`      - 原始ID: ${source.id}`);
          console.log(`      - 颜色: ${source.color}`);
          console.log(`      - 内容长度: ${source.content.length} 字符`);
          console.log(`      - 创建时间: ${source.createdAt.toLocaleString()}`);
          console.log(`      - 删除时间: ${source.deletedAt.toLocaleString()}`);
        });
      });

      return {
        success: true,
        replaceModeNotes: replaceModeNotes.map((note) => ({
          id: note.id,
          title: note.title,
          generationMode: note.generationMode,
          sourceNotesCount: note.sourceNotesContent!.length,
          sourceNotes: note.sourceNotesContent!.map((source) => ({
            id: source.id,
            title: source.title,
            color: source.color,
            contentLength: source.content.length,
            createdAt: source.createdAt,
            deletedAt: source.deletedAt,
          })),
        })),
      };
    } else {
      console.log("❌ 未找到任何替换模式便签");
      return {
        success: false,
        error: "未找到替换模式便签",
      };
    }
  } catch (error) {
    console.error("❌ 验证替换模式溯源数据失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "验证失败",
    };
  }
}

/**
 * 清理替换模式测试数据
 */
export async function cleanupReplaceModeTestData() {
  const store = useStickyNotesStore.getState();

  console.log("🧹 清理替换模式测试数据...");

  try {
    // 查找所有替换模式测试便签
    const testNotes = store.notes.filter(
      (note) =>
        note.generationMode === "replace" &&
        note.title.includes("AI综合分析报告")
    );

    if (testNotes.length === 0) {
      console.log("ℹ️ 没有找到需要清理的测试数据");
      return { success: true, deletedCount: 0 };
    }

    // 删除测试便签
    for (const note of testNotes) {
      await store.deleteNote(note.id);
      console.log(`🗑️ 已删除测试便签: ${note.title} (${note.id})`);
    }

    console.log(`✅ 清理完成，共删除 ${testNotes.length} 个测试便签`);
    return { success: true, deletedCount: testNotes.length };
  } catch (error) {
    console.error("❌ 清理测试数据失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "清理失败",
    };
  }
}

// 导出到全局窗口对象，方便在浏览器控制台中调用
if (typeof window !== "undefined") {
  (window as any).__REPLACE_MODE_TRACEABILITY_TEST__ = {
    createTestData: createReplaceModeTraceabilityTestData,
    verifyPersistence: verifyReplaceModeTraceabilityPersistence,
    cleanup: cleanupReplaceModeTestData,
  };
}
