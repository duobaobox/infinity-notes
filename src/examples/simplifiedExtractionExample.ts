/**
 * 简化版内容提取使用示例
 * 🎯 展示1000字阈值策略的简单有效性
 */

import {
  extractContentSmart,
  extractContentWithMetadata,
} from "../services/smartContentExtractionService";

import {
  isShortNote,
  isLongNote,
  getLengthThreshold,
  setLengthThreshold,
} from "../config/simpleContentExtractionConfig";

/**
 * 基础使用示例 - 完全无配置
 */
export async function basicSimplifiedExample() {
  console.log("🎯 简化版基础使用示例");

  // 短便签示例
  const shortNote = `
今天的重要任务：
1. 完成项目报告
2. 参加团队会议
3. 联系客户确认需求
`;

  console.log("📝 短便签测试:", shortNote.length, "字符");
  console.log("📏 是否为短便签:", isShortNote(shortNote));

  const shortResult = await extractContentSmart(shortNote);
  console.log("✅ 短便签结果:", shortResult === shortNote.trim() ? "完整保留" : "进行了处理");

  // 长便签示例
  const longNote = `
## 🤔 详细分析过程

让我来详细分析这个复杂的商业问题。首先需要考虑市场环境...

${Array(50).fill("这是一段很长的分析内容。").join(" ")}

## ✨ 最终答案

基于以上分析，我建议采取以下策略：
1. 短期调整产品定位
2. 中期建立品牌优势  
3. 长期构建生态系统
`;

  console.log("📝 长便签测试:", longNote.length, "字符");
  console.log("📏 是否为长便签:", isLongNote(longNote));

  const longResult = await extractContentSmart(longNote);
  console.log("🎯 长便签结果:", longResult.length, "字符");
  console.log("📊 压缩率:", ((1 - longResult.length / longNote.length) * 100).toFixed(1) + "%");

  console.log("✅ 基础示例完成\n");
}

/**
 * 阈值配置示例
 */
export function thresholdConfigExample() {
  console.log("⚙️ 阈值配置示例");

  // 查看当前阈值
  const currentThreshold = getLengthThreshold();
  console.log("📏 当前阈值:", currentThreshold, "字符");

  // 测试不同内容长度
  const testContents = [
    "短内容",
    "中等长度的内容".repeat(50),
    "很长的内容".repeat(200),
  ];

  testContents.forEach((content, index) => {
    console.log(`📝 测试内容${index + 1}:`, content.length, "字符");
    console.log("📏 分类:", isShortNote(content) ? "短便签" : "长便签");
  });

  // 动态调整阈值（如果需要）
  console.log("\n🔧 动态调整阈值示例:");
  setLengthThreshold(800); // 调整为800字
  console.log("📏 新阈值:", getLengthThreshold(), "字符");

  // 恢复默认阈值
  setLengthThreshold(1000);
  console.log("📏 恢复默认阈值:", getLengthThreshold(), "字符");

  console.log("✅ 阈值配置示例完成\n");
}

/**
 * 性能对比示例
 */
export async function performanceComparisonExample() {
  console.log("⚡ 性能对比示例");

  const shortContent = "简短便签内容";
  const longContent = "长便签内容".repeat(300);

  // 短便签性能测试
  const shortStart = performance.now();
  await extractContentSmart(shortContent);
  const shortTime = performance.now() - shortStart;

  // 长便签性能测试
  const longStart = performance.now();
  await extractContentSmart(longContent);
  const longTime = performance.now() - longStart;

  console.log("📊 性能对比:");
  console.log(`- 短便签处理时间: ${shortTime.toFixed(2)}ms (几乎为0)`);
  console.log(`- 长便签处理时间: ${longTime.toFixed(2)}ms`);
  console.log(`- 短便签性能优势: ${((longTime - shortTime) / longTime * 100).toFixed(1)}%`);

  console.log("✅ 性能对比完成\n");
}

/**
 * 实际业务场景示例
 */
export class SimplifiedBusinessUsage {
  /**
   * 便签卡片显示
   */
  static async noteCardDisplay(noteContent: string): Promise<string> {
    // 🎯 零配置使用，系统自动判断
    return await extractContentSmart(noteContent);
  }

  /**
   * AI汇总功能
   */
  static async aiSummaryUsage(notes: string[]): Promise<string[]> {
    // 🎯 批量处理，每个便签自动判断长短
    return Promise.all(
      notes.map(note => extractContentSmart(note))
    );
  }

  /**
   * 搜索结果预览
   */
  static async searchPreview(searchResults: string[]): Promise<Array<{
    original: string;
    preview: string;
    isShort: boolean;
  }>> {
    return Promise.all(
      searchResults.map(async (content) => ({
        original: content,
        preview: await extractContentSmart(content),
        isShort: isShortNote(content),
      }))
    );
  }
}

/**
 * 完整的简化示例演示
 */
export async function runSimplifiedDemo() {
  console.log("🚀 简化版内容提取演示开始\n");

  try {
    await basicSimplifiedExample();
    thresholdConfigExample();
    await performanceComparisonExample();

    console.log("🎉 简化版演示完成！");
    console.log("\n📋 简化策略总结:");
    console.log("✅ 无需配置 - 开箱即用");
    console.log("✅ 逻辑简单 - 只需判断1000字阈值");
    console.log("✅ 性能优异 - 短便签零延迟");
    console.log("✅ 用户友好 - 符合使用直觉");

  } catch (error) {
    console.error("❌ 演示过程中出现错误:", error);
  }
}

/**
 * 浏览器控制台测试
 */
export function setupSimplifiedBrowserTest() {
  // @ts-ignore
  window.testSimplified = async () => {
    console.log("🧪 简化版浏览器测试");
    
    const shortNote = "这是一个短便签";
    const longNote = "这是一个长便签内容。".repeat(100);
    
    console.log("📝 短便签:", shortNote.length, "字符");
    const shortResult = await extractContentSmart(shortNote);
    console.log("✅ 短便签结果:", shortResult === shortNote.trim() ? "完整保留" : "处理了");
    
    console.log("📝 长便签:", longNote.length, "字符");
    const longResult = await extractContentSmart(longNote);
    console.log("🎯 长便签结果:", longResult.length, "字符");
    
    console.log("✅ 简化版测试完成！");
  };
  
  console.log("🔧 简化版浏览器测试已设置，调用：window.testSimplified()");
}
