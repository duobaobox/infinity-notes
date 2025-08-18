import React, { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
// 新增表格扩展导入
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useCanvasStore } from "../../stores/canvasStore";
import TableToolbar from "./editor/TableToolbar";
import {
  createDebouncedScrollbarDetector,
  createScrollbarStateWatchdog,
} from "../../utils/scrollbarUtils";
import "./WysiwygEditor.css";

/**
 * 编辑器配置接口
 */
interface EditorConfig {
  /** 是否启用健康检查 */
  healthCheck?: boolean;
  /** 是否启用性能监控 */
  performanceMonitor?: boolean;
  /** 是否启用UX优化 */
  uxOptimizer?: boolean;
  /** 防抖延迟时间（毫秒） */
  debounceDelay?: number;
  /** 是否启用智能滚动 */
  smartScroll?: boolean;
  /** 是否启用表格功能 */
  enableTable?: boolean;
  /** 表格工具栏配置 */
  tableToolbar?: {
    enabled?: boolean;
    compact?: boolean;
  };
}

/**
 * 默认编辑器配置
 */
const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  healthCheck: false,
  performanceMonitor: false,
  uxOptimizer: false,
  debounceDelay: 100,
  smartScroll: true,
  enableTable: true,
  tableToolbar: {
    enabled: true,
    compact: false,
  },
};

/**
 * 编辑器错误处理 Hook
 */
const useEditorErrorHandler = () => {
  const handleError = useCallback((error: Error, context: string) => {
    console.error(`[Editor Error - ${context}]:`, error);
    // 可以在这里添加错误上报逻辑
  }, []);

  return { handleError };
};

/**
 * 安全地执行编辑器命令，避免在编辑器未挂载时出错
 * 优化版本，增加类型安全
 */
const safeEditorCommand = (
  editor: Editor | null,
  command: () => void
): boolean => {
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
  onEditorReady?: (editor: Editor) => void;
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
  /** 编辑器配置 */
  config?: EditorConfig;
}

/**
 * 将HTML表格转换为Markdown表格格式
 */
const convertTableToMarkdown = (tableElement: Element): string => {
  const rows: string[][] = [];
  let hasHeader = false;

  // 提取表头（thead 或第一行）
  const thead = tableElement.querySelector("thead");
  if (thead) {
    const headerRow = thead.querySelector("tr");
    if (headerRow) {
      const headerCells = Array.from(headerRow.querySelectorAll("th, td")).map(
        (cell) => cell.textContent?.trim() || ""
      );
      rows.push(headerCells);
      hasHeader = true;
    }
  }

  // 提取表体数据
  const tbody = tableElement.querySelector("tbody");
  const dataRows = tbody
    ? Array.from(tbody.querySelectorAll("tr"))
    : Array.from(tableElement.querySelectorAll("tr")).slice(hasHeader ? 0 : 0);

  // 如果没有thead但有数据行，第一行作为表头
  if (!hasHeader && dataRows.length > 0) {
    const firstRow = dataRows[0];
    const headerCells = Array.from(firstRow.querySelectorAll("th, td")).map(
      (cell) => cell.textContent?.trim() || ""
    );
    rows.push(headerCells);
    hasHeader = true;
    dataRows.shift(); // 移除已处理的第一行
  }

  // 处理剩余数据行
  dataRows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td, th")).map(
      (cell) => cell.textContent?.trim() || ""
    );
    rows.push(cells);
  });

  if (rows.length === 0) return "";

  // 确定列数
  const maxCols = Math.max(...rows.map((row) => row.length));

  // 构建Markdown表格
  let markdown = "";

  // 表头
  if (rows.length > 0) {
    const headerRow = rows[0];
    // 补齐列数
    while (headerRow.length < maxCols) {
      headerRow.push("");
    }
    markdown += "| " + headerRow.join(" | ") + " |\n";

    // 分隔行
    markdown += "|" + " --- |".repeat(maxCols) + "\n";
  }

  // 数据行
  rows.slice(1).forEach((row) => {
    // 补齐列数
    while (row.length < maxCols) {
      row.push("");
    }
    markdown += "| " + row.join(" | ") + " |\n";
  });

  return markdown + "\n";
};

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

          // 🎯 关键修复：TipTap TaskList 使用 data-type="taskItem" 和 data-checked 属性
          if (element.getAttribute("data-type") === "taskItem") {
            const isChecked = element.getAttribute("data-checked") === "true";
            return `${indent}- [${isChecked ? "x" : " "}] ${content}\n`;
          }

          // 🎯 备用检查：兼容传统的 checkbox 方式（如果存在）
          const checkbox = element.querySelector(
            'input[type="checkbox"]'
          ) as HTMLInputElement;
          if (checkbox) {
            const isChecked =
              checkbox.checked || checkbox.hasAttribute("checked");

            // 排除checkbox元素，只获取文本内容
            const clonedElement = element.cloneNode(true) as Element;
            const clonedCheckbox = clonedElement.querySelector(
              'input[type="checkbox"]'
            );
            if (clonedCheckbox) {
              clonedCheckbox.remove();
            }
            const textContent = clonedElement.textContent?.trim() || "";

            return `${indent}- [${isChecked ? "x" : " "}] ${textContent}\n`;
          }

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
        case "table":
          return convertTableToMarkdown(element);
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
 * 转换Markdown表格为HTML表格
 * 支持标准Markdown表格语法，生成TipTap兼容的表格HTML
 */
