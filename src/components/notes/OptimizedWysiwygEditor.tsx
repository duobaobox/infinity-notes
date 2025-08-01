import React, { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useCanvasStore } from "../../stores/canvasStore";
import { EditorStorageManager } from "../../utils/editorStorage";
import {
  EditorHealthChecker,
  EditorHealthStatus,
} from "../../utils/editorHealthCheck";
import { EditorPerformanceMonitor } from "../../utils/editorPerformance";
import { EditorUXOptimizer } from "../../utils/editorUXOptimizer";
import EditorErrorBoundary from "./EditorErrorBoundary";
import "./WysiwygEditor.css";

/**
 * 优化的编辑器组件属性接口
 */
interface OptimizedWysiwygEditorProps {
  /** 编辑器内容 - 支持 JSON 或 HTML 格式 */
  content?: string | object;
  /** 内容变化回调 - 返回 JSON 格式 */
  onChange?: (content: object) => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 是否禁用编辑器 */
  disabled?: boolean;
  /** 编辑器类名 */
  className?: string;
  /** 编辑器实例回调 */
  onEditorReady?: (editor: any) => void;
  /** 点击事件回调 */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  /** 鼠标按下事件回调 */
  onMouseDown?: (event: React.MouseEvent<HTMLDivElement>) => void;
  /** 内联样式 */
  style?: React.CSSProperties;
  /** 标题属性 */
  title?: string;
  /** 是否正在流式输入（用于智能滚动） */
  isStreaming?: boolean;
  /** 是否自动聚焦 */
  autoFocus?: boolean;
}

/**
 * 安全地执行编辑器命令
 * 简化版本，减少复杂的检查逻辑
 */
const safeEditorCommand = (editor: any, command: () => void) => {
  if (!editor || editor.isDestroyed) {
    return false;
  }

  try {
    command();
    return true;
  } catch (error) {
    console.warn("编辑器命令执行失败:", error);
    return false;
  }
};

/**
 * 优化的所见即所得编辑器组件
 *
 * 主要改进：
 * 1. 使用 TipTap 原生 JSON 存储，避免复杂的 Markdown 转换
 * 2. 简化错误处理逻辑
 * 3. 优化性能，减少不必要的重新渲染
 * 4. 更好的类型安全
 */
