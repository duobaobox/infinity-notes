import { Badge, Button, Collapse, Divider } from "antd";
import type { CollapseProps } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { usePerformanceOptimization } from "../hooks/usePerformanceOptimization";
import { useStickyNotesStore } from "../stores/stickyNotesStore";
import { connectionLineManager } from "../utils/connectionLineManager";

/**
 * 连接线性能监控数据接口
 */
interface ConnectionPerformanceData {
  totalConnections: number;
  normalConnections: number;
  sourceConnections: number;
  updateFrequency: number;
  lastUpdateTime: number;
  averageUpdateTime: number;
  maxUpdateTime: number;
  throttleHits: number;
}

/**
 * 增强版虚拟化状态监控组件
 * 包含虚拟化状态监控和连接线性能参数监控调试工具
 */
const VirtualizationStatusMonitorEnhanced: React.FC = () => {
  const { notes } = useStickyNotesStore();

  // 性能优化配置
  const {
    virtualizationThreshold,
    performanceScore,
    isDetecting,
    getVirtualizationAdvice,
    getPerformanceLevelInfo,
  } = usePerformanceOptimization();

  // 连接线性能监控状态
  const [connectionPerformance, setConnectionPerformance] =
    useState<ConnectionPerformanceData>({
      totalConnections: 0,
      normalConnections: 0,
      sourceConnections: 0,
      updateFrequency: 0,
      lastUpdateTime: 0,
      averageUpdateTime: 0,
      maxUpdateTime: 0,
      throttleHits: 0,
    });

  // 监控面板展开状态
  const [expandedPanels, setExpandedPanels] = useState<string[]>([
    "virtualization",
  ]);

  // 更新连接线性能数据
  const updateConnectionPerformance = useCallback(() => {
    const totalConnections = connectionLineManager.getConnectionCount();
    const performanceMetrics = connectionLineManager.getPerformanceMetrics();

    setConnectionPerformance({
      totalConnections,
      normalConnections: performanceMetrics.normalConnections,
      sourceConnections: performanceMetrics.sourceConnections,
      updateFrequency: performanceMetrics.updateFrequency,
      lastUpdateTime: performanceMetrics.lastUpdateTime,
      averageUpdateTime: performanceMetrics.averageUpdateTime,
      maxUpdateTime: performanceMetrics.maxUpdateTime,
      throttleHits: performanceMetrics.throttleHits,
    });
  }, []);

  // 定期更新连接线性能数据
  useEffect(() => {
    const interval = setInterval(updateConnectionPerformance, 1000);
    return () => clearInterval(interval);
  }, [updateConnectionPerformance]);

  // 显示当前统计信息和性能建议
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const advice = getVirtualizationAdvice(notes.length);
      const levelInfo = getPerformanceLevelInfo();
      console.log(
        `📊 当前便签数量: ${notes.length}, 阈值: ${virtualizationThreshold}, 性能: ${levelInfo?.label}`
      );
      if (advice) {
        console.log(`💡 性能建议: ${advice.recommendedAction}`);
      }

      // 连接线性能日志
      console.log(
        `🔗 连接线统计: 总数=${connectionPerformance.totalConnections}, 普通=${connectionPerformance.normalConnections}, 溯源=${connectionPerformance.sourceConnections}`
      );
    }
  }, [
    notes.length,
    virtualizationThreshold,
    getVirtualizationAdvice,
    getPerformanceLevelInfo,
    connectionPerformance,
  ]);

  // 强制更新所有连接线位置
  const forceUpdateConnections = useCallback(() => {
    connectionLineManager.updateConnectionPositions();
    updateConnectionPerformance();
  }, [updateConnectionPerformance]);

  // 清理所有连接线
  const clearAllConnections = useCallback(() => {
    connectionLineManager.clearAllConnections();
    updateConnectionPerformance();
  }, [updateConnectionPerformance]);

  // 重置性能统计
  const resetPerformanceStats = useCallback(() => {
    connectionLineManager.resetPerformanceMetrics();
    updateConnectionPerformance();
  }, [updateConnectionPerformance]);

  // 定义 Collapse 的 items 配置
  const collapseItems: CollapseProps["items"] = [
    {
      key: "virtualization",
      label: "📊 虚拟化状态",
      children: (
        <div
          style={{
            padding: "8px",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            border: "1px solid #e9ecef",
          }}
        >
          {/* 状态指示器 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: isDetecting
                  ? "#faad14"
                  : notes.length > virtualizationThreshold
                  ? "#52c41a"
                  : "#8c8c8c",
                textAlign: "center",
                lineHeight: "1.2",
                padding: "2px 6px",
                backgroundColor: "white",
                borderRadius: "3px",
                border: "1px solid #d9d9d9",
                minWidth: "45px",
              }}
            >
              <div style={{ fontSize: "12px" }}>
                {isDetecting ? "🔍" : "📊"}
              </div>
              <div style={{ fontSize: "9px", marginTop: "1px" }}>
                {notes.length > virtualizationThreshold
                  ? `${Math.min(notes.length, 50)}/${notes.length}`
                  : `${notes.length}/${notes.length}`}
              </div>
            </div>

            <div
              style={{
                fontSize: "11px",
                textAlign: "right",
                flex: 1,
                marginLeft: "8px",
              }}
            >
              <div
                style={{
                  color:
                    notes.length > virtualizationThreshold
                      ? "#52c41a"
                      : "#8c8c8c",
                  fontWeight: "500",
                }}
              >
                {notes.length > virtualizationThreshold ? "已启用" : "未启用"}
              </div>
            </div>
          </div>

          {/* 详细信息 */}
          <div style={{ fontSize: "10px", lineHeight: "1.3", color: "#666" }}>
            <div style={{ marginBottom: "2px" }}>
              <Badge
                color={getPerformanceLevelInfo()?.color || "#8c8c8c"}
                text={`${getPerformanceLevelInfo()?.icon} ${
                  getPerformanceLevelInfo()?.label || "检测中"
                }`}
                style={{ fontSize: "10px" }}
              />
            </div>
            <div style={{ marginBottom: "1px" }}>
              便签: {notes.length} / 阈值: {virtualizationThreshold}
            </div>
            <div style={{ marginBottom: "1px" }}>
              性能: {performanceScore.toFixed(1)}/100
            </div>
            {isDetecting && (
              <div
                style={{
                  color: "#faad14",
                  marginTop: "3px",
                  fontSize: "9px",
                }}
              >
                🔍 检测设备性能中...
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "connections",
      label: "🔗 连接线性能",
      children: (
        <div
          style={{
            padding: "8px",
            backgroundColor: "#f0f8ff",
            borderRadius: "4px",
            border: "1px solid #d6e4ff",
          }}
        >
          {/* 连接线统计 */}
          <div style={{ fontSize: "10px", lineHeight: "1.4", color: "#666" }}>
            <div
              style={{
                marginBottom: "3px",
                fontWeight: "500",
                color: "#1677ff",
              }}
            >
              📈 连接线统计
            </div>
            <div style={{ marginBottom: "2px" }}>
              总连接数: {connectionPerformance.totalConnections}
            </div>
            <div style={{ marginBottom: "2px" }}>
              普通连接: {connectionPerformance.normalConnections}
            </div>
            <div style={{ marginBottom: "2px" }}>
              溯源连接: {connectionPerformance.sourceConnections}
            </div>

            <Divider style={{ margin: "8px 0 6px 0" }} />

            <div
              style={{
                marginBottom: "3px",
                fontWeight: "500",
                color: "#fa8c16",
              }}
            >
              ⚡ 性能指标
            </div>
            <div style={{ marginBottom: "2px" }}>
              更新频率: {connectionPerformance.updateFrequency.toFixed(1)} Hz
            </div>
            <div style={{ marginBottom: "2px" }}>
              平均更新时间: {connectionPerformance.averageUpdateTime.toFixed(2)}{" "}
              ms
            </div>
            <div style={{ marginBottom: "2px" }}>
              最大更新时间: {connectionPerformance.maxUpdateTime.toFixed(2)} ms
            </div>
            <div style={{ marginBottom: "2px" }}>
              节流命中次数: {connectionPerformance.throttleHits}
            </div>
          </div>

          {/* 调试操作按钮 */}
          <div
            style={{
              marginTop: "8px",
              display: "flex",
              gap: "4px",
              flexWrap: "wrap",
            }}
          >
            <Button
              size="small"
              type="primary"
              onClick={forceUpdateConnections}
              style={{ fontSize: "10px", height: "24px" }}
            >
              🔄 强制更新
            </Button>
            <Button
              size="small"
              onClick={resetPerformanceStats}
              style={{ fontSize: "10px", height: "24px" }}
            >
              📊 重置统计
            </Button>
            <Button
              size="small"
              danger
              onClick={clearAllConnections}
              style={{ fontSize: "10px", height: "24px" }}
            >
              🧹 清理连接
            </Button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px", // 保持在左下角
        background: "white",
        padding: "12px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        zIndex: 1000,
        minWidth: "280px",
        maxWidth: "350px",
        maxHeight: "70vh",
        overflow: "auto",
      }}
      data-dev-tool="true"
    >
      <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#666" }}>
        🎯 性能监控调试面板
      </h4>

      <Collapse
        activeKey={expandedPanels}
        onChange={setExpandedPanels}
        size="small"
        ghost
        items={collapseItems}
      />

      {/* 提示信息 */}
      <div
        style={{
          marginTop: "8px",
          fontSize: "9px",
          color: "#999",
          textAlign: "center",
        }}
      >
        💡 开发者工具可查看详细日志
      </div>
    </div>
  );
};

export default VirtualizationStatusMonitorEnhanced;