const convertMarkdownTables = (text: string): string => {
  const lines = text.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // 检查是否是表格行（包含管道符 |）
    if (line.includes("|") && line.length > 0) {
      // 查找表格的开始
      const tableStart = i;
      let tableRows: string[] = [];
      let headerRow: string | null = null;
      let separatorRow: string | null = null;

      // 收集表格行
      while (i < lines.length && lines[i].trim().includes("|")) {
        const currentLine = lines[i].trim();
        if (currentLine) {
          if (!headerRow) {
            headerRow = currentLine;
          } else if (!separatorRow && currentLine.match(/^[\|\s\-:]+$/)) {
            separatorRow = currentLine;
          } else {
            tableRows.push(currentLine);
          }
        }
        i++;
      }

      // 验证是否是有效的Markdown表格
      if (headerRow && (separatorRow || tableRows.length > 0)) {
        const tableHtml = buildTableHtml(headerRow, tableRows);
        result.push(tableHtml);
      } else {
        // 不是有效表格，原样保留
        for (let j = tableStart; j < i; j++) {
          result.push(lines[j]);
        }
      }
    } else {
      result.push(lines[i]);
      i++;
    }
  }

  return result.join("\n");
};

/**
 * 构建HTML表格
 */
const buildTableHtml = (headerRow: string, dataRows: string[]): string => {
  // 解析表头
  const headerCells = parseTableRow(headerRow);

  // 生成表头HTML
  const headerHtml = headerCells
    .map((cell) => `<th class="editor-table-header">${cell}</th>`)
    .join("");

  // 生成数据行HTML
  const dataRowsHtml = dataRows
    .map((row) => {
      const cells = parseTableRow(row);
      const cellsHtml = cells
        .map((cell) => `<td class="editor-table-cell">${cell}</td>`)
        .join("");
      return `<tr class="editor-table-row">${cellsHtml}</tr>`;
    })
    .join("");

  // 生成完整表格HTML（使用TipTap表格扩展的类名）
  return `<table class="editor-table">
  <thead>
    <tr class="editor-table-row">${headerHtml}</tr>
  </thead>
  <tbody>
    ${dataRowsHtml}
  </tbody>
</table>`;
};

/**
 * 解析表格行，提取单元格内容
 */
