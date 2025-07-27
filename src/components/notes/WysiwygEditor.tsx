import React, { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useCanvasStore } from "../../stores/canvasStore";
import "./WysiwygEditor.css";

/**
 * 安全地执行编辑器命令，避免在编辑器未挂载时出错
 * 使用简单但可靠的检查机制
 */
const safeEditorCommand = (
  editor: any,
  command: () => void,
  _errorMessage: string = "编辑器命令执行失败"
) => {
  // 基本检查
  if (!editor) {
    return false;
  }

  try {
    // 检查编辑器是否已销毁
    if (editor.isDestroyed) {
      return false;
    }

    // 检查编辑器命令是否可用
    if (!editor.commands) {
      return false;
    }

    // 直接执行命令，让TipTap内部处理错误
    command();
    return true;
  } catch (error) {
    // 静默处理错误，避免控制台噪音
    return false;
  }
};

/**
 * 所见即所得编辑器组件属性接口
 */
interface WysiwygEditorProps {
  /** 编辑器内容（Markdown格式） */
  content: string;
  /** 内容变化回调函数 */
  onChange: (content: string) => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 是否自动聚焦 */
  autoFocus?: boolean;
  /** 编辑器失焦回调 */
  onBlur?: () => void;
  /** 键盘事件回调 */
  onKeyDown?: (event: KeyboardEvent) => boolean;
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
}

/**
 * 将HTML转换为Markdown的改进转换器
 * 用于将TipTap的HTML输出转换为Markdown格式存储
 */
const htmlToMarkdown = (html: string): string => {
  if (!html || html === "<p></p>") return "";

  // 创建临时DOM元素来解析HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // 递归转换节点为Markdown
  const convertNode = (node: Node, listDepth = 0): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const children = Array.from(element.childNodes)
        .map((child) => convertNode(child, listDepth))
        .join("");

      const tagName = element.tagName.toLowerCase();

      // 处理标题标签 - 统一逻辑
      if (tagName.match(/^h[1-6]$/)) {
        const level = parseInt(tagName.charAt(1));
        const hashes = "#".repeat(level);
        return `${hashes} ${children.trim()}\n\n`;
      }

      switch (tagName) {
        case "p":
          const trimmed = children.trim();
          return trimmed ? `${trimmed}\n\n` : "\n";
        case "strong":
        case "b":
          return `**${children}**`;
        case "em":
        case "i":
          return `*${children}*`;
        case "s":
        case "strike":
        case "del":
          return `~~${children}~~`;
        case "code":
          return `\`${children}\``;
        case "pre":
          const codeContent =
            element.querySelector("code")?.textContent || children;
          return `\`\`\`\n${codeContent}\n\`\`\`\n\n`;
        case "ul":
          return `${children}`;
        case "ol":
          return `${children}`;
        case "li": {
          const parent = element.parentElement;
          const indent = "  ".repeat(listDepth);
          const content = children.trim();

          if (parent?.tagName.toLowerCase() === "ul") {
            return `${indent}- ${content}\n`;
          } else if (parent?.tagName.toLowerCase() === "ol") {
            const index = Array.from(parent.children).indexOf(element) + 1;
            return `${indent}${index}. ${content}\n`;
          }
          return `${indent}- ${content}\n`;
        }
        case "blockquote":
          return `> ${children.trim()}\n\n`;
        case "a": {
          const href = element.getAttribute("href");
          return href ? `[${children}](${href})` : children;
        }
        case "img": {
          const src = element.getAttribute("src");
          const alt = element.getAttribute("alt") || "";
          return src ? `![${alt}](${src})\n\n` : "";
        }
        case "br":
          return "\n";
        case "hr":
          return "---\n\n";
        case "div":
          return children;
        default:
          return children;
      }
    }

    return "";
  };

  const result = convertNode(tempDiv).trim();
  // 清理多余的空行
  return result.replace(/\n{3,}/g, "\n\n");
};

/**
 * 代码处理工具类 - 提取公共的代码保护逻辑
 */
class CodeProcessor {
  private codeBlocks: string[] = [];
  private inlineCodes: string[] = [];

