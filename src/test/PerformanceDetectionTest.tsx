import React, { useEffect, useState } from "react";
import { Button, Card, Space, Progress, Descriptions, Tag } from "antd";
import { performanceDetector, type PerformanceProfile, DevicePerformanceLevel } from "../utils/performanceDetector";

/**
 * 性能检测测试组件
 * 用于测试和展示设备性能检测功能
 */
const PerformanceDetectionTest: React.FC = () => {
  const [profile, setProfile] = useState<PerformanceProfile | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  // 运行性能检测
  const runDetection = async () => {
    setIsDetecting(true);
    setTestResults([]);
    
    try {
      console.log("🔍 开始性能检测测试...");
      setTestResults(prev => [...prev, "🔍 开始性能检测..."]);
      
      const result = await performanceDetector.detectPerformance();
      setProfile(result);
      
      setTestResults(prev => [...prev, `✅ 检测完成: ${result.level} (${result.score.toFixed(1)}分)`]);
      setTestResults(prev => [...prev, `📊 虚拟化阈值: ${result.virtualizationThreshold}`]);
      setTestResults(prev => [...prev, `🎯 渲染批次: ${result.renderBatchSize}`]);
      setTestResults(prev => [...prev, `⏱️ 节流时间: ${result.updateThrottleMs}ms`]);
      
    } catch (error) {
      console.error("❌ 性能检测失败:", error);
      setTestResults(prev => [...prev, `❌ 检测失败: ${error}`]);
    } finally {
      setIsDetecting(false);
    }
  };

  // 强制重新检测
  const forceRedetect = async () => {
    setIsDetecting(true);
    setTestResults([]);
    
    try {
      setTestResults(prev => [...prev, "🔄 强制重新检测..."]);
      const result = await performanceDetector.forceRedetect();
      setProfile(result);
      setTestResults(prev => [...prev, `✅ 重新检测完成: ${result.level}`]);
    } catch (error) {
      setTestResults(prev => [...prev, `❌ 重新检测失败: ${error}`]);
    } finally {
      setIsDetecting(false);
    }
  };

  // 加载缓存的配置
  const loadCached = () => {
    const cached = performanceDetector.loadProfileFromStorage();
    if (cached) {
      setProfile(cached);
      setTestResults(prev => [...prev, "📋 已加载缓存的性能配置"]);
    } else {
      setTestResults(prev => [...prev, "❌ 没有找到缓存的配置"]);
    }
  };

  // 获取性能等级的颜色
  const getLevelColor = (level: DevicePerformanceLevel) => {
    switch (level) {
      case DevicePerformanceLevel.HIGH:
        return "green";
      case DevicePerformanceLevel.MEDIUM:
        return "orange";
      case DevicePerformanceLevel.LOW:
        return "red";
      default:
        return "default";
    }
  };

  // 获取性能等级的图标
  const getLevelIcon = (level: DevicePerformanceLevel) => {
    switch (level) {
      case DevicePerformanceLevel.HIGH:
        return "🚀";
      case DevicePerformanceLevel.MEDIUM:
        return "⚡";
      case DevicePerformanceLevel.LOW:
        return "🐌";
      default:
        return "❓";
    }
  };

  // 组件挂载时尝试加载缓存
  useEffect(() => {
    loadCached();
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <Card title="设备性能检测测试" style={{ marginBottom: "20px" }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Space>
            <Button 
              type="primary" 
              onClick={runDetection} 
              loading={isDetecting}
            >
              运行性能检测
            </Button>
            <Button 
              onClick={forceRedetect} 
              loading={isDetecting}
            >
              强制重新检测
            </Button>
            <Button onClick={loadCached}>
              加载缓存配置
            </Button>
          </Space>

          {/* 测试结果日志 */}
          {testResults.length > 0 && (
            <Card size="small" title="检测日志">
              <div style={{ fontFamily: "monospace", fontSize: "12px" }}>
                {testResults.map((result, index) => (
                  <div key={index}>{result}</div>
                ))}
              </div>
            </Card>
          )}
        </Space>
      </Card>

      {/* 性能配置详情 */}
      {profile && (
        <Card title="性能配置详情">
          <Space direction="vertical" style={{ width: "100%" }}>
            {/* 基本信息 */}
            <div>
              <Tag color={getLevelColor(profile.level)} style={{ fontSize: "14px" }}>
                {getLevelIcon(profile.level)} {profile.level.toUpperCase()}
              </Tag>
              <span style={{ marginLeft: "10px" }}>
                性能评分: <strong>{profile.score.toFixed(1)}/100</strong>
              </span>
            </div>

            <Progress 
              percent={profile.score} 
              strokeColor={
                profile.score >= 75 ? "#52c41a" : 
                profile.score >= 50 ? "#faad14" : "#ff4d4f"
              }
            />

            {/* 虚拟化配置 */}
            <Descriptions title="虚拟化配置" bordered size="small">
              <Descriptions.Item label="虚拟化阈值">
                {profile.virtualizationThreshold} 个便签
              </Descriptions.Item>
              <Descriptions.Item label="渲染批次大小">
                {profile.renderBatchSize}
              </Descriptions.Item>
              <Descriptions.Item label="更新节流时间">
                {profile.updateThrottleMs}ms
              </Descriptions.Item>
            </Descriptions>

            {/* 硬件信息 */}
            <Descriptions title="硬件信息" bordered size="small">
              <Descriptions.Item label="CPU核心数">
                {profile.details.cpuCores}
              </Descriptions.Item>
              <Descriptions.Item label="内存大小">
                {profile.details.memory}GB
              </Descriptions.Item>
              <Descriptions.Item label="屏幕分辨率">
                {profile.details.screenResolution}
              </Descriptions.Item>
              <Descriptions.Item label="设备像素比">
                {profile.details.devicePixelRatio}
              </Descriptions.Item>
              <Descriptions.Item label="GPU信息" span={2}>
                {profile.details.gpu}
              </Descriptions.Item>
              <Descriptions.Item label="并发能力">
                {profile.details.hardwareConcurrency}
              </Descriptions.Item>
            </Descriptions>

            {/* 用户代理 */}
            <Descriptions title="系统信息" bordered size="small">
              <Descriptions.Item label="用户代理" span={3}>
                <div style={{ 
                  wordBreak: "break-all", 
                  fontSize: "11px",
                  fontFamily: "monospace" 
                }}>
                  {profile.details.userAgent}
                </div>
              </Descriptions.Item>
            </Descriptions>
          </Space>
        </Card>
      )}
    </div>
  );
};

export default PerformanceDetectionTest;
