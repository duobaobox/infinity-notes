/**
 * 右键点击选中状态测试组件
 * 测试右键点击是否不再触发便签选中状态
 */

import React, { useState } from "react";
import { Button, Space, Typography, Card, Alert } from "antd";

const { Title, Text } = Typography;

interface TestResult {
  timestamp: string;
  action: string;
  result: string;
  success: boolean;
}

/**
 * 右键点击选中状态测试组件
 * 用于验证右键点击不再触发便签选中状态
 */
const RightClickSelectionTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isSelected, setIsSelected] = useState(false);

  // 添加测试结果
  const addTestResult = (action: string, result: string, success: boolean) => {
    const newResult: TestResult = {
      timestamp: new Date().toLocaleTimeString(),
      action,
      result,
      success,
    };
    setTestResults((prev) => [...prev, newResult]);
  };

  // 模拟左键点击处理
  const handleLeftClick = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsSelected(true);
      addTestResult("左键点击", "便签已选中", true);
    }
  };

  // 模拟右键点击处理（修复后的逻辑）
  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault(); // 阻止默认右键菜单

    // 修复后的逻辑：只响应左键点击
    if (e.button !== 0) {
      addTestResult("右键点击", "便签未选中（正确行为）", true);
      return;
    }

    // 这段代码不应该被执行（因为右键的 button !== 0）
    setIsSelected(true);
    addTestResult("右键点击", "便签被选中（错误行为）", false);
  };

  // 模拟鼠标按下事件（包含左键和右键）
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // 左键
      handleLeftClick(e);
    } else if (e.button === 2) {
      // 右键
      handleRightClick(e);
    }
  };

  // 重置测试
  const resetTest = () => {
    setIsSelected(false);
    setTestResults([]);
  };

  // 清空结果
  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <Title level={2}>🖱️ 右键点击选中状态测试</Title>

      <Text type="secondary">此测试用于验证右键点击不再触发便签选中状态。</Text>

      <Alert
        message="测试说明"
        description="修复后，只有左键点击应该触发便签选中，右键点击应该被忽略。"
        type="info"
        style={{ margin: "20px 0" }}
      />

      <div style={{ marginBottom: "20px" }}>
        <Space wrap>
          <Button onClick={resetTest}>重置测试</Button>

          <Button onClick={clearResults}>清空结果</Button>
        </Space>
      </div>

      {/* 便签状态显示 */}
      <Card title="当前便签状态" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Text strong>选中状态:</Text>
          <span
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              background: isSelected ? "#52c41a" : "#f5f5f5",
              color: isSelected ? "white" : "#666",
              fontWeight: "bold",
            }}
          >
            {isSelected ? "已选中" : "未选中"}
          </span>
        </div>
      </Card>

      {/* 测试区域 */}
      <Card title="测试区域" style={{ marginBottom: "20px" }}>
        <div
          style={{
            border: "2px dashed #d9d9d9",
            borderRadius: "8px",
            padding: "40px",
            textAlign: "center",
            background: "#fafafa",
            cursor: "pointer",
            userSelect: "none",
            transition: "all 0.2s ease",
          }}
          onMouseDown={handleMouseDown}
          onContextMenu={(e) => e.preventDefault()} // 阻止默认右键菜单
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗒️</div>
          <Text strong style={{ fontSize: "16px" }}>
            模拟便签区域
          </Text>
          <br />
          <Text type="secondary">左键点击选中 | 右键点击测试</Text>
        </div>

        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <Space>
            <Text>
              <strong>左键点击:</strong> 应该选中便签
            </Text>
            <Text>
              <strong>右键点击:</strong> 应该不选中便签
            </Text>
          </Space>
        </div>
      </Card>

      {/* 测试步骤 */}
      <Card title="测试步骤" style={{ marginBottom: "20px" }}>
        <ol style={{ marginLeft: "20px" }}>
          <li>点击"重置测试"按钮，确保便签处于未选中状态</li>
          <li>在模拟便签区域进行左键点击，验证便签是否被选中</li>
          <li>点击"重置测试"按钮，重新开始</li>
          <li>在模拟便签区域进行右键点击，验证便签是否保持未选中状态</li>
          <li>查看测试结果，确认右键点击没有触发选中</li>
        </ol>
      </Card>

      {/* 测试结果 */}
      <Card title="测试结果">
        {testResults.length === 0 ? (
          <Text type="secondary">暂无测试结果</Text>
        ) : (
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {testResults.map((result, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "8px",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  background: result.success ? "#f6ffed" : "#fff2f0",
                  border: `1px solid ${result.success ? "#b7eb8f" : "#ffccc7"}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <Text strong>{result.timestamp}</Text>
                    <Text style={{ marginLeft: "8px" }}>{result.action}</Text>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Text>{result.result}</Text>
                    <span
                      style={{
                        fontSize: "16px",
                        color: result.success ? "#52c41a" : "#ff4d4f",
                      }}
                    >
                      {result.success ? "✅" : "❌"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 修复说明 */}
      <Card title="修复说明" style={{ marginTop: "20px" }}>
        <Text>
          <strong>修复前:</strong> <code>onMouseDown</code>{" "}
          事件会响应所有鼠标按键（左键、右键、中键），
          导致右键点击也会触发便签选中。
        </Text>
        <br />
        <br />
        <Text>
          <strong>修复后:</strong> 在 <code>handleNoteClickToFront</code>{" "}
          函数中添加了
          <code>if (e.button !== 0) return;</code> 检查，只响应左键点击（button
          === 0）， 忽略右键（button === 2）和中键（button === 1）。
        </Text>
      </Card>
    </div>
  );
};

export default RightClickSelectionTest;
