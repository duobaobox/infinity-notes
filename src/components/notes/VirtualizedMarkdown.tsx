import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

// 自定义链接组件 - 在新标签页中打开链接
// 使用React.AnchorHTMLAttributes来确保类型兼容性
const CustomLink: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = ({
  href,
  children,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发便签的点击事件
  };

  return (
    <a
      {...props} // 传递所有其他属性
      href={href}
      target="_blank" // 在新标签页中打开
      rel="noopener noreferrer" // 安全性设置
      onClick={handleClick}
      style={{
        color: "#1890ff", // 蓝色链接
        textDecoration: "underline",
        cursor: "pointer",
        ...props.style, // 合并传入的样式
      }}
    >
      {children}
    </a>
  );
};

// 优化后的Markdown组件属性接口
interface VirtualizedMarkdownProps {
  /** Markdown内容 */
  content: string;
  /** 容器引用，用于监听滚动事件 */
  containerRef: React.RefObject<HTMLDivElement>;
  /** 是否启用虚拟化（默认true，内容少时可禁用） */
  enableVirtualization?: boolean;
  /** 内容长度阈值，超过此值才启用虚拟化（默认8000字符） */
  virtualizationThreshold?: number;
  /** 是否正在流式生成（流式时禁用虚拟化） */
  isStreaming?: boolean;
  /** 流式生成时显示的光标 */
  streamingCursor?: React.ReactNode;
}

/**
 * 智能分页Markdown渲染组件
 * 采用简单有效的分页策略，避免复杂虚拟化带来的滚动问题
 */
const VirtualizedMarkdown: React.FC<VirtualizedMarkdownProps> = ({
  content,
  containerRef,
  enableVirtualization = true,
  virtualizationThreshold = 8000,
  isStreaming = false,
  streamingCursor,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 判断是否需要使用分页
  const shouldUsePagination = useMemo(() => {
    return (
      enableVirtualization &&
      !isStreaming &&
      content.length > virtualizationThreshold
    );
  }, [
    enableVirtualization,
    isStreaming,
    content.length,
    virtualizationThreshold,
  ]);

  // 将内容按段落分页，保持Markdown语法完整性
  const pages = useMemo(() => {
    if (!shouldUsePagination) {
      return [content];
    }

    const lines = content.split("\n");
    const pagesArray: string[] = [];
    const linesPerPage = 100; // 每页显示的行数

    let currentPageLines: string[] = [];
    let lineCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      currentPageLines.push(line);
      lineCount++;

      // 检查是否应该分页（避免在代码块中间分页）
      const shouldBreak =
        lineCount >= linesPerPage &&
        !isInsideCodeBlock(currentPageLines) &&
        !isInsideTable(line, lines[i + 1]);

      if (shouldBreak || i === lines.length - 1) {
        pagesArray.push(currentPageLines.join("\n"));
        currentPageLines = [];
        lineCount = 0;
      }
    }

    return pagesArray.length > 0 ? pagesArray : [content];
  }, [content, shouldUsePagination]);

  // 检查是否在代码块内部
  const isInsideCodeBlock = (lines: string[]): boolean => {
    let codeBlockCount = 0;
    for (const line of lines) {
      if (line.trim().startsWith("```")) {
        codeBlockCount++;
      }
    }
    return codeBlockCount % 2 !== 0; // 奇数表示在代码块内
  };

  // 检查是否在表格中
  const isInsideTable = (currentLine: string, nextLine?: string): boolean => {
    const tablePattern = /^\|.*\|$/;
    return (
      tablePattern.test(currentLine.trim()) ||
      (nextLine ? tablePattern.test(nextLine.trim()) : false)
    );
  };

  // 当前显示的内容（包含已加载的所有页面）
  const displayContent = useMemo(() => {
    if (!shouldUsePagination) {
      return content;
    }

    // 渐进式加载：显示从第一页到当前页的所有内容
    const currentPages = pages.slice(0, currentPage + 1);
    return currentPages.join("\n\n---\n\n"); // 页面间添加分隔符
  }, [pages, currentPage, shouldUsePagination, content]);

  // 使用 Intersection Observer 检测是否需要加载更多内容
  useEffect(() => {
    if (!shouldUsePagination || !loadMoreRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsIntersecting(entry.isIntersecting);
      },
      {
        root: containerRef.current,
        threshold: 0.1,
        rootMargin: "100px",
      }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [shouldUsePagination, containerRef]);

  // 当元素进入视区时加载下一页
  useEffect(() => {
    if (isIntersecting && currentPage < pages.length - 1) {
      // 使用 setTimeout 避免过于频繁的更新
      const timer = setTimeout(() => {
        setCurrentPage((prev) => Math.min(prev + 1, pages.length - 1));
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isIntersecting, currentPage, pages.length]);

  // 重置分页状态当内容改变时
  useEffect(() => {
    setCurrentPage(0);
  }, [content]);

  // 如果不需要分页，直接渲染全部内容
  if (!shouldUsePagination) {
    return (
      <div className="streaming-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            a: CustomLink, // 使用自定义链接组件
          }}
        >
          {content}
        </ReactMarkdown>
        {isStreaming && streamingCursor}
      </div>
    );
  }

  return (
    <div className="paginated-markdown-container">
      {/* 已加载的内容 */}
      <div className="streaming-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            a: CustomLink, // 使用自定义链接组件
          }}
        >
          {displayContent}
        </ReactMarkdown>
      </div>

      {/* 加载更多内容的触发器 */}
      {currentPage < pages.length - 1 && (
        <div
          ref={loadMoreRef}
          className="load-more-trigger"
          style={{
            height: "20px",
            margin: "20px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
            fontSize: "12px",
            opacity: 0.7,
          }}
        >
          {isIntersecting ? "正在加载更多内容..." : ""}
        </div>
      )}

      {/* 内容加载完成提示 */}
      {currentPage >= pages.length - 1 && pages.length > 1 && (
        <div
          className="content-end-indicator"
          style={{
            height: "20px",
            margin: "20px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
            fontSize: "12px",
            opacity: 0.5,
          }}
        >
          内容已全部加载完成
        </div>
      )}
    </div>
  );
};

// 使用React.memo优化性能，避免不必要的重渲染
export default memo(VirtualizedMarkdown);
