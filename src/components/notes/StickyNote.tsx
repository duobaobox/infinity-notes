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
import { useDebounce } from "../../hooks";
import { useConnectionStore } from "../../stores/connectionStore";
import { useStickyNotesStore } from "../../stores/stickyNotesStore";
import { connectionLineManager } from "../../utils/connectionLineManager";
import {
  getFontSizeStyles,
  getPixelAlignedValue,
} from "../../utils/fontScaleUtils";
import SourceNotesModal from "../modals/SourceNotesModal";
import ThinkingChain from "../thinking/ThinkingChain";
import type { StickyNoteProps } from "../types";
import "./StickyNote.css";
import WysiwygEditor from "./WysiwygEditor";

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

  // 直接使用全局状态，移除冗余的本地状态
  // const [isEditing, setIsEditing] = useState(note.isEditing);
  // const [isTitleEditing, setIsTitleEditing] = useState(note.isTitleEditing);
  const [isTitleComposing, setIsTitleComposing] = useState(false);
  const [localContent, setLocalContent] = useState(note.content);
  const [localTitle, setLocalTitle] = useState(note.title);

  const [sourceConnectionsVisible, setSourceConnectionsVisible] =
    useState(false);
  const [isBeingSourceConnected, setIsBeingSourceConnected] = useState(false);

  // 新编辑器相关状态
  const [editorInstance, setEditorInstance] = useState<any>(null); // TipTap编辑器实例

  // 工具栏交互状态 - 用于临时禁用失焦检测
  const [isToolbarInteracting, setIsToolbarInteracting] = useState(false);

  // 通用的工具栏按钮点击处理函数
  const handleToolbarButtonClick = useCallback(
    (e: React.MouseEvent, action: () => void) => {
      e.preventDefault();
      e.stopPropagation();

      // 设置工具栏交互状态，临时禁用失焦检测
      setIsToolbarInteracting(true);

      // 执行格式化操作
      action();

      // 延迟重新聚焦编辑器并清除交互状态
      // 使用更长的延迟确保操作完成
      setTimeout(() => {
        editorInstance?.commands.focus();
        // 再延迟一点清除交互状态，确保失焦检测不会误触发
        setTimeout(() => {
          setIsToolbarInteracting(false);
        }, 50);
      }, 100);
    },
    [editorInstance]
  );
  const [sourceNotesModalVisible, setSourceNotesModalVisible] = useState(false);

  // Refs 和定时器
  const titleInputRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

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

  // 处理流式完成回调（分离逻辑避免循环依赖）
  useEffect(() => {
    if (!isStreaming && streamingContent && streamingContent !== note.content) {
      console.log("🔄 流式完成，更新便签内容:", {
        noteId: note.id,
        streamingContentLength: streamingContent.length,
        noteContentLength: note.content.length,
      });
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

  // 开始编辑内容 - 使用全局状态管理
  const startEditing = useCallback(() => {
    if (isStreaming) return; // 流式过程中不允许编辑
    if (isMoveModeActive) return; // 移动模式下不允许编辑
    onUpdate(note.id, { isEditing: true });
    setLocalContent(note.content);
  }, [note.id, note.content, onUpdate, isStreaming, isMoveModeActive]);

  // 停止编辑内容 - 使用全局状态管理
  const stopEditing = useCallback(() => {
    // 最后一次保存确保数据同步，同时停止编辑状态
    onUpdate(note.id, {
      content: localContent,
      isEditing: false,
      updatedAt: new Date(),
    });
  }, [note.id, onUpdate, localContent]);

  // 开始编辑标题 - 使用全局状态管理
  const startTitleEditing = useCallback(() => {
    if (isStreaming) return; // 流式过程中不允许编辑
    if (isMoveModeActive) return; // 移动模式下不允许编辑
    onUpdate(note.id, { isTitleEditing: true });
    setLocalTitle(note.title);
  }, [note.id, note.title, onUpdate, isStreaming, isMoveModeActive]);

  // 防抖更新标题到数据库
  const [debouncedUpdateTitle, clearTitleDebounce] = useDebounce(
    useCallback(
      (newTitle: string) => {
        onUpdate(note.id, { title: newTitle });
      },
      [note.id, onUpdate]
    ),
    300 // 300ms 防抖
  );

  // 停止编辑标题 - 使用全局状态管理
  const stopTitleEditing = useCallback(() => {
    // 清理防抖计时器
    clearTitleDebounce();
    // 最后一次保存确保数据同步，同时停止编辑状态
    onUpdate(note.id, {
      title: localTitle,
      isTitleEditing: false,
      updatedAt: new Date(),
    });
  }, [note.id, onUpdate, localTitle, clearTitleDebounce]);

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

  // 处理 WysiwygEditor 内容变化
  const handleWysiwygContentChange = useCallback(
    (newContent: string) => {
      setLocalContent(newContent);
      // 直接更新，WysiwygEditor内部已有防抖机制
      onUpdate(note.id, { content: newContent });
    },
    [note.id, onUpdate]
  );

  // WysiwygEditor 失焦处理已移除，统一使用 handleGlobalClick 处理失焦检测

  // 处理 WysiwygEditor 键盘事件
  const handleWysiwygKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        stopEditing();
        return true;
      }

      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        stopEditing();
        return true;
      }

      return false;
    },
    [stopEditing]
  );

  // 处理编辑器实例准备就绪 - 使用全局状态
  const handleEditorReady = useCallback(
    (editor: any) => {
      setEditorInstance(editor);

      // 如果当前处于编辑状态，确保编辑器聚焦
      if (note.isEditing) {
        setTimeout(() => {
          editor.commands.focus();
        }, 100);
      }
    },
    [note.isEditing]
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

      if (note.isEditing || note.isTitleEditing) {
        onUpdate(note.id, {
          isEditing: false,
          isTitleEditing: false,
        });
      }
    },
    [
      note.id,
      note.isEditing,
      note.isTitleEditing,
      onDelete,
      onUpdate,
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

  // 新增：处理便签点击置顶和选中 - 使用全局状态
  const handleNoteClickToFront = useCallback(() => {
    // 只有在预览模式（非编辑状态）下才触发置顶和选中
    if (!note.isEditing && !note.isTitleEditing) {
      onBringToFront(note.id); // 置顶
      selectNote(note.id); // 选中（会自动取消其他便签的选中状态）
    }
  }, [
    note.isEditing,
    note.isTitleEditing,
    onBringToFront,
    selectNote,
    note.id,
  ]);

  // 开始拖拽 - 使用全局状态
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (note.isEditing || note.isTitleEditing) return;

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
      note.isEditing,
      note.isTitleEditing,
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

  // 同步外部状态到本地状态 - 使用全局状态
  useEffect(() => {
    if (!note.isEditing) {
      setLocalContent(note.content);
    }
  }, [note.content, note.isEditing]);

  useEffect(() => {
    if (!note.isTitleEditing && !isTitleComposing) {
      setLocalTitle(note.title);
    }
  }, [note.title, note.isTitleEditing, isTitleComposing]);

  // 移除状态同步useEffect，直接使用全局状态

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
      clearTitleDebounce();
    };
  }, [clearTitleDebounce]);

  useEffect(() => {
    if (note.isTitleEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.setSelectionRange(
        localTitle.length,
        localTitle.length
      );
    }
  }, [note.isTitleEditing, localTitle.length]);

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

  // 焦点变化检测 - 已禁用，使用统一的失焦检测避免冲突
  // 原来的焦点检测会与工具栏操作冲突，已移除
  // 统一使用 handleGlobalClick 处理失焦检测

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
      clearTitleDebounce();

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

  // 统一的失焦检测 - 当点击便签外部时退出编辑模式
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      // 只有在编辑模式下才需要检测失焦
      if (!note.isEditing && !note.isTitleEditing) return;

      // 如果正在进行工具栏交互，暂时跳过失焦检测
      if (isToolbarInteracting) return;

      if (noteRef.current) {
        const target = event.target as HTMLElement;

        // 检查点击是否在当前便签内部
        const isInsideNote = noteRef.current.contains(target);

        // 检查是否在设置工具栏内部
        const isInsideToolbar = target.closest(".settings-toolbar");

        // 更全面地检查是否在内置格式化工具栏内部
        const isInsideFormatToolbar =
          target.closest(".toolbar-content") || // 工具栏容器
          target.classList.contains("toolbar-button") || // 工具栏按钮
          target.classList.contains("toolbar-button-group") || // 按钮组
          target.closest(".toolbar-button") || // 按钮内的子元素
          target.closest(".toolbar-divider") || // 分割线
          target.closest(".ProseMirror") || // TipTap编辑器内容区域
          target.classList.contains("ProseMirror"); // TipTap编辑器根元素

        // 检查是否在TipTap编辑器相关元素内部
        const isInsideEditor =
          target.closest(".wysiwyg-editor") ||
          target.closest(".tiptap") ||
          target.classList.contains("wysiwyg-editor") ||
          target.classList.contains("tiptap");

        // 额外检查：如果目标元素的父级链中包含当前便签，也认为是内部点击
        let currentElement = target;
        let isInsideCurrentNote = false;
        while (currentElement && currentElement !== document.body) {
          if (currentElement === noteRef.current) {
            isInsideCurrentNote = true;
            break;
          }
          currentElement = currentElement.parentElement as HTMLElement;
        }

        // 如果点击的不是当前便签内部，也不是任何工具栏或编辑器，退出编辑模式
        if (
          !isInsideNote &&
          !isInsideCurrentNote &&
          !isInsideToolbar &&
          !isInsideFormatToolbar &&
          !isInsideEditor
        ) {
          if (note.isEditing) stopEditing();
          if (note.isTitleEditing) stopTitleEditing();
        }
      }
    };

    // 只有在编辑模式下才添加监听器
    if (note.isEditing || note.isTitleEditing) {
      // 使用更短的延迟，但确保不与工具栏点击冲突
      const timeoutId = setTimeout(() => {
        document.addEventListener("click", handleGlobalClick, true); // 使用捕获阶段
      }, 100); // 增加延迟确保工具栏交互状态正确设置

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("click", handleGlobalClick, true);
      };
    }
  }, [
    note.isEditing,
    note.isTitleEditing,
    stopEditing,
    stopTitleEditing,
    isToolbarInteracting,
  ]);

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
          note.isEditing ? "editing" : ""
        } ${isDragging ? "dragging" : ""} ${isResizing ? "resizing" : ""} ${
          note.isNew ? "new" : ""
        } ${isStreaming ? "streaming" : ""} ${
          isMoveModeActive ? "move-mode-disabled" : ""
        } ${isSelected ? "selected" : ""}`}
        style={{
          left: pixelAlignedX,
          top: pixelAlignedY,
          width: pixelAlignedWidth,
          height: pixelAlignedHeight,
          zIndex: note.zIndex,
          ...fontStyles, // 应用基于缩放的字体样式
        }}
        onWheel={() => {
          // 滚轮事件处理由WysiwygEditor内部处理
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
                : note.isEditing || note.isTitleEditing
                ? "default"
                : "move",
              minHeight: "20px",
              display: "flex",
              alignItems: "center",
            }}
            title={
              note.isEditing || note.isTitleEditing
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
              {note.isTitleEditing ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={localTitle}
                  onChange={handleTitleChange}
                  onKeyDown={handleTitleKeyDown}
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
                    if (note.isEditing || note.isTitleEditing) {
                      e.preventDefault();
                      e.stopPropagation();
                      if (note.isEditing) stopEditing();
                      if (note.isTitleEditing) stopTitleEditing();
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // 移动模式下禁用编辑
                    if (isMoveModeActive) return;
                    // 如果不在编辑模式，双击开始编辑标题
                    if (!note.isEditing && !note.isTitleEditing) {
                      startTitleEditing();
                    }
                  }}
                  title={
                    note.isEditing || note.isTitleEditing
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
                    cursor:
                      note.isEditing || note.isTitleEditing
                        ? "pointer"
                        : "text",
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
          {/* 思维链组件 - 只在非编辑状态且有思维链数据时显示 */}
          {!note.isEditing && !isStreaming && note.thinkingChain && (
            <div style={{ marginBottom: "12px" }}>
              <ThinkingChain
                thinkingChain={note.thinkingChain}
                defaultExpanded={false}
                compact={true}
              />
            </div>
          )}

          {/* 🎯 无感一体化编辑器 - 彻底消除编辑/预览模式概念 */}
          <WysiwygEditor
            content={
              note.isEditing
                ? localContent
                : isStreaming && streamingContent
                ? streamingContent
                : // 如果有思维链数据，只显示最终答案，否则显示完整内容
                note.thinkingChain && !note.isEditing
                ? note.thinkingChain.finalAnswer
                : note.content
            }
            onChange={handleWysiwygContentChange}
            onBlur={undefined}
            onKeyDown={note.isEditing ? handleWysiwygKeyDown : undefined}
            onEditorReady={handleEditorReady}
            placeholder={
              note.content.trim() && !isStreaming
                ? ""
                : isStreaming
                ? "AI正在生成内容..."
                : "点击开始编辑..."
            }
            autoFocus={note.isEditing}
            disabled={!note.isEditing}
            className={`${note.isEditing ? "editing" : "viewing"} ${
              isStreaming ? "streaming" : ""
            }`}
            onClick={(e) => {
              // 只有在非编辑状态且不在移动模式下才启动编辑
              if (
                !note.isEditing &&
                !isMoveModeActive &&
                !note.isTitleEditing
              ) {
                e.preventDefault();
                e.stopPropagation();
                startEditing();
              }
            }}
            onMouseDown={handleNoteClickToFront}
            style={{
              cursor:
                !note.isEditing && !isMoveModeActive && !note.isTitleEditing
                  ? "text"
                  : "default",
              position: "relative",
            }}
            title={
              !note.isEditing && !isMoveModeActive && !note.isTitleEditing
                ? "点击开始编辑"
                : note.isEditing
                ? "正在编辑中"
                : ""
            }
          />
        </div>

        {/* 格式化工具栏 - 位于content下方，只在编辑时显示 */}
        {note.isEditing && (
          <div
            className="toolbar-content"
            onClick={(e) => {
              // 阻止工具栏容器的点击事件冒泡，防止触发失焦检测
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseDown={(e) => {
              // 阻止鼠标按下事件冒泡，确保工具栏交互不会影响编辑状态
              e.stopPropagation();
              // 设置工具栏交互状态
              setIsToolbarInteracting(true);
              // 短暂延迟后清除状态
              setTimeout(() => {
                setIsToolbarInteracting(false);
              }, 200);
            }}
          >
            {/* 基础格式化按钮 */}
            <div className="toolbar-button-group">
              <button
                className={`toolbar-button ${
                  editorInstance?.isActive("bold") ? "active" : ""
                }`}
                onClick={(e) =>
                  handleToolbarButtonClick(e, () => {
                    editorInstance?.chain().focus().toggleBold().run();
                  })
                }
                title="粗体 (Ctrl+B)"
                disabled={!editorInstance}
              >
                <strong>B</strong>
              </button>
              <button
                className={`toolbar-button ${
                  editorInstance?.isActive("italic") ? "active" : ""
                }`}
                onClick={(e) =>
                  handleToolbarButtonClick(e, () => {
                    editorInstance?.chain().focus().toggleItalic().run();
                  })
                }
                title="斜体 (Ctrl+I)"
                disabled={!editorInstance}
              >
                <em>I</em>
              </button>
              <button
                className={`toolbar-button ${
                  editorInstance?.isActive("strike") ? "active" : ""
                }`}
                onClick={(e) =>
                  handleToolbarButtonClick(e, () => {
                    editorInstance?.chain().focus().toggleStrike().run();
                  })
                }
                title="删除线"
                disabled={!editorInstance}
              >
                <s>S</s>
              </button>
              <button
                className={`toolbar-button ${
                  editorInstance?.isActive("code") ? "active" : ""
                }`}
                onClick={(e) =>
                  handleToolbarButtonClick(e, () => {
                    editorInstance?.chain().focus().toggleCode().run();
                  })
                }
                title="行内代码"
                disabled={!editorInstance}
              >
                &lt;/&gt;
              </button>
            </div>

            <div className="toolbar-divider"></div>

            {/* 列表按钮 */}
            <div className="toolbar-button-group">
              <button
                className={`toolbar-button ${
                  editorInstance?.isActive("bulletList") ? "active" : ""
                }`}
                onClick={(e) =>
                  handleToolbarButtonClick(e, () => {
                    editorInstance?.chain().focus().toggleBulletList().run();
                  })
                }
                title="无序列表"
                disabled={!editorInstance}
              >
                •
              </button>
              <button
                className={`toolbar-button ${
                  editorInstance?.isActive("orderedList") ? "active" : ""
                }`}
                onClick={(e) =>
                  handleToolbarButtonClick(e, () => {
                    editorInstance?.chain().focus().toggleOrderedList().run();
                  })
                }
                title="有序列表"
                disabled={!editorInstance}
              >
                1.
              </button>
              <button
                className={`toolbar-button ${
                  editorInstance?.isActive("taskList") ? "active" : ""
                }`}
                onClick={(e) =>
                  handleToolbarButtonClick(e, () => {
                    editorInstance?.chain().focus().toggleTaskList().run();
                  })
                }
                title="任务列表"
                disabled={!editorInstance}
              >
                ☐
              </button>
            </div>
          </div>
        )}

        {!note.isEditing && (
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
        {!note.isEditing &&
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
