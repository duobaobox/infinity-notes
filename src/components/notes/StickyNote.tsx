import {
  BarChartOutlined,
  DeleteOutlined,
  HistoryOutlined,
  LinkOutlined,
  LoadingOutlined,
  MessageOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useConnectionStore } from "../../stores/connectionStore";
import { useStickyNotesStore } from "../../stores/stickyNotesStore";
import { connectionLineManager } from "../../utils/connectionLineManager";
import {
  getFontSizeStyles,
  getPixelAlignedValue,
} from "../../utils/fontScaleUtils";
import SourceNotesModal from "../modals/SourceNotesModal";
import type { StickyNoteProps } from "../types";
import "./StickyNote.css";
import VirtualizedMarkdown from "./VirtualizedMarkdown";

const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  onUpdate,
  onDelete,
  onBringToFront,
  canvasScale,
  canvasOffset, // 新增：画布偏移量
  // 交互模式
  isMoveModeActive = false,
  // 流式相关属性
  isStreaming = false,
  streamingContent = "",
  onStreamingComplete,
  // 连接相关属性
  onConnect,
  isConnected = false,
}) => {
  // 状态管理
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSyncingPosition, setIsSyncingPosition] = useState(false);
  const [isSyncingSize, setIsSyncingSize] = useState(false);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const [tempPosition, setTempPosition] = useState({ x: note.x, y: note.y });
  const [tempSize, setTempSize] = useState({
    width: note.width,
    height: note.height,
  });

  const [isEditing, setIsEditing] = useState(note.isEditing);
  const [isTitleEditing, setIsTitleEditing] = useState(note.isTitleEditing);
  const [isComposing, setIsComposing] = useState(false);
  const [isTitleComposing, setIsTitleComposing] = useState(false);
  const [localContent, setLocalContent] = useState(note.content);
  const [localTitle, setLocalTitle] = useState(note.title);

  const [displayContent, setDisplayContent] = useState(note.content);
  const [showCursor, setShowCursor] = useState(false);
  const [sourceConnectionsVisible, setSourceConnectionsVisible] =
    useState(false);
  const [isBeingSourceConnected, setIsBeingSourceConnected] = useState(false);
  const [sourceNotesModalVisible, setSourceNotesModalVisible] = useState(false);

  // Refs 和定时器
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const contentUpdateTimerRef = useRef<number | NodeJS.Timeout | null>(null);
  const titleUpdateTimerRef = useRef<number | NodeJS.Timeout | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Store hooks
  const {
    updateNoteConnectionLinesImmediate,
    removeConnection: removeConnectionFromStore,
  } = useConnectionStore();

  const allNotes = useStickyNotesStore((state) => state.notes);

  // 检查当前便签是否作为源便签被引用
  const isSourceConnected = useMemo(() => {
    return allNotes.some((otherNote) => {
      if (otherNote.id === note.id) return false;
      return otherNote.sourceNoteIds?.includes(note.id);
    });
  }, [note.id, allNotes]);

  // 检查并更新源连接状态
  useEffect(() => {
    const checkSourceConnectionStatus = () => {
      const isConnected = connectionLineManager.isNoteBeingSourceConnected(
        note.id
      );
      setIsBeingSourceConnected(isConnected);
    };

    checkSourceConnectionStatus();

    const handleSourceConnectionChanged = (event: CustomEvent) => {
      if (event.detail.noteId === note.id) {
        checkSourceConnectionStatus();
      }
    };

    window.addEventListener(
      "sourceConnectionChanged",
      handleSourceConnectionChanged as EventListener
    );

    return () => {
      window.removeEventListener(
        "sourceConnectionChanged",
        handleSourceConnectionChanged as EventListener
      );
    };
  }, [note.id]);

  // 监听 sourceNoteIds 变化，在源便签被删除时重新创建连接线
  useEffect(() => {
    // 只有在溯源连接线已经显示的情况下才需要重新创建
    if (
      !sourceConnectionsVisible ||
      !note.sourceNoteIds ||
      note.sourceNoteIds.length === 0
    ) {
      return;
    }

    // 异步重新创建所有有效的溯源连接线
    const recreateSourceConnections = async () => {
      try {
        // 先清除所有现有的溯源连接线
        connectionLineManager.removeAllSourceConnectionsToNote(note.id);

        // 获取当前所有便签，验证源便签是否存在
        const validSourceNoteIds = note.sourceNoteIds!.filter((sourceId) =>
          allNotes.some((n) => n.id === sourceId)
        );

        if (validSourceNoteIds.length === 0) {
          setSourceConnectionsVisible(false);
          return;
        }

        // 重新创建有效源便签的连接线
        let successCount = 0;
        for (const sourceNoteId of validSourceNoteIds) {
          const success = await connectionLineManager.createSourceConnection(
            sourceNoteId,
            note.id
          );
          if (success) {
            successCount++;
          }
        }

        // 如果没有成功创建任何连接线，隐藏溯源连接线状态
        if (successCount === 0) {
          setSourceConnectionsVisible(false);
        }

        // 通知所有源便签更新其连接状态
        for (const sourceNoteId of validSourceNoteIds) {
          const event = new CustomEvent("sourceConnectionChanged", {
            detail: { noteId: sourceNoteId },
          });
          window.dispatchEvent(event);
        }
      } catch (error) {
        console.error(`重新创建溯源连接线失败:`, error);
        setSourceConnectionsVisible(false);
      }
    };

    // 使用 setTimeout 延迟执行，确保 DOM 更新完成
    const timeoutId = setTimeout(recreateSourceConnections, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [note.sourceNoteIds, sourceConnectionsVisible, note.id, allNotes]);

  // 处理流式内容更新
  useEffect(() => {
    if (isStreaming) {
      setDisplayContent(streamingContent);
      setShowCursor(true);
      // 内容更新时滚动到底部
      if (previewRef.current) {
        previewRef.current.scrollTop = previewRef.current.scrollHeight;
      }
    } else {
      setDisplayContent(note.content);
      setShowCursor(false);
    }
  }, [isStreaming, streamingContent, note.content]);

  // 处理流式完成回调（分离逻辑避免循环依赖）
  useEffect(() => {
    if (!isStreaming && streamingContent && streamingContent !== note.content) {
      // 流式完成，更新便签内容
      onUpdate(note.id, { content: streamingContent });
      onStreamingComplete?.();
    }
  }, [
    isStreaming,
    streamingContent,
    note.content,
    note.id,
    onUpdate,
    onStreamingComplete,
  ]);

  // 光标闪烁效果
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // 开始编辑内容
  const startEditing = useCallback(() => {
    if (isStreaming) return; // 流式过程中不允许编辑
    if (isMoveModeActive) return; // 移动模式下不允许编辑
    setIsEditing(true);
    setLocalContent(note.content);
  }, [note.content, isStreaming, isMoveModeActive]);

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
    if (isStreaming) return; // 流式过程中不允许编辑
    if (isMoveModeActive) return; // 移动模式下不允许编辑
    setIsTitleEditing(true);
    setLocalTitle(note.title);
  }, [note.title, isStreaming, isMoveModeActive]);

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
      if (isStreaming) return;

      e.stopPropagation();
      e.preventDefault();

      // 清理所有相关的连接线
      try {
        connectionLineManager.removeConnection(note.id);
        removeConnectionFromStore(note.id);
        connectionLineManager.removeAllSourceConnectionsToNote(note.id);
        connectionLineManager.removeAllSourceConnectionsFromNote(note.id);
        console.log(`已清理便签 ${note.id} 的所有连接线和连接状态`);
      } catch (error) {
        console.error("清理连接线失败:", error);
      }

      setTimeout(() => {
        onDelete(note.id);
      }, 0);

      if (isEditing || isTitleEditing) {
        setIsEditing(false);
        setIsTitleEditing(false);
      }
    },
    [
      note.id,
      isEditing,
      isTitleEditing,
      onDelete,
      isStreaming,
      removeConnectionFromStore,
    ]
  );

  // 处理连接点点击
  const handleConnectionClick = useCallback(
    (e: React.MouseEvent) => {
      if (isStreaming) return;

      e.stopPropagation();
      e.preventDefault();

      if (onConnect) {
        onConnect(note);
      }
    },
    [note, onConnect, isStreaming]
  );

  // 处理溯源按钮点击
  const handleSourceButtonClick = useCallback(
    async (e: React.MouseEvent) => {
      if (isStreaming) return;

      e.stopPropagation();
      e.preventDefault();

      // 检查是否有溯源数据
      const hasSourceNoteIds =
        note.sourceNoteIds && note.sourceNoteIds.length > 0;
      const hasSourceNotesContent =
        note.sourceNotesContent && note.sourceNotesContent.length > 0;

      if (!hasSourceNoteIds && !hasSourceNotesContent) {
        return;
      }

      // 根据便签生成模式决定行为
      if (note.generationMode === "replace" && hasSourceNotesContent) {
        // 替换模式：打开源便签查看弹窗
        setSourceNotesModalVisible(true);
        return;
      }

      // 汇总模式或没有生成模式标识：显示/隐藏连接线
      if (!hasSourceNoteIds) {
        return;
      }

      // 获取当前所有便签，验证源便签是否存在
      const validSourceNoteIds = note.sourceNoteIds!.filter((sourceId) =>
        allNotes.some((n) => n.id === sourceId)
      );

      // 检查循环引用：如果当前便签被任何源便签引用，就存在循环引用
      const hasCircularReference = validSourceNoteIds.some((sourceId) => {
        const sourceNote = allNotes.find((n) => n.id === sourceId);
        return sourceNote?.sourceNoteIds?.includes(note.id);
      });

      if (hasCircularReference) {
        // 循环引用警告，但仍允许显示连接线
      }

      // 如果有无效的源便签ID，更新便签的溯源信息
      if (validSourceNoteIds.length !== note.sourceNoteIds!.length) {
        // 更新便签的源便签列表，移除无效的ID
        onUpdate(note.id, {
          sourceNoteIds:
            validSourceNoteIds.length > 0 ? validSourceNoteIds : undefined,
          updatedAt: new Date(),
        });

        // 如果没有有效的源便签了，直接返回
        if (validSourceNoteIds.length === 0) {
          return;
        }
      }

      if (sourceConnectionsVisible) {
        // 隐藏溯源连接线 - 使用原始的sourceNoteIds，因为连接线管理器会自动处理不存在的连接
        for (const sourceNoteId of note.sourceNoteIds!) {
          connectionLineManager.removeSourceConnection(sourceNoteId, note.id);
        }
        setSourceConnectionsVisible(false);

        // 立即检查并更新所有相关便签的连接状态
        // 更新当前便签的状态
        const isConnected = connectionLineManager.isNoteBeingSourceConnected(
          note.id
        );
        setIsBeingSourceConnected(isConnected);

        // 通知所有源便签更新其连接状态
        for (const sourceNoteId of note.sourceNoteIds!) {
          const event = new CustomEvent("sourceConnectionChanged", {
            detail: { noteId: sourceNoteId },
          });
          window.dispatchEvent(event);
        }
      } else {
        // 显示溯源连接线 - 只尝试创建有效源便签的连接
        let successCount = 0;
        for (const sourceNoteId of validSourceNoteIds) {
          const success = await connectionLineManager.createSourceConnection(
            sourceNoteId,
            note.id
          );
          if (success) {
            successCount++;
          }
        }

        if (successCount > 0) {
          setSourceConnectionsVisible(true);

          // 通知所有源便签更新其连接状态
          for (const sourceNoteId of validSourceNoteIds) {
            const event = new CustomEvent("sourceConnectionChanged", {
              detail: { noteId: sourceNoteId },
            });
            window.dispatchEvent(event);
          }
        } else {
          console.warn("没有成功创建任何溯源连接线");
        }
      }
    },
    [
      note.id,
      note.sourceNoteIds,
      isStreaming,
      sourceConnectionsVisible,
      allNotes,
      onUpdate,
    ]
  );

  // 获取选中状态管理方法和当前选中状态
  const { selectNote, selectedNoteId } = useStickyNotesStore();
  const isSelected = selectedNoteId === note.id;

  // 新增：处理便签点击置顶和选中
  const handleNoteClickToFront = useCallback(() => {
    // 只有在预览模式（非编辑状态）下才触发置顶和选中
    if (!isEditing && !isTitleEditing) {
      onBringToFront(note.id); // 置顶
      selectNote(note.id); // 选中（会自动取消其他便签的选中状态）
    }
  }, [isEditing, isTitleEditing, onBringToFront, selectNote, note.id]);

  // 开始拖拽
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isEditing || isTitleEditing) return;

      e.preventDefault();
      e.stopPropagation();

      // 由于现在便签直接根据缩放调整大小，需要重新计算坐标
      // 将屏幕坐标转换为画布坐标（不需要除以缩放，因为便签已经缩放）
      const canvasX = e.clientX - canvasOffset.x;
      const canvasY = e.clientY - canvasOffset.y;

      // 计算拖拽偏移（基于缩放后的便签尺寸）
      const scaledNoteX = note.x * canvasScale;
      const scaledNoteY = note.y * canvasScale;

      setDragOffset({
        x: (canvasX - scaledNoteX) / canvasScale, // 转换回原始坐标系
        y: (canvasY - scaledNoteY) / canvasScale,
      });
      setTempPosition({ x: note.x, y: note.y });
      setIsDragging(true);
      onBringToFront(note.id); // 置顶
      selectNote(note.id); // 选中
    },
    [
      isEditing,
      isTitleEditing,
      note.id,
      note.x,
      note.y,
      onBringToFront,
      selectNote,
      canvasScale,
      canvasOffset,
    ]
  );

  // 开始调整大小
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 调整大小时的坐标计算也需要适应新的缩放模式
      setResizeStart({
        x: e.clientX, // 直接使用屏幕坐标
        y: e.clientY,
        width: note.width,
        height: note.height,
      });
      setTempSize({ width: note.width, height: note.height });
      setIsResizing(true);
    },
    [note.width, note.height, canvasScale]
  );

  // 优化的连接线更新 - 减少延迟，提升性能
  const optimizedConnectionUpdate = useMemo(() => {
    let updateScheduled = false;

    return () => {
      // 避免重复调度更新
      if (updateScheduled) return;

      updateScheduled = true;

      // 使用requestAnimationFrame确保在下一帧更新，避免阻塞当前帧
      requestAnimationFrame(() => {
        updateNoteConnectionLinesImmediate(note.id);
        updateScheduled = false;
      });
    };
  }, [updateNoteConnectionLinesImmediate, note.id]);

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
          // 新的坐标计算方式，适应直接缩放模式
          const canvasX = e.clientX - canvasOffset.x;
          const canvasY = e.clientY - canvasOffset.y;
          const newX = canvasX / canvasScale - dragOffset.x;
          const newY = canvasY / canvasScale - dragOffset.y;

          setTempPosition({ x: newX, y: newY });
          optimizedConnectionUpdate();
        });
      } else if (isResizing) {
        // 取消之前的动画帧
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        // 使用 requestAnimationFrame 优化性能
        rafRef.current = requestAnimationFrame(() => {
          // 调整大小的坐标计算也需要适应新模式
          const deltaX = (e.clientX - resizeStart.x) / canvasScale;
          const deltaY = (e.clientY - resizeStart.y) / canvasScale;
          const newWidth = Math.max(200, resizeStart.width + deltaX);
          const newHeight = Math.max(150, resizeStart.height + deltaY);

          setTempSize({ width: newWidth, height: newHeight });
          // 调整大小时也需要更新连接线位置，因为连接点位置会改变
          optimizedConnectionUpdate();
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
        onUpdate(note.id, {
          x: tempPosition.x,
          y: tempPosition.y,
          updatedAt: new Date(),
        });
        setIsDragging(false);
        setIsSyncingPosition(true);
      }

      if (isResizing) {
        onUpdate(note.id, {
          width: tempSize.width,
          height: tempSize.height,
          updatedAt: new Date(),
        });
        setIsResizing(false);
        setIsSyncingSize(true);
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
    canvasOffset,
    tempPosition.x,
    tempPosition.y,
    tempSize.width,
    tempSize.height,
    optimizedConnectionUpdate,
  ]);

  // 处理位置同步
  useEffect(() => {
    if (
      isSyncingPosition &&
      note.x === tempPosition.x &&
      note.y === tempPosition.y
    ) {
      setIsSyncingPosition(false);
      // 拖拽结束后立即更新连接线位置，确保最终位置准确
      // 使用单个 requestAnimationFrame 减少延迟，提高最终位置同步精度
      requestAnimationFrame(() => {
        updateNoteConnectionLinesImmediate(note.id);
      });
    }
  }, [
    note.x,
    note.y,
    tempPosition.x,
    tempPosition.y,
    isSyncingPosition,
    note.id,
    updateNoteConnectionLinesImmediate,
  ]);

  // 处理尺寸同步
  useEffect(() => {
    if (
      isSyncingSize &&
      note.width === tempSize.width &&
      note.height === tempSize.height
    ) {
      setIsSyncingSize(false);
      // 调整大小结束后立即更新连接线位置，确保连接点位置准确
      // 因为连接点位置相对于便签左下角，大小改变会影响连接点的绝对位置
      requestAnimationFrame(() => {
        updateNoteConnectionLinesImmediate(note.id);
      });
    }
  }, [
    note.width,
    note.height,
    tempSize.width,
    tempSize.height,
    isSyncingSize,
    note.id,
    updateNoteConnectionLinesImmediate,
  ]);

  // 同步外部状态到本地状态
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

  useEffect(() => {
    if (note.isEditing !== isEditing) {
      setIsEditing(note.isEditing);
    }
    if (note.isTitleEditing !== isTitleEditing) {
      setIsTitleEditing(note.isTitleEditing);
    }
  }, [note.isEditing, note.isTitleEditing]);

  useEffect(() => {
    if (!isDragging && !isSyncingPosition) {
      setTempPosition({ x: note.x, y: note.y });
    }
  }, [note.x, note.y, isDragging, isSyncingPosition]);

  useEffect(() => {
    if (!isResizing && !isSyncingSize) {
      setTempSize({ width: note.width, height: note.height });
    }
  }, [note.width, note.height, isResizing, isSyncingSize]);

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

  // 自动聚焦
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        localContent.length,
        localContent.length
      );
    }
  }, [isEditing]);

  useEffect(() => {
    if (isTitleEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.setSelectionRange(
        localTitle.length,
        localTitle.length
      );
    }
  }, [isTitleEditing]);

  // 智能Markdown辅助函数
  const insertTextAtCursor = useCallback(
    (text: string, offsetStart = 0, offsetEnd = 0) => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent =
        localContent.substring(0, start) + text + localContent.substring(end);

      setLocalContent(newContent);
      debouncedUpdateContent(newContent);

      // 设置光标位置
      setTimeout(() => {
        textarea.setSelectionRange(start + offsetStart, start + offsetEnd);
      }, 0);
    },
    [localContent, debouncedUpdateContent]
  );

  // 获取当前行内容和位置
  const getCurrentLineInfo = useCallback(() => {
    if (!textareaRef.current) return null;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = localContent.substring(0, cursorPos);
    const textAfterCursor = localContent.substring(cursorPos);

    const lineStart = textBeforeCursor.lastIndexOf("\n") + 1;
    const lineEnd = textAfterCursor.indexOf("\n");
    const lineEndPos =
      lineEnd === -1 ? localContent.length : cursorPos + lineEnd;

    const currentLine = localContent.substring(lineStart, lineEndPos);
    const cursorInLine = cursorPos - lineStart;

    return {
      line: currentLine,
      lineStart,
      lineEnd: lineEndPos,
      cursorPos,
      cursorInLine,
      textBeforeCursor,
      textAfterCursor,
    };
  }, [localContent]);

  // 多级编号工具函数
  const multilevelNumbering = useMemo(() => {
    const ROMAN_NUMERALS = [
      "",
      "Ⅰ",
      "Ⅱ",
      "Ⅲ",
      "Ⅳ",
      "Ⅴ",
      "Ⅵ",
      "Ⅶ",
      "Ⅷ",
      "Ⅸ",
      "Ⅹ",
    ];
    const ROMAN_MAP = {
      Ⅰ: 1,
      Ⅱ: 2,
      Ⅲ: 3,
      Ⅳ: 4,
      Ⅴ: 5,
      Ⅵ: 6,
      Ⅶ: 7,
      Ⅷ: 8,
      Ⅸ: 9,
      Ⅹ: 10,
    };

    return {
      // 获取缩进级别
      getLevel: (indent: string) => Math.floor(indent.length / 3),

      // 生成编号格式
      generateNumber: (number: number, level: number) => {
        switch (level) {
          case 0:
            return `${number}.`;
          case 1:
            return `${String.fromCharCode(96 + number)}.`;
          case 2:
            return `${
              ROMAN_NUMERALS[number] ||
              `Ⅹ${ROMAN_NUMERALS[number - 10] || number - 10}`
            }.`;
          default:
            return `${number}.`;
        }
      },

      // 解析编号
      parseNumber: (marker: string) => {
        if (marker.match(/^\d+\.$/)) {
          return parseInt(marker.replace(".", ""));
        } else if (marker.match(/^[a-z]+\.$/)) {
          return marker.replace(".", "").charCodeAt(0) - 96;
        } else if (marker.match(/^[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+\.$/)) {
          const roman = marker.replace(".", "");
          return ROMAN_MAP[roman as keyof typeof ROMAN_MAP] || 1;
        }
        return 1;
      },

      // 检测列表项
      detectListItem: (line: string) => {
        return line.match(/^(\s*)([0-9]+\.|[a-z]+\.|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+\.)\s(.*)$/);
      },
    };
  }, []);

  // 查找有序列表的下一个编号（支持多级编号格式）
  const findNextOrderedNumber = useCallback(
    (currentLineStart: number, currentIndent: string) => {
      const lines = localContent.split("\n");
      const currentLineIndex =
        localContent.substring(0, currentLineStart).split("\n").length - 1;
      const currentLevel = multilevelNumbering.getLevel(currentIndent);

      // 向上查找同级别的最后一个编号
      let lastSameLevelNumber = 0;
      let foundAnyAtThisLevel = false;

      for (let i = currentLineIndex - 1; i >= 0; i--) {
        const line = lines[i];
        const match = multilevelNumbering.detectListItem(line);
        if (match) {
          const [, indent, marker] = match;
          if (indent.length === currentIndent.length) {
            // 找到同级别的列表项，解析编号
            lastSameLevelNumber = multilevelNumbering.parseNumber(marker);
            foundAnyAtThisLevel = true;
            break;
          } else if (indent.length < currentIndent.length) {
            // 遇到更高级别的列表项，停止查找
            break;
          }
          // 如果是更深层级，继续查找
        } else if (
          line.trim() !== "" &&
          !line.match(/^\s*[-*+]\s/) &&
          !multilevelNumbering.detectListItem(line)
        ) {
          // 遇到非列表内容，停止查找
          break;
        }
      }

      // 生成下一个编号
      const nextNumber = foundAnyAtThisLevel ? lastSameLevelNumber + 1 : 1;
      return multilevelNumbering.generateNumber(nextNumber, currentLevel);
    },
    [localContent, multilevelNumbering]
  );

  // 智能列表处理
  const handleSmartList = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const lineInfo = getCurrentLineInfo();
      if (!lineInfo) return false;

      const { line, lineStart } = lineInfo;

      // 检测无序列表 (- 或 * 或 +)
      const unorderedMatch = line.match(/^(\s*)([-*+])\s(.*)$/);
      if (unorderedMatch) {
        const [, indent, marker, content] = unorderedMatch;
        if (content.trim() === "") {
          // 空列表项，删除当前行的列表标记
          e.preventDefault();
          const newContent =
            localContent.substring(0, lineStart) +
            indent +
            localContent.substring(lineStart + line.length);
          setLocalContent(newContent);
          debouncedUpdateContent(newContent);
          setTimeout(() => {
            textareaRef.current?.setSelectionRange(
              lineStart + indent.length,
              lineStart + indent.length
            );
          }, 0);
        } else {
          // 创建新的列表项
          e.preventDefault();
          const newListItem = `\n${indent}${marker} `;
          insertTextAtCursor(
            newListItem,
            newListItem.length,
            newListItem.length
          );
        }
        return true;
      }

      // 检测有序列表 (支持多种格式：1. a. Ⅰ. 等)
      const orderedMatch = multilevelNumbering.detectListItem(line);
      if (orderedMatch) {
        const [, indent, marker, content] = orderedMatch;
        if (content.trim() === "") {
          // 空列表项，删除当前行的列表标记
          e.preventDefault();
          const newContent =
            localContent.substring(0, lineStart) +
            indent +
            localContent.substring(lineStart + line.length);
          setLocalContent(newContent);
          debouncedUpdateContent(newContent);
          setTimeout(() => {
            textareaRef.current?.setSelectionRange(
              lineStart + indent.length,
              lineStart + indent.length
            );
          }, 0);
        } else {
          // 创建新的有序列表项 - 智能多级编号
          e.preventDefault();

          // 获取当前级别并生成下一个编号
          const currentLevel = multilevelNumbering.getLevel(indent);
          const currentNumber = multilevelNumbering.parseNumber(marker);
          const nextNumber = currentNumber + 1;
          const nextMarker = multilevelNumbering.generateNumber(
            nextNumber,
            currentLevel
          );

          const newListItem = `\n${indent}${nextMarker} `;
          insertTextAtCursor(
            newListItem,
            newListItem.length,
            newListItem.length
          );
        }
        return true;
      }

      return false;
    },
    [
      getCurrentLineInfo,
      insertTextAtCursor,
      localContent,
      debouncedUpdateContent,
      multilevelNumbering,
    ]
  );

  // 智能缩进处理
  const handleSmartIndent = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>, isShift = false) => {
      const lineInfo = getCurrentLineInfo();
      if (!lineInfo) return false;

      const { line, lineStart } = lineInfo;

      // 检测无序列表项
      const unorderedMatch = line.match(/^(\s*)([-*+])\s(.*)$/);
      if (unorderedMatch) {
        e.preventDefault();
        const [, currentIndent, marker, content] = unorderedMatch;

        // 使用2个空格作为无序列表的标准缩进单位
        const indentChange = isShift ? -2 : 2;
        const newIndentLevel = Math.max(0, currentIndent.length + indentChange);
        const newIndent = " ".repeat(newIndentLevel);

        const newLine = `${newIndent}${marker} ${content}`;
        const newContent =
          localContent.substring(0, lineStart) +
          newLine +
          localContent.substring(lineStart + line.length);

        setLocalContent(newContent);
        debouncedUpdateContent(newContent);

        // 保持光标在合适位置
        const newCursorPos = lineStart + newIndent.length + marker.length + 1;
        setTimeout(() => {
          textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);

        return true;
      }

      // 检测有序列表项（支持多种格式）
      const orderedMatch = multilevelNumbering.detectListItem(line);
      if (orderedMatch) {
        e.preventDefault();
        const [, currentIndent, , content] = orderedMatch;

        // 使用3个空格作为标准缩进单位（符合Markdown规范）
        const indentChange = isShift ? -3 : 3;
        const newIndentLevel = Math.max(0, currentIndent.length + indentChange);
        const newIndent = " ".repeat(newIndentLevel);

        // 为新的缩进级别找到合适的编号（使用多级编号格式）
        const newMarker = findNextOrderedNumber(lineStart, newIndent);
        const newLine = `${newIndent}${newMarker} ${content}`;
        const newContent =
          localContent.substring(0, lineStart) +
          newLine +
          localContent.substring(lineStart + line.length);

        setLocalContent(newContent);
        debouncedUpdateContent(newContent);

        // 保持光标在合适位置
        const newCursorPos =
          lineStart + newIndent.length + newMarker.length + 1;
        setTimeout(() => {
          textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);

        return true;
      }

      return false;
    },
    [
      getCurrentLineInfo,
      localContent,
      debouncedUpdateContent,
      findNextOrderedNumber,
      multilevelNumbering,
    ]
  );

  // 处理内容编辑键盘事件 - 增强版
  const handleContentKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        stopEditing();
        return;
      }

      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        // Ctrl/Cmd + Enter 保存并退出编辑
        e.preventDefault();
        stopEditing();
        return;
      }

      if (e.key === "Enter") {
        // 智能列表处理
        if (handleSmartList(e)) {
          return;
        }
      }

      if (e.key === "Tab") {
        // 智能缩进处理
        if (handleSmartIndent(e, e.shiftKey)) {
          return;
        }

        // 默认Tab处理（插入制表符）
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent =
          localContent.substring(0, start) + "\t" + localContent.substring(end);
        setLocalContent(newContent);
        debouncedUpdateContent(newContent);

        // 设置光标位置到插入的制表符之后
        setTimeout(() => {
          textarea.setSelectionRange(start + 1, start + 1);
        }, 0);
      }
    },
    [
      stopEditing,
      localContent,
      debouncedUpdateContent,
      handleSmartList,
      handleSmartIndent,
    ]
  );

  // 处理标题编辑键盘事件
  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        stopTitleEditing();
      } else if (e.key === "Enter") {
        e.preventDefault();
        stopTitleEditing();
      } else if (e.key === "Tab") {
        // 阻止Tab键的默认行为（移动焦点），在标题输入框中插入制表符
        e.preventDefault();
        const input = e.currentTarget as HTMLInputElement;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const newTitle =
          localTitle.substring(0, start) + "\t" + localTitle.substring(end);
        setLocalTitle(newTitle);
        debouncedUpdateTitle(newTitle);

        // 设置光标位置到插入的制表符之后
        setTimeout(() => {
          input.setSelectionRange(start + 1, start + 1);
        }, 0);
      }
    },
    [stopTitleEditing, localTitle, debouncedUpdateTitle]
  );

  // 防止文本框失焦时意外保存空内容
  const handleContentBlur = useCallback(
    (e: React.FocusEvent) => {
      // 检查新的焦点目标
      const relatedTarget = e.relatedTarget as HTMLElement;

      // 如果焦点转移到当前便签内的其他元素，不退出编辑模式
      if (relatedTarget && noteRef.current?.contains(relatedTarget)) {
        // 但是如果转移到标题输入框，允许
        if (relatedTarget.classList.contains("sticky-note-title-input")) {
          return;
        }
        // 转移到删除按钮等，不退出编辑模式
        if (
          relatedTarget.classList.contains("delete-button") ||
          relatedTarget.closest(".delete-button") ||
          relatedTarget.closest("[class*='delete-button']") ||
          relatedTarget.closest(".settings-toolbar")
        ) {
          return;
        }
      }

      // 所有其他情况（包括点击便签外部、其他便签等）都退出编辑模式
      stopEditing();
    },
    [stopEditing]
  );

  // 处理文本框点击事件
  const handleTextareaClick = useCallback(() => {
    // 不需要特殊处理
  }, []);

  // 标题失焦时停止编辑
  const handleTitleBlur = useCallback(
    (e: React.FocusEvent) => {
      // 检查新的焦点目标
      const relatedTarget = e.relatedTarget as HTMLElement;

      // 如果焦点转移到当前便签内的其他元素，不退出编辑模式
      if (relatedTarget && noteRef.current?.contains(relatedTarget)) {
        // 但是如果转移到内容文本框，允许
        if (relatedTarget.classList.contains("sticky-note-textarea")) {
          return;
        }
        // 转移到删除按钮等，不退出编辑模式
        if (
          relatedTarget.classList.contains("delete-button") ||
          relatedTarget.closest(".delete-button") ||
          relatedTarget.closest("[class*='delete-button']") ||
          relatedTarget.closest(".settings-toolbar")
        ) {
          return;
        }
      }

      // 所有其他情况（包括点击便签外部、其他便签等）都退出编辑模式
      stopTitleEditing();
    },
    [stopTitleEditing]
  );

  // 焦点变化检测 - 更敏感的失焦检测
  useEffect(() => {
    const handleFocusChange = () => {
      // 只有在编辑模式下才需要检测失焦
      if (!isEditing && !isTitleEditing) return;

      // 使用 setTimeout 让焦点变化完成后再检查
      setTimeout(() => {
        const activeElement = document.activeElement;

        // 如果当前没有任何元素有焦点（例如点击了空白区域）
        if (!activeElement || activeElement === document.body) {
          if (isEditing) stopEditing();
          if (isTitleEditing) stopTitleEditing();
          return;
        }

        // 如果焦点不在当前便签内部，退出编辑模式
        if (
          noteRef.current &&
          !noteRef.current.contains(activeElement as HTMLElement)
        ) {
          // 检查是否在设置工具栏内部
          const isInsideToolbar = (activeElement as HTMLElement).closest(
            ".settings-toolbar"
          );

          if (!isInsideToolbar) {
            if (isEditing) stopEditing();
            if (isTitleEditing) stopTitleEditing();
          }
        }
      }, 10);
    };

    // 只有在编辑模式下才添加监听器
    if (isEditing || isTitleEditing) {
      document.addEventListener("focusin", handleFocusChange);
      document.addEventListener("focusout", handleFocusChange);

      return () => {
        document.removeEventListener("focusin", handleFocusChange);
        document.removeEventListener("focusout", handleFocusChange);
      };
    }
  }, [isEditing, isTitleEditing, stopEditing, stopTitleEditing]);

  // 计算标题的最大可用宽度 - 用于限制显示区域
  const getTitleMaxWidth = () => {
    const controlsWidth = 56; // 按钮区域宽度
    const headerPadding = 32; // 头部左右padding (16px * 2)
    const gap = 8; // 标题和按钮之间的间距
    const margin = 10; // 额外边距

    // 动态计算最大可用宽度
    const noteWidth = noteRef.current?.offsetWidth || 200;
    const maxAvailableWidth =
      noteWidth - controlsWidth - headerPadding - gap - margin;

    return Math.max(maxAvailableWidth, 80) + "px"; // 至少80px
  };

  // 计算实际使用的位置和尺寸，并应用缩放变换
  // 现在便签直接根据缩放级别调整自身大小和位置，避免CSS transform缩放
  const scaledX = Math.round(
    (isDragging || isSyncingPosition ? tempPosition.x : note.x) * canvasScale
  );
  const scaledY = Math.round(
    (isDragging || isSyncingPosition ? tempPosition.y : note.y) * canvasScale
  );
  const scaledWidth = Math.round(
    (isResizing || isSyncingSize ? tempSize.width : note.width) * canvasScale
  );
  const scaledHeight = Math.round(
    (isResizing || isSyncingSize ? tempSize.height : note.height) * canvasScale
  );

  // 应用精确的像素对齐，确保在所有缩放级别下都清晰显示
  const getAlignedValue = useCallback((value: number): number => {
    return getPixelAlignedValue(value);
  }, []);

  // 应用像素对齐到缩放后的值
  const pixelAlignedX = getAlignedValue(scaledX);
  const pixelAlignedY = getAlignedValue(scaledY);
  const pixelAlignedWidth = getAlignedValue(scaledWidth);
  const pixelAlignedHeight = getAlignedValue(scaledHeight);

  // 计算基于画布缩放的字体样式 - 包含表情符号优化
  const fontStyles = useMemo(() => {
    const styles = getFontSizeStyles(canvasScale);
    // 添加CSS变量以支持所有子元素的字体缩放
    return {
      ...styles,
      "--note-content-font-size": styles.fontSize,
      "--note-title-font-size": styles.fontSize,
    } as React.CSSProperties;
  }, [canvasScale]);

  // 组件卸载时完整清理 - 防止内存泄漏
  useEffect(() => {
    return () => {
      // 清理溯源连接线
      if (note.sourceNoteIds && sourceConnectionsVisible) {
        for (const sourceNoteId of note.sourceNoteIds) {
          connectionLineManager.removeSourceConnection(sourceNoteId, note.id);
        }
      }

      // 清理所有定时器
      if (contentUpdateTimerRef.current) {
        clearTimeout(contentUpdateTimerRef.current);
        contentUpdateTimerRef.current = null;
      }

      if (titleUpdateTimerRef.current) {
        clearTimeout(titleUpdateTimerRef.current);
        titleUpdateTimerRef.current = null;
      }

      // 清理动画帧
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      // 清理所有连接线
      try {
        connectionLineManager.removeConnection(note.id);
        connectionLineManager.removeAllSourceConnectionsToNote(note.id);
        connectionLineManager.removeAllSourceConnectionsFromNote(note.id);
      } catch (error) {
        console.warn(`清理便签 ${note.id} 连接线时出错:`, error);
      }
    };
  }, [note.id]);

  // 便签级别的失焦检测 - 当点击便签外部时退出编辑模式
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      // 只有在编辑模式下才需要检测失焦
      if (!isEditing && !isTitleEditing) return;

      if (noteRef.current) {
        const target = event.target as HTMLElement;

        // 检查点击是否在当前便签内部
        const isInsideNote = noteRef.current.contains(target);
        // 检查是否在设置工具栏内部
        const isInsideToolbar = target.closest(".settings-toolbar");

        // 如果点击的不是当前便签内部，也不是设置工具栏，退出编辑模式
        if (!isInsideNote && !isInsideToolbar) {
          if (isEditing) stopEditing();
          if (isTitleEditing) stopTitleEditing();
        }
      }
    };

    // 只有在编辑模式下才添加监听器
    if (isEditing || isTitleEditing) {
      // 使用 setTimeout 延迟添加监听器，避免与开始编辑的点击事件冲突
      const timeoutId = setTimeout(() => {
        document.addEventListener("click", handleGlobalClick);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("click", handleGlobalClick);
      };
    }
  }, [isEditing, isTitleEditing, stopEditing, stopTitleEditing]);

  return (
    <>
      {/* 设置工具栏 - 位于便签右侧，竖排显示，选中时显示 */}
      {isSelected && (
        <div
          className="settings-toolbar vertical"
          style={{
            left: pixelAlignedX + pixelAlignedWidth + 8, // 位于便签右侧8px处
            top: pixelAlignedY, // 与便签顶部对齐
            zIndex: Math.max(note.zIndex + 10, 9999), // 确保足够高的z-index
          }}
          onClick={(e) => {
            // 阻止点击工具栏本身时关闭菜单
            e.stopPropagation();
          }}
        >
          {/* 溯源连接按钮 */}
          <Button
            className={`settings-toolbar-button ${
              (!note.sourceNoteIds || note.sourceNoteIds.length === 0) &&
              (!note.sourceNotesContent || note.sourceNotesContent.length === 0)
                ? "disabled"
                : sourceConnectionsVisible
                ? "active"
                : ""
            }`}
            icon={
              note.generationMode === "replace" &&
              note.sourceNotesContent &&
              note.sourceNotesContent.length > 0 ? (
                <HistoryOutlined />
              ) : (
                <LinkOutlined />
              )
            }
            size="small"
            type="default"
            disabled={
              (!note.sourceNoteIds || note.sourceNoteIds.length === 0) &&
              (!note.sourceNotesContent || note.sourceNotesContent.length === 0)
            }
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();

              // 检查按钮是否被禁用
              const hasSourceNoteIds =
                note.sourceNoteIds && note.sourceNoteIds.length > 0;
              const hasSourceNotesContent =
                note.sourceNotesContent && note.sourceNotesContent.length > 0;

              if (!hasSourceNoteIds && !hasSourceNotesContent) {
                return;
              }

              handleSourceButtonClick(e);
            }}
            title={
              note.generationMode === "replace" &&
              note.sourceNotesContent &&
              note.sourceNotesContent.length > 0
                ? `查看历史便签：${note.sourceNotesContent.length} 个被替换的原始便签内容`
                : note.sourceNoteIds && note.sourceNoteIds.length > 0
                ? sourceConnectionsVisible
                  ? `隐藏连接线：${note.sourceNoteIds.length} 个源便签的连接关系`
                  : `显示连接线：${note.sourceNoteIds.length} 个源便签的连接关系`
                : "此便签没有源便签"
            }
          >
            {/* 显示溯源数量徽章 */}
            {((note.sourceNoteIds && note.sourceNoteIds.length > 0) ||
              (note.sourceNotesContent &&
                note.sourceNotesContent.length > 0)) && (
              <span className="toolbar-badge">
                {note.generationMode === "replace" && note.sourceNotesContent
                  ? note.sourceNotesContent.length
                  : note.sourceNoteIds?.length || 0}
              </span>
            )}
          </Button>

          {/* 持续对话按钮 */}
          <Button
            className="settings-toolbar-button disabled"
            icon={<MessageOutlined />}
            size="small"
            type="default"
            disabled
            title="持续对话 - 即将推出"
          />

          {/* 统计信息按钮 */}
          <Button
            className="settings-toolbar-button disabled"
            icon={<BarChartOutlined />}
            size="small"
            type="default"
            disabled
            title="统计信息 - 即将推出"
          />

          {/* 标签管理按钮 */}
          <Button
            className="settings-toolbar-button disabled"
            icon={<TagOutlined />}
            size="small"
            type="default"
            disabled
            title="标签管理 - 即将推出"
          />
        </div>
      )}

      <div
        ref={noteRef}
        data-note-id={note.id}
        data-scale={canvasScale.toString()} // 添加缩放级别数据属性
        className={`sticky-note color-${note.color} ${
          isEditing ? "editing" : ""
        } ${isDragging ? "dragging" : ""} ${note.isNew ? "new" : ""} ${
          isStreaming ? "streaming" : ""
        } ${isMoveModeActive ? "move-mode-disabled" : ""} ${
          isSelected ? "selected" : ""
        }`}
        style={{
          left: pixelAlignedX,
          top: pixelAlignedY,
          width: pixelAlignedWidth,
          height: pixelAlignedHeight,
          zIndex: note.zIndex,
          ...fontStyles, // 应用基于缩放的字体样式
        }}
        onWheel={(e) => {
          // 简化的滚轮事件处理逻辑，提升性能

          // 预览模式：直接允许画布缩放
          if (!isEditing) {
            return; // 不阻止冒泡，让画布处理缩放
          }

          // 编辑模式：只有textarea需要检查滚动
          if (isEditing && textareaRef.current) {
            const textarea = textareaRef.current;
            const { scrollTop, scrollHeight, clientHeight } = textarea;

            // 简化判断：只有内容确实可滚动时才进行边界检查
            if (scrollHeight <= clientHeight) {
              return; // 内容不需要滚动，允许画布缩放
            }

            const deltaY = e.deltaY;
            const canScrollUp = scrollTop > 0;
            const canScrollDown = scrollTop < scrollHeight - clientHeight;

            // 只有在可以继续滚动的方向上才阻止冒泡
            if ((deltaY < 0 && canScrollUp) || (deltaY > 0 && canScrollDown)) {
              e.stopPropagation();
            }
          }

          // 其他情况允许画布缩放
        }}
      >
        <div className="sticky-note-header">
          {/* 专门的拖拽区域 */}
          <div
            className="drag-handle"
            onMouseDown={(e) => {
              e.stopPropagation(); // 阻止冒泡，避免触发容器的置顶事件
              handleMouseDown(e);
            }}
            onClick={(e) => {
              // 阻止冒泡，让全局失焦检测处理编辑模式退出
              e.stopPropagation();
            }}
            style={{
              flexGrow: 1,
              cursor: isDragging
                ? "move"
                : isEditing || isTitleEditing
                ? "default"
                : "move",
              minHeight: "20px",
              display: "flex",
              alignItems: "center",
            }}
            title={
              isEditing || isTitleEditing
                ? "点击便签外部区域退出编辑模式"
                : "拖拽移动便签"
            }
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "flex-start",
                minWidth: 0, // 允许flex子元素收缩
                overflow: "hidden", // 防止内容溢出
              }}
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
                  style={{
                    width: "100%", // 占满可用空间
                    maxWidth: getTitleMaxWidth(), // 与显示模式保持一致
                  }}
                />
              ) : (
                <h3
                  className="sticky-note-title"
                  onMouseDown={handleNoteClickToFront}
                  onClick={(e) => {
                    // 如果正在编辑模式，单击标题退出编辑
                    if (isEditing || isTitleEditing) {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isEditing) stopEditing();
                      if (isTitleEditing) stopTitleEditing();
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // 移动模式下禁用编辑
                    if (isMoveModeActive) return;
                    // 如果不在编辑模式，双击开始编辑标题
                    if (!isEditing && !isTitleEditing) {
                      startTitleEditing();
                    }
                  }}
                  title={
                    isEditing || isTitleEditing
                      ? "点击退出编辑模式"
                      : `${localTitle || "便签"}${
                          (localTitle || "便签").length > 15
                            ? " (双击编辑标题)"
                            : " - 双击编辑标题"
                        }`
                  }
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.06)", // 深灰色背景
                    maxWidth: getTitleMaxWidth(), // 使用计算的最大宽度
                    display: "inline-block", // 恢复为inline-block
                    cursor: isEditing || isTitleEditing ? "pointer" : "text",
                  }}
                >
                  {localTitle || "便签"}
                </h3>
              )}
            </div>
          </div>
          <div className="sticky-note-controls">
            {/* 删除按钮 */}
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
              onClick={handleTextareaClick}
              onCompositionStart={handleContentCompositionStart}
              onCompositionEnd={handleContentCompositionEnd}
              placeholder="支持 Markdown 输入...&#10;&#10;⌨️ 快捷键：Esc 退出 | Ctrl+Enter 保存"
              className="sticky-note-textarea"
            />
          ) : (
            <div
              ref={previewRef}
              className="sticky-note-preview"
              onMouseDown={handleNoteClickToFront}
              onClick={(e) => {
                // 阻止冒泡，让全局失焦检测处理编辑模式退出
                e.stopPropagation();
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // 移动模式下禁用编辑
                if (isMoveModeActive) return;
                // 如果不在编辑模式，双击开始编辑
                if (!isEditing && !isTitleEditing) {
                  startEditing();
                }
              }}
              style={{
                backgroundColor: "transparent",
                cursor: isEditing || isTitleEditing ? "default" : "default",
              }}
              title={
                isEditing || isTitleEditing
                  ? "点击便签外部区域退出编辑模式"
                  : "双击开始编辑内容"
              }
            >
              {displayContent.trim() ? (
                <VirtualizedMarkdown
                  content={displayContent}
                  containerRef={previewRef}
                  enableVirtualization={true}
                  virtualizationThreshold={8000}
                  isStreaming={isStreaming}
                  streamingCursor={
                    isStreaming && showCursor ? (
                      <span className="streaming-cursor">|</span>
                    ) : undefined
                  }
                />
              ) : (
                <div className="empty-note">
                  {isStreaming ? "AI正在生成内容..." : "双击开始编辑内容"}
                </div>
              )}
            </div>
          )}
        </div>

        {!isEditing && (
          <>
            <div
              className="resize-handle"
              onMouseDown={handleResizeMouseDown}
              title="拖拽调整大小"
            />
            {/* macOS风格的缩放提示符号 */}
            <div className="resize-indicator" />
          </>
        )}

        {/* AI生成加载状态指示器 - 只在等待生成时显示 */}
        {isStreaming && !streamingContent && (
          <div className="ai-loading-indicator">
            <LoadingOutlined style={{ marginRight: 4 }} />
            <span>等待AI响应...</span>
          </div>
        )}

        {/* 连接点 - 只在非编辑和非流式状态下显示 */}
        {!isEditing &&
          !isStreaming &&
          (onConnect || sourceConnectionsVisible || isBeingSourceConnected) && (
            <div
              className={`connection-point ${isConnected ? "connected" : ""} ${
                note.sourceNoteIds && note.sourceNoteIds.length > 0
                  ? "has-source"
                  : ""
              } ${sourceConnectionsVisible ? "source-active" : ""} ${
                isSourceConnected ? "source-connected" : ""
              } ${isBeingSourceConnected ? "being-source-connected" : ""}`}
              onClick={handleConnectionClick}
              title={
                isConnected
                  ? "已连接到插槽"
                  : isSourceConnected
                  ? "作为源便签被其他便签引用"
                  : "点击连接到插槽"
              }
            >
              <div className="connection-dot"></div>
            </div>
          )}
      </div>

      {/* 源便签查看弹窗 - 替换模式溯源功能 */}
      <SourceNotesModal
        open={sourceNotesModalVisible}
        onClose={() => setSourceNotesModalVisible(false)}
        sourceNotes={note.sourceNotesContent || []}
        currentNoteTitle={note.title}
      />
    </>
  );
};

// 使用React.memo优化性能，避免不必要的重渲染
export default memo(StickyNote);
