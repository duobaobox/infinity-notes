/**
 * 优化效果测试脚本
 * 用于验证连接线实时更新优化和内存泄漏修复的效果
 */

import { connectionLineManager } from "../utils/connectionLineManager";
import { memoryManager } from "../utils/memoryManager";

/**
 * 性能测试结果接口
 */
interface PerformanceTestResult {
  testName: string;
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryDelta: number;
  success: boolean;
  details?: any;
}

/**
 * 连接线更新性能测试
 */
export async function testConnectionUpdatePerformance(): Promise<PerformanceTestResult> {
  console.log("🧪 开始连接线更新性能测试...");

  const startTime = performance.now();
  let memoryBefore = 0;
  let memoryAfter = 0;

  try {
    // 获取初始内存使用
    if ("memory" in performance) {
      memoryBefore = (performance as any).memory.usedJSHeapSize;
    }

    // 模拟大量连接线更新操作
    const updateCount = 100;
    const promises: Promise<void>[] = [];

    for (let i = 0; i < updateCount; i++) {
      promises.push(
        new Promise((resolve) => {
          // 模拟便签拖拽时的连接线更新
          connectionLineManager.updateConnectionPositions();
          setTimeout(resolve, 1);
        })
      );
    }

    await Promise.all(promises);

    // 等待所有更新完成
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 获取结束时的内存使用
    if ("memory" in performance) {
      memoryAfter = (performance as any).memory.usedJSHeapSize;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`✅ 连接线更新性能测试完成: ${duration.toFixed(2)}ms`);

    return {
      testName: "连接线更新性能测试",
      duration,
      memoryBefore,
      memoryAfter,
      memoryDelta: memoryAfter - memoryBefore,
      success: duration < 1000, // 期望在1秒内完成
      details: {
        updateCount,
        averageUpdateTime: duration / updateCount,
      },
    };
  } catch (error) {
    console.error("❌ 连接线更新性能测试失败:", error);

    return {
      testName: "连接线更新性能测试",
      duration: performance.now() - startTime,
      memoryBefore,
      memoryAfter,
      memoryDelta: 0,
      success: false,
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * 内存泄漏测试
 */
export async function testMemoryLeaks(): Promise<PerformanceTestResult> {
  console.log("🧪 开始内存泄漏测试...");

  const startTime = performance.now();
  let memoryBefore = 0;
  let memoryAfter = 0;

  try {
    // 获取初始内存使用
    if ("memory" in performance) {
      memoryBefore = (performance as any).memory.usedJSHeapSize;
    }

    // 模拟大量对象创建和销毁
    const iterations = 50;

    for (let i = 0; i < iterations; i++) {
      // 创建临时DOM元素（模拟便签）
      const tempElements: HTMLElement[] = [];

      for (let j = 0; j < 10; j++) {
        const element = document.createElement("div");
        element.style.position = "absolute";
        element.style.left = `${Math.random() * 1000}px`;
        element.style.top = `${Math.random() * 1000}px`;
        element.textContent = `测试元素 ${i}-${j}`;
        document.body.appendChild(element);
        tempElements.push(element);
      }

      // 等待一帧
      await new Promise((resolve) => requestAnimationFrame(resolve));

      // 清理元素
      tempElements.forEach((element) => {
        document.body.removeChild(element);
      });

      // 触发内存清理
      if (i % 10 === 0) {
        await memoryManager.performMemoryCleanup();
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    // 最终清理
    await memoryManager.performMemoryCleanup();

    // 等待垃圾回收
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 强制垃圾回收（如果可用）
    if (typeof window !== "undefined" && "gc" in window) {
      try {
        (window as any).gc();
      } catch (error) {
        // 忽略错误
      }
    }

    // 再次等待
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 获取结束时的内存使用
    if ("memory" in performance) {
      memoryAfter = (performance as any).memory.usedJSHeapSize;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const memoryDelta = memoryAfter - memoryBefore;

    // 判断是否有明显的内存泄漏（增长超过5MB认为有问题）
    const hasMemoryLeak = memoryDelta > 5 * 1024 * 1024;

    console.log(
      `✅ 内存泄漏测试完成: ${duration.toFixed(2)}ms, 内存变化: ${(
        memoryDelta /
        1024 /
        1024
      ).toFixed(2)}MB`
    );

    return {
      testName: "内存泄漏测试",
      duration,
      memoryBefore,
      memoryAfter,
      memoryDelta,
      success: !hasMemoryLeak,
      details: {
        iterations,
        memoryDeltaMB: memoryDelta / 1024 / 1024,
        hasMemoryLeak,
      },
    };
  } catch (error) {
    console.error("❌ 内存泄漏测试失败:", error);

    return {
      testName: "内存泄漏测试",
      duration: performance.now() - startTime,
      memoryBefore,
      memoryAfter,
      memoryDelta: 0,
      success: false,
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * 运行所有优化测试
 */
export async function runOptimizationTests(): Promise<PerformanceTestResult[]> {
  console.log("🚀 开始运行优化效果测试套件...");

  const results: PerformanceTestResult[] = [];

  try {
    // 连接线更新性能测试
    const connectionTest = await testConnectionUpdatePerformance();
    results.push(connectionTest);

    // 等待一段时间再进行下一个测试
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 内存泄漏测试
    const memoryTest = await testMemoryLeaks();
    results.push(memoryTest);

    // 输出测试报告
    console.log("\n📊 优化测试报告:");
    console.log("=".repeat(50));

    results.forEach((result) => {
      const status = result.success ? "✅ 通过" : "❌ 失败";
      console.log(`${status} ${result.testName}`);
      console.log(`   耗时: ${result.duration.toFixed(2)}ms`);
      if (result.memoryDelta !== 0) {
        console.log(
          `   内存变化: ${(result.memoryDelta / 1024 / 1024).toFixed(2)}MB`
        );
      }
      if (result.details) {
        console.log(`   详情:`, result.details);
      }
      console.log("");
    });

    const passedTests = results.filter((r) => r.success).length;
    const totalTests = results.length;

    console.log(`📈 测试总结: ${passedTests}/${totalTests} 个测试通过`);

    if (passedTests === totalTests) {
      console.log("🎉 所有优化测试都通过了！");
    } else {
      console.log("⚠️ 部分测试失败，需要进一步优化");
    }
  } catch (error) {
    console.error("❌ 测试套件执行失败:", error);
  }

  return results;
}

// 在开发环境中自动运行测试（可选）
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  // 延迟运行测试，等待应用初始化完成
  setTimeout(() => {
    if (window.location.search.includes("runOptimizationTests=true")) {
      runOptimizationTests();
    }
  }, 5000);
}