  /**
   * 保护代码块和行内代码，避免被其他转换影响
   */
  protect(text: string): string {
    let result = text;

    // 先处理代码块
    result = result.replace(/```([\s\S]*?)```/g, (_match, code) => {
      const index = this.codeBlocks.length;
      this.codeBlocks.push(code);
      return `__CODE_BLOCK_${index}__`;
    });

    // 处理行内代码
    result = result.replace(/`([^`]+)`/g, (_match, code) => {
      const index = this.inlineCodes.length;
      this.inlineCodes.push(code);
      return `__INLINE_CODE_${index}__`;
    });

    return result;
  }

  /**
   * 恢复代码块和行内代码为HTML格式
   */
  restoreAsHtml(text: string): string {
    let result = text;

    // 恢复代码块
    result = result.replace(/__CODE_BLOCK_(\d+)__/g, (_match, index) => {
      return `<pre><code>${this.codeBlocks[parseInt(index)]}</code></pre>`;
    });

    // 恢复行内代码
    result = result.replace(/__INLINE_CODE_(\d+)__/g, (_match, index) => {
      return `<code>${this.inlineCodes[parseInt(index)]}</code>`;
    });

    return result;
  }

  /**
   * 重置处理器状态
   */
  reset(): void {
    this.codeBlocks = [];
    this.inlineCodes = [];
  }
}

/**
 * 将Markdown转换为HTML的改进转换器
 * 用于将存储的Markdown转换为TipTap可以理解的HTML
 */
const markdownToHtml = (markdown: string): string => {
  if (!markdown.trim()) return "<p></p>";

  const codeProcessor = new CodeProcessor();
  let html = codeProcessor.protect(markdown);

  // 标题转换 - 统一处理所有级别
  html = html.replace(/^(#{1,6}) (.*$)/gm, (_match, hashes, content) => {
    const level = hashes.length;
    return `<h${level}>${content}</h${level}>`;
  });

  // 粗体和斜体（注意顺序，先处理粗体）
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // 删除线
  html = html.replace(/~~([^~]+)~~/g, "<s>$1</s>");

  // 链接
  html = html.replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2">$1</a>');

  // 图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, '<img src="$2" alt="$1" />');

  // 引用
  html = html.replace(/^&gt; (.*$)/gm, "<blockquote>$1</blockquote>");

  // 分割线
  html = html.replace(/^---$/gm, "<hr>");

  // 列表处理
  const lines = html.split("\n");
  const processedLines: string[] = [];
  let inList = false;
  let listType = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const unorderedMatch = line.match(/^- (.*)$/);
    const orderedMatch = line.match(/^\d+\. (.*)$/);

    if (unorderedMatch) {
      if (!inList || listType !== "ul") {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push("<ul>");
        listType = "ul";
        inList = true;
      }
      processedLines.push(`<li>${unorderedMatch[1]}</li>`);
    } else if (orderedMatch) {
      if (!inList || listType !== "ol") {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push("<ol>");
        listType = "ol";
        inList = true;
      }
      processedLines.push(`<li>${orderedMatch[1]}</li>`);
    } else {
      if (inList) {
        processedLines.push(`</${listType}>`);
        inList = false;
        listType = "";
      }
      processedLines.push(line);
    }
  }

  if (inList) {
    processedLines.push(`</${listType}>`);
  }

  html = processedLines.join("\n");

  // 段落处理
  const paragraphs = html.split("\n\n").filter((p) => p.trim());
  const processedParagraphs = paragraphs
    .map((p) => {
      const trimmed = p.trim();
      // 如果已经是块级元素，不要包装在p标签中
      if (trimmed.match(/^<(h[1-6]|ul|ol|blockquote|pre|hr)/)) {
        return trimmed;
      }
      // 如果是空行，跳过
      if (!trimmed) {
        return "";
      }
      return `<p>${trimmed}</p>`;
    })
    .filter((p) => p);

  // 恢复代码块和行内代码
  const finalHtml = codeProcessor.restoreAsHtml(processedParagraphs.join(""));

  return finalHtml || "<p></p>";
};

/**
 * 所见即所得编辑器组件
 * 基于TipTap实现，支持Markdown语法自动识别和转换
 */
const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  content,
  onChange,
  placeholder = "开始输入...",
  autoFocus = false,
  onBlur,
  onKeyDown,
  disabled = false,
  className = "",
  onEditorReady,
  onClick,
  onMouseDown,
  style,
  title,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const proseMirrorRef = useRef<HTMLElement | null>(null);

  // 监听画布缩放状态
  const canvasScale = useCanvasStore((state) => state.scale);

  // 检测滚动条状态的函数
  const checkScrollbarState = useCallback(() => {
    if (proseMirrorRef.current) {
      const element = proseMirrorRef.current;
      const hasVerticalScrollbar = element.scrollHeight > element.clientHeight;

      // 设置data属性用于CSS选择器
      element.setAttribute("data-scrollable", hasVerticalScrollbar.toString());

      // 为父容器添加/移除类名（兼容不支持:has()的浏览器）
      const contentContainer = element.closest(".sticky-note-content");
      if (contentContainer) {
        if (hasVerticalScrollbar) {
          contentContainer.classList.add("has-scrollbar");
        } else {
          contentContainer.classList.remove("has-scrollbar");
        }
      }
    }
  }, []);

  // 防抖更新函数 - 优化防抖时间以减少快速输入时的乱输入问题
  const debouncedOnChange = useCallback(
    (markdown: string) => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(() => {
        onChange(markdown);
      }, 100); // 减少到100ms防抖，提高响应性同时避免过于频繁的更新
    },
    [onChange]
  );

  // 创建TipTap编辑器实例
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // 配置内置扩展
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        // 配置内置的 codeBlock 扩展
        codeBlock: {
          HTMLAttributes: {
            class: "code-block",
          },
        },
        // 配置内置的 link 扩展
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: "editor-link",
          },
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Image.configure({
        HTMLAttributes: {
          class: "editor-image",
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "task-list",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "task-item",
        },
      }),
    ],
    content: markdownToHtml(content),
    editable: !disabled,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      // 将编辑器内容转换为Markdown并回调
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      debouncedOnChange(markdown);

      // 内容更新后检测滚动条状态
      setTimeout(checkScrollbarState, 50);
    },
    onBlur: () => {
      onBlur?.();
    },
    onCreate: ({ editor }) => {
      // 编辑器创建后的初始化
      if (autoFocus) {
        // 使用更长的延迟确保编辑器完全挂载
        setTimeout(() => {
          safeEditorCommand(
            editor,
            () => editor.commands.focus(),
            "编辑器创建时聚焦失败"
          );
        }, 200);
      }

      // 获取ProseMirror元素引用
      setTimeout(() => {
        const proseMirrorElement = editor.view.dom;
        proseMirrorRef.current = proseMirrorElement;

        // 初始检测滚动条状态
        checkScrollbarState();
      }, 100);

      // 将编辑器实例传递给父组件
      onEditorReady?.(editor);
    },
  });

  // 处理键盘事件
  useEffect(() => {
    if (!editor || !onKeyDown) return;

    const handleKeyDown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      // 如果外部处理了事件，则阻止默认行为
      if (onKeyDown(keyboardEvent)) {
        event.preventDefault();
        return false;
      }
      return true;
    };

    const editorElement = editorRef.current?.querySelector(".ProseMirror");
    if (editorElement) {
      editorElement.addEventListener("keydown", handleKeyDown);
      return () => {
        editorElement.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [editor, onKeyDown]);

  // 当外部内容变化时更新编辑器
  useEffect(() => {
    if (!editor) return;

    const currentMarkdown = htmlToMarkdown(editor.getHTML());
    // 只有当内容真正不同时才更新，避免无限循环
    if (content !== currentMarkdown) {
      const newHtml = markdownToHtml(content);
      // 使用 setContent 而不是 insertContent 来替换全部内容
      editor.commands.setContent(newHtml, { emitUpdate: false }); // 不触发 onUpdate

      // 内容更新后检测滚动条状态
      setTimeout(checkScrollbarState, 50);
    }
  }, [content, editor, checkScrollbarState]);

  // 当 disabled 状态变化时更新编辑器的可编辑状态
  useEffect(() => {
    if (!editor) return;

    editor.setEditable(!disabled);

    // 如果启用编辑且需要自动聚焦
    if (!disabled && autoFocus) {
      setTimeout(() => {
        safeEditorCommand(
          editor,
          () => editor.commands.focus(),
          "编辑器自动聚焦失败"
        );
      }, 200);
    }
  }, [disabled, autoFocus, editor]);

  // 监听编辑器尺寸变化以检测滚动条状态
  useEffect(() => {
    if (!editor || !proseMirrorRef.current) return;

    const element = proseMirrorRef.current;

    // 创建ResizeObserver监听尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      // 使用 requestAnimationFrame 确保在DOM更新后检测
      requestAnimationFrame(() => {
        checkScrollbarState();
      });
    });

    resizeObserver.observe(element);

    // 也监听内容变化
    const mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(() => {
        checkScrollbarState();
      });
    });

    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // 清理函数
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [editor, checkScrollbarState]);

  // 监听画布缩放变化，重新检测滚动条状态
  useEffect(() => {
    // 当画布缩放发生变化时，字体大小会改变，内容高度也会改变
    // 需要重新检测是否需要滚动条
    if (proseMirrorRef.current) {
      // 使用延迟确保字体大小变化已经应用到DOM
      setTimeout(() => {
        checkScrollbarState();
      }, 100);
    }
  }, [canvasScale, checkScrollbarState]);

  // 组件卸载时销毁编辑器和清理定时器
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) {
    return <div className="wysiwyg-editor-loading">加载编辑器...</div>;
  }

  return (
    <div
      ref={editorRef}
      className={`wysiwyg-editor ${className} ${
        disabled ? "disabled" : "editing"
      }`}
      onClick={onClick}
      onMouseDown={onMouseDown}
      style={style}
      title={title}
    >
      <EditorContent editor={editor} />
    </div>
  );
};

export default WysiwygEditor;
export { safeEditorCommand };
