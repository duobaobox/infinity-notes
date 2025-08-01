/**
 * 编辑器健康检查和恢复机制
 * 
 * 提供编辑器状态监控、问题检测和自动恢复功能
 */

/**
 * 编辑器健康状态枚举
 */
export enum EditorHealthStatus {
  HEALTHY = "healthy",
  WARNING = "warning", 
  ERROR = "error",
  DESTROYED = "destroyed",
}

/**
 * 编辑器健康检查结果接口
 */
export interface EditorHealthCheckResult {
  status: EditorHealthStatus;
  issues: string[];
  suggestions: string[];
  canRecover: boolean;
}

/**
 * 编辑器健康检查器类
 */
export class EditorHealthChecker {
  private static readonly CHECK_INTERVAL = 5000; // 5秒检查一次
  private static readonly MAX_RECOVERY_ATTEMPTS = 3;
  
  private editor: any;
  private checkInterval?: NodeJS.Timeout;
  private recoveryAttempts = 0;
  private lastHealthStatus = EditorHealthStatus.HEALTHY;
  private onHealthChange?: (status: EditorHealthStatus, result: EditorHealthCheckResult) => void;

  constructor(editor: any, onHealthChange?: (status: EditorHealthStatus, result: EditorHealthCheckResult) => void) {
    this.editor = editor;
    this.onHealthChange = onHealthChange;
  }

  /**
   * 开始健康检查
   */
  startMonitoring() {
    this.stopMonitoring(); // 确保没有重复的监控
    
    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, EditorHealthChecker.CHECK_INTERVAL);

