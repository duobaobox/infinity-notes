import { Badge } from "antd";
import React, { useEffect } from "react";
import { usePerformanceOptimization } from "../hooks/usePerformanceOptimization";
import { useStickyNotesStore } from "../stores/stickyNotesStore";

/**
 * 智能虚拟化状态监控组件
 * 实时显示虚拟化状态和性能信息，用于开发环境下的性能监控
 */
const VirtualizationStatusMonitor: React.FC = () => {
  const { notes } = useStickyNotesStore();

  // 性能优化配置
  const {
    virtualizationThreshold,
    performanceScore,
    isDetecting,
    getVirtualizationAdvice,
    getPerformanceLevelInfo,
  } = usePerformanceOptimization();

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
    }
  }, [
    notes.length,
    virtualizationThreshold,
    getVirtualizationAdvice,
    getPerformanceLevelInfo,
  ]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        background: "white",
        padding: "12px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        zIndex: 1000,
        minWidth: "180px",
        maxWidth: "220px",
      }}
      data-dev-tool="true"
    >
      <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#666" }}>
        🎯 虚拟化状态监控
      </h4>

      {/* 虚拟化状态显示区域 */}
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
            <div style={{ fontSize: "12px" }}>{isDetecting ? "🔍" : "📊"}</div>
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
              style={{ color: "#faad14", marginTop: "3px", fontSize: "9px" }}
            >
              🔍 检测设备性能中...
            </div>
          )}
        </div>
      </div>

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

export default VirtualizationStatusMonitor;
