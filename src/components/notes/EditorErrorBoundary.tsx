import { Component, type ReactNode } from "react";
import type { ErrorInfo } from "react";

/**
 * 编辑器错误边界组件的属性接口
 */
interface EditorErrorBoundaryProps {
  children: ReactNode;
  /** 错误回调函数 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** 自定义错误显示组件 */
  fallback?: ReactNode;
  /** 是否显示错误详情（开发模式） */
  showErrorDetails?: boolean;
}

/**
 * 编辑器错误边界组件的状态接口
 */
interface EditorErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * 编辑器错误边界组件
 *
 * 用于捕获编辑器组件中的 JavaScript 错误，防止整个应用崩溃
 * 提供友好的错误提示和恢复机制
 */
class EditorErrorBoundary extends Component<
  EditorErrorBoundaryProps,
  EditorErrorBoundaryState
> {
  constructor(props: EditorErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * 捕获错误并更新状态
   */
  static getDerivedStateFromError(error: Error): EditorErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * 错误发生时的处理逻辑
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error("编辑器错误边界捕获到错误:", error, errorInfo);

    // 更新状态
    this.setState({
      error,
      errorInfo,
    });

    // 调用外部错误处理函数
    this.props.onError?.(error, errorInfo);

    // 在生产环境中，可以将错误发送到错误监控服务
    if (process.env.NODE_ENV === "production") {
      this.reportErrorToService(error, errorInfo);
    }
  }

  /**
   * 重置错误状态，尝试恢复
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  /**
   * 报告错误到监控服务（生产环境）
   */
  private reportErrorToService(error: Error, _errorInfo: ErrorInfo) {
    // 这里可以集成错误监控服务，如 Sentry、LogRocket 等
    // 示例：
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: errorInfo.componentStack,
    //     },
    //   },
    // });

    console.warn("错误已记录到监控服务:", error.message);
  }

  /**
   * 渲染错误回退 UI
   */
  renderErrorFallback() {
    const {
      fallback,
      showErrorDetails = process.env.NODE_ENV === "development",
    } = this.props;
    const { error, errorInfo } = this.state;

    // 如果提供了自定义回退组件，使用它
    if (fallback) {
      return fallback;
    }

    // 默认错误 UI
    return (
      <div className="editor-error-boundary">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h3>编辑器遇到了问题</h3>
          <p>
            很抱歉，编辑器出现了意外错误。您可以尝试刷新页面或重新加载编辑器。
          </p>

          <div className="error-actions">
            <button onClick={this.handleReset} className="retry-button">
              重试
            </button>
            <button
              onClick={() => window.location.reload()}
              className="reload-button"
            >
              刷新页面
            </button>
          </div>

          {showErrorDetails && error && (
            <details className="error-details">
              <summary>错误详情（开发模式）</summary>
              <div className="error-stack">
                <h4>错误信息:</h4>
                <pre>{error.message}</pre>

                <h4>错误堆栈:</h4>
                <pre>{error.stack}</pre>

                {errorInfo && (
                  <>
                    <h4>组件堆栈:</h4>
                    <pre>{errorInfo.componentStack}</pre>
                  </>
                )}
              </div>
            </details>
          )}
        </div>

        <style>{`
          .editor-error-boundary {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            padding: 20px;
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            margin: 10px 0;
          }

          .error-content {
            text-align: center;
            max-width: 500px;
          }

          .error-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }

          .error-content h3 {
            color: #dc2626;
            margin-bottom: 12px;
            font-size: 18px;
          }

          .error-content p {
            color: #6b7280;
            margin-bottom: 20px;
            line-height: 1.5;
          }

          .error-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            margin-bottom: 20px;
          }

          .retry-button,
          .reload-button {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
          }

          .retry-button {
            background-color: #3b82f6;
            color: white;
          }

          .retry-button:hover {
            background-color: #2563eb;
          }

          .reload-button {
            background-color: #6b7280;
            color: white;
          }

          .reload-button:hover {
            background-color: #4b5563;
          }

          .error-details {
            text-align: left;
            margin-top: 20px;
            padding: 16px;
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
          }

          .error-details summary {
            cursor: pointer;
            font-weight: 600;
            margin-bottom: 12px;
          }

          .error-stack h4 {
            margin: 12px 0 6px 0;
            font-size: 14px;
            color: #374151;
          }

          .error-stack pre {
            background-color: #1f2937;
            color: #f9fafb;
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 12px;
            line-height: 1.4;
            margin-bottom: 12px;
          }
        `}</style>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderErrorFallback();
    }

    return this.props.children;
  }
}

export default EditorErrorBoundary;
