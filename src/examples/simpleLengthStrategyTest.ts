/**
 * 简单长度策略测试
 * 验证1000字阈值策略的效果
 */

import {
  extractContentSmart,
  extractContentWithMetadata,
} from "../services/smartContentExtractionService";

/**
 * 测试短便签（≤1000字）的处理
 */
export async function testShortNoteHandling() {
  console.log("🧪 测试短便签处理（≤1000字）");

  const shortNote = `
今天的会议要点：
1. 项目进度正常，按计划推进
2. 预算需要调整，增加10%的缓冲
3. 下周一开始新的营销活动
4. 记得联系供应商确认交货时间
5. 团队成员反馈积极，士气高涨

明天的待办事项：
- 准备季度报告
- 与客户沟通需求变更
- 审核新员工简历
- 安排下周的团队建设活动
`;

  console.log("📝 原始内容长度:", shortNote.length, "字符");

  // 测试基础API
  const extracted = await extractContentSmart(shortNote);
  console.log(
    "✅ 基础API结果:",
    extracted === shortNote.trim() ? "返回完整内容" : "进行了处理"
  );

  // 测试高级API
  const result = await extractContentWithMetadata(shortNote);
  console.log("📊 高级API元数据:", {
    originalLength: result.metadata.originalLength,
    extractedLength: result.metadata.extractedLength,
    confidence: result.metadata.confidence,
    processingTime: result.metadata.processingTime,
  });

  console.log("✅ 短便签测试完成\n");
  return { extracted, metadata: result.metadata };
}

/**
 * 测试长便签（>1000字）的处理
 */
export async function testLongNoteHandling() {
  console.log("🧪 测试长便签处理（>1000字）");

  // 生成一个超过1000字的长便签
  const longNote = `
## 🤔 AI思考过程

<details>
<summary>点击展开详细分析过程</summary>

让我来详细分析这个复杂的商业问题。首先，我需要考虑市场环境的变化，包括消费者行为的转变、技术发展的趋势、竞争格局的演变等多个维度。

在市场分析方面，我们需要关注以下几个关键因素：
1. 消费者需求的变化趋势
2. 竞争对手的策略调整
3. 行业发展的整体方向
4. 技术创新对市场的影响
5. 政策法规的变化

然后，我需要评估我们公司的内部资源和能力，包括：
- 人力资源的配置和能力
- 技术研发的实力
- 资金状况和投资能力
- 品牌影响力和市场地位
- 供应链的稳定性和效率

接下来，我要分析各种可能的战略选择，权衡每种选择的优缺点，考虑实施的可行性和风险。这需要综合考虑短期收益和长期发展，平衡风险和机遇。

</details>

---

## ✨ 最终答案

基于以上全面分析，我建议采取以下三步走战略：

### 第一步：短期调整（3-6个月）
1. **市场定位优化**：专注于高价值客户群体，提升客户粘性
2. **产品线精简**：集中资源在核心产品上，提高竞争力
3. **运营效率提升**：优化内部流程，降低运营成本

### 第二步：中期建设（6-18个月）
1. **品牌建设**：加强品牌营销，提升市场认知度
2. **技术投入**：增加研发投入，保持技术领先优势
3. **渠道拓展**：开拓新的销售渠道，扩大市场覆盖

### 第三步：长期发展（18个月以上）
1. **生态构建**：建立完整的产业生态系统
2. **国际化**：逐步进入国际市场，实现全球化布局
3. **创新驱动**：持续创新，引领行业发展趋势

这个战略能够帮助公司在激烈的市场竞争中建立持续的竞争优势，实现长期稳定的发展。同时，我们需要建立完善的监控机制，及时调整策略以应对市场变化。
`;

  console.log("📝 原始内容长度:", longNote.length, "字符");

  // 测试基础API
  const extracted = await extractContentSmart(longNote);
  console.log("🎯 基础API结果长度:", extracted.length, "字符");
  console.log("📄 提取结果预览:", extracted.substring(0, 200) + "...");

  // 测试高级API
  const result = await extractContentWithMetadata(longNote);
  console.log("📊 高级API元数据:", {
    originalLength: result.metadata.originalLength,
    extractedLength: result.metadata.extractedLength,
    confidence: result.metadata.confidence,
    processingTime: result.metadata.processingTime,
  });

  console.log("✅ 长便签测试完成\n");
  return { extracted, metadata: result.metadata };
}

