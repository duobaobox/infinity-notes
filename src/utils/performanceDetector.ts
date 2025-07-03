/**
 * 设备性能检测和动态虚拟化阈值管理器
 * 根据设备性能自动调整虚拟化阈值，照顾性能较差的设备
 */

// 设备性能等级常量
export const DevicePerformanceLevel = {
  LOW: "low", // 低性能设备
  MEDIUM: "medium", // 中等性能设备
  HIGH: "high", // 高性能设备
  UNKNOWN: "unknown", // 未知性能
} as const;

export type DevicePerformanceLevel =
  (typeof DevicePerformanceLevel)[keyof typeof DevicePerformanceLevel];

// 性能检测结果接口
export interface PerformanceProfile {
  level: DevicePerformanceLevel;
  score: number; // 性能评分 (0-100)
  virtualizationThreshold: number; // 推荐的虚拟化阈值
  renderBatchSize: number; // 渲染批次大小
  updateThrottleMs: number; // 更新节流时间
  details: {
    cpuCores: number;
    memory: number; // GB
    gpu: string;
    devicePixelRatio: number;
    screenResolution: string;
    userAgent: string;
    hardwareConcurrency: number;
  };
}

class PerformanceDetector {
  private static instance: PerformanceDetector;
  private profile: PerformanceProfile | null = null;
  // private benchmarkResults: number[] = [];

  private constructor() {}

  static getInstance(): PerformanceDetector {
    if (!PerformanceDetector.instance) {
      PerformanceDetector.instance = new PerformanceDetector();
    }
    return PerformanceDetector.instance;
  }

  /**
   * 检测设备性能并生成性能配置文件
   */
  async detectPerformance(): Promise<PerformanceProfile> {
    if (this.profile) {
      return this.profile;
    }

    console.log("🔍 开始检测设备性能...");

    // 1. 收集硬件信息
    const hardwareInfo = this.collectHardwareInfo();

    // 2. 运行性能基准测试
    const benchmarkScore = await this.runBenchmarkTests();

    // 3. 计算综合性能评分
    const performanceScore = this.calculatePerformanceScore(
      hardwareInfo,
      benchmarkScore
    );

    // 4. 确定性能等级
    const performanceLevel = this.determinePerformanceLevel(performanceScore);

    // 5. 生成推荐配置
    const config = this.generatePerformanceConfig(
      performanceLevel,
      performanceScore
    );

    this.profile = {
      level: performanceLevel,
      score: performanceScore,
      virtualizationThreshold: config.virtualizationThreshold,
      renderBatchSize: config.renderBatchSize,
      updateThrottleMs: config.updateThrottleMs,
      details: hardwareInfo,
    };

    console.log("✅ 设备性能检测完成:", this.profile);

    // 保存到本地存储，避免重复检测
    this.saveProfileToStorage();

    return this.profile;
  }

  /**
   * 收集硬件信息
   */
  private collectHardwareInfo() {
    const nav = navigator as any;

    return {
      cpuCores: navigator.hardwareConcurrency || 4,
      memory: nav.deviceMemory || 4, // GB
      gpu: this.getGPUInfo(),
      devicePixelRatio: window.devicePixelRatio || 1,
      screenResolution: `${screen.width}x${screen.height}`,
      userAgent: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
    };
  }

