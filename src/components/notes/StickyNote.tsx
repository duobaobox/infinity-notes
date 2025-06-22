import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
  useMemo,
} from "react";
import { throttle } from "lodash";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import type { StickyNoteProps } from "../types";
import "./StickyNote.css";
import { Button } from "antd";
import {
  DeleteOutlined,
  LoadingOutlined,
  LinkOutlined,
  BarChartOutlined,
  TagOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useConnectionStore } from "../../stores/connectionStore";
import { useStickyNotesStore } from "../../stores/stickyNotesStore";
import { connectionLineManager } from "../../utils/connectionLineManager";

const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  onUpdate,
  onDelete,
  onBringToFront,
  canvasScale,
  canvasOffset, // 新增：画布偏移量
  // 流式相关属性
  isStreaming = false,
  streamingContent = "",
  onStreamingComplete,
  // 连接相关属性
  onConnect,
  isConnected = false,
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

  // 光标位置保存状态
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const [shouldRestoreCursor, setShouldRestoreCursor] = useState(false);

  // 流式显示相关状态
  const [displayContent, setDisplayContent] = useState(note.content);
  const [showCursor, setShowCursor] = useState(false);

  // 溯源连接线状态
  const [sourceConnectionsVisible, setSourceConnectionsVisible] =
    useState(false);

  // 当前便签是否正在被溯源连接线连接（作为源便签）
  const [isBeingSourceConnected, setIsBeingSourceConnected] = useState(false);

  // 设置菜单状态
  const [settingsMenuVisible, setSettingsMenuVisible] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // 防抖更新的 timer
  const contentUpdateTimerRef = useRef<number | NodeJS.Timeout | null>(null);
  const titleUpdateTimerRef = useRef<number | NodeJS.Timeout | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  // 连接状态管理
  const {
    updateNoteConnectionLines,
    updateNoteConnectionLinesImmediate,
    removeConnection: removeConnectionFromStore,
  } = useConnectionStore();

  // 获取所有便签数据，用于检查源便签连接状态
  const allNotes = useStickyNotesStore((state) => state.notes);

  // 检查当前便签是否作为其他便签的源便签被引用
  const isSourceConnected = useMemo(() => {
    return allNotes.some((otherNote) => {
      if (otherNote.id === note.id) return false; // 跳过自己
      // 检查其他便签是否将当前便签作为源便签
      return otherNote.sourceNoteIds?.includes(note.id);
    });
  }, [note.id, allNotes]);

  // 检查并更新当前便签是否正在被溯源连接线连接（作为源便签）
  useEffect(() => {
    const checkSourceConnectionStatus = () => {
      const isConnected = connectionLineManager.isNoteBeingSourceConnected(
        note.id
      );
      setIsBeingSourceConnected(isConnected);
    };

    // 初始检查
    checkSourceConnectionStatus();

    // 设置定时器定期检查（这是一个临时解决方案，更好的方案是事件驱动）
    const interval = setInterval(checkSourceConnectionStatus, 100);

    // 监听源连接状态变化事件
    const handleSourceConnectionChanged = (event: CustomEvent) => {
      if (event.detail.noteId === note.id) {
        // 如果事件是针对当前便签的，立即更新状态
        console.log(`📢 便签 ${note.id} 接收到连接状态变化通知`);
        const newStatus = connectionLineManager.isNoteBeingSourceConnected(
          note.id
        );
        console.log(
          `📢 便签 ${note.id} 连接状态变更: ${isBeingSourceConnected} -> ${newStatus}`
        );
        checkSourceConnectionStatus();
      }
    };

    window.addEventListener(
      "sourceConnectionChanged",
      handleSourceConnectionChanged as EventListener
    );

    return () => {
      clearInterval(interval);
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

    console.log(
      `🔄 检测到便签 ${note.id} 的 sourceNoteIds 变化，重新创建溯源连接线`
    );

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
          console.warn(`便签 ${note.id} 没有有效的源便签，隐藏溯源连接线`);
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

        console.log(`🔗 重新创建了 ${successCount} 个溯源连接线`);

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
    setIsEditing(true);
    setLocalContent(note.content);
  }, [note.content, isStreaming]);

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
    setIsTitleEditing(true);
    setLocalTitle(note.title);
  }, [note.title, isStreaming]);

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

      // 保存光标位置
      const currentCursorPosition = e.currentTarget.selectionStart;
      setCursorPosition(currentCursorPosition);
      setShouldRestoreCursor(true);

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

      // 保存当前光标位置
      const currentCursorPosition = e.target.selectionStart;
      setCursorPosition(currentCursorPosition);
      setShouldRestoreCursor(true);

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
      if (isStreaming) return; // 流式过程中不允许删除

      e.stopPropagation();
      e.preventDefault(); // 添加阻止默认行为

      // 在删除便签之前，清理所有相关的连接线
      try {
        // 清理普通连接线
        connectionLineManager.removeConnection(note.id);

        // 同时从连接状态管理中移除该便签
        removeConnectionFromStore(note.id);

        // 清理作为目标便签的溯源连接线
        connectionLineManager.removeAllSourceConnectionsToNote(note.id);

        // 清理作为源便签的溯源连接线
        connectionLineManager.removeAllSourceConnectionsFromNote(note.id);

        console.log(`🧹 已清理便签 ${note.id} 的所有连接线和连接状态`);
      } catch (error) {
        console.error("清理连接线失败:", error);
      }

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
    [
      note.id,
      isEditing,
      isTitleEditing,
      onDelete,
      isStreaming,
      removeConnectionFromStore,
    ]
  );

  // 处理连接点点击 - 简单的单击连接
  const handleConnectionClick = useCallback(
    (e: React.MouseEvent) => {
      if (isStreaming) return; // 流式过程中不允许连接

      e.stopPropagation();
      e.preventDefault();

      // 如果有连接回调，调用连接回调
      if (onConnect) {
        onConnect(note);
      } else if (isSourceConnected) {
        // 如果是源便签，显示提示或其他处理逻辑
        console.log("当前便签作为源便签被其他便签引用");
      }
    },
    [note, onConnect, isStreaming, isSourceConnected]
  );

  // 处理溯源按钮点击
  const handleSourceButtonClick = useCallback(
    async (e: React.MouseEvent) => {
      if (isStreaming) return; // 流式过程中不允许操作

      e.stopPropagation();
      e.preventDefault();

      // 检查是否有源便签
      if (!note.sourceNoteIds || note.sourceNoteIds.length === 0) {
        console.warn("该便签没有源便签，无法显示溯源连接");
        return;
      }

      // 获取当前所有便签，验证源便签是否存在
      const validSourceNoteIds = note.sourceNoteIds.filter((sourceId) =>
        allNotes.some((n) => n.id === sourceId)
      );

      // 检查循环引用：如果当前便签被任何源便签引用，就存在循环引用
      const hasCircularReference = validSourceNoteIds.some((sourceId) => {
        const sourceNote = allNotes.find((n) => n.id === sourceId);
        return sourceNote?.sourceNoteIds?.includes(note.id);
      });

      if (hasCircularReference) {
        console.warn(
          `检测到循环引用：便签 "${note.title}" 与其源便签之间存在相互引用关系`
        );
        // 可以选择阻止显示连接线，或者只显示警告
        // 这里选择显示警告但仍然允许显示连接线
      }

      // 如果有无效的源便签ID，更新便签的溯源信息
      if (validSourceNoteIds.length !== note.sourceNoteIds.length) {
        const invalidIds = note.sourceNoteIds.filter(
          (id) => !validSourceNoteIds.includes(id)
        );
        console.warn(
          `发现无效的源便签ID: ${invalidIds.join(", ")}，将自动清理`
        );

        // 更新便签的源便签列表，移除无效的ID
        onUpdate(note.id, {
          sourceNoteIds:
            validSourceNoteIds.length > 0 ? validSourceNoteIds : undefined,
          updatedAt: new Date(),
        });

        // 如果没有有效的源便签了，直接返回
        if (validSourceNoteIds.length === 0) {
          console.warn("没有有效的源便签，无法显示溯源连接");
          return;
        }
      }

      if (sourceConnectionsVisible) {
        // 隐藏溯源连接线 - 使用原始的sourceNoteIds，因为连接线管理器会自动处理不存在的连接
        for (const sourceNoteId of note.sourceNoteIds) {
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
        // 通过触发一个自定义事件来通知其他便签组件更新状态
        for (const sourceNoteId of note.sourceNoteIds) {
          const event = new CustomEvent("sourceConnectionChanged", {
            detail: { noteId: sourceNoteId },
          });
          window.dispatchEvent(event);
          console.log(`🔔 通知源便签 ${sourceNoteId} 更新连接状态（移除连接）`);
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
            console.log(
              `🔔 通知源便签 ${sourceNoteId} 更新连接状态（创建连接）`
            );
          }
        } else {
          console.warn("🔗 没有成功创建任何溯源连接线");
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

  // 处理设置按钮点击
  const handleSettingsClick = useCallback(
    (e: React.MouseEvent) => {
      if (isStreaming) return; // 流式过程中不允许操作

      e.stopPropagation();
      e.preventDefault();

      setSettingsMenuVisible(!settingsMenuVisible);
    },
    [isStreaming, settingsMenuVisible]
  );

  // 鼠标按下开始拖拽
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isEditing || isTitleEditing || isStreaming) return; // 流式过程中不允许拖拽

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

      // 立即执行置顶操作，提升响应性
      onBringToFront(note.id);
    },
    [
      isEditing,
      isTitleEditing,
      isStreaming,
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

  // 节流的连接线更新 - 减少便签拖拽时的连接线更新频率
  const throttledNoteConnectionUpdate = useMemo(
    () =>
      throttle(() => {
        updateNoteConnectionLinesImmediate(note.id);
      }, 16), // 60fps
    [updateNoteConnectionLinesImmediate, note.id]
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

          // 使用节流的连接线更新，减少卡顿
          throttledNoteConnectionUpdate();
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
    canvasOffset,
    tempPosition.x,
    tempPosition.y,
    tempSize.width,
    tempSize.height,
    throttledNoteConnectionUpdate,
  ]);

  // 处理位置同步的 Effect
  useEffect(() => {
    if (
      isSyncingPosition &&
      note.x === tempPosition.x &&
      note.y === tempPosition.y
    ) {
      setIsSyncingPosition(false);
      // 位置同步完成后，更新连接线位置
      updateNoteConnectionLines(note.id);
    }
  }, [
    note.x,
    note.y,
    tempPosition.x,
    tempPosition.y,
    isSyncingPosition,
    note.id,
    updateNoteConnectionLines,
  ]);

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
      // 只在首次进入编辑模式时设置光标到末尾
      textareaRef.current.setSelectionRange(
        localContent.length,
        localContent.length
      );
    }
  }, [isEditing]); // 只依赖编辑状态，不依赖内容长度

  // 恢复光标位置 - 在内容更新后恢复之前保存的光标位置
  useEffect(() => {
    if (
      shouldRestoreCursor &&
      cursorPosition !== null &&
      textareaRef.current &&
      isEditing
    ) {
      // 使用setTimeout确保DOM更新完成后再设置光标位置
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
          setShouldRestoreCursor(false);
        }
      }, 0);
    }
  }, [localContent, shouldRestoreCursor, cursorPosition, isEditing]);

  // 自动聚焦到标题输入框 - 仅在进入标题编辑模式时设置光标到末尾
  useEffect(() => {
    if (isTitleEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.setSelectionRange(
        localTitle.length,
        localTitle.length
      );
    }
  }, [isTitleEditing]); // 只依赖编辑状态，不依赖内容长度

  // 处理内容编辑键盘事件
  const handleContentKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        stopEditing();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        // Ctrl/Cmd + Enter 保存并退出编辑
        e.preventDefault();
        stopEditing();
      } else {
        // 对于其他按键，保存光标位置
        const target = e.currentTarget;
        setTimeout(() => {
          setCursorPosition(target.selectionStart);
        }, 0);
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

      // 如果焦点转移到当前便签内的其他元素，不退出编辑模式
      if (relatedTarget && noteRef.current?.contains(relatedTarget)) {
        // 但是如果转移到标题输入框，允许
        if (relatedTarget.classList.contains("sticky-note-title-input")) {
          return;
        }
        // 转移到删除按钮、设置按钮等，不退出编辑模式
        if (
          relatedTarget.classList.contains("delete-button") ||
          relatedTarget.closest(".delete-button") ||
          relatedTarget.closest("[class*='delete-button']") ||
          relatedTarget.classList.contains("settings-button") ||
          relatedTarget.closest(".settings-button") ||
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

  // 处理文本框点击事件 - 保存光标位置
  const handleTextareaClick = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      const target = e.currentTarget;
      setTimeout(() => {
        setCursorPosition(target.selectionStart);
      }, 0);
    },
    []
  );

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
        // 转移到删除按钮、设置按钮等，不退出编辑模式
        if (
          relatedTarget.classList.contains("delete-button") ||
          relatedTarget.closest(".delete-button") ||
          relatedTarget.closest("[class*='delete-button']") ||
          relatedTarget.classList.contains("settings-button") ||
          relatedTarget.closest(".settings-button") ||
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

  // 组件卸载时清理溯源连接线
  useEffect(() => {
    return () => {
      // 清理溯源连接线
      if (note.sourceNoteIds && sourceConnectionsVisible) {
        for (const sourceNoteId of note.sourceNoteIds) {
          connectionLineManager.removeSourceConnection(sourceNoteId, note.id);
        }
      }
    };
  }, [note.id, note.sourceNoteIds, sourceConnectionsVisible]);

  // 点击外部区域关闭设置工具栏
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuVisible && noteRef.current) {
        const target = event.target as HTMLElement;
        // 检查点击是否在便签内部或工具栏内部
        const isInsideNote = noteRef.current.contains(target);
        const isInsideToolbar = target.closest(".settings-toolbar");
        const isInsideToolbarButton = target.closest(
          ".settings-toolbar-button"
        );

        // 如果点击的不是便签内部也不是工具栏内部，关闭设置工具栏
        // 但是如果点击的是工具栏按钮，不要关闭（让按钮自己处理）
        if (!isInsideNote && !isInsideToolbar && !isInsideToolbarButton) {
          setSettingsMenuVisible(false);
        }
      }
    };

    if (settingsMenuVisible) {
      // 使用setTimeout延迟添加事件监听器，避免与按钮点击冲突
      const timeoutId = setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 150); // 增加延迟时间，确保按钮点击事件先执行

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [settingsMenuVisible]);

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
      {/* 设置工具栏 - 位于便签头部上方 */}
      {settingsMenuVisible && (
        <div
          className="settings-toolbar"
          style={{
            left: actualX,
            top: actualY - 45, // 位于便签头部上方45px
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
              !note.sourceNoteIds || note.sourceNoteIds.length === 0
                ? "disabled"
                : sourceConnectionsVisible
                ? "active"
                : ""
            }`}
            icon={<LinkOutlined />}
            size="small"
            type="text"
            disabled={!note.sourceNoteIds || note.sourceNoteIds.length === 0}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();

              // 检查按钮是否被禁用
              if (!note.sourceNoteIds || note.sourceNoteIds.length === 0) {
                return;
              }

              handleSourceButtonClick(e);
            }}
            title={
              note.sourceNoteIds && note.sourceNoteIds.length > 0
                ? sourceConnectionsVisible
                  ? `隐藏 ${note.sourceNoteIds.length} 个源便签的连接线`
                  : `显示 ${note.sourceNoteIds.length} 个源便签的连接关系`
                : "此便签没有源便签"
            }
          >
            {note.sourceNoteIds && note.sourceNoteIds.length > 0 && (
              <span className="toolbar-badge">{note.sourceNoteIds.length}</span>
            )}
          </Button>

          {/* 统计信息按钮 */}
          <Button
            className="settings-toolbar-button disabled"
            icon={<BarChartOutlined />}
            size="small"
            type="text"
            disabled
            title="统计信息 - 即将推出"
          />

          {/* 标签管理按钮 */}
          <Button
            className="settings-toolbar-button disabled"
            icon={<TagOutlined />}
            size="small"
            type="text"
            disabled
            title="标签管理 - 即将推出"
          />

          {/* 模板应用按钮 */}
          <Button
            className="settings-toolbar-button disabled"
            icon={<FileTextOutlined />}
            size="small"
            type="text"
            disabled
            title="模板应用 - 即将推出"
          />
        </div>
      )}

      <div
        ref={noteRef}
        data-note-id={note.id}
        className={`sticky-note color-${note.color} ${
          isEditing ? "editing" : ""
        } ${isDragging ? "dragging" : ""} ${note.isNew ? "new" : ""} ${
          isStreaming ? "streaming" : ""
        }`}
        style={{
          left: actualX,
          top: actualY,
          width: actualWidth,
          height: actualHeight,
          zIndex: note.zIndex,
        }}
        onWheel={(e) => {
          // 阻止滚轮事件冒泡到画布，避免在便签上滚动时触发画布缩放
          e.stopPropagation();
        }}
      >
        <div className="sticky-note-header">
          {/* 专门的拖拽区域 */}
          <div
            className="drag-handle"
            onMouseDown={handleMouseDown}
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
                    // 如果不在编辑模式，双击开始编辑标题
                    if (!isEditing && !isTitleEditing) {
                      startTitleEditing();
                    }
                  }}
                  title={
                    isEditing || isTitleEditing
                      ? "点击退出编辑模式"
                      : "双击编辑标题"
                  }
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.06)", // 深灰色背景
                    width: getTitleBackgroundWidth(),
                    display: "inline-block",
                    cursor: isEditing || isTitleEditing ? "pointer" : "text",
                  }}
                >
                  {localTitle || "便签"}
                </h3>
              )}
            </div>
          </div>
          <div className="sticky-note-controls">
            {/* 设置按钮 - 三个点 */}
            <Button
              icon={<span className="settings-icon">⋯</span>}
              onClick={handleSettingsClick}
              title="便签设置"
              type="text"
              size="small"
              style={{
                color: "#666", // 默认灰色图标
                backgroundColor: "rgba(0, 0, 0, 0.06)", // 与删除按钮背景色一致
                borderRadius: "4px",
                marginRight: "4px", // 与删除按钮保持间距
              }}
              className="settings-button sticky-note-settings-button"
            />
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
              placeholder="输入 Markdown 内容...&#10;&#10;💡 快捷键：&#10;• Esc 退出编辑（会自动保存）&#10;• Ctrl/⌘ + Enter 保存"
              className="sticky-note-textarea"
            />
          ) : (
            <div
              ref={previewRef}
              className="sticky-note-preview"
              onMouseDown={(e) => {
                // 阻止父元素的拖拽事件
                e.stopPropagation();
              }}
              onClick={(e) => {
                // 阻止冒泡，让全局失焦检测处理编辑模式退出
                e.stopPropagation();
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
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
                <div className="streaming-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                    {displayContent}
                  </ReactMarkdown>
                  {isStreaming && showCursor && (
                    <span className="streaming-cursor">|</span>
                  )}
                </div>
              ) : (
                <div className="empty-note">
                  {isStreaming ? "AI正在生成内容..." : "双击开始编辑内容"}
                </div>
              )}
            </div>
          )}
        </div>

        {!isEditing && !isStreaming && (
          <div
            className="resize-handle"
            onMouseDown={handleResizeMouseDown}
            title="拖拽调整大小"
          />
        )}

        {/* AI生成加载状态指示器 - 只在等待生成时显示 */}
        {isStreaming && !streamingContent && (
          <div className="ai-loading-indicator">
            <LoadingOutlined style={{ marginRight: 4, fontSize: 12 }} />
            <span style={{ fontSize: 12 }}>等待AI响应...</span>
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
              onDoubleClick={(e) => {
                // 双击连接点的处理逻辑 - 当前只是记录日志，不执行删除
                e.stopPropagation();
                e.preventDefault();
                console.log(`🔍 双击连接点 - 便签ID: ${note.id}, 连接状态:`, {
                  isConnected,
                  isSourceConnected,
                  sourceConnectionsVisible,
                  isBeingSourceConnected,
                });
                console.warn(
                  "⚠️ 如果溯源连接线被意外删除，请检查这里是否有删除逻辑！"
                );
              }}
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
    </>
  );
};

// 使用React.memo优化性能，避免不必要的重渲染
export default memo(StickyNote);
