import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

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

    for (let i = 0; i < lines.length; i += linesPerPage) {
      const pageLines = lines.slice(i, i + linesPerPage);
      pagesArray.push(pageLines.join("\n"));
    }

    return pagesArray.length > 0 ? pagesArray : [content];
  }, [content, shouldUsePagination]);

  // 当前显示的内容（包含已加载的所有页面）
  const displayContent = useMemo(() => {
    if (!shouldUsePagination) {
      return content;
    }

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
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
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
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
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
