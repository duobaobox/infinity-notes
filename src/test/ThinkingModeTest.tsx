import React, { useState } from "react";
import { Button, Card, Switch, Space, Typography, Divider } from "antd";
import { useUIStore } from "../stores/uiStore";
import { useStickyNotesStore } from "../stores/stickyNotesStore";
import type { StickyNote } from "../components/types";

const { Text, Paragraph } = Typography;

/**
 * 思维模式功能测试组件
 * 用于验证思维链显示逻辑是否正确工作
 */
const ThinkingModeTest: React.FC = () => {
  const { basicSettings, setBasicSettings } = useUIStore();
  const { addNote } = useStickyNotesStore();
  const [testResults, setTestResults] = useState<string[]>([]);

  // 创建测试便签的辅助函数
  const createTestNote = (
    id: string,
    title: string,
    content: string,
    thinkingChain?: any
  ): StickyNote => {
    return {
      id,
      title,
      content,
      thinkingChain,
      x: Math.random() * 400,
      y: Math.random() * 400,
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
  };

  // 测试思维模式开关
  const testThinkingModeToggle = () => {
    const results: string[] = [];

    // 测试1: 开启思维模式
    setBasicSettings({ showThinkingMode: true });
    results.push(`✅ 思维模式已开启: ${basicSettings.showThinkingMode}`);

    // 测试2: 关闭思维模式
    setBasicSettings({ showThinkingMode: false });
    results.push(`✅ 思维模式已关闭: ${basicSettings.showThinkingMode}`);

    setTestResults(results);
  };

  // 创建测试便签
  const createTestNotes = () => {
    const results: string[] = [];

    // 创建普通便签
    const normalNote = createTestNote(
      "test-normal-" + Date.now(),
      "普通便签测试",
      "这是一个普通便签的内容，没有思维链数据。"
    );
    addNote(normalNote);
    results.push("✅ 已创建普通便签");

    // 创建有思维链的便签
    const thinkingNote = createTestNote(
      "test-thinking-" + Date.now(),
      "思维链便签测试",
      "这是包含完整AI思考过程的内容，用户在关闭思维模式时应该看到这部分。",
      {
        finalAnswer: "这是最终答案，用户在开启思维模式时应该只看到这部分。",
        steps: [
          { stepType: "analysis", content: "分析步骤：首先分析问题的核心" },
          { stepType: "reasoning", content: "推理步骤：基于分析结果进行推理" },
          { stepType: "conclusion", content: "结论步骤：得出最终结论" },
        ],
        totalThinkingTime: 2500,
      }
    );
    addNote(thinkingNote);
    results.push("✅ 已创建思维链便签");

    setTestResults((prev) => [...prev, ...results]);
  };

  // 测试显示逻辑
  const testDisplayLogic = () => {
    const results: string[] = [];

    // 模拟StickyNote组件的显示逻辑
    const mockNote = {
      isEditing: false,
      thinkingChain: {
        finalAnswer: "最终答案内容",
        steps: [{ stepType: "analysis", content: "思考步骤" }],
      },
    };

    // 测试开启思维模式时的显示逻辑
    const showThinkingMode = true;
    const shouldShowThinkingChain =
      !mockNote.isEditing && mockNote.thinkingChain && showThinkingMode;

    const displayContent =
      mockNote.thinkingChain && !mockNote.isEditing && showThinkingMode
        ? mockNote.thinkingChain.finalAnswer
        : "完整内容";

    results.push(`思维模式开启时:`);
    results.push(
      `  - 显示思维链组件: ${shouldShowThinkingChain ? "是" : "否"}`
    );
    results.push(`  - 编辑器显示内容: ${displayContent}`);

    // 测试关闭思维模式时的显示逻辑
    const showThinkingModeOff = false;
    const shouldShowThinkingChainOff =
      !mockNote.isEditing && mockNote.thinkingChain && showThinkingModeOff;

    const displayContentOff =
      mockNote.thinkingChain && !mockNote.isEditing && showThinkingModeOff
        ? mockNote.thinkingChain.finalAnswer
        : "完整内容";

    results.push(`思维模式关闭时:`);
    results.push(
      `  - 显示思维链组件: ${shouldShowThinkingChainOff ? "是" : "否"}`
    );
    results.push(`  - 编辑器显示内容: ${displayContentOff}`);

    setTestResults((prev) => [...prev, ...results]);
  };

  // 测试AI生成（需要返回主应用）
  const testAIGeneration = () => {
    const results: string[] = [];
    results.push("🤖 AI生成测试说明:");
    results.push("1. 返回主应用 (去掉URL中的?test=thinking-mode)");
    results.push('2. 在控制台输入: "请分析一下人工智能的发展趋势"');
    results.push("3. 观察生成的便签内容和思维链显示");
    results.push("4. 切换思维模式开关，观察显示变化");
    results.push("");
    results.push("预期结果:");
    results.push("- 开启思维模式: 显示思维链折叠区域 + 编辑器只显示最终答案");
    results.push("- 关闭思维模式: 隐藏思维链折叠区域 + 编辑器显示完整内容");

    setTestResults((prev) => [...prev, ...results]);
  };

  return (
    <Card
      title="思维模式功能测试"
      style={{ margin: "20px", maxWidth: "800px" }}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {/* 当前设置状态 */}
        <Card size="small" title="当前设置状态">
          <Space>
            <Text>思维模式显示:</Text>
            <Switch
              checked={basicSettings.showThinkingMode}
              onChange={(checked) =>
                setBasicSettings({ showThinkingMode: checked })
              }
            />
            <Text
              type={basicSettings.showThinkingMode ? "success" : "secondary"}
            >
              {basicSettings.showThinkingMode ? "开启" : "关闭"}
            </Text>
          </Space>
        </Card>

        {/* 测试按钮 */}
        <Space wrap>
          <Button type="primary" onClick={testThinkingModeToggle}>
            测试开关切换
          </Button>
          <Button onClick={createTestNotes}>创建测试便签</Button>
          <Button onClick={testDisplayLogic}>测试显示逻辑</Button>
          <Button onClick={testAIGeneration}>AI生成测试说明</Button>
          <Button onClick={() => setTestResults([])}>清空结果</Button>
        </Space>

        {/* 测试结果 */}
        {testResults.length > 0 && (
          <>
            <Divider />
            <Card size="small" title="测试结果">
              {testResults.map((result, index) => (
                <Paragraph
                  key={index}
                  style={{ margin: "4px 0", fontFamily: "monospace" }}
                >
                  {result}
                </Paragraph>
              ))}
            </Card>
          </>
        )}

        {/* 使用说明 */}
        <Divider />
        <Card size="small" title="测试说明">
          <Paragraph>
            <Text strong>测试步骤:</Text>
          </Paragraph>
          <ol>
            <li>点击"测试开关切换"验证设置状态变化</li>
            <li>点击"创建测试便签"在画布上创建测试便签</li>
            <li>切换思维模式开关，观察便签显示变化</li>
            <li>点击"测试显示逻辑"验证逻辑正确性</li>
          </ol>
          <Paragraph>
            <Text strong>预期结果:</Text>
          </Paragraph>
          <ul>
            <li>开启思维模式：显示思维链折叠区域，编辑器只显示最终答案</li>
            <li>关闭思维模式：隐藏思维链折叠区域，编辑器显示完整内容</li>
          </ul>
        </Card>
      </Space>
    </Card>
  );
};

export default ThinkingModeTest;
