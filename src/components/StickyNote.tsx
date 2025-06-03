import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { StickyNoteProps, StickyNote as StickyNoteType } from "./types";
import "./StickyNote.css";

const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  onUpdate,
  onDelete,
  onBringToFront,
  canvasScale,
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
  const noteRef = useRef<HTMLDivElement>(null);

  // 开始编辑
  const startEditing = useCallback(() => {
    onUpdate(note.id, { isEditing: true });
  }, [note.id, onUpdate]);

  // 停止编辑
  const stopEditing = useCallback(() => {
    onUpdate(note.id, { isEditing: false, updatedAt: new Date() });
  }, [note.id, onUpdate]);

  // 内容变化处理
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdate(note.id, { content: e.target.value });
    },
    [note.id, onUpdate]
  );

  // 删除便签
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(note.id);
    },
    [note.id, onDelete]
  );

  // 鼠标按下开始拖拽
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (note.isEditing) return;

      e.preventDefault();
      e.stopPropagation();

      // 将便签置顶
      onBringToFront(note.id);

      const rect = noteRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        setIsDragging(true);
      }
    },
    [note.isEditing, note.id, onBringToFront]
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
        const newX = (e.clientX - dragOffset.x) / canvasScale;
        const newY = (e.clientY - dragOffset.y) / canvasScale;
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
  ]);

  // 自动聚焦到文本框
  useEffect(() => {
    if (note.isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        note.content.length,
        note.content.length
      );
    }
  }, [note.isEditing, note.content]);

  // 处理键盘事件
  const handleKeyDown = useCallback(
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

  // 防止文本框失焦时意外保存空内容
  const handleBlur = useCallback(() => {
    // 延迟一点时间，让用户有机会点击其他按钮
    setTimeout(() => {
      stopEditing();
    }, 150);
  }, [stopEditing]);

  // 更改便签颜色
  const changeColor = useCallback(
    (color: StickyNoteType["color"]) => {
      onUpdate(note.id, { color });
    },
    [note.id, onUpdate]
  );

  const colors: Array<{ name: StickyNoteType["color"]; emoji: string }> = [
    { name: "yellow", emoji: "🟡" },
    { name: "blue", emoji: "🔵" },
    { name: "green", emoji: "🟢" },
    { name: "pink", emoji: "🩷" },
    { name: "purple", emoji: "🟣" },
  ];

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
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="sticky-note-header">
        <div className="color-selector">
          {colors.map((colorOption) => (
            <button
              key={colorOption.name}
              className={`color-btn ${
                note.color === colorOption.name ? "active" : ""
              }`}
              onClick={() => changeColor(colorOption.name)}
              title={`切换到${colorOption.name}色`}
            >
              {colorOption.emoji}
            </button>
          ))}
        </div>
        <div className="sticky-note-controls">
          {!note.isEditing && (
            <button className="edit-btn" onClick={startEditing} title="编辑">
              ✏️
            </button>
          )}
          {note.isEditing && (
            <button className="save-btn" onClick={stopEditing} title="保存">
              ✅
            </button>
          )}
          <button className="delete-btn" onClick={handleDelete} title="删除">
            🗑️
          </button>
        </div>
      </div>

      <div className="sticky-note-content">
        {note.isEditing ? (
          <textarea
            ref={textareaRef}
            value={note.content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="输入 Markdown 内容...&#10;&#10;💡 快捷键：&#10;• Esc 退出编辑&#10;• Ctrl/⌘ + Enter 保存"
            className="sticky-note-textarea"
          />
        ) : (
          <div className="sticky-note-preview" onDoubleClick={startEditing}>
            {note.content.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {note.content}
              </ReactMarkdown>
            ) : (
              <div className="empty-note">双击编辑便签</div>
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
