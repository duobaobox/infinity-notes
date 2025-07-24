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
    const extractedContent = connectionUtils.extractNoteContent(
      noteWithThinkingChain
    );

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
    const extractedContent =
      connectionUtils.extractNoteContent(noteWithFinalAnswer);

    // 应该只包含最终答案部分
    expect(extractedContent).toContain("这是最终答案部分的内容");
    // 不应该包含其他部分
    expect(extractedContent).not.toContain("一些前置内容");
    expect(extractedContent).not.toContain("这部分不应该被包含");
  });

  test("总结模式为 final_answer_only 时应该使用智能提取", () => {
    const connectedNotes = [noteWithThinkingChain, normalNote];
    const summary = connectionUtils.getConnectionSummary(
      connectedNotes,
      "final_answer_only"
    );

    // 应该包含提取后的内容
    expect(summary).toContain("这是经过深思熟虑后的最终答案");
    expect(summary).toContain("这是一个普通的便签内容");
    // 不应该包含思维链格式
    expect(summary).not.toContain("点击展开思考过程");
  });

  test("总结模式为 full 时应该使用完整内容", () => {
    const connectedNotes = [noteWithThinkingChain];
    const summary = connectionUtils.getConnectionSummary(
      connectedNotes,
      "full"
    );

    // 应该包含完整的原始内容（截取前100个字符）
    expect(summary).toContain("## 🤔 AI思考过程");
  });

  test("生成AI提示词时应该包含模式描述", () => {
    // 测试短内容（精准模式）
    const shortNotes = [
      {
        ...noteWithThinkingChain,
        content: "短内容", // 短内容应该触发精准模式
      },
    ];

    const shortResult = connectionUtils.generateAIPromptWithConnections(
      "请总结这些内容",
      shortNotes
    );

    // 短内容应该使用精准模式
    expect(shortResult.prompt).toContain("（精准模式：完整内容）");

    // 测试长内容（智能模式）
    const longNotes = [
      {
        ...noteWithThinkingChain,
        content: "很长的内容".repeat(200), // 长内容应该触发智能模式
      },
    ];

    const longResult = connectionUtils.generateAIPromptWithConnections(
      "请总结这些内容",
      longNotes
    );

    // 长内容应该使用智能模式
    expect(longResult.prompt).toContain("（智能模式：已提取核心内容）");
  });

  // 新增：增强版内容提取准确性测试
  describe("增强版内容提取准确性测试", () => {
    // 测试多语言支持
    const englishNote: StickyNote = {
      id: "english-note",
      title: "English Note",
      content: `Some initial thoughts...

## Final Answer

This is the final answer in English that should be extracted.

## Additional Info

This should not be included.`,
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

    // 测试边界情况
    const edgeCaseNote: StickyNote = {
      id: "edge-case-note",
      title: "Edge Case",
      content: `## ✨ 最终答案

这是一个很短的答案。`,
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

    // 测试无效数据
    const invalidNote: any = {
      id: "invalid-note",
      title: null,
      content: 123, // 错误的数据类型
      x: 0,
      y: 0,
      width: 300,
      height: 200,
      color: "red",
      isEditing: false,
      isTitleEditing: false,
      isNew: false,
      zIndex: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    test("应该支持英文格式的最终答案提取", () => {
      const extracted = connectionUtils.extractNoteContent(englishNote);
      expect(extracted).toContain("This is the final answer in English");
      expect(extracted).not.toContain("Some initial thoughts");
      expect(extracted).not.toContain("Additional Info");
    });

    test("应该正确处理短内容", () => {
      const extracted = connectionUtils.extractNoteContent(edgeCaseNote);
      expect(extracted).toBe("这是一个很短的答案。");
    });

    test("应该验证便签数据的有效性", () => {
      expect(connectionUtils.validateSingleConnection(normalNote)).toBe(true);
      expect(connectionUtils.validateSingleConnection(invalidNote)).toBe(false);
      expect(connectionUtils.validateSingleConnection(null as any)).toBe(false);
    });

    test("智能截断应该在合适位置截断", () => {
      const longText =
        "这是第一句话。这是第二句话，包含更多信息。这是第三句话。";
      const truncated = connectionUtils.smartTruncate(longText, 20);

      // 应该在句号后截断
      expect(truncated).toMatch(/。\.\.\.$/);
      expect(truncated.length).toBeLessThanOrEqual(23); // 20 + "..."
    });

    test("内容质量评估应该返回合理分数", () => {
      const highQualityContent =
        "这是一个结构完整的答案。它包含了详细的分析和建议，能够解决用户的问题。";
      const lowQualityContent = "短";

      const highScore =
        connectionUtils.assessContentQuality(highQualityContent);
      const lowScore = connectionUtils.assessContentQuality(lowQualityContent);

      expect(highScore).toBeGreaterThan(lowScore);
      expect(highScore).toBeGreaterThan(0.5);
      expect(lowScore).toBeLessThan(0.3);
    });

    test("应该过滤无效便签并给出警告", () => {
      const mixedNotes = [normalNote, invalidNote, noteWithThinkingChain];
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const summary = connectionUtils.getConnectionSummary(
        mixedNotes,
        "final_answer_only"
      );

      // 应该只包含有效便签的内容
      expect(summary).toContain("普通便签");
      expect(summary).toContain("这是经过深思熟虑后的最终答案");
      expect(summary).not.toContain("invalid-note");

      // 应该有警告信息
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("个便签数据无效，已过滤")
      );

      consoleSpy.mockRestore();
    });

    test("智能内容提取应该识别核心段落", () => {
      const structuredContent = `首先，我需要分析这个问题。

然后，我会考虑各种可能的解决方案。

经过深入思考，我认为最佳方案是采用渐进式改进策略。

这个方案具有以下优势：可行性高、风险可控、效果明显。`;

      const extracted =
        connectionUtils.intelligentContentExtraction(structuredContent);

      // 应该提取后半部分的核心内容
      expect(extracted).toContain("最佳方案是采用渐进式改进策略");
      expect(extracted).toContain("这个方案具有以下优势");
      expect(extracted).not.toContain("首先，我需要分析");
    });
  });

  // 新增：配置管理功能测试
  describe("配置管理功能测试", () => {
    beforeEach(() => {
      // 每个测试前重置配置
      const { resetExtractionConfig } = useConnectionStore.getState();
      resetExtractionConfig();
    });

    test("应该能够更新配置", () => {
      const { updateExtractionConfig, getExtractionConfig } =
        useConnectionStore.getState();

      const newConfig = {
        lengthLimits: {
          finalAnswerOnly: 300,
          full: 150,
          qualityBonus: 100,
        },
        qualityAssessment: {
          enabled: false,
        },
      };

      updateExtractionConfig(newConfig);
      const updatedConfig = getExtractionConfig();

      expect(updatedConfig.lengthLimits.finalAnswerOnly).toBe(300);
      expect(updatedConfig.lengthLimits.full).toBe(150);
      expect(updatedConfig.lengthLimits.qualityBonus).toBe(100);
      expect(updatedConfig.qualityAssessment.enabled).toBe(false);
    });

    test("应该能够切换优化场景", () => {
      const { setExtractionScenario, getExtractionConfig } =
        useConnectionStore.getState();

      // 测试速度优先模式
      setExtractionScenario("speed");
      let config = getExtractionConfig();
      expect(config.qualityAssessment.enabled).toBe(false);
      expect(config.smartTruncation.enabled).toBe(false);

      // 测试准确性优先模式
      setExtractionScenario("accuracy");
      config = getExtractionConfig();
      expect(config.qualityAssessment.enabled).toBe(true);
      expect(config.smartTruncation.enabled).toBe(true);
      expect(config.lengthLimits.finalAnswerOnly).toBeGreaterThan(200);
    });

    test("配置应该影响实际的内容提取", () => {
      const { updateExtractionConfig } = useConnectionStore.getState();

      // 设置较短的长度限制
      updateExtractionConfig({
        lengthLimits: {
          finalAnswerOnly: 50,
          full: 30,
          qualityBonus: 0,
        },
        qualityAssessment: {
          enabled: false,
        },
        smartTruncation: {
          enabled: false,
        },
      });

      const longNote: StickyNote = {
        id: "long-note",
        title: "长内容便签",
        content:
          "这是一个很长的便签内容，包含了大量的文字信息，应该会被截断处理。这里有更多的内容来测试截断功能是否正常工作。",
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

      const summary = connectionUtils.getConnectionSummary(
        [longNote],
        "final_answer_only"
      );

      // 由于长度限制，摘要应该被截断
      expect(summary.length).toBeLessThan(longNote.content.length + 50); // 考虑格式化字符
    });

    test("应该能够重置配置", () => {
      const {
        updateExtractionConfig,
        resetExtractionConfig,
        getExtractionConfig,
      } = useConnectionStore.getState();

      // 先修改配置
      updateExtractionConfig({
        lengthLimits: {
          finalAnswerOnly: 999,
          full: 888,
          qualityBonus: 777,
        },
      });

      // 验证配置已修改
      let config = getExtractionConfig();
      expect(config.lengthLimits.finalAnswerOnly).toBe(999);

      // 重置配置
      resetExtractionConfig();
      config = getExtractionConfig();

      // 验证配置已重置为默认值
      expect(config.lengthLimits.finalAnswerOnly).toBe(200); // 默认值
      expect(config.lengthLimits.full).toBe(100); // 默认值
    });
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

  const summary = connectionUtils.getConnectionSummary(
    [testNote],
    "final_answer_only"
  );
  console.log("📋 总结结果:", summary);

  console.log("✅ 测试完成");
};
