import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import type { StickyNoteProps } from "./types";
import "./StickyNote.css";
import { Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  onUpdate,
  onDelete,
  onBringToFront,
  canvasScale,
  canvasOffset, // 新增：画布偏移量
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSyncingPosition, setIsSyncingPosition] = useState(false); // 位置同步状态
  const [isSyncingSize, setIsSyncingSize] = useState(false); // 新增：尺寸同步状态
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // 拖动期间的临时位置和尺寸
  const [tempPosition, setTempPosition] = useState({ x: note.x, y: note.y });
  const [tempSize, setTempSize] = useState({
    width: note.width,
    height: note.height,
  });

  // 本地编辑状态管理 - 不通过数据库同步
  const [isEditing, setIsEditing] = useState(note.isEditing);
  const [isTitleEditing, setIsTitleEditing] = useState(note.isTitleEditing);

  // 中文输入法合成状态跟踪
  const [isComposing, setIsComposing] = useState(false);
  const [isTitleComposing, setIsTitleComposing] = useState(false);

  // 本地内容状态，用于在输入期间避免外部更新干扰
  const [localContent, setLocalContent] = useState(note.content);
  const [localTitle, setLocalTitle] = useState(note.title);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // 防抖更新的 timer
  const contentUpdateTimerRef = useRef<number | null>(null);
  const titleUpdateTimerRef = useRef<number | null>(null);

  // 开始编辑内容
  const startEditing = useCallback(() => {
    setIsEditing(true);
    setLocalContent(note.content);
  }, [note.content]);

  // 停止编辑内容
  const stopEditing = useCallback(() => {
    setIsEditing(false);
    // 清理防抖计时器
    if (contentUpdateTimerRef.current) {
      clearTimeout(contentUpdateTimerRef.current);
      contentUpdateTimerRef.current = null;
    }
    // 最后一次保存确保数据同步
    onUpdate(note.id, { content: localContent, updatedAt: new Date() });
  }, [note.id, onUpdate, localContent]);

  // 开始编辑标题
  const startTitleEditing = useCallback(() => {
    setIsTitleEditing(true);
    setLocalTitle(note.title);
  }, [note.title]);

  // 停止编辑标题
  const stopTitleEditing = useCallback(() => {
    setIsTitleEditing(false);
    // 清理防抖计时器
    if (titleUpdateTimerRef.current) {
      clearTimeout(titleUpdateTimerRef.current);
      titleUpdateTimerRef.current = null;
    }
    // 最后一次保存确保数据同步
    onUpdate(note.id, { title: localTitle, updatedAt: new Date() });
  }, [note.id, onUpdate, localTitle]);

  // 防抖更新内容到数据库
  const debouncedUpdateContent = useCallback(
    (newContent: string) => {
      if (contentUpdateTimerRef.current) {
        clearTimeout(contentUpdateTimerRef.current);
      }
      contentUpdateTimerRef.current = setTimeout(() => {
        onUpdate(note.id, { content: newContent });
        contentUpdateTimerRef.current = null;
      }, 300); // 300ms 防抖
    },
    [note.id, onUpdate]
  );

  // 防抖更新标题到数据库
  const debouncedUpdateTitle = useCallback(
    (newTitle: string) => {
      if (titleUpdateTimerRef.current) {
        clearTimeout(titleUpdateTimerRef.current);
      }
      titleUpdateTimerRef.current = setTimeout(() => {
        onUpdate(note.id, { title: newTitle });
        titleUpdateTimerRef.current = null;
      }, 300); // 300ms 防抖
    },
    [note.id, onUpdate]
  );

  // 内容合成事件处理
  const handleContentCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleContentCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      setIsComposing(false);
      const newContent = e.currentTarget.value;
      setLocalContent(newContent);
      debouncedUpdateContent(newContent);
    },
    [debouncedUpdateContent]
  );

  // 标题合成事件处理
  const handleTitleCompositionStart = useCallback(() => {
    setIsTitleComposing(true);
  }, []);

  const handleTitleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      setIsTitleComposing(false);
      const newTitle = e.currentTarget.value;
      setLocalTitle(newTitle);
      debouncedUpdateTitle(newTitle);
    },
    [debouncedUpdateTitle]
  );

  // 内容变化处理
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setLocalContent(newContent);

      // 如果不是合成事件期间，则正常更新
      if (!isComposing) {
        debouncedUpdateContent(newContent);
      }
    },
    [isComposing, debouncedUpdateContent]
  );

  // 标题变化处理
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setLocalTitle(newTitle);

      // 如果不是合成事件期间，则正常更新
      if (!isTitleComposing) {
        debouncedUpdateTitle(newTitle);
      }
    },
    [isTitleComposing, debouncedUpdateTitle]
  );

  // 删除便签
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault(); // 添加阻止默认行为

      // 立即删除便签，不管当前状态如何
      // 确保删除操作优先于任何其他状态更新
      setTimeout(() => {
        onDelete(note.id);
      }, 0);

      // 如果当前处于编辑状态，将编辑状态设为false，但不保存内容
      if (isEditing || isTitleEditing) {
        setIsEditing(false);
        setIsTitleEditing(false);
      }
    },
    [note.id, isEditing, isTitleEditing, onDelete]
  );

  // 鼠标按下开始拖拽
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isEditing || isTitleEditing) return;

      e.preventDefault();
      e.stopPropagation();

      // 计算鼠标在画布坐标系中的位置
      const canvasX = (e.clientX - canvasOffset.x) / canvasScale;
      const canvasY = (e.clientY - canvasOffset.y) / canvasScale;

      // 计算鼠标相对于便签的偏移量
      setDragOffset({
        x: canvasX - note.x,
        y: canvasY - note.y,
      });

      // 初始化临时位置为当前位置
      setTempPosition({ x: note.x, y: note.y });
      setIsDragging(true);

      // 延迟执行置顶操作，避免拖动初期的卡顿
      setTimeout(() => {
        onBringToFront(note.id);
      }, 50);
    },
    [
      isEditing,
      isTitleEditing,
      note.id,
      note.x,
      note.y,
      onBringToFront,
      canvasScale,
      canvasOffset,
    ]
  );

  // 开始调整大小
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setResizeStart({
        x: e.clientX / canvasScale,
        y: e.clientY / canvasScale,
        width: note.width,
        height: note.height,
      });

      // 初始化临时尺寸为当前尺寸
      setTempSize({ width: note.width, height: note.height });
      setIsResizing(true);
    },
    [note.width, note.height, canvasScale]
  );

  // 全局鼠标移动处理
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // 取消之前的动画帧
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        // 使用 requestAnimationFrame 优化性能
        rafRef.current = requestAnimationFrame(() => {
          // 将屏幕坐标转换为画布逻辑坐标
          const canvasX = (e.clientX - canvasOffset.x) / canvasScale;
          const canvasY = (e.clientY - canvasOffset.y) / canvasScale;
          const newX = canvasX - dragOffset.x;
          const newY = canvasY - dragOffset.y;

          // 使用临时状态来更新位置，避免频繁的数据库操作
          setTempPosition({ x: newX, y: newY });
        });
      } else if (isResizing) {
        // 取消之前的动画帧
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        // 使用 requestAnimationFrame 优化性能
        rafRef.current = requestAnimationFrame(() => {
          const deltaX = e.clientX / canvasScale - resizeStart.x;
          const deltaY = e.clientY / canvasScale - resizeStart.y;
          const newWidth = Math.max(200, resizeStart.width + deltaX);
          const newHeight = Math.max(150, resizeStart.height + deltaY);

          // 使用临时状态来更新尺寸，避免频繁的数据库操作
          setTempSize({ width: newWidth, height: newHeight });
        });
      }
    };

    const handleMouseUp = () => {
      // 清理动画帧
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (isDragging) {
        // 拖动结束时，将临时位置同步到数据库
        onUpdate(note.id, {
          x: tempPosition.x,
          y: tempPosition.y,
          updatedAt: new Date(),
        });
        setIsDragging(false); // 首先设置 dragging 为 false
        setIsSyncingPosition(true); // 然后设置 syncing 为 true
      }

      if (isResizing) {
        // 调整大小结束时，将临时尺寸同步到数据库
        onUpdate(note.id, {
          width: tempSize.width,
          height: tempSize.height,
          updatedAt: new Date(),
        });
        setIsResizing(false); // 首先设置 resizing 为 false
        setIsSyncingSize(true); // 然后设置 syncing 为 true
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      // 清理动画帧
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [
    isDragging,
    isResizing,
    dragOffset.x,
    dragOffset.y,
    resizeStart.x,
    resizeStart.y,
    resizeStart.width,
    resizeStart.height,
    note.id,
    onUpdate,
    canvasScale,
    canvasOffset.x,
    canvasOffset.y,
    tempPosition.x,
    tempPosition.y,
    tempSize.width,
    tempSize.height,
  ]);

  // 处理位置同步的 Effect
  useEffect(() => {
    if (
      isSyncingPosition &&
      note.x === tempPosition.x &&
      note.y === tempPosition.y
    ) {
      setIsSyncingPosition(false);
    }
  }, [note.x, note.y, tempPosition.x, tempPosition.y, isSyncingPosition]);

  // 处理尺寸同步的 Effect
  useEffect(() => {
    if (
      isSyncingSize &&
      note.width === tempSize.width &&
      note.height === tempSize.height
    ) {
      setIsSyncingSize(false);
    }
  }, [note.width, note.height, tempSize.width, tempSize.height, isSyncingSize]);

  // 同步外部 props 到本地状态（仅在非编辑状态下）
  useEffect(() => {
    if (!isEditing && !isComposing) {
      setLocalContent(note.content);
    }
  }, [note.content, isEditing, isComposing]);

  useEffect(() => {
    if (!isTitleEditing && !isTitleComposing) {
      setLocalTitle(note.title);
    }
  }, [note.title, isTitleEditing, isTitleComposing]);

  // 清理防抖计时器
  useEffect(() => {
    return () => {
      if (contentUpdateTimerRef.current) {
        clearTimeout(contentUpdateTimerRef.current);
      }
      if (titleUpdateTimerRef.current) {
        clearTimeout(titleUpdateTimerRef.current);
      }
    };
  }, []);

  // 当 note 的位置从 props 更新时，同步 tempPosition (非拖动或同步状态下)
  useEffect(() => {
    if (!isDragging && !isSyncingPosition) {
      setTempPosition({ x: note.x, y: note.y });
    }
  }, [note.x, note.y, isDragging, isSyncingPosition]);

  // 当 note 的尺寸从 props 更新时，同步 tempSize (非调整大小或同步状态下)
  useEffect(() => {
    if (!isResizing && !isSyncingSize) {
      setTempSize({ width: note.width, height: note.height });
    }
  }, [note.width, note.height, isResizing, isSyncingSize]);

  // 同步数据库中的编辑状态到本地状态（只在组件初始化时）
  useEffect(() => {
    if (note.isEditing !== isEditing) {
      setIsEditing(note.isEditing);
    }
    if (note.isTitleEditing !== isTitleEditing) {
      setIsTitleEditing(note.isTitleEditing);
    }
  }, [note.isEditing, note.isTitleEditing]); // 只在数据库状态变化时同步

  // 自动聚焦到文本框 - 仅在进入编辑模式时设置光标到末尾
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        localContent.length,
        localContent.length
      );
    }
  }, [isEditing, localContent.length]); // 依赖本地编辑状态

  // 自动聚焦到标题输入框 - 仅在进入标题编辑模式时设置光标到末尾
  useEffect(() => {
    if (isTitleEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.setSelectionRange(
        localTitle.length,
        localTitle.length
      );
    }
  }, [isTitleEditing, localTitle.length]); // 依赖本地编辑状态

  // 处理内容编辑键盘事件
  const handleContentKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        stopEditing();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        // Ctrl/Cmd + Enter 保存并退出编辑
        e.preventDefault();
        stopEditing();
      }
    },
    [stopEditing]
  );

  // 处理标题编辑键盘事件
  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        stopTitleEditing();
      } else if (e.key === "Enter") {
        e.preventDefault();
        stopTitleEditing();
      }
    },
    [stopTitleEditing]
  );

  // 防止文本框失焦时意外保存空内容
  const handleContentBlur = useCallback(
    (e: React.FocusEvent) => {
      // 检查新的焦点目标
      const relatedTarget = e.relatedTarget as HTMLElement;

      // 如果焦点转移到删除按钮，不退出编辑模式
      if (
        relatedTarget &&
        (relatedTarget.classList.contains("delete-button") ||
          relatedTarget.closest(".delete-button") ||
          relatedTarget.closest("[class*='delete-button']"))
      ) {
        return;
      }

      // 如果焦点转移到当前便签内的其他元素，不退出编辑模式
      if (
        relatedTarget &&
        noteRef.current &&
        noteRef.current.contains(relatedTarget)
      ) {
        return;
      }

      // 否则退出编辑模式
      stopEditing();
    },
    [stopEditing]
  );

  // 标题失焦时停止编辑
  const handleTitleBlur = useCallback(
    (e: React.FocusEvent) => {
      // 检查新的焦点目标
      const relatedTarget = e.relatedTarget as HTMLElement;

      // 如果焦点转移到删除按钮，不退出编辑模式
      if (
        relatedTarget &&
        (relatedTarget.classList.contains("delete-button") ||
          relatedTarget.closest(".delete-button") ||
          relatedTarget.closest("[class*='delete-button']"))
      ) {
        return;
      }

      // 如果焦点转移到当前便签内的其他元素，不退出编辑模式
      if (
        relatedTarget &&
        noteRef.current &&
        noteRef.current.contains(relatedTarget)
      ) {
        return;
      }

      // 否则退出编辑模式
      stopTitleEditing();
    },
    [stopTitleEditing]
  );

  // 计算背景色透明度 - 根据文本长度
  const getContentBackgroundOpacity = () => {
    // 返回透明度0，即完全透明
    return 0;
  };

  // 计算标题背景宽度 - 根据标题文本长度动态调整
  const getTitleBackgroundWidth = () => {
    const titleText = localTitle || "便签";
    // 每个字符平均宽度约为10px（根据字体大小和字符类型调整）
    // 中文字符和英文字符宽度不同，这里取一个估计值
    const avgCharWidth = 10;
    // 添加一些额外的padding
    const padding = 10;
    // 返回估计宽度，但限制最小宽度为60px
    return Math.max(60, titleText.length * avgCharWidth + padding) + "px";
  };

  // 计算实际使用的位置和尺寸（拖动时用临时值，否则用数据库值）
  const actualX = isDragging || isSyncingPosition ? tempPosition.x : note.x;
  const actualY = isDragging || isSyncingPosition ? tempPosition.y : note.y;
  const actualWidth = isResizing || isSyncingSize ? tempSize.width : note.width;
  const actualHeight =
    isResizing || isSyncingSize ? tempSize.height : note.height;

  return (
    <div
      ref={noteRef}
      className={`sticky-note color-${note.color} ${
        isEditing ? "editing" : ""
      } ${isDragging ? "dragging" : ""} ${note.isNew ? "new" : ""}`}
      style={{
        left: actualX,
        top: actualY,
        width: actualWidth,
        height: actualHeight,
        zIndex: note.zIndex,
      }}
    >
      <div className="sticky-note-header">
        {/* 专门的拖拽区域 */}
        <div
          className="drag-handle"
          onMouseDown={handleMouseDown}
          style={{
            flexGrow: 1,
            cursor: isDragging ? "grabbing" : "grab",
            minHeight: "20px",
            display: "flex",
            alignItems: "center",
          }}
          title="拖拽移动便签"
        >
          <div
            style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}
          >
            {isTitleEditing ? (
              <input
                ref={titleInputRef}
                type="text"
                value={localTitle}
                onChange={handleTitleChange}
                onKeyDown={handleTitleKeyDown}
                onBlur={handleTitleBlur}
                onCompositionStart={handleTitleCompositionStart}
                onCompositionEnd={handleTitleCompositionEnd}
                className="sticky-note-title-input"
                placeholder="便签标题"
              />
            ) : (
              <h3
                className="sticky-note-title"
                onMouseDown={(e) => {
                  // 阻止父元素的拖拽事件
                  e.stopPropagation();
                }}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  startTitleEditing();
                }}
                title="双击编辑标题"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.06)", // 深灰色背景
                  width: getTitleBackgroundWidth(),
                  display: "inline-block",
                  cursor: "text",
                }}
              >
                {localTitle || "便签"}
              </h3>
            )}
          </div>
        </div>
        <div className="sticky-note-controls">
          {/* 编辑按钮已移除 */}
          <Button
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            title="删除"
            type="text"
            danger={false} // 移除危险按钮样式
            size="small"
            style={{
              color: "#666", // 默认灰色图标
              backgroundColor: "rgba(0, 0, 0, 0.06)", // 与标题背景色一致
              borderRadius: "4px",
            }}
            className="delete-button sticky-note-delete-button" // 添加多个类名以增强识别
          />
        </div>
      </div>

      <div className="sticky-note-content">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={handleContentChange}
            onKeyDown={handleContentKeyDown}
            onBlur={handleContentBlur}
            onCompositionStart={handleContentCompositionStart}
            onCompositionEnd={handleContentCompositionEnd}
            placeholder="输入 Markdown 内容...&#10;&#10;💡 快捷键：&#10;• Esc 退出编辑（会自动保存）&#10;• Ctrl/⌘ + Enter 保存"
            className="sticky-note-textarea"
          />
        ) : (
          <div
            className="sticky-note-preview"
            onMouseDown={(e) => {
              // 阻止父元素的拖拽事件
              e.stopPropagation();
            }}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startEditing();
            }}
            style={{
              backgroundColor: `rgba(255, 255, 255, ${getContentBackgroundOpacity()})`,
            }}
          >
            {localContent.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                {localContent}
              </ReactMarkdown>
            ) : (
              <div className="empty-note">双击开始编辑内容</div>
            )}
          </div>
        )}
      </div>

      {!isEditing && (
        <div
          className="resize-handle"
          onMouseDown={handleResizeMouseDown}
          title="拖拽调整大小"
        />
      )}
    </div>
  );
};

export default StickyNote;
