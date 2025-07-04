import React, { useEffect, useState } from "react";
import { Button, Card, Space, Typography, Statistic, Row, Col } from "antd";
import { connectionLineManager } from "../utils/connectionLineManager";
import { useStickyNotesStore } from "../stores/stickyNotesStore";
import { useConnectionStore } from "../stores/connectionStore";

const { Title, Text } = Typography;

/**
 * 连接线性能测试组件
 * 用于测试和验证连接线性能监控功能
 */
const ConnectionPerformanceTest: React.FC = () => {
  const { notes, addNote } = useStickyNotesStore();
  const { connectedNotes, addConnection } = useConnectionStore();
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  // 更新性能数据
  const updatePerformanceData = () => {
    const metrics = connectionLineManager.getPerformanceMetrics();
    const connectionCount = connectionLineManager.getConnectionCount();
    
    setPerformanceData({
      ...metrics,
      totalConnections: connectionCount,
    });
  };

  // 定期更新性能数据
  useEffect(() => {
    const interval = setInterval(updatePerformanceData, 500);
    return () => clearInterval(interval);
  }, []);

  // 创建测试便签
  const createTestNotes = async () => {
    setIsRunningTest(true);
    
    try {
      // 创建5个测试便签
      for (let i = 0; i < 5; i++) {
        const note = {
          id: `test-note-${i}-${Date.now()}`,
          title: `测试便签 ${i + 1}`,
          content: `这是第 ${i + 1} 个测试便签，用于测试连接线性能监控功能。\n\n创建时间: ${new Date().toLocaleString()}`,
          x: 100 + i * 200,
          y: 100 + (i % 2) * 150,
          width: 180,
          height: 120,
          zIndex: 1000 + i,
          color: ["#fff2e8", "#f6ffed", "#e6f7ff", "#f9f0ff", "#fff1f0"][i],
          isSelected: false,
          isEditing: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        addNote(note);
        
        // 添加小延迟以便观察创建过程
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log("✅ 测试便签创建完成");
    } catch (error) {
      console.error("❌ 创建测试便签失败:", error);
    } finally {
      setIsRunningTest(false);
    }
  };

  // 创建测试连接线
  const createTestConnections = async () => {
    setIsRunningTest(true);
    
    try {
      // 为前3个便签创建连接
      const testNotes = notes.filter(note => note.id.startsWith('test-note-'));
      
      for (let i = 0; i < Math.min(3, testNotes.length); i++) {
        const note = testNotes[i];
        await connectionLineManager.createConnection(note, i);
        
        // 添加小延迟以便观察创建过程
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log("✅ 测试连接线创建完成");
    } catch (error) {
      console.error("❌ 创建测试连接线失败:", error);
    } finally {
      setIsRunningTest(false);
    }
  };

  // 性能压力测试
  const runPerformanceStressTest = async () => {
    setIsRunningTest(true);
    
    try {
      console.log("🚀 开始连接线性能压力测试");
      
      // 重置性能统计
      connectionLineManager.resetPerformanceMetrics();
      
      // 连续更新连接线位置100次
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        connectionLineManager.updateConnectionLinesImmediate();
        
        // 每10次更新后短暂暂停
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      console.log(`📊 压力测试完成: 100次更新耗时 ${totalTime.toFixed(2)}ms`);
      console.log(`⚡ 平均每次更新: ${(totalTime / 100).toFixed(2)}ms`);
      
      // 更新性能数据
      updatePerformanceData();
      
    } catch (error) {
      console.error("❌ 性能压力测试失败:", error);
    } finally {
      setIsRunningTest(false);
    }
  };

  // 清理测试数据
  const cleanupTestData = () => {
    // 清理所有连接线
    connectionLineManager.clearAllConnections();
    
    // 重置性能统计
    connectionLineManager.resetPerformanceMetrics();
    
    console.log("🧹 测试数据已清理");
    updatePerformanceData();
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px" }}>
      <Title level={3}>🔗 连接线性能测试工具</Title>
      <Text type="secondary">
        用于测试和验证连接线性能监控功能的开发工具
      </Text>

      {/* 操作按钮 */}
      <Card title="测试操作" style={{ marginTop: "16px" }}>
        <Space wrap>
          <Button 
            type="primary" 
            onClick={createTestNotes}
            loading={isRunningTest}
          >
            📝 创建测试便签
          </Button>
          <Button 
            onClick={createTestConnections}
            loading={isRunningTest}
          >
            🔗 创建测试连接
          </Button>
          <Button 
            onClick={runPerformanceStressTest}
            loading={isRunningTest}
          >
            🚀 性能压力测试
          </Button>
          <Button 
            danger 
            onClick={cleanupTestData}
          >
            🧹 清理测试数据
          </Button>
        </Space>
      </Card>

      {/* 性能数据显示 */}
      {performanceData && (
        <Card title="实时性能数据" style={{ marginTop: "16px" }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic 
                title="总连接数" 
                value={performanceData.totalConnections} 
                suffix="个"
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="普通连接" 
                value={performanceData.normalConnections} 
                suffix="个"
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="溯源连接" 
                value={performanceData.sourceConnections} 
                suffix="个"
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="更新次数" 
                value={performanceData.updateCount} 
                suffix="次"
              />
            </Col>
          </Row>
          
          <Row gutter={16} style={{ marginTop: "16px" }}>
            <Col span={6}>
              <Statistic 
                title="更新频率" 
                value={performanceData.updateFrequency} 
                precision={1}
                suffix="Hz"
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="平均耗时" 
                value={performanceData.averageUpdateTime} 
                precision={2}
                suffix="ms"
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="最大耗时" 
                value={performanceData.maxUpdateTime} 
                precision={2}
                suffix="ms"
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="节流命中" 
                value={performanceData.throttleHits} 
                suffix="次"
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 使用说明 */}
      <Card title="使用说明" style={{ marginTop: "16px" }}>
        <ol>
          <li>点击"创建测试便签"按钮创建5个测试便签</li>
          <li>点击"创建测试连接"按钮为前3个便签创建连接线</li>
          <li>拖拽便签观察右下角性能监控面板的数据变化</li>
          <li>点击"性能压力测试"按钮进行100次连续更新测试</li>
          <li>观察控制台输出的详细性能日志</li>
          <li>使用"清理测试数据"按钮清理所有测试数据</li>
        </ol>
        <Text type="warning">
          注意：该工具仅在开发环境下可用，用于测试和调试连接线性能。
        </Text>
      </Card>
    </div>
  );
};

export default ConnectionPerformanceTest;
