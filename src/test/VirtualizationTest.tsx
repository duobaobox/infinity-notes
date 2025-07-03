import { Badge, Button, message, Space } from "antd";
import React, { useEffect } from "react";
import type { StickyNote } from "../components/types";
import { usePerformanceOptimization } from "../hooks/usePerformanceOptimization";
import { useCanvasStore } from "../stores/canvasStore";
import { useStickyNotesStore } from "../stores/stickyNotesStore";

/**
 * 智能虚拟化功能测试组件
 * 用于测试基于设备性能的动态虚拟化渲染优化效果
 */
const VirtualizationTest: React.FC = () => {
  const { addNote, notes, clearAllNotes } = useStickyNotesStore();
  const { resetView } = useCanvasStore();

  // 性能优化配置
  const {
    virtualizationThreshold,
    // performanceLevel,
    performanceScore,
    isDetecting,
    getVirtualizationAdvice,
    getPerformanceLevelInfo,
    forceRedetect,
  } = usePerformanceOptimization();

  // 生成测试便签的函数
  const generateTestNotes = async (count: number) => {
    try {
      message.loading(`正在生成 ${count} 个测试便签...`, 0);

      const promises = [];
      for (let i = 0; i < count; i++) {
        // 在一个较大的区域内随机分布便签
        const x = Math.random() * 3000 - 1500; // -1500 到 1500
        const y = Math.random() * 3000 - 1500; // -1500 到 1500

        const colors = ["yellow", "blue", "green", "pink", "purple", "orange"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const testNote: StickyNote = {
          id: `test-note-${i}-${Date.now()}`,
          x,
          y,
          width: 300,
          height: 200,
          content: `这是测试便签 #${
            i + 1
          }\n\n用于测试虚拟化渲染性能。\n\n坐标: (${x.toFixed(0)}, ${y.toFixed(
            0
          )})`,
          title: `测试便签 ${i + 1}`,
          color: randomColor as any,
          isNew: false,
          zIndex: i + 1,
          isEditing: false,
          isTitleEditing: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        promises.push(addNote(testNote, "manual"));
      }

      await Promise.all(promises);
      message.destroy();
      message.success(`成功生成 ${count} 个测试便签！`);
    } catch (error) {
      message.destroy();
      message.error("生成测试便签失败");
      console.error("生成测试便签失败:", error);
    }
  };

  // 清空所有便签
  const handleClearAll = async () => {
    try {
      await clearAllNotes();
      message.success("已清空所有便签");
    } catch (error) {
      message.error("清空便签失败");
      console.error("清空便签失败:", error);
    }
  };

  // 重置视图到中心
  const handleResetView = () => {
    resetView();
    message.info("视图已重置到中心");
  };

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
        top: "20px",
        right: "20px",
        background: "white",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        zIndex: 1000,
        minWidth: "200px",
      }}
      data-dev-tool="true"
    >
      <h4 style={{ margin: "0 0 12px 0", fontSize: "14px" }}>
        智能虚拟化测试工具
      </h4>

      {/* 虚拟化状态指示器 */}
      <div
        style={{
          marginBottom: "12px",
          padding: "8px",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
          border: "1px solid #d9d9d9",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: "bold" }}>
            🎯 虚拟化状态
          </span>
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
              borderRadius: "2px",
              border: "1px solid #d9d9d9",
            }}
          >
            <div>{isDetecting ? "🔍" : "📊"}</div>
            <div>
              {notes.length > virtualizationThreshold
                ? `${Math.min(notes.length, 50)}/${notes.length}`
                : `${notes.length}/${notes.length}`}
            </div>
          </div>
        </div>

        <div style={{ fontSize: "11px", lineHeight: "1.4" }}>
          <div style={{ marginBottom: "2px" }}>
            <Badge
              color={getPerformanceLevelInfo()?.color || "#8c8c8c"}
              text={`${getPerformanceLevelInfo()?.icon} ${
                getPerformanceLevelInfo()?.label || "检测中"
              }`}
            />
          </div>
          <div style={{ color: "#666", marginBottom: "2px" }}>
            便签数量: {notes.length} / 阈值: {virtualizationThreshold}
          </div>
          <div style={{ color: "#666", marginBottom: "2px" }}>
            性能评分: {performanceScore.toFixed(1)}/100
          </div>
          <div
            style={{
              color:
                notes.length > virtualizationThreshold ? "#52c41a" : "#8c8c8c",
            }}
          >
            状态:{" "}
            {notes.length > virtualizationThreshold
              ? "已启用虚拟化"
              : "未启用虚拟化"}
          </div>
          {isDetecting && (
            <div style={{ color: "#faad14", marginTop: "4px" }}>
              🔍 正在检测设备性能...
            </div>
          )}
        </div>
      </div>

      <Space direction="vertical" size="small" style={{ width: "100%" }}>
        <Button
          size="small"
          onClick={() => generateTestNotes(50)}
          style={{ width: "100%" }}
        >
          生成 50 个便签
        </Button>

        <Button
          size="small"
          onClick={() => generateTestNotes(150)}
          style={{ width: "100%" }}
        >
          生成 150 个便签 (触发虚拟化)
        </Button>

        <Button
          size="small"
          onClick={() => generateTestNotes(500)}
          style={{ width: "100%" }}
        >
          生成 500 个便签 (压力测试)
        </Button>

        <Button
          size="small"
          onClick={handleResetView}
          style={{ width: "100%" }}
        >
          重置视图
        </Button>

        <Button
          size="small"
          onClick={() => {
            forceRedetect();
            message.info("正在重新检测设备性能...");
          }}
          loading={isDetecting}
          style={{ width: "100%" }}
        >
          重新检测性能
        </Button>

        <Button
          size="small"
          danger
          onClick={handleClearAll}
          style={{ width: "100%" }}
        >
          清空所有便签
        </Button>
      </Space>

      <div style={{ marginTop: "12px", fontSize: "11px", color: "#999" }}>
        💡 提示: 打开开发者工具查看虚拟化日志
      </div>
    </div>
  );
};

export default VirtualizationTest;
