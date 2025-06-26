/**
 * 数据库性能监控工具
 * 用于监控和优化数据库操作性能
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<
    string,
    {
      count: number;
      totalTime: number;
      averageTime: number;
      maxTime: number;
      minTime: number;
      lastExecuted: Date;
    }
  > = new Map();

  private constructor() {}

  /**
   * 获取性能监控器单例
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 监控异步操作性能
   */
  async monitor<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric(operationName, duration);

      // 如果操作时间超过阈值，记录警告
      if (duration > 1000) {
        // 1秒
        console.warn(
          `🐌 慢查询警告: ${operationName} 耗时 ${duration.toFixed(2)}ms`
        );
      }

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.error(
        `❌ 操作失败: ${operationName} 耗时 ${duration.toFixed(2)}ms`,
        error
      );
      throw error;
    }
  }

  /**
   * 记录性能指标
   */
  private recordMetric(operationName: string, duration: number): void {
    const existing = this.metrics.get(operationName);

    if (existing) {
      existing.count++;
      existing.totalTime += duration;
      existing.averageTime = existing.totalTime / existing.count;
      existing.maxTime = Math.max(existing.maxTime, duration);
      existing.minTime = Math.min(existing.minTime, duration);
      existing.lastExecuted = new Date();
    } else {
      this.metrics.set(operationName, {
        count: 1,
        totalTime: duration,
        averageTime: duration,
        maxTime: duration,
        minTime: duration,
        lastExecuted: new Date(),
      });
    }
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): {
    operations: Array<{
      name: string;
      count: number;
      averageTime: number;
      maxTime: number;
      minTime: number;
      totalTime: number;
      lastExecuted: Date;
    }>;
    summary: {
      totalOperations: number;
      slowOperations: number;
      averageResponseTime: number;
    };
  } {
    const operations = Array.from(this.metrics.entries()).map(
      ([name, metrics]) => ({
        name,
        ...metrics,
      })
    );

    const totalOperations = operations.reduce((sum, op) => sum + op.count, 0);
    const slowOperations = operations.filter(
      (op) => op.averageTime > 100
    ).length;
    const totalTime = operations.reduce((sum, op) => sum + op.totalTime, 0);
    const averageResponseTime =
      totalOperations > 0 ? totalTime / totalOperations : 0;

    return {
      operations: operations.sort((a, b) => b.averageTime - a.averageTime),
      summary: {
        totalOperations,
        slowOperations,
        averageResponseTime,
      },
    };
  }

  /**
   * 清除性能数据
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * 获取慢查询列表
   */
  getSlowQueries(threshold: number = 100): Array<{
    name: string;
    averageTime: number;
    count: number;
  }> {
    return Array.from(this.metrics.entries())
      .filter(([, metrics]) => metrics.averageTime > threshold)
      .map(([name, metrics]) => ({
        name,
        averageTime: metrics.averageTime,
        count: metrics.count,
      }))
      .sort((a, b) => b.averageTime - a.averageTime);
  }

  /**
   * 打印性能报告到控制台
   */
  printReport(): void {
    const report = this.getPerformanceReport();

    console.group("📊 数据库性能报告");
    console.log("总操作数:", report.summary.totalOperations);
    console.log("慢操作数:", report.summary.slowOperations);
    console.log(
      "平均响应时间:",
      report.summary.averageResponseTime.toFixed(2) + "ms"
    );

    if (report.operations.length > 0) {
      console.table(
        report.operations.map((op) => ({
          操作名称: op.name,
          执行次数: op.count,
          平均耗时: op.averageTime.toFixed(2) + "ms",
          最大耗时: op.maxTime.toFixed(2) + "ms",
          最小耗时: op.minTime.toFixed(2) + "ms",
          最后执行: op.lastExecuted.toLocaleString(),
        }))
      );
    }

    const slowQueries = this.getSlowQueries();
    if (slowQueries.length > 0) {
      console.warn("🐌 慢查询列表:");
      console.table(slowQueries);
    }

    console.groupEnd();
  }
}

/**
 * 性能监控装饰器工厂
 */
export function performanceMonitorDecorator(operationName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const monitor = PerformanceMonitor.getInstance();

    descriptor.value = async function (...args: any[]) {
      return monitor.monitor(
        `${target.constructor.name}.${operationName || propertyKey}`,
        () => originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

/**
 * 全局性能监控器实例
 */
export const performanceMonitor = PerformanceMonitor.getInstance();
