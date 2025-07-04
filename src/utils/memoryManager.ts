/**
 * 全局内存管理器
 * 统一管理应用中的内存清理工作，防止内存泄漏
 */

import { CacheManager } from "../database/CacheManager";
import { PerformanceMonitor } from "../database/PerformanceMonitor";
import { connectionLineManager } from "./connectionLineManager";

/**
 * 内存管理器类
 * 负责协调各个模块的内存清理工作
 */
class MemoryManager {
  private static instance: MemoryManager;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor() {
    // 私有构造函数，确保单例模式
  }

  /**
   * 获取内存管理器单例
   */
  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * 初始化内存管理器
   */
  public initialize(): void {
    if (this.isInitialized) return;

    console.log("🧠 初始化内存管理器...");

    // 启动定期内存清理
    this.startPeriodicCleanup();

    // 监听页面卸载事件，确保清理
    this.setupPageUnloadHandler();

    // 监听内存压力事件（如果浏览器支持）
    this.setupMemoryPressureHandler();

    this.isInitialized = true;
    console.log("🧠 内存管理器初始化完成");
  }

  /**
   * 启动定期内存清理
   */
  private startPeriodicCleanup(): void {
    // 每5分钟执行一次内存清理
    this.cleanupInterval = setInterval(async () => {
      await this.performMemoryCleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * 执行内存清理
   */
  public async performMemoryCleanup(): Promise<void> {
    console.log("🧹 开始执行内存清理...");

    try {
      // 清理缓存管理器中的过期数据
      // 缓存管理器有自己的定期清理，这里只是触发一次额外的清理

      // 清理性能监控器中的旧数据
      const performanceMonitor = PerformanceMonitor.getInstance();
      const report = performanceMonitor.getPerformanceReport();

      // 如果性能数据过多，清理一些旧数据
      if (report.summary.totalOperations > 10000) {
        console.log("🧹 性能监控数据过多，建议重置");
        // 可以选择性地重置一些数据
      }

      // 连接线池功能已移除，跳过相关清理

      // 强制垃圾回收（如果可用）
      this.forceGarbageCollection();

      console.log("✅ 内存清理完成");
    } catch (error) {
      console.error("❌ 内存清理失败:", error);
    }
  }

  /**
   * 强制垃圾回收（仅在开发环境或支持的浏览器中）
   */
  private forceGarbageCollection(): void {
    // 检查是否有垃圾回收API可用
    if (typeof window !== "undefined" && "gc" in window) {
      try {
        (window as any).gc();
        console.log("🗑️ 强制垃圾回收已执行");
      } catch (error) {
        console.warn("⚠️ 强制垃圾回收失败:", error);
      }
    }
  }

  /**
   * 设置页面卸载处理器
   */
  private setupPageUnloadHandler(): void {
    const handlePageUnload = async () => {
      console.log("📄 页面卸载，执行最终清理...");
      await this.destroy();
    };

    // 监听页面卸载事件
    window.addEventListener("beforeunload", handlePageUnload);
    window.addEventListener("unload", handlePageUnload);

    // 监听页面隐藏事件（移动端）
    document.addEventListener("visibilitychange", async () => {
      if (document.hidden) {
        await this.performMemoryCleanup();
      }
    });
  }

  /**
   * 设置内存压力处理器
   */
  private setupMemoryPressureHandler(): void {
    // 检查是否支持内存压力API
    if ("memory" in performance) {
      const checkMemoryPressure = async () => {
        const memInfo = (performance as any).memory;
        if (memInfo) {
          const usedRatio = memInfo.usedJSHeapSize / memInfo.totalJSHeapSize;

          // 如果内存使用率超过80%，执行清理
          if (usedRatio > 0.8) {
            console.log(
              `⚠️ 内存使用率过高: ${(usedRatio * 100).toFixed(1)}%，执行清理`
            );
            await this.performMemoryCleanup();
          }
        }
      };

      // 每30秒检查一次内存使用情况
      setInterval(checkMemoryPressure, 30 * 1000);
    }
  }

  /**
   * 获取内存使用统计
   */
  public async getMemoryStats(): Promise<{
    cacheItems: number;
    connectionCount: number;
    performanceOperations: number;

    jsHeapSize?: number;
  }> {
    const cacheManager = CacheManager.getInstance();
    const performanceMonitor = PerformanceMonitor.getInstance();
    const report = performanceMonitor.getPerformanceReport();

    const stats: any = {
      cacheItems: cacheManager.getStats().totalKeys,
      connectionCount: connectionLineManager.getConnectionCount(),
      performanceOperations: report.summary.totalOperations,
    };

    // 连接线池功能已移除

    // 添加JS堆内存信息（如果可用）
    if ("memory" in performance) {
      const memInfo = (performance as any).memory;
      if (memInfo) {
        stats.jsHeapSize = memInfo.usedJSHeapSize;
      }
    }

    return stats;
  }

  /**
   * 销毁内存管理器
   */
  public async destroy(): Promise<void> {
    console.log("🧠 开始销毁内存管理器...");

    // 停止定期清理
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // 销毁各个模块
    try {
      // 销毁连接线管理器
      connectionLineManager.destroy();

      // 连接线池功能已移除

      // 销毁缓存管理器
      const cacheManager = CacheManager.getInstance();
      cacheManager.destroy();

      // 清理性能监控器
      const performanceMonitor = PerformanceMonitor.getInstance();
      performanceMonitor.clearMetrics();
    } catch (error) {
      console.error("❌ 销毁模块时出错:", error);
    }

    this.isInitialized = false;
    console.log("🧠 内存管理器已完全销毁");
  }

  /**
   * 检查是否已初始化
   */
  public isReady(): boolean {
    return this.isInitialized;
  }
}

// 创建全局内存管理器实例
export const memoryManager = MemoryManager.getInstance();

// 导出类型
export { MemoryManager };
