/**
 * 编辑器性能监控和优化工具
 * 
 * 提供编辑器性能监控、优化建议和自动优化功能
 */

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
  renderTime: number; // 渲染时间 (ms)
  updateTime: number; // 更新时间 (ms)
  memoryUsage: number; // 内存使用量 (MB)
  domNodeCount: number; // DOM 节点数量
  contentLength: number; // 内容长度
  lastMeasurement: number; // 最后测量时间戳
}

/**
 * 性能优化建议接口
 */
export interface PerformanceRecommendation {
  type: "warning" | "error" | "info";
  message: string;
  action?: string;
  priority: number; // 1-5，5 为最高优先级
}

/**
 * 编辑器性能监控器类
 */
export class EditorPerformanceMonitor {
  private editor: any;
  private metrics: PerformanceMetrics;
  private measurementHistory: PerformanceMetrics[] = [];
  private maxHistorySize = 50;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  
  // 性能阈值配置
  private readonly thresholds = {
    renderTime: 100, // ms
    updateTime: 50, // ms
    memoryUsage: 100, // MB
    domNodeCount: 1000,
    contentLength: 50000, // 字符数
  };

  constructor(editor: any) {
    this.editor = editor;
    this.metrics = this.createEmptyMetrics();
  }

  /**
   * 创建空的性能指标
   */
  private createEmptyMetrics(): PerformanceMetrics {
    return {
      renderTime: 0,
      updateTime: 0,
      memoryUsage: 0,
      domNodeCount: 0,
      contentLength: 0,
      lastMeasurement: Date.now(),
    };
  }

  /**
   * 开始性能监控
   */
  startMonitoring(interval = 5000) {
    if (this.isMonitoring) {
      this.stopMonitoring();
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.measurePerformance();
    }, interval);

