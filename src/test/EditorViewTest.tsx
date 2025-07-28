import React, { useState, useEffect } from "react";
import { Button, Card, Space, Typography, Alert } from "antd";
import WysiwygEditor from "../components/notes/WysiwygEditor";

const { Title, Text } = Typography;

/**
 * TipTap 编辑器视图安全性测试组件
 * 用于测试编辑器在快速创建/销毁时是否会出现 view.dom 访问错误
 */
const EditorViewTest: React.FC = () => {
  const [editors, setEditors] = useState<
    Array<{ id: string; content: string }>
  >([]);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // 添加编辑器实例
  const addEditor = () => {
    const newEditor = {
      id: `editor-${Date.now()}`,
      content: `# 测试编辑器 ${editors.length + 1}\n\n这是一个测试编辑器实例。`,
    };
    setEditors((prev) => [...prev, newEditor]);
    addTestResult(`✅ 创建编辑器: ${newEditor.id}`);
  };

  // 移除编辑器实例
  const removeEditor = (id: string) => {
    setEditors((prev) => prev.filter((editor) => editor.id !== id));
    addTestResult(`❌ 销毁编辑器: ${id}`);
  };

  // 清除所有编辑器
  const clearAllEditors = () => {
    setEditors([]);
    addTestResult("🧹 清除所有编辑器");
  };

  // 添加测试结果
  const addTestResult = (message: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  // 快速创建/销毁测试
  const runStressTest = async () => {
    setIsRunning(true);
    addTestResult("🚀 开始压力测试");

    try {
      // 快速创建多个编辑器
      for (let i = 0; i < 8; i++) {
        addEditor();
        await new Promise((resolve) => setTimeout(resolve, 50)); // 更快的创建速度
      }

      // 等待一段时间让编辑器完全初始化
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 快速销毁编辑器
      const currentEditors = [...editors];
      for (const editor of currentEditors) {
        removeEditor(editor.id);
        await new Promise((resolve) => setTimeout(resolve, 20)); // 更快的销毁速度
      }

      addTestResult("✅ 压力测试完成，无错误");
    } catch (error) {
      addTestResult(`❌ 压力测试失败: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  // 极限压力测试
  const runExtremeStressTest = async () => {
    setIsRunning(true);
    addTestResult("🔥 开始极限压力测试");

    try {
      // 连续快速创建和销毁
      for (let round = 0; round < 3; round++) {
        addTestResult(`🔄 第 ${round + 1} 轮测试`);

        // 快速创建
        for (let i = 0; i < 5; i++) {
          addEditor();
          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        // 短暂等待
        await new Promise((resolve) => setTimeout(resolve, 200));

        // 快速销毁
        clearAllEditors();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      addTestResult("✅ 极限压力测试完成，无错误");
    } catch (error) {
      addTestResult(`❌ 极限压力测试失败: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  // 监听控制台错误
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(" ");
      if (message.includes("tiptap error") || message.includes("view['dom']")) {
        addTestResult(`🚨 检测到TipTap错误: ${message}`);
      }
      originalError(...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={2}>🧪 TipTap 编辑器视图安全性测试</Title>

      <Alert
        message="测试说明"
        description="此测试用于验证 TipTap 编辑器在快速创建/销毁时是否会出现 view.dom 访问错误。修复后应该不会再出现相关错误。"
        type="info"
        style={{ marginBottom: "24px" }}
      />

      <Space direction="vertical" style={{ width: "100%" }}>
        {/* 控制按钮 */}
        <Card title="测试控制">
          <Space wrap>
            <Button type="primary" onClick={addEditor}>
              创建编辑器
            </Button>
            <Button onClick={clearAllEditors}>清除所有编辑器</Button>
            <Button type="dashed" onClick={runStressTest} loading={isRunning}>
              运行压力测试
            </Button>
            <Button
              type="dashed"
              danger
              onClick={runExtremeStressTest}
              loading={isRunning}
            >
              极限压力测试
            </Button>
            <Button onClick={() => setTestResults([])}>清除日志</Button>
          </Space>
          <div style={{ marginTop: "12px" }}>
            <Text type="secondary">当前编辑器数量: {editors.length}</Text>
          </div>
        </Card>

        {/* 测试结果日志 */}
        <Card title="测试日志" style={{ maxHeight: "300px", overflow: "auto" }}>
          {testResults.length === 0 ? (
            <Text type="secondary">暂无测试日志</Text>
          ) : (
            <div>
              {testResults.map((result, index) => (
                <div key={index} style={{ marginBottom: "4px" }}>
                  <Text code style={{ fontSize: "12px" }}>
                    {result}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 编辑器实例 */}
        <Card title="编辑器实例">
          {editors.length === 0 ? (
            <Text type="secondary">暂无编辑器实例</Text>
          ) : (
            <Space direction="vertical" style={{ width: "100%" }}>
              {editors.map((editor) => (
                <Card
                  key={editor.id}
                  size="small"
                  title={`编辑器: ${editor.id}`}
                  extra={
                    <Button
                      size="small"
                      danger
                      onClick={() => removeEditor(editor.id)}
                    >
                      删除
                    </Button>
                  }
                  style={{ width: "100%" }}
                >
                  <div
                    style={{
                      height: "150px",
                      border: "1px solid #d9d9d9",
                      borderRadius: "4px",
                    }}
                  >
                    <WysiwygEditor
                      content={editor.content}
                      onChange={(content) => {
                        setEditors((prev) =>
                          prev.map((e) =>
                            e.id === editor.id ? { ...e, content } : e
                          )
                        );
                      }}
                      placeholder="开始编辑..."
                      onEditorReady={(editorInstance) => {
                        addTestResult(`📝 编辑器 ${editor.id} 初始化完成`);
                      }}
                    />
                  </div>
                </Card>
              ))}
            </Space>
          )}
        </Card>
      </Space>
    </div>
  );
};

export default EditorViewTest;
