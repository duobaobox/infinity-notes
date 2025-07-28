/**
 * 便签拖拽功能测试组件
 * 测试编辑状态下头部区域的拖拽功能
 */

import React, { useState } from "react";
import { Button, Space, Typography, Card } from "antd";
import { EditOutlined, DragOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface TestNote {
  id: string;
  title: string;
  content: string;
  isEditing: boolean;
  isTitleEditing: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 便签拖拽测试组件
 * 用于验证编辑状态下头部区域的拖拽功能是否正常工作
 */
const StickyNoteDragTest: React.FC = () => {
  const [testNote, setTestNote] = useState<TestNote>({
    id: "test-note-1",
    title: "测试便签",
    content: "这是一个用于测试拖拽功能的便签",
    isEditing: false,
    isTitleEditing: false,
    x: 100,
    y: 100,
    width: 300,
    height: 200,
  });

  const [testResults, setTestResults] = useState<string[]>([]);

  // 添加测试结果
  const addTestResult = (result: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // 切换编辑状态
  const toggleEditMode = () => {
    setTestNote((prev) => ({
      ...prev,
      isEditing: !prev.isEditing,
    }));
    addTestResult(`切换编辑状态: ${!testNote.isEditing ? "开启" : "关闭"}`);
  };

  // 切换标题编辑状态
  const toggleTitleEditMode = () => {
    setTestNote((prev) => ({
      ...prev,
      isTitleEditing: !prev.isTitleEditing,
    }));
    addTestResult(`切换标题编辑状态: ${!testNote.isTitleEditing ? "开启" : "关闭"}`);
  };

  // 模拟拖拽测试
  const simulateDragTest = () => {
    const originalX = testNote.x;
    const originalY = testNote.y;
    
    // 模拟拖拽到新位置
    const newX = originalX + 50;
    const newY = originalY + 30;
    
    setTestNote((prev) => ({
      ...prev,
      x: newX,
      y: newY,
    }));
    
    addTestResult(
      `模拟拖拽: 从 (${originalX}, ${originalY}) 移动到 (${newX}, ${newY})`
    );
  };

  // 重置位置
  const resetPosition = () => {
    setTestNote((prev) => ({
      ...prev,
      x: 100,
      y: 100,
    }));
    addTestResult("重置便签位置到 (100, 100)");
  };

  // 清空测试结果
  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <Title level={2}>
        <DragOutlined /> 便签拖拽功能测试
      </Title>
      
      <Text type="secondary">
        此测试用于验证便签在编辑状态下头部区域的拖拽功能是否正常工作。
      </Text>

      <div style={{ marginTop: "20px", marginBottom: "20px" }}>
        <Space wrap>
          <Button 
            icon={<EditOutlined />} 
            onClick={toggleEditMode}
            type={testNote.isEditing ? "primary" : "default"}
          >
            {testNote.isEditing ? "退出编辑" : "进入编辑"}
          </Button>
          
          <Button 
            onClick={toggleTitleEditMode}
            type={testNote.isTitleEditing ? "primary" : "default"}
          >
            {testNote.isTitleEditing ? "退出标题编辑" : "编辑标题"}
          </Button>
          
          <Button onClick={simulateDragTest}>
            模拟拖拽
          </Button>
          
          <Button onClick={resetPosition}>
            重置位置
          </Button>
          
          <Button onClick={clearResults}>
            清空结果
          </Button>
        </Space>
      </div>

      {/* 便签状态显示 */}
      <Card title="当前便签状态" style={{ marginBottom: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <Text strong>编辑状态:</Text> {testNote.isEditing ? "是" : "否"}
          </div>
          <div>
            <Text strong>标题编辑:</Text> {testNote.isTitleEditing ? "是" : "否"}
          </div>
          <div>
            <Text strong>位置:</Text> ({testNote.x}, {testNote.y})
          </div>
          <div>
            <Text strong>尺寸:</Text> {testNote.width} × {testNote.height}
          </div>
        </div>
      </Card>

      {/* 测试说明 */}
      <Card title="测试说明" style={{ marginBottom: "20px" }}>
        <div>
          <Text>
            <strong>测试步骤:</strong>
          </Text>
          <ol style={{ marginTop: "10px" }}>
            <li>点击"进入编辑"按钮，使便签进入编辑状态</li>
            <li>尝试在便签头部区域（标题区域）进行拖拽</li>
            <li>验证便签是否可以正常拖拽移动</li>
            <li>测试标题编辑状态下的拖拽功能</li>
          </ol>
          
          <Text style={{ marginTop: "10px", display: "block" }}>
            <strong>预期结果:</strong> 即使在编辑状态下，便签头部区域也应该可以正常拖拽移动。
          </Text>
        </div>
      </Card>

      {/* 测试结果 */}
      <Card title="测试结果">
        {testResults.length === 0 ? (
          <Text type="secondary">暂无测试结果</Text>
        ) : (
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {testResults.map((result, index) => (
              <div key={index} style={{ marginBottom: "5px" }}>
                <Text code>{result}</Text>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 实际便签预览 */}
      <Card title="便签预览" style={{ marginTop: "20px" }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "300px",
            border: "1px dashed #d9d9d9",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: `${testNote.x}px`,
              top: `${testNote.y}px`,
              width: `${testNote.width}px`,
              height: `${testNote.height}px`,
              background: "#fff",
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "all 0.2s ease",
            }}
          >
            {/* 便签头部 */}
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #f0f0f0",
                background: testNote.isEditing || testNote.isTitleEditing ? "#f6f8fa" : "#fff",
                borderRadius: "6px 6px 0 0",
                cursor: "move",
                userSelect: "none",
              }}
            >
              <Text strong>{testNote.title}</Text>
              {(testNote.isEditing || testNote.isTitleEditing) && (
                <Text type="secondary" style={{ marginLeft: "8px", fontSize: "12px" }}>
                  (编辑中)
                </Text>
              )}
            </div>
            
            {/* 便签内容 */}
            <div style={{ padding: "12px" }}>
              <Text>{testNote.content}</Text>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StickyNoteDragTest;