    // 立即执行一次测量
    this.measurePerformance();
  }

  /**
   * 停止性能监控
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
  }

  /**
   * 测量编辑器性能
   */
  measurePerformance(): PerformanceMetrics {
    if (!this.editor || this.editor.isDestroyed) {
      return this.metrics;
    }

    const startTime = performance.now();

    try {
      // 测量渲染时间
      const renderStartTime = performance.now();
      this.editor.view?.updateState(this.editor.state);
      const renderTime = performance.now() - renderStartTime;

      // 测量更新时间
      const updateStartTime = performance.now();
      const content = this.editor.getJSON();
      const updateTime = performance.now() - updateStartTime;

      // 测量内存使用量（如果可用）
      const memoryUsage = this.measureMemoryUsage();

      // 测量 DOM 节点数量
      const domNodeCount = this.measureDOMNodeCount();

      // 测量内容长度
      const contentLength = this.measureContentLength(content);

      // 更新指标
      this.metrics = {
        renderTime,
        updateTime,
        memoryUsage,
        domNodeCount,
        contentLength,
        lastMeasurement: Date.now(),
      };

      // 添加到历史记录
      this.addToHistory(this.metrics);

      return this.metrics;
    } catch (error) {
      console.warn("性能测量失败:", error);
      return this.metrics;
    }
  }

  /**
   * 测量内存使用量
   */
  private measureMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / (1024 * 1024); // 转换为 MB
    }
    return 0;
  }

  /**
   * 测量 DOM 节点数量
   */
  private measureDOMNodeCount(): number {
    if (!this.editor?.view?.dom) return 0;
    
    const editorDOM = this.editor.view.dom;
    return editorDOM.querySelectorAll('*').length;
  }

  /**
   * 测量内容长度
   */
  private measureContentLength(content: any): number {
    try {
      return JSON.stringify(content).length;
    } catch {
      return 0;
    }
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(metrics: PerformanceMetrics) {
    this.measurementHistory.push({ ...metrics });
    
    // 保持历史记录大小限制
    if (this.measurementHistory.length > this.maxHistorySize) {
      this.measurementHistory.shift();
    }
  }

  /**
   * 获取当前性能指标
   */
  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 获取性能历史记录
   */
  getHistory(): PerformanceMetrics[] {
    return [...this.measurementHistory];
  }

  /**
   * 获取平均性能指标
   */
  getAverageMetrics(): PerformanceMetrics {
    if (this.measurementHistory.length === 0) {
      return this.createEmptyMetrics();
    }

    const sum = this.measurementHistory.reduce(
      (acc, metrics) => ({
        renderTime: acc.renderTime + metrics.renderTime,
        updateTime: acc.updateTime + metrics.updateTime,
        memoryUsage: acc.memoryUsage + metrics.memoryUsage,
        domNodeCount: acc.domNodeCount + metrics.domNodeCount,
        contentLength: acc.contentLength + metrics.contentLength,
        lastMeasurement: Math.max(acc.lastMeasurement, metrics.lastMeasurement),
      }),
      this.createEmptyMetrics()
    );

    const count = this.measurementHistory.length;
    return {
      renderTime: sum.renderTime / count,
      updateTime: sum.updateTime / count,
      memoryUsage: sum.memoryUsage / count,
      domNodeCount: sum.domNodeCount / count,
      contentLength: sum.contentLength / count,
      lastMeasurement: sum.lastMeasurement,
    };
  }

  /**
   * 分析性能并提供优化建议
   */
  analyzePerformance(): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];
    const current = this.metrics;
    const average = this.getAverageMetrics();

    // 检查渲染时间
    if (current.renderTime > this.thresholds.renderTime) {
      recommendations.push({
        type: "warning",
        message: `渲染时间过长 (${current.renderTime.toFixed(2)}ms)`,
        action: "考虑减少扩展数量或优化内容结构",
        priority: 4,
      });
    }

    // 检查更新时间
    if (current.updateTime > this.thresholds.updateTime) {
      recommendations.push({
        type: "warning",
        message: `更新时间过长 (${current.updateTime.toFixed(2)}ms)`,
        action: "增加防抖延迟或优化更新逻辑",
        priority: 3,
      });
    }

    // 检查内存使用量
    if (current.memoryUsage > this.thresholds.memoryUsage) {
      recommendations.push({
        type: "error",
        message: `内存使用量过高 (${current.memoryUsage.toFixed(2)}MB)`,
        action: "检查内存泄漏或减少缓存数据",
        priority: 5,
      });
    }

    // 检查 DOM 节点数量
    if (current.domNodeCount > this.thresholds.domNodeCount) {
      recommendations.push({
        type: "warning",
        message: `DOM 节点数量过多 (${current.domNodeCount})`,
        action: "简化内容结构或使用虚拟滚动",
        priority: 3,
      });
    }

    // 检查内容长度
    if (current.contentLength > this.thresholds.contentLength) {
      recommendations.push({
        type: "info",
        message: `内容长度较大 (${current.contentLength} 字符)`,
        action: "考虑分页或延迟加载",
        priority: 2,
      });
    }

    // 检查性能趋势
    if (this.measurementHistory.length >= 5) {
      const recent = this.measurementHistory.slice(-5);
      const trend = this.calculateTrend(recent, 'renderTime');
      
      if (trend > 0.2) {
        recommendations.push({
          type: "warning",
          message: "渲染性能呈下降趋势",
          action: "检查是否有性能回归问题",
          priority: 4,
        });
      }
    }

    // 按优先级排序
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 计算性能趋势
   */
  private calculateTrend(data: PerformanceMetrics[], metric: keyof PerformanceMetrics): number {
    if (data.length < 2) return 0;
    
    const values = data.map(d => d[metric] as number);
    const first = values[0];
    const last = values[values.length - 1];
    
    return first > 0 ? (last - first) / first : 0;
  }

  /**
   * 应用性能优化
   */
  applyOptimizations() {
    if (!this.editor || this.editor.isDestroyed) return;

    const recommendations = this.analyzePerformance();
    
    // 自动应用一些优化措施
    recommendations.forEach(rec => {
      if (rec.priority >= 4) {
        this.applyOptimization(rec);
      }
    });
  }

  /**
   * 应用具体的优化措施
   */
  private applyOptimization(recommendation: PerformanceRecommendation) {
    // 这里可以实现具体的优化逻辑
    console.log(`应用优化: ${recommendation.message}`);
    
    // 示例：如果内存使用过高，触发垃圾回收（如果可用）
    if (recommendation.message.includes("内存使用量过高")) {
      if ('gc' in window && typeof (window as any).gc === 'function') {
        (window as any).gc();
      }
    }
  }

  /**
   * 销毁监控器
   */
  destroy() {
    this.stopMonitoring();
    this.editor = null;
    this.measurementHistory = [];
  }
}
