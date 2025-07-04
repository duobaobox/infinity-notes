/**
 * 内存监控组件
 * 用于开发环境中实时监控内存使用情况，帮助发现内存泄漏
 */

import {
  DeleteOutlined,
  ReloadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import { memoryManager } from "../utils/memoryManager";

const { Text } = Typography;

interface MemoryStats {
  cacheItems: number;
  connectionCount: number;
  performanceOperations: number;
  jsHeapSize?: number;
}

interface MemoryMonitorProps {
  visible?: boolean;
  position?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
}

/**
 * 内存监控组件
 */
const MemoryMonitor: React.FC<MemoryMonitorProps> = ({
  visible = true,
  position = "bottom-right",
}) => {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // 获取内存统计
  const fetchMemoryStats = async () => {
    try {
      setIsLoading(true);
      const newStats = await memoryManager.getMemoryStats();
      setStats(newStats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("获取内存统计失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 执行内存清理
  const performCleanup = async () => {
    await memoryManager.performMemoryCleanup();
    // 清理后重新获取统计
    setTimeout(fetchMemoryStats, 1000);
  };

  // 强制垃圾回收（仅在支持的环境中）
  const forceGC = () => {
    if (typeof window !== "undefined" && "gc" in window) {
      try {
        (window as any).gc();
        console.log("🗑️ 强制垃圾回收已执行");
        setTimeout(fetchMemoryStats, 500);
      } catch (error) {
        console.warn("强制垃圾回收失败:", error);
      }
    } else {
      console.warn("当前环境不支持强制垃圾回收");
    }
  };

  // 定期更新统计
  useEffect(() => {
    if (!visible) return;

    fetchMemoryStats();
    const interval = setInterval(fetchMemoryStats, 5000); // 每5秒更新一次

    return () => clearInterval(interval);
  }, [visible]);

  // 计算内存使用率
  const getMemoryUsagePercent = (): number => {
    if (!stats?.jsHeapSize) return 0;
    // 假设最大堆大小为100MB（实际会根据浏览器和设备而变化）
    const maxHeapSize = 100 * 1024 * 1024;
    return Math.min((stats.jsHeapSize / maxHeapSize) * 100, 100);
  };

  // 检查是否有内存警告
  const hasMemoryWarning = (): boolean => {
    if (!stats) return false;

    return (
      stats.cacheItems > 500 ||
      stats.connectionCount > 100 ||
      stats.performanceOperations > 5000 ||
      getMemoryUsagePercent() > 80
    );
  };

  // 获取位置样式
  const getPositionStyle = () => {
    const baseStyle: React.CSSProperties = {
      position: "fixed",
      zIndex: 9999,
      width: "320px",
      maxHeight: "400px",
      overflow: "auto",
    };

    switch (position) {
      case "bottom-left":
        return { ...baseStyle, bottom: "20px", left: "20px" };
      case "bottom-right":
        return { ...baseStyle, bottom: "20px", right: "20px" };
      case "top-left":
        return { ...baseStyle, top: "20px", left: "20px" };
      case "top-right":
        return { ...baseStyle, top: "20px", right: "20px" };
      default:
        return { ...baseStyle, bottom: "20px", right: "20px" };
    }
  };

  if (!visible || process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <Card
      style={getPositionStyle()}
      title={
        <Space>
          <span>🧠 内存监控</span>
          {hasMemoryWarning() && (
            <WarningOutlined style={{ color: "#ff4d4f" }} />
          )}
        </Space>
      }
      size="small"
      extra={
        <Space>
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            loading={isLoading}
            onClick={fetchMemoryStats}
          />
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={performCleanup}
          />
        </Space>
      }
    >
      {stats ? (
        <Space direction="vertical" style={{ width: "100%" }}>
          {/* JS堆内存使用 */}
          {stats.jsHeapSize && (
            <div>
              <Text strong>JS堆内存</Text>
              <Progress
                percent={getMemoryUsagePercent()}
                size="small"
                status={getMemoryUsagePercent() > 80 ? "exception" : "normal"}
                format={() =>
                  `${(stats.jsHeapSize! / 1024 / 1024).toFixed(1)}MB`
                }
              />
            </div>
          )}

          {/* 统计信息 */}
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Statistic
                title="缓存项"
                value={stats.cacheItems}
                valueStyle={{ fontSize: "14px" }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="连接线"
                value={stats.connectionCount}
                valueStyle={{ fontSize: "14px" }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="性能操作"
                value={stats.performanceOperations}
                valueStyle={{ fontSize: "14px" }}
              />
            </Col>
          </Row>

          {/* 操作按钮 */}
          <Space>
            <Button size="small" onClick={performCleanup}>
              清理内存
            </Button>
            <Button size="small" onClick={forceGC}>
              强制GC
            </Button>
          </Space>

          {/* 最后更新时间 */}
          {lastUpdate && (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              更新: {lastUpdate.toLocaleTimeString()}
            </Text>
          )}
        </Space>
      ) : (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Text type="secondary">加载中...</Text>
        </div>
      )}
    </Card>
  );
};

export default MemoryMonitor;