  /**
   * 获取GPU信息
   */
  private getGPUInfo(): string {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl && "getExtension" in gl && "getParameter" in gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension(
          "WEBGL_debug_renderer_info"
        );
        if (debugInfo) {
          return (
            (gl as WebGLRenderingContext).getParameter(
              debugInfo.UNMASKED_RENDERER_WEBGL
            ) || "Unknown GPU"
          );
        }
      }
    } catch (e) {
      console.warn("无法获取GPU信息:", e);
    }
    return "Unknown GPU";
  }

  /**
   * 运行性能基准测试
   */
  private async runBenchmarkTests(): Promise<number> {
    const tests = [
      this.testDOMManipulation,
      this.testCanvasRendering,
      this.testArrayProcessing,
      this.testAnimationPerformance,
    ];

    const results: number[] = [];

    for (const test of tests) {
      try {
        const score = await test.call(this);
        results.push(score);
        // 给设备一点休息时间
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        console.warn("基准测试失败:", error);
        results.push(50); // 默认中等分数
      }
    }

    // this.benchmarkResults = results;
    return results.reduce((sum, score) => sum + score, 0) / results.length;
  }

  /**
   * DOM操作性能测试
   */
  private async testDOMManipulation(): Promise<number> {
    const startTime = performance.now();
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    document.body.appendChild(container);

    // 创建和操作100个DOM元素
    for (let i = 0; i < 100; i++) {
      const div = document.createElement("div");
      div.textContent = `Test ${i}`;
      div.style.transform = `translate(${i}px, ${i}px)`;
      container.appendChild(div);
    }

    // 批量样式更新
    const elements = container.children;
    for (let i = 0; i < elements.length; i++) {
      (elements[i] as HTMLElement).style.backgroundColor = `hsl(${
        i * 3.6
      }, 50%, 50%)`;
    }

    document.body.removeChild(container);
    const duration = performance.now() - startTime;

    // 转换为0-100分数，越快分数越高
    return Math.max(0, Math.min(100, 100 - duration));
  }

  /**
   * Canvas渲染性能测试
   */
  private async testCanvasRendering(): Promise<number> {
    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 500;
    const ctx = canvas.getContext("2d")!;

    const startTime = performance.now();

    // 绘制复杂图形
    for (let i = 0; i < 1000; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 20 + 5,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 50%)`;
      ctx.fill();
    }

    const duration = performance.now() - startTime;
    return Math.max(0, Math.min(100, 100 - duration / 2));
  }

  /**
   * 数组处理性能测试
   */
  private async testArrayProcessing(): Promise<number> {
    const startTime = performance.now();

    // 创建大数组并进行复杂操作
    const largeArray = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      value: Math.random() * 1000,
      text: `Item ${i}`,
    }));

    // 多次过滤、排序、映射操作
    // 执行数组操作但不保存结果，只是为了测试性能
    largeArray
      .filter((item) => item.value > 500)
      .sort((a, b) => b.value - a.value)
      .map((item) => ({ ...item, processed: true }))
      .slice(0, 100);

    const duration = performance.now() - startTime;
    return Math.max(0, Math.min(100, 100 - duration / 3));
  }

  /**
   * 动画性能测试
   */
  private async testAnimationPerformance(): Promise<number> {
    return new Promise((resolve) => {
      const element = document.createElement("div");
      element.style.position = "absolute";
      element.style.left = "-9999px";
      element.style.width = "100px";
      element.style.height = "100px";
      element.style.backgroundColor = "red";
      document.body.appendChild(element);

      let frameCount = 0;
      const startTime = performance.now();
      const duration = 500; // 测试500ms

      const animate = () => {
        frameCount++;
        element.style.transform = `translateX(${frameCount}px) rotate(${frameCount}deg)`;

        if (performance.now() - startTime < duration) {
          requestAnimationFrame(animate);
        } else {
          document.body.removeChild(element);
          const fps = (frameCount / duration) * 1000;
          const score = Math.min(100, (fps / 60) * 100); // 60fps为满分
          resolve(score);
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * 计算综合性能评分
   */
  private calculatePerformanceScore(
    hardwareInfo: any,
    benchmarkScore: number
  ): number {
    // 硬件评分权重
    const hardwareScore =
      (Math.min(hardwareInfo.cpuCores, 16) / 16) * 25 + // CPU核心数 25%
      (Math.min(hardwareInfo.memory, 32) / 32) * 25 + // 内存 25%
      (hardwareInfo.devicePixelRatio <= 2 ? 25 : 15) + // 屏幕密度 25%
      (hardwareInfo.hardwareConcurrency >= 8 ? 25 : 15); // 并发能力 25%

    // 基准测试评分权重60%，硬件评分权重40%
    return benchmarkScore * 0.6 + hardwareScore * 0.4;
  }

  /**
   * 确定性能等级
   */
  private determinePerformanceLevel(score: number): DevicePerformanceLevel {
    if (score >= 75) return DevicePerformanceLevel.HIGH;
    if (score >= 50) return DevicePerformanceLevel.MEDIUM;
    if (score >= 25) return DevicePerformanceLevel.LOW;
    return DevicePerformanceLevel.UNKNOWN;
  }

  /**
   * 生成性能配置
   */
  private generatePerformanceConfig(
    level: DevicePerformanceLevel,
    _score: number
  ) {
    switch (level) {
      case DevicePerformanceLevel.HIGH:
        return {
          virtualizationThreshold: 200, // 高性能设备可以处理更多便签
          renderBatchSize: 50,
          updateThrottleMs: 8,
        };

      case DevicePerformanceLevel.MEDIUM:
        return {
          virtualizationThreshold: 100, // 中等性能设备使用默认值
          renderBatchSize: 30,
          updateThrottleMs: 16,
        };

      case DevicePerformanceLevel.LOW:
        return {
          virtualizationThreshold: 50, // 低性能设备更早启用虚拟化
          renderBatchSize: 20,
          updateThrottleMs: 32,
        };

      default:
        return {
          virtualizationThreshold: 75, // 保守的默认值
          renderBatchSize: 25,
          updateThrottleMs: 24,
        };
    }
  }

  /**
   * 保存性能配置到本地存储
   */
  private saveProfileToStorage() {
    if (this.profile) {
      try {
        localStorage.setItem(
          "devicePerformanceProfile",
          JSON.stringify({
            ...this.profile,
            timestamp: Date.now(),
            version: "1.0",
          })
        );
      } catch (error) {
        console.warn("无法保存性能配置到本地存储:", error);
      }
    }
  }

  /**
   * 从本地存储加载性能配置
   */
  loadProfileFromStorage(): PerformanceProfile | null {
    try {
      const stored = localStorage.getItem("devicePerformanceProfile");
      if (stored) {
        const data = JSON.parse(stored);
        // 检查是否过期（7天）
        if (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
          this.profile = data;
          return data;
        }
      }
    } catch (error) {
      console.warn("无法从本地存储加载性能配置:", error);
    }
    return null;
  }

  /**
   * 获取当前性能配置
   */
  getCurrentProfile(): PerformanceProfile | null {
    return this.profile;
  }

  /**
   * 强制重新检测性能
   */
  async forceRedetect(): Promise<PerformanceProfile> {
    this.profile = null;
    localStorage.removeItem("devicePerformanceProfile");
    return this.detectPerformance();
  }
}

// 导出单例实例
export const performanceDetector = PerformanceDetector.getInstance();
