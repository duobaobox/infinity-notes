// 重构后的无限画布组件 - 使用全局状态管理
import { message } from "antd";
import { debounce, throttle } from "lodash";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import StickyNote from "../notes/StickyNote";
import CanvasConsole from "./CanvasConsole";
import CanvasGrid from "./CanvasGrid";
import CanvasToolbar from "./CanvasToolbar";
import StickyNoteSlots from "./StickyNoteSlots";

import { usePerformanceOptimization } from "../../hooks/usePerformanceOptimization";
import SettingsModal from "../modals/SettingsModal";
import type { SourceNoteContent, StickyNote as StickyNoteType } from "../types";
import { CANVAS_CONSTANTS, PERFORMANCE_CONSTANTS } from "./CanvasConstants";
import "./InfiniteCanvas.css";

// 全局状态管理导入
import {
  useAIStore,
  useCanvasStore,
  useConnectionStore,
  useStickyNotesStore,
  useUIStore,
} from "../../stores";
import { connectionUtils } from "../../stores/connectionStore";

// AI服务导入
import { getAIService } from "../../services/ai/aiService";

// 检查是否应该忽略画布事件的工具函数
const shouldIgnoreCanvasEvent = (
  target: HTMLElement,
  isMoveModeActive: boolean = false
): boolean => {
  return !!(
    // 在移动模式下，不忽略便签事件，允许在便签上也能拖拽画布
    (
      (!isMoveModeActive && target.closest(".sticky-note")) ||
      target.closest(".canvas-console") ||
      target.closest(".canvas-toolbar") ||
      target.closest(".ant-modal") || // Ant Design 模态框
      target.closest(".settings-modal") || // 设置模态框
      target.closest(".ant-drawer") || // Ant Design 抽屉
      target.closest(".ant-popover") || // Ant Design 弹出框
      target.closest(".ant-tooltip") || // Ant Design 提示框
      target.closest(".ant-dropdown") || // Ant Design 下拉菜单
      target.closest(".sidebar") || // 侧边栏
      target.closest("[data-sidebar]") || // 侧边栏数据属性
      // 检查是否在侧边栏的固定位置范围内（左侧220px）
      (target.getBoundingClientRect &&
        target.getBoundingClientRect().left < 220 &&
        !target.classList.contains("infinite-canvas-container"))
    )
  );
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
}

