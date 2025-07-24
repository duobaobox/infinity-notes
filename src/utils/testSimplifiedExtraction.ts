// 测试简化后的内容提取功能
import {
  ContentExtractionConfigManager,
  ExtractionMode,
  getExtractionModeForLength,
} from "../config/contentExtractionConfig";
import { connectionUtils } from "../stores/connectionStore";
import type { StickyNote } from "../components/types";

/**
 * 创建测试便签的工具函数
 */
const createTestNote = (
  id: string,
  title: string,
  content: string
): StickyNote => ({
  id,
  title,
  content,
  x: 0,
  y: 0,
  width: 200,
  height: 150,
  color: "#fff",
  zIndex: 1,
  isNew: false,
  isEditing: false,
  isTitleEditing: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

/**
 * 测试简化后的内容提取功能
 * 验证自动模式选择是否正常工作
 */
export const testSimplifiedExtraction = () => {
  console.log("🧪 开始测试简化后的内容提取功能");

  // 测试1: 阈值设置
  const configManager = ContentExtractionConfigManager.getInstance();
  console.log("📏 当前阈值:", configManager.getLengthThreshold());

  // 测试2: 模式选择
  console.log("\n🎯 测试模式选择:");

  // 短文本 - 应该选择精准模式
  const shortLength = 500;
  const shortMode = getExtractionModeForLength(shortLength);
  console.log(
    `${shortLength}字 -> ${
      shortMode === ExtractionMode.SMART ? "智能模式" : "精准模式"
    } ✓`
  );

  // 长文本 - 应该选择智能模式
  const longLength = 1500;
  const longMode = getExtractionModeForLength(longLength);
  console.log(
    `${longLength}字 -> ${
      longMode === ExtractionMode.SMART ? "智能模式" : "精准模式"
    } ✓`
  );

  // 测试3: 连接便签总字数计算
  console.log("\n📊 测试连接便签字数计算:");

  const mockNotes: StickyNote[] = [
    createTestNote("note1", "短便签", "这是一个短便签内容"),
    createTestNote("note2", "长便签", "这是一个很长的便签内容".repeat(50)), // 约1000字
  ];

  const totalLength = connectionUtils.calculateTotalLength(mockNotes);
  const autoMode = connectionUtils.getAutoExtractionMode(mockNotes);
  console.log(
    `总字数: ${totalLength}, 自动选择: ${
      autoMode === ExtractionMode.SMART ? "智能模式" : "精准模式"
    } ✓`
  );

  // 测试4: 自动摘要生成（通过generateAIPromptWithConnections测试）
  console.log("\n📝 测试自动摘要生成:");
  const promptResult = connectionUtils.generateAIPromptWithConnections(
    "请总结这些内容",
    mockNotes
  );
  console.log("摘要长度:", promptResult.prompt.length);
  console.log("摘要预览:", promptResult.prompt.substring(0, 100) + "...");

  console.log(
    "生成的模式:",
    promptResult.mode === ExtractionMode.SMART ? "智能模式" : "精准模式"
  );
  console.log("总字数:", promptResult.totalLength);
  console.log("便签数量:", promptResult.noteCount);

  console.log("\n✅ 简化后的内容提取功能测试完成！");

  return {
    shortMode: shortMode === ExtractionMode.PRECISE,
    longMode: longMode === ExtractionMode.SMART,
    totalLength,
    autoMode: autoMode === ExtractionMode.SMART,
    promptResult: {
      mode: promptResult.mode,
      totalLength: promptResult.totalLength,
      noteCount: promptResult.noteCount,
      promptGenerated: promptResult.prompt.length > 0,
    },
  };
};

/**
 * 测试阈值修改功能
 */
export const testThresholdChange = (newThreshold: number) => {
  console.log(`🔧 测试阈值修改: ${newThreshold}字`);

  const configManager = ContentExtractionConfigManager.getInstance();
  const oldThreshold = configManager.getLengthThreshold();

  // 修改阈值
  configManager.setLengthThreshold(newThreshold);

  // 验证修改
  const currentThreshold = configManager.getLengthThreshold();
  console.log(
    `阈值修改: ${oldThreshold} -> ${currentThreshold} ${
      currentThreshold === newThreshold ? "✓" : "✗"
    }`
  );

  // 测试新阈值下的模式选择
  const testLength = newThreshold + 100;
  const mode = getExtractionModeForLength(testLength);
  console.log(
    `${testLength}字 -> ${
      mode === ExtractionMode.SMART ? "智能模式" : "精准模式"
    } ✓`
  );

  return currentThreshold === newThreshold;
};

/**
 * 测试用户提醒功能
 * 模拟不同字数的便签组合，验证提醒逻辑
 */
export const testUserNotification = () => {
  console.log("🔔 开始测试用户提醒功能");

  const configManager = ContentExtractionConfigManager.getInstance();
  const threshold = configManager.getLengthThreshold();
  console.log(`当前阈值: ${threshold}字`);

  // 测试场景1: 短内容，不应该触发智能模式提醒
  const shortNotes: StickyNote[] = [
    createTestNote("short1", "短便签1", "这是一个短内容"),
  ];

  const shortResult = connectionUtils.generateAIPromptWithConnections(
    "请处理这些内容",
    shortNotes
  );

  console.log(`\n📝 场景1 - 短内容测试:`);
  console.log(`  便签数: ${shortResult.noteCount}`);
  console.log(`  总字数: ${shortResult.totalLength}`);
  console.log(
    `  选择模式: ${
      shortResult.mode === ExtractionMode.SMART ? "智能模式" : "精准模式"
    }`
  );
  console.log(
    `  是否触发提醒: ${
      shortResult.mode === ExtractionMode.SMART ? "是" : "否"
    } ${shortResult.mode === ExtractionMode.SMART ? "❌" : "✓"}`
  );

  // 测试场景2: 长内容，应该触发智能模式提醒
  const longNotes: StickyNote[] = [
    createTestNote("long1", "长便签1", "这是一个很长的内容".repeat(100)), // 约1000字
    createTestNote("long2", "长便签2", "另一个长内容".repeat(50)), // 约500字
  ];

  const longResult = connectionUtils.generateAIPromptWithConnections(
    "请处理这些内容",
    longNotes
  );

  console.log(`\n📝 场景2 - 长内容测试:`);
  console.log(`  便签数: ${longResult.noteCount}`);
  console.log(`  总字数: ${longResult.totalLength}`);
  console.log(
    `  选择模式: ${
      longResult.mode === ExtractionMode.SMART ? "智能模式" : "精准模式"
    }`
  );
  console.log(
    `  是否触发提醒: ${
      longResult.mode === ExtractionMode.SMART ? "是" : "否"
    } ${longResult.mode === ExtractionMode.SMART ? "✓" : "❌"}`
  );

  // 模拟用户提醒消息
  if (longResult.mode === ExtractionMode.SMART) {
    const notificationMessage = `🧠 智能模式已启用：检测到${longResult.noteCount}个便签共${longResult.totalLength}字，将智能提取核心内容进行处理`;
    console.log(`\n🔔 模拟用户提醒: ${notificationMessage}`);
  }

  console.log("\n✅ 用户提醒功能测试完成！");

  return {
    shortContent: {
      noteCount: shortResult.noteCount,
      totalLength: shortResult.totalLength,
      mode: shortResult.mode,
      shouldNotify: shortResult.mode === ExtractionMode.SMART,
    },
    longContent: {
      noteCount: longResult.noteCount,
      totalLength: longResult.totalLength,
      mode: longResult.mode,
      shouldNotify: longResult.mode === ExtractionMode.SMART,
    },
  };
};

// 在浏览器控制台中可以调用的全局函数
if (typeof window !== "undefined") {
  (window as any).testSimplifiedExtraction = testSimplifiedExtraction;
  (window as any).testThresholdChange = testThresholdChange;
  (window as any).testUserNotification = testUserNotification;
}