const parseTableRow = (row: string): string[] => {
  // 移除首尾的管道符，然后按管道符分割
  const cleaned = row.replace(/^\||\|$/g, "");
  return cleaned.split("|").map((cell) => cell.trim());
};

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

  // 🎯 新增：Markdown表格转换
  html = convertMarkdownTables(html);

  // 列表处理
  const lines = html.split("\n");
  const processedLines: string[] = [];
  let inList = false;
  let listType = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 🎯 关键修复：先匹配任务列表，再匹配普通列表
    const taskMatch = line.match(/^- \[([ x])\] (.*)$/);
    // 🎯 修复：普通列表正则排除任务列表格式 - 不匹配 [x] 或 [ ]
    const unorderedMatch = line.match(/^- (?!\[[ x]\])(.*)$/);
    const orderedMatch = line.match(/^\d+\. (.*)$/);

    if (taskMatch) {
      // 任务列表项处理
      if (!inList || listType !== "task-list") {
        if (inList)
          processedLines.push(
            `</${listType === "task-list" ? "ul" : listType}>`
          );
        // 🎯 关键修复：生成 TipTap TaskList 兼容的 HTML 结构
        processedLines.push('<ul data-type="taskList">');
        listType = "task-list";
        inList = true;
      }
      const isChecked = taskMatch[1] === "x";
      const content = taskMatch[2];
      // 🎯 使用 TipTap TaskItem 的标准格式：data-type 和 data-checked 属性
      processedLines.push(
        `<li data-type="taskItem" data-checked="${isChecked}">${content}</li>`
      );
    } else if (unorderedMatch) {
      if (!inList || listType !== "ul") {
        if (inList)
          processedLines.push(
            `</${listType === "task-list" ? "ul" : listType}>`
          );
        processedLines.push("<ul>");
        listType = "ul";
        inList = true;
      }
      processedLines.push(`<li>${unorderedMatch[1]}</li>`);
    } else if (orderedMatch) {
      if (!inList || listType !== "ol") {
        if (inList)
          processedLines.push(
            `</${listType === "task-list" ? "ul" : listType}>`
          );
        processedLines.push("<ol>");
        listType = "ol";
        inList = true;
      }
      processedLines.push(`<li>${orderedMatch[1]}</li>`);
    } else {
      if (inList) {
        processedLines.push(`</${listType === "task-list" ? "ul" : listType}>`);
        inList = false;
        listType = "";
      }
      processedLines.push(line);
    }
  }

  if (inList) {
    processedLines.push(`</${listType === "task-list" ? "ul" : listType}>`);
  }

  html = processedLines.join("\n");

  // 段落处理
  const paragraphs = html.split("\n\n").filter((p) => p.trim());
  const processedParagraphs = paragraphs
    .map((p) => {
      const trimmed = p.trim();
      // 如果已经是块级元素，不要包装在p标签中
      if (trimmed.match(/^<(h[1-6]|ul|ol|blockquote|pre|hr|table)/)) {
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
  isStreaming = false,
  config = DEFAULT_EDITOR_CONFIG,
}) => {
  const { handleError } = useEditorErrorHandler();
  const editorRef = useRef<HTMLDivElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const proseMirrorRef = useRef<HTMLElement | null>(null);
  const viewReadyRef = useRef<boolean>(false); // 标记视图是否已准备好
  const lastContentLengthRef = useRef<number>(0); // 记录上次内容长度，用于检测内容增长
  const [showTableToolbar, setShowTableToolbar] = useState(false);

  // 监听画布缩放状态
  const canvasScale = useCanvasStore((state) => state.scale);

  // 监听画布缩放状态（保持原有逻辑）

  // 智能滚动到底部的函数
  const scrollToBottom = useCallback((smooth: boolean = true) => {
    if (proseMirrorRef.current) {
      const element = proseMirrorRef.current;

      // 检查是否需要滚动（内容超出可视区域）
      if (element.scrollHeight > element.clientHeight) {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: smooth ? "smooth" : "auto",
        });

        // 自动滚动完成
      }
    }
  }, []);

  // 创建防抖的滚动条检测函数
  const debouncedScrollbarDetector = useRef(
    createDebouncedScrollbarDetector(16, {
      debug: process.env.NODE_ENV === "development",
    })
  );

  // 健壮的滚动条检测函数
  const checkScrollbarState = useCallback(() => {
    if (!proseMirrorRef.current) return;

    // 使用工具函数进行检测
    debouncedScrollbarDetector.current(proseMirrorRef.current);
  }, []);

  // 防抖更新函数 - 优化防抖时间以减少快速输入时的乱输入问题
  const debouncedOnChange = useCallback(
    (markdown: string) => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(() => {
        onChange(markdown);
      }, config.debounceDelay || 100);
    },
    [onChange, config.debounceDelay]
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
        // 启用斜体功能
        italic: {
          HTMLAttributes: {
            class: "italic-text",
          },
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
      // 新增表格扩展
      ...(config.enableTable
        ? [
            Table.configure({
              resizable: true,
              handleWidth: 5,
              cellMinWidth: 25,
              HTMLAttributes: {
                class: "editor-table",
              },
            }),
            TableRow.configure({
              HTMLAttributes: {
                class: "editor-table-row",
              },
            }),
            TableCell.configure({
              HTMLAttributes: {
                class: "editor-table-cell",
              },
            }),
            TableHeader.configure({
              HTMLAttributes: {
                class: "editor-table-header",
              },
            }),
          ]
        : []),
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

      // 🎯 智能滚动逻辑：检测内容是否增长（用于流式输入场景）
      const currentContentLength = markdown.length;
      const isContentGrowing =
        currentContentLength > lastContentLengthRef.current;

      // 🎯 流式输入时自动滚动到底部
      if (isContentGrowing && isStreaming && config.smartScroll) {
        setTimeout(() => {
          scrollToBottom(true); // 使用平滑滚动
        }, 100);
      }

      lastContentLengthRef.current = currentContentLength;
    },
    onBlur: () => {
      onBlur?.();
    },
    onTransaction: ({ editor }) => {
      // 在第一次事务时，视图应该已经完全准备好
      if (
        !viewReadyRef.current &&
        editor.view &&
        editor.view.dom &&
        editor.view.dom &&
        editor.view.dom.parentNode
      ) {
        viewReadyRef.current = true;

        // 安全地获取ProseMirror元素引用
        try {
          const proseMirrorElement = editor.view.dom;
          proseMirrorRef.current = proseMirrorElement;

          // 初始检测滚动条状态
          checkScrollbarState();
        } catch (error) {
          console.warn("在备用获取编辑器视图时出错:", error);
        }
      }
    },
    onCreate: ({ editor }) => {
      // 编辑器创建后的初始化
      if (autoFocus) {
        // 使用更长的延迟确保编辑器完全挂载
        setTimeout(() => {
          safeEditorCommand(editor, () => editor.commands.focus());
        }, 200);
      }

      // 检查是否在表格中以显示表格工具栏
      if (config.enableTable && config.tableToolbar?.enabled) {
        const updateTableToolbar = () => {
          setShowTableToolbar(editor.isActive("table"));
        };
        updateTableToolbar();

        // 监听选择变化以更新表格工具栏
        editor.on("selectionUpdate", updateTableToolbar);
        editor.on("update", updateTableToolbar);
      }

      // 备用方案：如果onTransaction没有成功获取视图，则使用重试机制
      // 延迟检查，给onTransaction一些时间先尝试
      setTimeout(() => {
        if (!viewReadyRef.current) {
          const tryGetEditorView = (attempt = 1, maxAttempts = 3) => {
            try {
              // 更严格的检查：确保编辑器没有被销毁且视图完全可用
              if (
                editor &&
                !editor.isDestroyed &&
                editor.view &&
                editor.view.dom &&
                editor.view.dom.parentNode
              ) {
                viewReadyRef.current = true;
                const proseMirrorElement = editor.view.dom;
                proseMirrorRef.current = proseMirrorElement;

                // 初始检测滚动条状态
                checkScrollbarState();
                return; // 成功获取，退出重试
              }

              // 如果还没达到最大重试次数，继续重试
              if (attempt < maxAttempts) {
                const delay = attempt * 200; // 递增延迟：200ms, 400ms
                setTimeout(() => {
                  tryGetEditorView(attempt + 1, maxAttempts);
                }, delay);
              }
            } catch (error) {
              handleError(error as Error, "获取编辑器视图重试");
              // 如果还没达到最大重试次数，继续重试
              if (attempt < maxAttempts) {
                const delay = attempt * 200;
                setTimeout(() => {
                  tryGetEditorView(attempt + 1, maxAttempts);
                }, delay);
              }
            }
          };

          tryGetEditorView();
        }
      }, 300); // 给onTransaction 300ms的时间先尝试

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

      // 🎯 检测是否是流式输入：使用传入的isStreaming属性
      const isContentGrowing = content.length > lastContentLengthRef.current;

      // 使用 setContent 而不是 insertContent 来替换全部内容
      editor.commands.setContent(newHtml, { emitUpdate: false }); // 不触发 onUpdate

      // 内容更新后检测滚动条状态
      setTimeout(checkScrollbarState, 50);

      // 🎯 流式输入时自动滚动到底部
      if (isContentGrowing && isStreaming && config.smartScroll) {
        setTimeout(() => {
          scrollToBottom(true); // 使用平滑滚动
        }, 100);
      }

      lastContentLengthRef.current = content.length;
    }
  }, [content, editor, checkScrollbarState, scrollToBottom, isStreaming]);

  // 当 disabled 状态变化时更新编辑器的可编辑状态
  useEffect(() => {
    if (!editor) return;

    editor.setEditable(!disabled);

    // 如果启用编辑且需要自动聚焦
    if (!disabled && autoFocus) {
      setTimeout(() => {
        safeEditorCommand(editor, () => editor.commands.focus());
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
      // 使用多次检测确保字体大小变化已经完全应用到DOM
      // 第一次检测：立即检测
      checkScrollbarState();

      // 第二次检测：短延迟后检测，确保CSS变量已应用
      setTimeout(() => {
        checkScrollbarState();
      }, 50);

      // 第三次检测：较长延迟后检测，确保所有渲染完成
      setTimeout(() => {
        checkScrollbarState();
      }, 150);
    }
  }, [canvasScale, checkScrollbarState]);

  // 统一的滚动条检测监听器
  useEffect(() => {
    if (!editor || !proseMirrorRef.current) return;

    const element = proseMirrorRef.current;

    // 初始检测
    checkScrollbarState();

    // 创建观察器
    const resizeObserver = new ResizeObserver(checkScrollbarState);
    const mutationObserver = new MutationObserver(checkScrollbarState);

    // 启动兜底监控
    const watchdogCleanup = createScrollbarStateWatchdog(
      element.closest(".sticky-note-content") || element,
      5000,
      { debug: false }
    );

    // 事件处理函数
    const handleResize = checkScrollbarState;
    const handleVisibilityChange = () => {
      if (!document.hidden) checkScrollbarState();
    };
    const handleEditorUpdate = () => setTimeout(checkScrollbarState, 0);

    try {
      // 启动观察器
      resizeObserver.observe(element);
      mutationObserver.observe(element, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      // 绑定事件监听
      window.addEventListener("resize", handleResize);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      // 编辑器事件
      editor.on("update", handleEditorUpdate);
      editor.on("focus", handleEditorUpdate);
    } catch (error) {
      console.warn("Failed to setup scrollbar observers:", error);
    }

    return () => {
      try {
        resizeObserver.disconnect();
        mutationObserver.disconnect();
        watchdogCleanup();

        window.removeEventListener("resize", handleResize);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );

        editor.off("update", handleEditorUpdate);
        editor.off("focus", handleEditorUpdate);
      } catch (error) {
        console.warn("Error during observer cleanup:", error);
      }
    };
  }, [editor, checkScrollbarState]);

  // 组件卸载时销毁编辑器和清理定时器
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      // 重置视图准备状态
      viewReadyRef.current = false;
      proseMirrorRef.current = null;
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
      {/* 表格工具栏 - 仅在启用表格功能且处于编辑状态时显示 */}
      {config.enableTable &&
        config.tableToolbar?.enabled &&
        !disabled &&
        showTableToolbar && (
          <TableToolbar
            editor={editor}
            visible={true}
            compact={config.tableToolbar.compact}
            className="editor-table-toolbar"
          />
        )}

      <EditorContent editor={editor} />
    </div>
  );
};

export default WysiwygEditor;
export { safeEditorCommand };
