/**
 * 调试抽屉组件
 * 右侧抽屉形式的调试面板，集成所有调试功能
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Drawer,
  Button,
  Collapse,
  Badge,
  Divider,
  Space,
  Typography,
  FloatButton,
} from "antd";
import {
  BugOutlined,
  SettingOutlined,
  LineChartOutlined,
  DatabaseOutlined,
  CloseOutlined,
  HddOutlined,
  InfoCircleOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import type { CollapseProps } from "antd";
import { usePerformanceOptimization } from "../../hooks/usePerformanceOptimization";
import { useStickyNotesStore } from "../../stores/stickyNotesStore";
import { connectionLineManager } from "../../utils/connectionLineManager";

const { Text } = Typography;

// 扩展 Window 接口以支持垃圾回收
declare global {
  interface Window {
    gc?: () => void;
  }
}

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
 * 调试抽屉组件属性接口
 */
interface DebugDrawerProps {
  /** 是否在开发环境中显示 */
  visible?: boolean;
}

/**
 * 调试抽屉组件
 * 提供性能监控、连接线调试、内存监控等功能
 */
const DebugDrawer: React.FC<DebugDrawerProps> = ({
  visible = process.env.NODE_ENV === "development",
}) => {
  const { notes } = useStickyNotesStore();

  // 抽屉状态
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  // 内存监控状态
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  // 用于跟踪上次日志输出的便签数量
  const lastLoggedCount = useRef<number>(0);

  // 监听 ESC 键关闭抽屉
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && drawerOpen) {
        setDrawerOpen(false);
      }
    };

    if (drawerOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [drawerOpen]);

  // 更新连接线性能数据
  const updateConnectionPerformance = useCallback(() => {
    const stats = connectionLineManager.getPerformanceMetrics();
    setConnectionPerformance({
      totalConnections: stats.normalConnections + stats.sourceConnections, // 计算总连接数
      normalConnections: stats.normalConnections,
      sourceConnections: stats.sourceConnections,
      updateFrequency: stats.updateFrequency,
      lastUpdateTime: stats.lastUpdateTime,
      averageUpdateTime: stats.averageUpdateTime,
      maxUpdateTime: stats.maxUpdateTime,
      throttleHits: stats.throttleHits,
    });
  }, []);

  // 更新内存信息
  const updateMemoryInfo = useCallback(() => {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      setMemoryInfo({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      });
    }
  }, []);

  // 定期更新连接线性能数据和内存信息
  useEffect(() => {
    const interval = setInterval(() => {
      updateConnectionPerformance();
      updateMemoryInfo();
    }, 1000);
    return () => clearInterval(interval);
  }, [updateConnectionPerformance, updateMemoryInfo]);

  // 显示当前统计信息和性能建议
  useEffect(() => {
    if (
      process.env.NODE_ENV === "development" &&
      import.meta.env.VITE_DEBUG_PERFORMANCE === "true"
    ) {
      // 只在便签数量发生显著变化时才输出日志
      const significantChange =
        Math.abs(notes.length - (lastLoggedCount.current || 0)) >= 5;

      if (significantChange || !lastLoggedCount.current) {
        const logThrottleDelay = 5000; // 5秒节流
        const timeoutId = setTimeout(() => {
          const advice = getVirtualizationAdvice(notes.length);
          const levelInfo = getPerformanceLevelInfo();
          console.log(
            `📊 便签数量变化: ${notes.length}, 阈值: ${virtualizationThreshold}, 性能: ${levelInfo?.label}`
          );
          if (advice && advice.recommendedAction !== "性能良好") {
            console.log(`💡 性能建议: ${advice.recommendedAction}`);
          }

          // 只在有连接线时才输出连接线统计
          if (connectionPerformance.totalConnections > 0) {
            console.log(
              `🔗 连接线统计: 总数=${connectionPerformance.totalConnections}, 普通=${connectionPerformance.normalConnections}, 溯源=${connectionPerformance.sourceConnections}`
            );
          }

          lastLoggedCount.current = notes.length;
        }, logThrottleDelay);

        return () => clearTimeout(timeoutId);
      }
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

  // 获取虚拟化状态颜色
  const getVirtualizationStatusColor = () => {
    if (notes.length > virtualizationThreshold * 1.2) return "#ff4d4f"; // 红色：超出阈值较多
    if (notes.length > virtualizationThreshold) return "#faad14"; // 橙色：接近或超出阈值
    return "#52c41a"; // 绿色：正常范围
  };

  // 获取连接线性能状态颜色
  const getConnectionPerformanceColor = () => {
    if (connectionPerformance.averageUpdateTime > 16) return "#ff4d4f"; // 红色：性能差
    if (connectionPerformance.averageUpdateTime > 8) return "#faad14"; // 橙色：性能一般
    return "#52c41a"; // 绿色：性能良好
  };

  // 生成折叠面板项目
  const getCollapseItems = (): CollapseProps["items"] => [
    {
      key: "virtualization",
      label: (
        <Space>
          <LineChartOutlined />
          <span>虚拟化监控</span>
          <Badge
            color={getVirtualizationStatusColor()}
            text={`${notes.length}/${virtualizationThreshold}`}
          />
        </Space>
      ),
      children: (
        <div>
          {/* 虚拟化状态详情 */}
          <div
            style={{ fontSize: "12px", lineHeight: "1.4", marginBottom: 12 }}
          >
            <div style={{ marginBottom: 4 }}>
              <Badge
                color={getPerformanceLevelInfo()?.color || "#8c8c8c"}
                text={`${getPerformanceLevelInfo()?.icon} ${
                  getPerformanceLevelInfo()?.label || "检测中"
                }`}
              />
            </div>
            <div>便签数量: {notes.length}</div>
            <div>虚拟化阈值: {virtualizationThreshold}</div>
            <div>性能评分: {performanceScore.toFixed(1)}/100</div>

            {/* 性能建议 */}
            {(() => {
              const advice = getVirtualizationAdvice(notes.length);
              if (advice && advice.recommendedAction !== "性能良好") {
                return (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 8,
                      background: "#fff7e6",
                      borderRadius: 4,
                      border: "1px solid #ffd591",
                    }}
                  >
                    <Text style={{ fontSize: "11px", color: "#d46b08" }}>
                      💡 {advice.recommendedAction}
                    </Text>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      ),
    },
    {
      key: "connections",
      label: (
        <Space>
          <DatabaseOutlined />
          <span>连接线监控</span>
          <Badge
            color={getConnectionPerformanceColor()}
            text={connectionPerformance.totalConnections.toString()}
          />
        </Space>
      ),
      children: (
        <div>
          {/* 连接线性能详情 */}
          <div
            style={{ fontSize: "12px", lineHeight: "1.4", marginBottom: 12 }}
          >
            <div>总连接数: {connectionPerformance.totalConnections}</div>
            <div>普通连接: {connectionPerformance.normalConnections}</div>
            <div>溯源连接: {connectionPerformance.sourceConnections}</div>
            <div>
              更新频率: {connectionPerformance.updateFrequency.toFixed(1)} Hz
            </div>
            <div>
              平均更新时间: {connectionPerformance.averageUpdateTime.toFixed(2)}{" "}
              ms
            </div>
            <div>
              最大更新时间: {connectionPerformance.maxUpdateTime.toFixed(2)} ms
            </div>
            <div>节流命中: {connectionPerformance.throttleHits}</div>
          </div>

          {/* 连接线调试操作 */}
          <Space wrap size="small">
            <Button
              size="small"
              type="primary"
              onClick={forceUpdateConnections}
            >
              🔄 强制更新
            </Button>
            <Button size="small" onClick={resetPerformanceStats}>
              📊 重置统计
            </Button>
            <Button size="small" danger onClick={clearAllConnections}>
              🧹 清理连接
            </Button>
          </Space>
        </div>
      ),
    },
    {
      key: "memory",
      label: (
        <Space>
          <HddOutlined />
          <span>内存监控</span>
          {memoryInfo && (
            <Badge
              color={
                memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit > 0.8
                  ? "#ff4d4f"
                  : memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit > 0.6
                  ? "#faad14"
                  : "#52c41a"
              }
              text={`${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`}
            />
          )}
        </Space>
      ),
      children: (
        <div>
          {memoryInfo ? (
            <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
              <div>
                已用堆内存:{" "}
                {(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
              </div>
              <div>
                总堆内存:{" "}
                {(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB
              </div>
              <div>
                堆内存限制:{" "}
                {(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB
              </div>
              <div>
                使用率:{" "}
                {(
                  (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) *
                  100
                ).toFixed(1)}
                %
              </div>

              {/* 内存使用警告 */}
              {memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit > 0.8 && (
                <div
                  style={{
                    marginTop: 8,
                    padding: 8,
                    background: "#fff2f0",
                    borderRadius: 4,
                    border: "1px solid #ffccc7",
                  }}
                >
                  <Text style={{ fontSize: "11px", color: "#cf1322" }}>
                    ⚠️ 内存使用率过高，建议清理缓存
                  </Text>
                </div>
              )}
            </div>
          ) : (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              浏览器不支持内存监控 API
            </Text>
          )}
        </div>
      ),
    },
    {
      key: "system",
      label: (
        <Space>
          <InfoCircleOutlined />
          <span>系统信息</span>
        </Space>
      ),
      children: (
        <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
          <div>
            用户代理: {navigator.userAgent.split(" ").slice(-2).join(" ")}
          </div>
          <div>CPU 核心数: {navigator.hardwareConcurrency || "未知"}</div>
          <div>设备像素比: {window.devicePixelRatio}</div>
          <div>
            屏幕分辨率: {screen.width}x{screen.height}
          </div>
          <div>
            视口大小: {window.innerWidth}x{window.innerHeight}
          </div>
          <div>在线状态: {navigator.onLine ? "在线" : "离线"}</div>
          <div>语言: {navigator.language}</div>
          <div>时区: {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
        </div>
      ),
    },
    {
      key: "actions",
      label: (
        <Space>
          <ClearOutlined />
          <span>快捷操作</span>
        </Space>
      ),
      children: (
        <div>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Button
              size="small"
              block
              onClick={() => {
                if (window.gc) {
                  window.gc();
                  console.log("🧹 手动触发垃圾回收");
                } else {
                  console.log("⚠️ 垃圾回收不可用（需要 --expose-gc 标志）");
                }
              }}
            >
              🧹 触发垃圾回收
            </Button>
            <Button
              size="small"
              block
              onClick={() => {
                console.clear();
                console.log("🧽 控制台已清理");
              }}
            >
              🧽 清理控制台
            </Button>
            <Button
              size="small"
              block
              onClick={() => {
                const info = {
                  便签数量: notes.length,
                  虚拟化阈值: virtualizationThreshold,
                  性能评分: performanceScore,
                  连接线数量: connectionPerformance.totalConnections,
                  内存使用: memoryInfo
                    ? `${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(
                        1
                      )}MB`
                    : "未知",
                };
                console.table(info);
              }}
            >
              📊 导出性能报告
            </Button>
          </Space>
        </div>
      ),
    },
  ];

  // 如果不在开发环境或不可见，则不渲染
  if (!visible) {
    return null;
  }

  return (
    <>
      {/* 悬浮按钮 - 用于打开调试抽屉 */}
      <FloatButton
        icon={<BugOutlined />}
        tooltip="调试面板"
        onClick={() => setDrawerOpen(true)}
        style={{
          right: 24,
          bottom: 24,
          zIndex: 1001, // 确保在便签之上
        }}
        badge={{
          dot:
            notes.length > virtualizationThreshold ||
            connectionPerformance.totalConnections > 50,
          color: getVirtualizationStatusColor(),
        }}
      />

      {/* 调试抽屉 */}
      <Drawer
        title={
          <Space>
            <BugOutlined />
            <span>调试面板</span>
            <Badge
              color={getPerformanceLevelInfo()?.color || "#8c8c8c"}
              text={getPerformanceLevelInfo()?.label || "检测中"}
            />
            <Text type="secondary" style={{ fontSize: "11px" }}>
              (ESC 关闭)
            </Text>
          </Space>
        }
        placement="right"
        width={400}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        closable={false}
        mask={false}
        maskClosable={false}
        zIndex={998}
        bodyStyle={{ padding: "16px" }}
        headerStyle={{
          borderBottom: "1px solid #f0f0f0",
          paddingBottom: "12px",
        }}
      >
        <div style={{ height: "100%", overflow: "auto" }}>
          {/* 快捷关闭按钮 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text strong>性能概览</Text>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => setDrawerOpen(false)}
              style={{ color: "#999" }}
            />
          </div>

          {/* 性能概览内容 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginTop: 8, fontSize: "12px", lineHeight: "1.4" }}>
              <div>
                便签数量: {notes.length} / 阈值: {virtualizationThreshold}
              </div>
              <div>性能评分: {performanceScore.toFixed(1)}/100</div>
              <div>连接线数量: {connectionPerformance.totalConnections}</div>
              {memoryInfo && (
                <div>
                  内存使用:{" "}
                  {(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB (
                  {(
                    (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) *
                    100
                  ).toFixed(1)}
                  %)
                </div>
              )}
              {isDetecting && (
                <div style={{ color: "#faad14", marginTop: 4 }}>
                  🔍 检测设备性能中...
                </div>
              )}
            </div>
          </div>

          <Divider style={{ margin: "16px 0" }} />

          {/* 折叠面板 */}
          <Collapse
            activeKey={expandedPanels}
            onChange={setExpandedPanels}
            size="small"
            ghost
            items={getCollapseItems()}
          />
        </div>
      </Drawer>
    </>
  );
};

export default DebugDrawer;