    // 立即执行一次检查
    this.performHealthCheck();
  }

  /**
   * 停止健康检查
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  /**
   * 执行健康检查
   */
  private performHealthCheck(): EditorHealthCheckResult {
    const result = this.checkEditorHealth();
    
    // 如果状态发生变化，通知外部
    if (result.status !== this.lastHealthStatus) {
      this.lastHealthStatus = result.status;
      this.onHealthChange?.(result.status, result);
    }

    // 如果检测到问题且可以恢复，尝试自动恢复
    if (result.status === EditorHealthStatus.ERROR && result.canRecover) {
      this.attemptRecovery(result);
    }

    return result;
  }

  /**
   * 检查编辑器健康状态
   */
  private checkEditorHealth(): EditorHealthCheckResult {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let status = EditorHealthStatus.HEALTHY;
    let canRecover = true;

    // 检查编辑器是否存在
    if (!this.editor) {
      issues.push("编辑器实例不存在");
      suggestions.push("重新初始化编辑器");
      status = EditorHealthStatus.ERROR;
      canRecover = true;
      return { status, issues, suggestions, canRecover };
    }

    // 检查编辑器是否已销毁
    if (this.editor.isDestroyed) {
      issues.push("编辑器已被销毁");
      suggestions.push("重新创建编辑器实例");
      status = EditorHealthStatus.DESTROYED;
      canRecover = false;
      return { status, issues, suggestions, canRecover };
    }

    // 检查编辑器视图
    if (!this.editor.view) {
      issues.push("编辑器视图不存在");
      suggestions.push("检查编辑器挂载状态");
      status = EditorHealthStatus.ERROR;
    }

    // 检查编辑器 DOM
    if (this.editor.view && !this.editor.view.dom) {
      issues.push("编辑器 DOM 节点不存在");
      suggestions.push("检查编辑器是否正确挂载到 DOM");
      status = EditorHealthStatus.ERROR;
    }

    // 检查编辑器 DOM 是否在文档中
    if (this.editor.view?.dom && !document.contains(this.editor.view.dom)) {
      issues.push("编辑器 DOM 节点未挂载到文档");
      suggestions.push("重新挂载编辑器到正确的容器");
      status = EditorHealthStatus.WARNING;
    }

    // 检查编辑器状态
    if (this.editor.view && !this.editor.view.state) {
      issues.push("编辑器状态不存在");
      suggestions.push("重新初始化编辑器状态");
      status = EditorHealthStatus.ERROR;
    }

    // 检查编辑器命令
    if (!this.editor.commands) {
      issues.push("编辑器命令不可用");
      suggestions.push("检查编辑器扩展配置");
      status = EditorHealthStatus.WARNING;
    }

    // 检查编辑器是否响应
    try {
      // 尝试获取编辑器内容来测试响应性
      this.editor.getJSON();
    } catch (error) {
      issues.push("编辑器无响应或内部错误");
      suggestions.push("重启编辑器或检查扩展兼容性");
      status = EditorHealthStatus.ERROR;
    }

    // 检查内存泄漏迹象
    if (this.checkMemoryLeaks()) {
      issues.push("检测到潜在的内存泄漏");
      suggestions.push("清理未使用的事件监听器和引用");
      status = status === EditorHealthStatus.HEALTHY ? EditorHealthStatus.WARNING : status;
    }

    return { status, issues, suggestions, canRecover };
  }

  /**
   * 检查内存泄漏迹象
   */
  private checkMemoryLeaks(): boolean {
    // 这里可以添加更复杂的内存泄漏检测逻辑
    // 例如检查事件监听器数量、DOM 节点数量等
    
    // 简单检查：如果编辑器存在但 DOM 不在文档中，可能存在泄漏
    if (this.editor?.view?.dom && !document.contains(this.editor.view.dom)) {
      return true;
    }

    return false;
  }

  /**
   * 尝试自动恢复
   */
  private attemptRecovery(healthResult: EditorHealthCheckResult) {
    if (this.recoveryAttempts >= EditorHealthChecker.MAX_RECOVERY_ATTEMPTS) {
      console.warn("编辑器恢复尝试次数已达上限，停止自动恢复");
      return;
    }

    this.recoveryAttempts++;
    console.log(`尝试编辑器自动恢复 (第 ${this.recoveryAttempts} 次)`);

    try {
      // 根据问题类型执行不同的恢复策略
      if (healthResult.issues.includes("编辑器视图不存在")) {
        this.recoverView();
      }
      
      if (healthResult.issues.includes("编辑器 DOM 节点未挂载到文档")) {
        this.recoverDOMMount();
      }
      
      if (healthResult.issues.includes("编辑器无响应或内部错误")) {
        this.recoverResponsiveness();
      }

      // 恢复后重置计数器
      setTimeout(() => {
        this.recoveryAttempts = 0;
      }, 30000); // 30秒后重置

    } catch (error) {
      console.error("编辑器自动恢复失败:", error);
    }
  }

  /**
   * 恢复编辑器视图
   */
  private recoverView() {
    try {
      if (this.editor && !this.editor.isDestroyed) {
        // 尝试重新创建视图
        this.editor.commands.focus();
      }
    } catch (error) {
      console.error("视图恢复失败:", error);
    }
  }

  /**
   * 恢复 DOM 挂载
   */
  private recoverDOMMount() {
    try {
      if (this.editor?.view?.dom) {
        // 这里需要外部提供容器引用，暂时只记录
        console.log("需要重新挂载编辑器 DOM");
      }
    } catch (error) {
      console.error("DOM 挂载恢复失败:", error);
    }
  }

  /**
   * 恢复编辑器响应性
   */
  private recoverResponsiveness() {
    try {
      if (this.editor && !this.editor.isDestroyed) {
        // 尝试执行一个简单的命令来恢复响应性
        this.editor.commands.blur();
        setTimeout(() => {
          this.editor.commands.focus();
        }, 100);
      }
    } catch (error) {
      console.error("响应性恢复失败:", error);
    }
  }

  /**
   * 手动触发健康检查
   */
  checkNow(): EditorHealthCheckResult {
    return this.performHealthCheck();
  }

  /**
   * 重置恢复计数器
   */
  resetRecoveryAttempts() {
    this.recoveryAttempts = 0;
  }

  /**
   * 获取当前健康状态
   */
  getCurrentStatus(): EditorHealthStatus {
    return this.lastHealthStatus;
  }

  /**
   * 销毁健康检查器
   */
  destroy() {
    this.stopMonitoring();
    this.editor = null;
    this.onHealthChange = undefined;
  }
}