const InfiniteCanvas = forwardRef<InfiniteCanvasRef>((_, ref) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<{ focus: () => void }>(null);

  // 性能优化配置 - 动态检测设备性能并调整虚拟化阈值
  const {
    virtualizationThreshold,
    viewportMargin,
    // performanceLevel,
    // performanceScore,
    // isDetecting: isPerformanceDetecting,
    getVirtualizationAdvice,
    getPerformanceLevelInfo,
  } = usePerformanceOptimization();

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
    isMoveModeActive,
    zoomIn,
    zoomOut,
    startDrag,
    updateDrag,
    endDrag,
    resetView,
    getCanvasCenter,
    toggleMoveMode,
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
    modals: { settingsModalOpen, settingsDefaultTab },
    openSettingsModal,
    closeSettingsModal,
    basicSettings,
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
      if (connectedNotes.length === 0) {
        return;
      }

      // 清空所有连接
      clearAllConnections();

      // 更新画布状态
      updateConnectionLinesImmediate();
    } catch (error) {
      console.error("清空连接失败:", error);
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
    return getAIService(fullAIConfig);
  }, [fullAIConfig]);

  // 优化便签渲染 - 缓存画布偏移对象，避免每次渲染都创建新对象
  const canvasOffset = useMemo(
    () => ({ x: offsetX, y: offsetY }),
    [offsetX, offsetY]
  );

  // 便签虚拟化渲染 - 基于设备性能动态调整阈值
  const visibleNotes = useMemo(() => {
    // 如果便签数量少于动态虚拟化阈值，直接返回所有便签
    if (stickyNotes.length <= virtualizationThreshold) {
      return stickyNotes;
    }

    // 计算当前视口范围（考虑画布变换）
    const viewportBounds = {
      left: -offsetX / scale,
      top: -offsetY / scale,
      right: (-offsetX + window.innerWidth) / scale,
      bottom: (-offsetY + window.innerHeight) / scale,
    };

    // 使用动态边距，根据设备性能调整
    const expandedBounds = {
      left: viewportBounds.left - viewportMargin,
      top: viewportBounds.top - viewportMargin,
      right: viewportBounds.right + viewportMargin,
      bottom: viewportBounds.bottom + viewportMargin,
    };

    // 过滤出在扩展视口范围内的便签
    const visibleNotesInViewport = stickyNotes.filter((note) => {
      // 检查便签是否与视口相交
      const noteRight = note.x + note.width;
      const noteBottom = note.y + note.height;

      return (
        note.x < expandedBounds.right &&
        noteRight > expandedBounds.left &&
        note.y < expandedBounds.bottom &&
        noteBottom > expandedBounds.top
      );
    });

    // 开发环境下输出虚拟化统计信息
    if (process.env.NODE_ENV === "development") {
      const advice = getVirtualizationAdvice(stickyNotes.length);
      const levelInfo = getPerformanceLevelInfo();

      console.log(
        `🎯 智能虚拟化 [${levelInfo?.icon} ${levelInfo?.label}]: 总数=${stickyNotes.length}, 可见=${visibleNotesInViewport.length}, 阈值=${virtualizationThreshold}, 负载=${advice?.currentLoad}, 边距=${viewportMargin}px`
      );
    }

    return visibleNotesInViewport;
  }, [
    stickyNotes,
    offsetX,
    offsetY,
    scale,
    virtualizationThreshold,
    viewportMargin,
    getVirtualizationAdvice,
    getPerformanceLevelInfo,
  ]);

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
          id: `note-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 11)}`,
          x: positionX,
          y: positionY,
          width: 300, // 手动便签默认宽度
          height: 200, // 手动便签默认高度
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

        // 添加到数据库，指定为手动便签类型
        const addedNote = await addNote(newNote, "manual");

        // 500ms 后移除新建标记
        setTimeout(async () => {
          try {
            await updateStickyNote(addedNote.id, { isNew: false });
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

        // 准备溯源数据
        let sourceNoteIds: string[] | undefined;
        let sourceNotesContent: SourceNoteContent[] | undefined;
        let generationMode: "summary" | "replace" | undefined;

        if (connectedNotes.length > 0) {
          generationMode = connectionMode;

          if (connectionMode === "summary") {
            // 汇总模式：只记录源便签ID
            sourceNoteIds = connectedNotes.map((note) => note.id);
          } else if (connectionMode === "replace") {
            // 替换模式：保存完整的原始便签内容
            sourceNotesContent = connectedNotes.map((note) => ({
              id: note.id,
              title: note.title,
              content: note.content,
              color: note.color,
              createdAt: note.createdAt,
              deletedAt: new Date(), // 记录删除时间
            }));
            // 立即删除旧便签并清空连接，防止新便签继承状态
            connectedNotes.forEach((note) => deleteNote(note.id));
            clearAllConnections();
          }
        }

        // 生成随机颜色
        const colors: Array<StickyNoteType["color"]> = [
          "yellow",
          "blue",
          "green",
          "pink",
          "purple",
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        // 生成便签标题：使用用户的prompt，限制长度避免过长
        const generateTitleFromPrompt = (prompt: string): string => {
          if (!prompt || prompt.trim().length === 0) {
            return "AI便签";
          }

          // 清理prompt，移除多余的空白字符
          const cleanPrompt = prompt.trim().replace(/\s+/g, " ");

          // 如果prompt长度超过30个字符，截取前30个字符并添加省略号
          if (cleanPrompt.length > 30) {
            return cleanPrompt.substring(0, 30) + "...";
          }

          return cleanPrompt;
        };

        const tempNote: StickyNoteType = {
          id: `ai-note-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 11)}`,
          x: logicalX,
          y: logicalY,
          width: 400, // AI便签默认宽度
          height: 300, // AI便签默认高度
          content: "",
          title: generateTitleFromPrompt(prompt), // 🔧 使用用户的prompt作为标题
          color: randomColor, // 🔧 使用随机颜色
          isNew: false,
          zIndex: maxZ + 1,
          isEditing: false,
          isTitleEditing: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          // 溯源相关属性
          sourceNoteIds,
          sourceNotesContent,
          generationMode,
        };

        // 添加临时便签到数据库，指定为AI便签类型
        const addedNote = await addNote(tempNote, "ai");

        // 开始流式生成
        startStreamingNote(addedNote.id, addedNote);

        // 调用AI服务生成内容
        const result = await aiService.generateStickyNotesStreaming(
          finalPrompt,
          {
            onNoteStart: () => {
              // AI便签标题保持固定，不需要更新
            },
            onContentChunk: (_, __, fullContent) => {
              // 更新流式内容
              updateStreamingContent(addedNote.id, fullContent);
            },
            onNoteComplete: async (_, noteData) => {
              // 完成流式生成，更新最终内容
              await finishStreamingNote(addedNote.id, noteData.content);

              // 🔧 修复：保持临时便签的颜色和标题，不使用AI返回的
              // 这样确保生成过程中和最终的便签颜色和标题保持一致
              // 新增：同时更新思维链数据
              const updateData: any = {
                color: tempNote.color, // 保持临时便签的颜色
                title: tempNote.title, // 🔧 保持用户prompt作为标题，不被AI覆盖
                updatedAt: new Date(),
              };

              // 如果有思维链数据，添加到更新中
              if (noteData.thinkingChain) {
                updateData.thinkingChain = noteData.thinkingChain;
                updateData.hasThinking = true;
              }

              await updateStickyNote(addedNote.id, updateData);
            },
            onAllComplete: (notes) => {
              message.success(`AI生成完成！共创建 ${notes.length} 个便签`);
            },
            onError: (error) => {
              message.error(`AI生成失败: ${error}`);

              // 清理流式状态
              cancelStreamingNote(addedNote.id);

              // 删除临时便签
              deleteNote(addedNote.id);
            },
          },
          {
            showThinkingMode: basicSettings.showThinkingMode, // 传入基础设置
          }
        );

        if (!result.success) {
          throw new Error(result.error || "AI生成失败");
        }
      } catch (error) {
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
      basicSettings.showThinkingMode,
    ]
  );

  // 鼠标事件处理
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // 只处理左键点击
      if (e.button !== 0) return;

      // 如果点击的是便签或其他交互元素，不处理画布拖拽
      const target = e.target as HTMLElement;
      if (shouldIgnoreCanvasEvent(target, isMoveModeActive)) {
        return;
      }

      // 移动模式下，直接开始拖拽画布，不进行其他操作
      if (isMoveModeActive) {
        e.preventDefault();
        if (process.env.NODE_ENV === "development") {
          console.log("🖱️ 移动模式：开始拖拽画布", {
            x: e.clientX,
            y: e.clientY,
          });
        }
        startDrag(e.clientX, e.clientY);
        return;
      }

      e.preventDefault();
      if (process.env.NODE_ENV === "development") {
        console.log("🖱️ 开始拖拽画布", { x: e.clientX, y: e.clientY });
      }
      startDrag(e.clientX, e.clientY);
    },
    [startDrag, isMoveModeActive]
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
      // 移动模式下禁用三击创建便签
      if (isMoveModeActive) {
        return;
      }

      // 如果点击的是便签或其他交互元素，不创建新便签
      const target = e.target as HTMLElement;
      if (shouldIgnoreCanvasEvent(target, isMoveModeActive)) {
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
    [offsetX, offsetY, scale, createStickyNote, isMoveModeActive]
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
      if (shouldIgnoreCanvasEvent(target, isMoveModeActive)) {
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
  }));

  return (
    <div
      className={`infinite-canvas-container ${
        dragState.isDragging ? "dragging" : ""
      } ${isMoveModeActive ? "move-mode" : ""}`}
      onMouseDown={handleMouseDown}
      onClick={handleTripleClick}
    >
      {/* 工具栏 */}
      <CanvasToolbar
        scale={scale}
        zoomAnimating={zoomAnimating}
        isMoveModeActive={isMoveModeActive}
        onToggleMoveMode={toggleMoveMode}
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
        {/* 便签 - 使用虚拟化渲染优化性能 */}
        {visibleNotes.map((note) => {
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
              isMoveModeActive={isMoveModeActive}
              isStreaming={streamingData?.isStreaming}
              streamingContent={streamingData?.streamingContent}
              onConnect={addConnection}
              isConnected={isNoteConnected(note.id)}
            />
          );
        })}
      </div>

      {/* 移动模式指示器 */}
      {isMoveModeActive && (
        <div className="move-mode-indicator">
          <span>移动模式已激活 - 便签编辑已禁用</span>
        </div>
      )}

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
