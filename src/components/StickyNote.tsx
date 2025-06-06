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
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  // 开始编辑内容
  const startEditing = useCallback(() => {
    onUpdate(note.id, { isEditing: true });
  }, [note.id, onUpdate]);

  // 停止编辑内容
  const stopEditing = useCallback(() => {
    onUpdate(note.id, { isEditing: false, updatedAt: new Date() });
  }, [note.id, onUpdate]);

  // 开始编辑标题
  const startTitleEditing = useCallback(() => {
    onUpdate(note.id, { isTitleEditing: true });
  }, [note.id, onUpdate]);

  // 停止编辑标题
  const stopTitleEditing = useCallback(() => {
    onUpdate(note.id, { isTitleEditing: false, updatedAt: new Date() });
  }, [note.id, onUpdate]);

  // 内容变化处理
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdate(note.id, { content: e.target.value });
    },
    [note.id, onUpdate]
  );

  // 标题变化处理
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate(note.id, { title: e.target.value });
    },
    [note.id, onUpdate]
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
      if (note.isEditing || note.isTitleEditing) {
        onUpdate(note.id, {
          isEditing: false,
          isTitleEditing: false,
        });
      }
    },
    [note.id, note.isEditing, note.isTitleEditing, onDelete, onUpdate]
  );

  // 鼠标按下开始拖拽
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (note.isEditing || note.isTitleEditing) return;

      e.preventDefault();
      e.stopPropagation();

      // 将便签置顶
      onBringToFront(note.id);

      // 计算鼠标在画布坐标系中的位置
      const canvasX = (e.clientX - canvasOffset.x) / canvasScale;
      const canvasY = (e.clientY - canvasOffset.y) / canvasScale;

      // 计算鼠标相对于便签的偏移量
      setDragOffset({
        x: canvasX - note.x,
        y: canvasY - note.y,
      });
      setIsDragging(true);
    },
    [
      note.isEditing,
      note.isTitleEditing,
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
      setIsResizing(true);
    },
    [note.width, note.height, canvasScale]
  );

  // 全局鼠标移动处理
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // 将屏幕坐标转换为画布逻辑坐标
        const canvasX = (e.clientX - canvasOffset.x) / canvasScale;
        const canvasY = (e.clientY - canvasOffset.y) / canvasScale;
        const newX = canvasX - dragOffset.x;
        const newY = canvasY - dragOffset.y;
        onUpdate(note.id, { x: newX, y: newY });
      } else if (isResizing) {
        const deltaX = e.clientX / canvasScale - resizeStart.x;
        const deltaY = e.clientY / canvasScale - resizeStart.y;
        const newWidth = Math.max(200, resizeStart.width + deltaX);
        const newHeight = Math.max(150, resizeStart.height + deltaY);
        onUpdate(note.id, { width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDragging,
    isResizing,
    dragOffset,
    resizeStart,
    note.id,
    onUpdate,
    canvasScale,
    canvasOffset.x,
    canvasOffset.y,
  ]);

  // 自动聚焦到文本框 - 仅在进入编辑模式时设置光标到末尾
  useEffect(() => {
    if (note.isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        note.content.length,
        note.content.length
      );
    }
  }, [note.isEditing]); // 只依赖编辑状态，不依赖内容变化

  // 自动聚焦到标题输入框 - 仅在进入标题编辑模式时设置光标到末尾
  useEffect(() => {
    if (note.isTitleEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.setSelectionRange(
        note.title.length,
        note.title.length
      );
    }
  }, [note.isTitleEditing]); // 只依赖标题编辑状态，不依赖标题内容变化

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
  const handleContentBlur = useCallback(() => {
    // 延迟一点时间，让用户有机会点击其他按钮
    setTimeout(() => {
      // 检查当前点击的元素是否是删除按钮或其父元素
      const activeElement = document.activeElement;
      const isClickedDeleteButton =
        activeElement &&
        (activeElement.classList.contains("delete-button") ||
          activeElement.closest(".delete-button") ||
          activeElement.closest("[class*='delete-button']")); // 增强检测，匹配任何包含delete-button的类名

      // 如果不是点击删除按钮，才进行保存
      if (!isClickedDeleteButton) {
        stopEditing();
      }
    }, 100); // 减少延迟时间，让删除操作有更大机会先执行
  }, [stopEditing]);

  // 标题失焦时停止编辑
  const handleTitleBlur = useCallback(() => {
    setTimeout(() => {
      // 检查当前点击的元素是否是删除按钮或其父元素
      const activeElement = document.activeElement;
      const isClickedDeleteButton =
        activeElement &&
        (activeElement.classList.contains("delete-button") ||
          activeElement.closest(".delete-button") ||
          activeElement.closest("[class*='delete-button']")); // 增强检测，匹配任何包含delete-button的类名

      // 如果不是点击删除按钮，才停止标题编辑
      if (!isClickedDeleteButton) {
        stopTitleEditing();
      }
    }, 100); // 减少延迟时间，让删除操作有更大机会先执行
  }, [stopTitleEditing]);

  // 计算背景色透明度 - 根据文本长度
  const getContentBackgroundOpacity = () => {
    // 返回透明度0，即完全透明
    return 0;
  };

  // 计算标题背景宽度 - 根据标题文本长度动态调整
  const getTitleBackgroundWidth = () => {
    const titleText = note.title || "便签";
    // 每个字符平均宽度约为10px（根据字体大小和字符类型调整）
    // 中文字符和英文字符宽度不同，这里取一个估计值
    const avgCharWidth = 10;
    // 添加一些额外的padding
    const padding = 10;
    // 返回估计宽度，但限制最小宽度为60px
    return Math.max(60, titleText.length * avgCharWidth + padding) + "px";
  };

  return (
    <div
      ref={noteRef}
      className={`sticky-note color-${note.color} ${
        note.isEditing ? "editing" : ""
      } ${isDragging ? "dragging" : ""} ${note.isNew ? "new" : ""}`}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        zIndex: note.zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="sticky-note-header">
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
          {note.isTitleEditing ? (
            <input
              ref={titleInputRef}
              type="text"
              value={note.title}
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              onBlur={handleTitleBlur}
              className="sticky-note-title-input"
              placeholder="便签标题"
            />
          ) : (
            <h3
              className="sticky-note-title"
              onDoubleClick={startTitleEditing}
              title="双击编辑标题"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.06)", // 深灰色背景
                width: getTitleBackgroundWidth(),
                display: "inline-block",
              }}
            >
              {note.title || "便签"}
            </h3>
          )}
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
        {note.isEditing ? (
          <textarea
            ref={textareaRef}
            value={note.content}
            onChange={handleContentChange}
            onKeyDown={handleContentKeyDown}
            onBlur={handleContentBlur}
            placeholder="输入 Markdown 内容...&#10;&#10;💡 快捷键：&#10;• Esc 退出编辑（会自动保存）&#10;• Ctrl/⌘ + Enter 保存"
            className="sticky-note-textarea"
          />
        ) : (
          <div
            className="sticky-note-preview"
            onDoubleClick={startEditing}
            style={{
              backgroundColor: `rgba(255, 255, 255, ${getContentBackgroundOpacity()})`,
            }}
          >
            {note.content.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                {note.content}
              </ReactMarkdown>
            ) : (
              <div className="empty-note">双击开始编辑内容</div>
            )}
          </div>
        )}
      </div>

      {!note.isEditing && (
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
