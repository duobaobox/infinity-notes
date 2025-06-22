// 重构后的无限画布组件 - 使用全局状态管理
import React, {
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useImperativeHandle,
  forwardRef,
} from "react";
import { throttle, debounce } from "lodash";
import { message } from "antd";
import CanvasToolbar from "./CanvasToolbar";
import CanvasGrid from "./CanvasGrid";
import CanvasConsole from "./CanvasConsole";
import StickyNoteSlots from "./StickyNoteSlots";
import StickyNote from "../notes/StickyNote";
import SearchModal from "../modals/SearchModal";
import SettingsModal from "../modals/SettingsModal";
import { CANVAS_CONSTANTS, PERFORMANCE_CONSTANTS } from "./CanvasConstants";
import type { StickyNote as StickyNoteType } from "../types";
import "./InfiniteCanvas.css";

// 全局状态管理导入
import {
  useStickyNotesStore,
  useCanvasStore,
  useAIStore,
  useUIStore,
  useConnectionStore,
} from "../../stores";
import { connectionUtils } from "../../stores/connectionStore";

// AI服务导入
import { getAIService } from "../../services/ai/aiService";

// 检查是否应该忽略画布事件的工具函数
const shouldIgnoreCanvasEvent = (target: HTMLElement): boolean => {
  return !!(
    (
      target.closest(".sticky-note") ||
      target.closest(".canvas-console") ||
      target.closest(".canvas-toolbar") ||
      target.closest(".ant-modal") || // Ant Design 模态框
      target.closest(".settings-modal") || // 设置模态框
      target.closest(".search-modal") || // 搜索模态框
      target.closest(".ant-drawer") || // Ant Design 抽屉
      target.closest(".ant-popover") || // Ant Design 弹出框
      target.closest(".ant-tooltip") || // Ant Design 提示框
      target.closest(".ant-dropdown")
    ) // Ant Design 下拉菜单
  );
};

// 颜色转换工具函数 - 将十六进制颜色转换为便签颜色名称
const convertColorToNoteName = (color?: string): StickyNoteType["color"] => {
  if (!color) return "yellow";

  // 十六进制颜色映射
  const colorMap: Record<string, StickyNoteType["color"]> = {
    "#fef3c7": "yellow",
    "#e3f2fd": "blue",
    "#dbeafe": "blue",
    "#d1fae5": "green",
    "#fce7f3": "pink",
    "#e9d5ff": "purple",
  };

  // 直接匹配
  if (colorMap[color.toLowerCase()]) {
    return colorMap[color.toLowerCase()];
  }

  // 如果已经是颜色名称，直接返回
  const validColors: StickyNoteType["color"][] = [
    "yellow",
    "blue",
    "green",
    "pink",
    "purple",
  ];
  if (validColors.includes(color as StickyNoteType["color"])) {
    return color as StickyNoteType["color"];
  }

  // 默认返回黄色
  return "yellow";
};

// 组件接口
interface InfiniteCanvasRef {
  createNote: () => void;
  focusConsole: () => void;
  saveAllNotes: () => void;
  undo: () => void;
  redo: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  openSearch: () => void;
}