const OptimizedWysiwygEditor: React.FC<OptimizedWysiwygEditorProps> = ({
  content = "",
  onChange,
  placeholder = "开始输入...",
  disabled = false,
  className = "",
  onEditorReady,
  onClick,
  onMouseDown,
  style,
  title,
  isStreaming = false,
  autoFocus = false,
}) => {
  const editorRef = useRef<any>(null);
  const healthCheckerRef = useRef<EditorHealthChecker | null>(null);
  const performanceMonitorRef = useRef<EditorPerformanceMonitor | null>(null);
  const uxOptimizerRef = useRef<EditorUXOptimizer | null>(null);
  const { scale } = useCanvasStore();

  // 健康状态管理
  const [healthStatus, setHealthStatus] = useState<EditorHealthStatus>(
    EditorHealthStatus.HEALTHY
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  // 防抖更新函数
  const debouncedOnChange = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (newContent: object) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onChange?.(newContent);
        }, 300); // 300ms 防抖
      };
    })(),
    [onChange]
  );

  // 编辑器配置
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // 禁用默认的历史记录，使用自定义的
        history: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: EditorStorageManager.deserialize(content),
    editable: !disabled,
    onUpdate: ({ editor }) => {
      // 使用 JSON 格式存储，通过存储管理器序列化
      const jsonContent = editor.getJSON();
      const serializedContent = EditorStorageManager.serialize(jsonContent);
      debouncedOnChange(serializedContent);
    },
    onCreate: ({ editor }) => {
      editorRef.current = editor;

      // 初始化健康检查器
      healthCheckerRef.current = new EditorHealthChecker(
        editor,
        (status, result) => {
          setHealthStatus(status);
          if (status === EditorHealthStatus.ERROR) {
            setErrorMessage(result.issues.join(", "));
          } else {
            setErrorMessage("");
          }
        }
      );
      healthCheckerRef.current.startMonitoring();

      // 初始化性能监控器
      performanceMonitorRef.current = new EditorPerformanceMonitor(editor);
      performanceMonitorRef.current.startMonitoring();

      // 初始化用户体验优化器
      uxOptimizerRef.current = new EditorUXOptimizer(editor, {
        scroll: {
          smoothScrolling: true,
          autoScrollToNewContent: isStreaming,
          scrollMargin: 20,
          scrollDuration: 300,
        },
        responsiveTyping: !isStreaming,
        autoSave: !isStreaming,
        autoSaveDelay: 2000,
        focusManagement: true,
        keyboardShortcuts: true,
      });

      // 如果是流式模式，启用流式优化
      if (isStreaming) {
        uxOptimizerRef.current.enableStreamingMode();
      }

      onEditorReady?.(editor);

      // 自动聚焦
      if (autoFocus) {
        setTimeout(() => {
          safeEditorCommand(editor, () => editor.commands.focus());
        }, 100);
      }
    },
    onDestroy: () => {
      // 清理健康检查器
      if (healthCheckerRef.current) {
        healthCheckerRef.current.destroy();
        healthCheckerRef.current = null;
      }

      // 清理性能监控器
      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.destroy();
        performanceMonitorRef.current = null;
      }

      // 清理用户体验优化器
      if (uxOptimizerRef.current) {
        uxOptimizerRef.current.destroy();
        uxOptimizerRef.current = null;
      }

      editorRef.current = null;
    },
  });

  // 内容更新效果
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getJSON();
      const newContent = EditorStorageManager.deserialize(content);

      // 比较内容是否真的发生了变化
      if (JSON.stringify(currentContent) !== JSON.stringify(newContent)) {
        editor.commands.setContent(newContent, false);
      }
    }
  }, [content, editor]);

  // 禁用状态更新
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  // 流式状态变化时更新优化器配置
  useEffect(() => {
    if (uxOptimizerRef.current) {
      if (isStreaming) {
        uxOptimizerRef.current.enableStreamingMode();
      } else {
        uxOptimizerRef.current.disableStreamingMode();
      }
    }
  }, [isStreaming]);

  // 组件卸载时的清理
  useEffect(() => {
    return () => {
      if (healthCheckerRef.current) {
        healthCheckerRef.current.destroy();
      }
      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.destroy();
      }
      if (uxOptimizerRef.current) {
        uxOptimizerRef.current.destroy();
      }
    };
  }, []);

  return (
    <EditorErrorBoundary
      onError={(error, errorInfo) => {
        console.error("编辑器错误:", error, errorInfo);
        setHealthStatus(EditorHealthStatus.ERROR);
        setErrorMessage(error.message);
      }}
      showErrorDetails={process.env.NODE_ENV === "development"}
    >
      <div
        className={`wysiwyg-editor ${className} ${disabled ? "disabled" : ""} ${
          healthStatus === EditorHealthStatus.ERROR ? "editor-error" : ""
        } ${
          healthStatus === EditorHealthStatus.WARNING ? "editor-warning" : ""
        }`}
        style={{
          ...style,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        onClick={onClick}
        onMouseDown={onMouseDown}
        title={title}
      >
        {/* 健康状态指示器 */}
        {healthStatus !== EditorHealthStatus.HEALTHY && (
          <div className="editor-health-indicator">
            <span className={`health-status ${healthStatus}`}>
              {healthStatus === EditorHealthStatus.WARNING && "⚠️"}
              {healthStatus === EditorHealthStatus.ERROR && "❌"}
            </span>
            {errorMessage && (
              <span className="health-message" title={errorMessage}>
                {errorMessage}
              </span>
            )}
          </div>
        )}

        <EditorContent editor={editor} />
      </div>
    </EditorErrorBoundary>
  );
};

export default OptimizedWysiwygEditor;