/**
 * 测试边界情况（正好1000字）
 */
export async function testBoundaryCase() {
  console.log("🧪 测试边界情况（正好1000字）");

  // 生成正好1000字的内容
  const boundaryNote = "这是一个测试便签。".repeat(100); // 大约1000字
  const exactNote = boundaryNote.substring(0, 1000); // 精确1000字

  console.log("📝 边界内容长度:", exactNote.length, "字符");

  const extracted = await extractContentSmart(exactNote);
  console.log(
    "✅ 边界测试结果:",
    extracted === exactNote.trim() ? "返回完整内容" : "进行了处理"
  );

  console.log("✅ 边界测试完成\n");
  return extracted;
}

/**
 * 运行所有测试
 */
export async function runAllLengthStrategyTests() {
  console.log("🚀 开始运行简单长度策略测试\n");

  try {
    await testShortNoteHandling();
    await testLongNoteHandling();
    await testBoundaryCase();

    console.log("🎉 所有测试完成！");
    console.log("\n📋 策略总结:");
    console.log("- ≤1000字：直接返回完整内容，性能最优");
    console.log("- >1000字：智能提取核心内容，避免信息过载");
    console.log("- 边界情况：1000字按短便签处理");
  } catch (error) {
    console.error("❌ 测试过程中出现错误:", error);
  }
}

/**
 * 浏览器控制台快速测试函数
 * 在浏览器控制台中调用：window.testLengthStrategy()
 */
export function setupBrowserTest() {
  // @ts-ignore
  window.testLengthStrategy = async () => {
    console.log("🧪 浏览器控制台测试 - 1000字阈值策略");

    // 短便签测试
    const shortNote = "这是一个短便签，用于测试1000字阈值策略的效果。";
    console.log("📝 短便签测试:", shortNote.length, "字符");
    const shortResult = await extractContentSmart(shortNote);
    console.log(
      "✅ 短便签结果:",
      shortResult === shortNote.trim() ? "完整保留" : "进行了处理"
    );

    // 长便签测试
    const longNote = "这是一个很长的便签内容。".repeat(100); // 超过1000字
    console.log("📝 长便签测试:", longNote.length, "字符");
    const longResult = await extractContentSmart(longNote);
    console.log(
      "🎯 长便签结果:",
      longResult.length,
      "字符",
      "压缩率:",
      ((1 - longResult.length / longNote.length) * 100).toFixed(1) + "%"
    );

    console.log("✅ 浏览器测试完成！");
  };

  console.log(
    "🔧 浏览器测试已设置，请在控制台调用：window.testLengthStrategy()"
  );
}

/**
 * 性能对比测试
 */
export async function performanceComparisonTest() {
  console.log("⚡ 性能对比测试");

  const shortContent = "简短的便签内容，用于测试性能。";
  const longContent = "很长的便签内容。".repeat(200); // 超过1000字

  // 测试短便签性能
  const shortStart = performance.now();
  await extractContentSmart(shortContent);
  const shortTime = performance.now() - shortStart;

  // 测试长便签性能
  const longStart = performance.now();
  await extractContentSmart(longContent);
  const longTime = performance.now() - longStart;

  console.log("📊 性能对比结果:");
  console.log(`- 短便签处理时间: ${shortTime.toFixed(2)}ms`);
  console.log(`- 长便签处理时间: ${longTime.toFixed(2)}ms`);
  console.log(
    `- 性能提升: ${(((longTime - shortTime) / longTime) * 100).toFixed(1)}%`
  );
}