const InfiniteCanvas = forwardRef<InfiniteCanvasRef>((_, ref) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<{ focus: () => void }>(null);

  // 全局状态管理 - 便签状态
  const {
    notes: stickyNotes,
    streamingNotes,
    addNote,
    updateNote,
    deleteNote,
    bringNoteToFront,
    startStreamingNote,
    updateStreamingContent,
    finishStreamingNote,
    cancelStreamingNote,
  } = useStickyNotesStore();

  // 全局状态管理 - 画布状态
  const {
    scale,
    offsetX,
    offsetY,
    dragState,
    zoomAnimating,
    zoomIn,
    zoomOut,
    startDrag,
    updateDrag,
    endDrag,
    resetView,
    getCanvasCenter,
  } = useCanvasStore();

  // 全局状态管理 - AI状态
  const {
    hasValidConfig,
    isGenerating: isAIGenerating,
    startGeneration,
    finishGeneration,
    getFullConfig,
  } = useAIStore();

  // 全局状态管理 - UI状态
  const {
    modals: { searchModalOpen, settingsModalOpen, settingsDefaultTab },
    openSearchModal,
    closeSearchModal,
    openSettingsModal,
    closeSettingsModal,
  } = useUIStore();

  // 全局状态管理 - 连接状态
  const {
    connectedNotes,
    connectionMode,
    isVisible: slotsVisible,
    addConnection,
    removeConnection,
    clearAllConnections,
    setConnectionMode,
    isNoteConnected,
    updateConnectionLines,
    updateConnectionLinesImmediate,
  } = useConnectionStore();

  // 处理清空所有连接的函数
  const handleClearAllConnections = useCallback(() => {
    try {
      console.log("🔄 开始清空所有连接...");
      if (connectedNotes.length === 0) {
        console.log("ℹ️ 没有需要清空的连接");
        return;
      }

      // 清空所有连接
      clearAllConnections();

      // 更新画布状态
      updateConnectionLinesImmediate();

      console.log("✅ 清空连接操作完成");
    } catch (error) {
      console.error("❌ 清空连接失败:", error);
      // 显示错误消息
      message.error("清空连接失败，请重试");
    }
  }, [connectedNotes, clearAllConnections, updateConnectionLinesImmediate]);

  // 获取完整AI配置
  const fullAIConfig = useMemo(() => {
    return getFullConfig();
  }, [getFullConfig]);

  // AI服务实例
  const aiService = useMemo(() => {
    console.log("🔧 更新AI服务配置:", {
      ...fullAIConfig,
      apiKey: fullAIConfig.apiKey ? "已设置" : "未设置",
      systemPrompt: fullAIConfig.systemPrompt ? "已设置" : "未设置",
    });
    return getAIService(fullAIConfig);
  }, [fullAIConfig]);

  // 优化便签渲染 - 缓存画布偏移对象，避免每次渲染都创建新对象
  const canvasOffset = useMemo(
    () => ({ x: offsetX, y: offsetY }),
    [offsetX, offsetY]
  );

  // 便签操作函数
  const updateStickyNote = useCallback(
    async (id: string, updates: Partial<StickyNoteType>) => {
      await updateNote(id, updates);
    },
    [updateNote]
  );

  const deleteStickyNote = useCallback(
    async (id: string) => {
      await deleteNote(id);
    },
    [deleteNote]
  );

  // 创建新便签
  const createStickyNote = useCallback(
    async (x: number, y: number) => {
      try {
        const colors: Array<StickyNoteType["color"]> = [
          "yellow",
          "blue",
          "green",
          "pink",
          "purple",
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        // 添加随机偏移，防止便签完全堆叠
        const offsetRange = 50;
        const randomOffsetX = Math.random() * offsetRange * 2 - offsetRange;
        const randomOffsetY = Math.random() * offsetRange * 2 - offsetRange;

        const positionX = x + randomOffsetX;
        const positionY = y + randomOffsetY;

        const maxZ =
          stickyNotes.length > 0
            ? Math.max(...stickyNotes.map((note) => note.zIndex))
            : 0;

        const newNote: StickyNoteType = {
          id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          x: positionX,
          y: positionY,
          width: 250,
          height: 200,
          content: "",
          title: "新便签",
          color: randomColor,
          isNew: true,
          zIndex: maxZ + 1,
          isEditing: true,
          isTitleEditing: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        if (process.env.NODE_ENV === "development") {
          console.log("📝 创建新便签:", newNote.id);
        }

        // 添加到数据库，addNote会返回实际添加的便签
        const addedNote = await addNote(newNote);

        if (process.env.NODE_ENV === "development") {
          console.log("✅ 便签添加完成:", addedNote.id);
        }

        // 500ms 后移除新建标记
        setTimeout(async () => {
          try {
            if (process.env.NODE_ENV === "development") {
              console.log("🔄 移除新建标记:", addedNote.id);
            }
            await updateStickyNote(addedNote.id, { isNew: false });
            if (process.env.NODE_ENV === "development") {
              console.log("✅ 新建标记移除完成:", addedNote.id);
            }
          } catch (error) {
            console.error("❌ 移除新建标记失败:", error);
          }
        }, 500);
      } catch (error) {
        console.error("❌ 创建便签失败:", error);
        message.error("创建便签失败");
      }
    },
    [stickyNotes, addNote, updateStickyNote]
  );

  // 在画布中心创建便签
  const createStickyNoteAtCenter = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // 增加中心区域随机分布
      const centerRandomRange = 100;
      const distributedScreenX =
        centerX + (Math.random() * centerRandomRange - centerRandomRange / 2);
      const distributedScreenY =
        centerY + (Math.random() * centerRandomRange - centerRandomRange / 2);

      // 将屏幕坐标转换为画布逻辑坐标
      const logicalX = (distributedScreenX - offsetX) / scale;
      const logicalY = (distributedScreenY - offsetY) / scale;

      createStickyNote(logicalX, logicalY);
    }
  }, [createStickyNote, offsetX, offsetY, scale]);

  // AI生成便签功能
  const handleAIGenerate = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) {
        message.warning("请输入提示内容");
        return;
      }

      try {
        // 开始AI生成状态
        startGeneration();

        // 如果有连接的便签，将其内容包含在提示中
        const finalPrompt =
          connectedNotes.length > 0
            ? connectionUtils.generateAIPromptWithConnections(
                prompt,
                connectedNotes
              )
            : prompt;

        console.log("🤖 开始AI生成便签，prompt:", finalPrompt);
        if (connectedNotes.length > 0) {
          console.log("🔗 使用了", connectedNotes.length, "个连接的便签");
        }

        // 计算便签创建位置（画布中心附近）
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) {
          throw new Error("无法获取画布位置");
        }

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // 添加随机偏移，避免便签重叠
        const randomRange = 150;
        const distributedScreenX =
          centerX + (Math.random() * randomRange - randomRange / 2);
        const distributedScreenY =
          centerY + (Math.random() * randomRange - randomRange / 2);

        // 将屏幕坐标转换为画布逻辑坐标
        const logicalX = (distributedScreenX - offsetX) / scale;
        const logicalY = (distributedScreenY - offsetY) / scale;

        // 创建临时便签用于流式显示
        const maxZ =
          stickyNotes.length > 0
            ? Math.max(...stickyNotes.map((note) => note.zIndex))
            : 0;

        const tempNote: StickyNoteType = {
          id: `ai-note-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          x: logicalX,
          y: logicalY,
          width: 280,
          height: 220,
          content: "",
          title: "AI便签",
          color: hasValidConfig ? "blue" : "yellow", // 有效配置用蓝色，演示模式用黄色
          isNew: false,
          zIndex: maxZ + 1,
          isEditing: false,
          isTitleEditing: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          // 汇总模式下记录源便签ID，用于溯源功能
          sourceNoteIds:
            connectedNotes.length > 0 && connectionMode === "summary"
              ? connectedNotes.map((note) => note.id)
              : undefined,
        };

        // 添加临时便签到数据库
        const addedNote = await addNote(tempNote);

        // 开始流式生成
        startStreamingNote(addedNote.id, addedNote);

        // 调用AI服务生成内容
        const result = await aiService.generateStickyNotesStreaming(
          finalPrompt,
          {
            onNoteStart: (index, title) => {
              console.log(`📝 便签 ${index} 开始生成:`, title);
              // AI便签标题保持固定，不需要更新
            },
            onContentChunk: (_index, _chunk, fullContent) => {
              // 更新流式内容
              updateStreamingContent(addedNote.id, fullContent);
            },
            onNoteComplete: async (index, noteData) => {
              console.log(`✅ 便签 ${index} 生成完成:`, noteData);

              // 完成流式生成，更新最终内容
              await finishStreamingNote(addedNote.id, noteData.content);

              // 更新便签的其他属性（保持AI便签标题不变）
              await updateStickyNote(addedNote.id, {
                color: convertColorToNoteName(noteData.color) || tempNote.color,
                updatedAt: new Date(),
              });
            },
            onAllComplete: (notes) => {
              console.log("🎉 所有便签生成完成:", notes.length);

              // 处理连接模式
              if (connectedNotes.length > 0) {
                if (connectionMode === "replace") {
                  // 替换模式：删除原始便签，但保留连接状态
                  console.log("🔄 替换模式：删除原始连接的便签");
                  connectedNotes.forEach((note) => {
                    deleteNote(note.id);
                  });
                  // 替换模式下清空连接，因为原始便签已被删除
                  clearAllConnections();
                  console.log("🧹 替换模式：已清空便签连接");
                } else {
                  // 汇总模式：保留原始便签和连接
                  console.log("📌 汇总模式：保留便签连接");
                }
              }

              message.success(`AI生成完成！共创建 ${notes.length} 个便签`);
            },
            onError: (error) => {
              console.error("❌ AI生成失败:", error);
              message.error(`AI生成失败: ${error}`);

              // 清理流式状态
              cancelStreamingNote(addedNote.id);

              // 删除临时便签
              deleteNote(addedNote.id);
            },
          }
        );

        if (!result.success) {
          throw new Error(result.error || "AI生成失败");
        }
      } catch (error) {
        console.error("❌ AI生成过程失败:", error);
        message.error(error instanceof Error ? error.message : "AI生成失败");
      } finally {
        // 结束AI生成状态
        finishGeneration();
      }
    },
    [
      startGeneration,
      finishGeneration,
      aiService,
      hasValidConfig,
      offsetX,
      offsetY,
      scale,
      stickyNotes,
      addNote,
      updateStickyNote,
      deleteNote,
      startStreamingNote,
      updateStreamingContent,
      finishStreamingNote,
      cancelStreamingNote,
      connectedNotes,
      connectionMode,
      clearAllConnections,
    ]
  );

  // 鼠标事件处理
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // 只处理左键点击
      if (e.button !== 0) return;

      // 如果点击的是便签或其他交互元素，不处理画布拖拽
      const target = e.target as HTMLElement;
      if (shouldIgnoreCanvasEvent(target)) {
        return;
      }

      e.preventDefault();
      if (process.env.NODE_ENV === "development") {
        console.log("🖱️ 开始拖拽画布", { x: e.clientX, y: e.clientY });
      }
      startDrag(e.clientX, e.clientY);
    },
    [startDrag]
  );

  // 节流的鼠标移动处理 - 提升拖拽性能
  const throttledUpdateDrag = useMemo(
    () =>
      throttle((clientX: number, clientY: number) => {
        updateDrag(clientX, clientY);
      }, PERFORMANCE_CONSTANTS.DRAG_THROTTLE_MS), // 60fps
    [updateDrag]
  );

  // 节流的连接线更新 - 减少画布拖拽时的连接线更新频率
  const throttledConnectionUpdate = useMemo(
    () =>
      throttle(() => {
        updateConnectionLinesImmediate();
      }, PERFORMANCE_CONSTANTS.CONNECTION_UPDATE_IMMEDIATE_THROTTLE_MS),
    [updateConnectionLinesImmediate]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragState.isDragging) {
        e.preventDefault();
        throttledUpdateDrag(e.clientX, e.clientY);
        // 使用节流的连接线更新，减少卡顿
        throttledConnectionUpdate();
      }
    },
    [dragState.isDragging, throttledUpdateDrag, throttledConnectionUpdate]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (dragState.isDragging) {
        e.preventDefault();
        endDrag();
      }
    },
    [dragState.isDragging, endDrag]
  );

  // 三击检测状态
  const tripleClickStateRef = useRef({
    clickCount: 0,
    lastClickTime: 0,
    lastClickPos: { x: 0, y: 0 },
  });

  // 三击创建便签
  const handleTripleClick = useCallback(
    (e: React.MouseEvent) => {
      // 如果点击的是便签或其他交互元素，不创建新便签
      const target = e.target as HTMLElement;
      if (shouldIgnoreCanvasEvent(target)) {
        return;
      }

      const now = Date.now();
      const clickPos = { x: e.clientX, y: e.clientY };
      const state = tripleClickStateRef.current;

      // 检查时间间隔（400ms内）和位置距离（20px内）
      const timeDiff = now - state.lastClickTime;
      const posDiff = Math.sqrt(
        Math.pow(clickPos.x - state.lastClickPos.x, 2) +
          Math.pow(clickPos.y - state.lastClickPos.y, 2)
      );

      if (timeDiff < 400 && posDiff < 20) {
        // 连续点击
        state.clickCount++;

        if (state.clickCount === 3) {
          // 第三次点击，创建便签
          e.preventDefault();

          // 使用容器的边界来计算坐标
          const containerElement = e.currentTarget as HTMLElement;
          const rect = containerElement.getBoundingClientRect();
          const canvasX = (e.clientX - rect.left - offsetX) / scale;
          const canvasY = (e.clientY - rect.top - offsetY) / scale;

          if (process.env.NODE_ENV === "development") {
            console.log("🖱️ 三击创建便签", {
              clientX: e.clientX,
              clientY: e.clientY,
              canvasX: canvasX.toFixed(1),
              canvasY: canvasY.toFixed(1),
            });
          }

          createStickyNote(canvasX, canvasY);

          // 重置状态
          state.clickCount = 0;
        }
      } else {
        // 重新开始计数
        state.clickCount = 1;
      }

      state.lastClickTime = now;
      state.lastClickPos = clickPos;
    },
    [offsetX, offsetY, scale, createStickyNote]
  );

  // 节流的滚轮缩放处理 - 提升缩放性能
  const throttledZoom = useMemo(
    () =>
      throttle((deltaY: number, centerX: number, centerY: number) => {
        if (deltaY < 0) {
          // 向上滚动，放大
          zoomIn(centerX, centerY);
        } else {
          // 向下滚动，缩小
          zoomOut(centerX, centerY);
        }
      }, CANVAS_CONSTANTS.WHEEL_THROTTLE_MS),
    [zoomIn, zoomOut]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      // 使用容器的边界来计算缩放中心点
      const containerElement = document.querySelector(
        ".infinite-canvas-container"
      ) as HTMLElement;
      if (!containerElement) return;

      const rect = containerElement.getBoundingClientRect();
      const centerX = e.clientX - rect.left;
      const centerY = e.clientY - rect.top;

      throttledZoom(e.deltaY, centerX, centerY);
    },
    [throttledZoom]
  );

  // 即时更新CSS变量 - 确保画布和便签同步
  const updateCSSVariables = useCallback(
    (scale: number, offsetX: number, offsetY: number) => {
      const container = document.querySelector(
        ".infinite-canvas-container"
      ) as HTMLElement;
      if (!container) return;

      // 批量更新CSS变量，减少重排重绘
      container.style.setProperty("--canvas-scale", scale.toString());
      container.style.setProperty("--canvas-offset-x", `${offsetX}px`);
      container.style.setProperty("--canvas-offset-y", `${offsetY}px`);
      // 同时更新内容偏移变量，确保画布内容和便签同步
      container.style.setProperty("--content-offset-x", `${offsetX}px`);
      container.style.setProperty("--content-offset-y", `${offsetY}px`);
    },
    []
  );

  // 防抖的日志输出 - 只用于日志，不影响渲染
  const debouncedLogUpdate = useMemo(
    () =>
      debounce((scale: number, offsetX: number, offsetY: number) => {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `🎨 画布状态更新: scale=${scale.toFixed(
              2
            )}, offset=(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`
          );
        }
      }, PERFORMANCE_CONSTANTS.CSS_UPDATE_DEBOUNCE_MS),
    []
  );

  // 同步画布状态到CSS变量，用于网格显示
  useEffect(() => {
    // 即时更新CSS变量，确保画布和便签同步
    updateCSSVariables(scale, offsetX, offsetY);

    // 防抖日志输出，避免拖拽时的日志噪音
    if (!dragState.isDragging) {
      debouncedLogUpdate(scale, offsetX, offsetY);
    }

    // 只在拖拽结束后更新连接线位置，避免拖拽过程中的频繁更新
    if (!dragState.isDragging) {
      updateConnectionLines();
    }
  }, [
    scale,
    offsetX,
    offsetY,
    dragState.isDragging,
    updateCSSVariables,
    debouncedLogUpdate,
    updateConnectionLines,
  ]);

  // 组件初始化和清理
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🎨 InfiniteCanvas 组件初始化完成");
    }

    // 组件卸载时清理节流和防抖函数
    return () => {
      throttledUpdateDrag.cancel();
      throttledZoom.cancel();
      throttledConnectionUpdate.cancel();
      debouncedLogUpdate.cancel();
      if (process.env.NODE_ENV === "development") {
        console.log("🧹 InfiniteCanvas 组件清理完成");
      }
    };
  }, [
    throttledUpdateDrag,
    throttledZoom,
    throttledConnectionUpdate,
    debouncedLogUpdate,
  ]);

  // 设置全局鼠标事件监听器
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const handleGlobalMouseUp = (e: MouseEvent) => handleMouseUp(e);

    if (dragState.isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  // 设置滚轮事件监听器 - 监听整个画布容器
  useEffect(() => {
    const containerElement = document.querySelector(
      ".infinite-canvas-container"
    ) as HTMLElement;
    if (!containerElement) return;

    const handleWheelEvent = (e: WheelEvent) => {
      // 检查事件是否来自便签或其他交互元素
      const target = e.target as HTMLElement;
      if (shouldIgnoreCanvasEvent(target)) {
        return; // 不处理这些元素上的滚轮事件
      }

      handleWheel(e);
    };

    containerElement.addEventListener("wheel", handleWheelEvent, {
      passive: false,
    });

    return () => {
      containerElement.removeEventListener("wheel", handleWheelEvent);
    };
  }, [handleWheel]);

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    createNote: createStickyNoteAtCenter,
    focusConsole: () => consoleRef.current?.focus(),
    saveAllNotes: () => {
      // TODO: 实现保存所有便签
      message.success("便签已保存");
    },
    undo: () => {
      // TODO: 实现撤销功能
      message.info("撤销功能待实现");
    },
    redo: () => {
      // TODO: 实现重做功能
      message.info("重做功能待实现");
    },
    zoomIn: () => zoomIn(),
    zoomOut: () => zoomOut(),
    resetZoom: () => resetView(),
    openSearch: () => openSearchModal(),
  }));

  return (
    <div
      className={`infinite-canvas-container ${
        dragState.isDragging ? "dragging" : ""
      }`}
      onMouseDown={handleMouseDown}
      onClick={handleTripleClick}
    >
      {/* 工具栏 */}
      <CanvasToolbar
        scale={scale}
        zoomAnimating={zoomAnimating}
        onZoomIn={() => {
          // 以画布中心为缩放中心
          const center = getCanvasCenter();
          zoomIn(center.x, center.y);
        }}
        onZoomOut={() => {
          // 以画布中心为缩放中心
          const center = getCanvasCenter();
          zoomOut(center.x, center.y);
        }}
        onReset={resetView}
        onSearch={openSearchModal}
        minScale={CANVAS_CONSTANTS.MIN_SCALE}
        maxScale={CANVAS_CONSTANTS.MAX_SCALE}
      />

      {/* 画布背景区域 - 包含网格但不变换 */}
      <div className="canvas-background">
        {/* 网格 - 独立于画布变换 */}
        <CanvasGrid showAxis={false} />
      </div>

      {/* 画布内容区域 - 通过CSS变量应用变换 */}
      <div ref={canvasRef} className="infinite-canvas">
        {/* 便签 */}
        {stickyNotes.map((note) => {
          const streamingData = streamingNotes.get(note.id);
          return (
            <StickyNote
              key={note.id}
              note={note}
              onUpdate={updateStickyNote}
              onDelete={deleteStickyNote}
              onBringToFront={bringNoteToFront}
              canvasScale={scale}
              canvasOffset={canvasOffset}
              isStreaming={streamingData?.isStreaming}
              streamingContent={streamingData?.streamingContent}
              onConnect={addConnection}
              isConnected={isNoteConnected(note.id)}
            />
          );
        })}
      </div>

      {/* 便签链接插槽 - 位于控制台上方 */}
      <StickyNoteSlots
        connectedNotes={connectedNotes}
        connectionMode={connectionMode}
        onModeChange={setConnectionMode}
        onRemoveConnection={removeConnection}
        onClearAllConnections={handleClearAllConnections}
        visible={slotsVisible}
      />

      {/* 控制台 */}
      <CanvasConsole
        ref={consoleRef}
        onCreateNote={createStickyNoteAtCenter}
        onGenerateWithAI={handleAIGenerate}
        isAIGenerating={isAIGenerating}
        onOpenAISettings={() => openSettingsModal("ai")}
      />

      {/* 搜索模态框 */}
      <SearchModal
        open={searchModalOpen}
        onClose={closeSearchModal}
        notes={stickyNotes}
        onSelectNote={(note) => {
          // TODO: 实现便签定位功能
          message.info(`定位到便签: ${note.title}`);
          closeSearchModal();
        }}
      />

      {/* 设置模态框 */}
      <SettingsModal
        open={settingsModalOpen}
        onClose={closeSettingsModal}
        defaultActiveTab={settingsDefaultTab}
      />
    </div>
  );
});

InfiniteCanvas.displayName = "InfiniteCanvas";

export default InfiniteCanvas;
