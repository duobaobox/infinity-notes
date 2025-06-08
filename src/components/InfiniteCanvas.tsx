import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { throttle } from "lodash";
import CanvasToolbar from "./CanvasToolbar";
import CanvasGrid from "./CanvasGrid";
import StickyNote from "./StickyNote";
import { CANVAS_CONSTANTS, GRID_CONSTANTS } from "./CanvasConstants";
import type { StickyNote as StickyNoteType } from "./types";
import { useDatabase } from "../database";
import "./InfiniteCanvas.css";

interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startOffsetX: number;
  startOffsetY: number;
}

const InfiniteCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    scale: CANVAS_CONSTANTS.DEFAULT_SCALE,
    offsetX: 0,
    offsetY: 0,
  });
  const [zoomAnimating, setZoomAnimating] = useState(false);

  // 使用数据库Hook管理便签
  const {
    notes: stickyNotes,
    loading: notesLoading,
    error: notesError,
    addNote,
    updateNote,
    deleteNote,
    clearDatabase,
  } = useDatabase();

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });

  // 便签置顶功能
  const bringNoteToFront = useCallback(
    async (id: string) => {
      const note = stickyNotes.find((note) => note.id === id);
      if (note) {
        const maxZ = Math.max(...stickyNotes.map((note) => note.zIndex));
        const updatedNote = { ...note, zIndex: maxZ + 1 };
        await updateNote(updatedNote);
      }
    },
    [stickyNotes, updateNote]
  );

  // 更新便签
  const updateStickyNote = useCallback(
    async (id: string, updates: Partial<StickyNoteType>) => {
      const note = stickyNotes.find((note) => note.id === id);
      if (note) {
        const updatedNote = { ...note, ...updates };
        await updateNote(updatedNote);
      }
    },
    [stickyNotes, updateNote]
  );

  // 删除便签
  const deleteStickyNote = useCallback(
    async (id: string) => {
      await deleteNote(id);
    },
    [deleteNote]
  );

  // 创建新便签 - 原有的双击功能
  const createStickyNote = useCallback(
    async (x: number, y: number) => {
      const colors: Array<StickyNoteType["color"]> = [
        "yellow",
        "blue",
        "green",
        "pink",
        "purple",
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      // 添加随机偏移，防止便签完全堆叠
      const offsetRange = 50; // 随机偏移范围（像素）
      const randomOffsetX = Math.random() * offsetRange * 2 - offsetRange; // -50 到 50 之间的随机值
      const randomOffsetY = Math.random() * offsetRange * 2 - offsetRange; // -50 到 50 之间的随机值

      // 应用随机偏移到位置坐标
      const positionX = x + randomOffsetX;
      const positionY = y + randomOffsetY;

      const maxZ =
        stickyNotes.length > 0
          ? Math.max(...stickyNotes.map((note) => note.zIndex))
          : 0;
      const newNote: StickyNoteType = {
        id: `note-${Date.now()}-${Math.random()}`,
        // 使用添加了随机偏移的坐标
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

      // 添加到数据库
      await addNote(newNote);

      // 500ms 后移除新建标记
      setTimeout(() => {
        updateStickyNote(newNote.id, { isNew: false });
      }, 500);
    },
    [stickyNotes, addNote, updateStickyNote]
  );

  // 创建新便签 - 在画布中心位置
  const createStickyNoteAtCenter = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      // 在画布中心创建便签
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // 增加中心区域随机分布
      const centerRandomRange = 100; // 中心区域分布范围
      const distributedScreenX =
        centerX + (Math.random() * centerRandomRange - centerRandomRange / 2);
      const distributedScreenY =
        centerY + (Math.random() * centerRandomRange - centerRandomRange / 2);

      // 重要：将屏幕坐标转换为画布逻辑坐标，考虑当前画布偏移和缩放
      // 这样即使画布被移动，便签也会出现在当前可见区域的中心位置
      const logicalX =
        (distributedScreenX - canvasState.offsetX) / canvasState.scale;
      const logicalY =
        (distributedScreenY - canvasState.offsetY) / canvasState.scale;

      // 使用转换后的逻辑坐标创建便签，createStickyNote函数会再添加小的随机偏移
      createStickyNote(logicalX, logicalY);
    }
  }, [
    createStickyNote,
    canvasState.offsetX,
    canvasState.offsetY,
    canvasState.scale,
  ]);

  // 触发缩放动画
  const triggerZoomAnimation = useCallback(() => {
    setZoomAnimating(true);
    setTimeout(
      () => setZoomAnimating(false),
      CANVAS_CONSTANTS.ZOOM_ANIMATION_DURATION
    );
  }, []);

  // 缩放功能
  const handleZoomIn = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      scale: Math.min(
        prev.scale * CANVAS_CONSTANTS.ZOOM_FACTOR,
        CANVAS_CONSTANTS.MAX_SCALE
      ),
    }));
    triggerZoomAnimation();
  }, [triggerZoomAnimation]);

  const handleZoomOut = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      scale: Math.max(
        prev.scale / CANVAS_CONSTANTS.ZOOM_FACTOR,
        CANVAS_CONSTANTS.MIN_SCALE
      ),
    }));
    triggerZoomAnimation();
  }, [triggerZoomAnimation]);

  // 重置画布
  const handleReset = useCallback(() => {
    setCanvasState({
      scale: CANVAS_CONSTANTS.DEFAULT_SCALE,
      offsetX: 0,
      offsetY: 0,
    });
    triggerZoomAnimation();
  }, [triggerZoomAnimation]);

  // 使用节流优化的滚轮缩放处理函数
  const handleWheelThrottled = useMemo(
    () =>
      throttle(
        (e: WheelEvent) => {
          e.preventDefault();

          // 优化：使用变量缓存频繁访问的值
          const currentScale = canvasState.scale;
          const delta = e.deltaY > 0 ? 0.9 : 1.1;
          const newScale = Math.min(
            Math.max(currentScale * delta, CANVAS_CONSTANTS.MIN_SCALE),
            CANVAS_CONSTANTS.MAX_SCALE
          );

          // 如果缩放比例没有变化，直接返回
          if (newScale === currentScale) return;

          if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // 计算缩放中心点
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // 调整偏移以保持鼠标位置不变
            const scaleRatio = newScale / canvasState.scale;
            const newOffsetX =
              canvasState.offsetX + (mouseX - centerX) * (1 - scaleRatio);
            const newOffsetY =
              canvasState.offsetY + (mouseY - centerY) * (1 - scaleRatio);

            setCanvasState({
              scale: newScale,
              offsetX: newOffsetX,
              offsetY: newOffsetY,
            });

            if (Math.abs(newScale - canvasState.scale) > 0.05) {
              triggerZoomAnimation();
            }
          }
        },
        CANVAS_CONSTANTS.WHEEL_THROTTLE_MS,
        { leading: true, trailing: true }
      ),
    [canvasState, triggerZoomAnimation]
  );

  // 使用 useEffect 清理节流函数
  useEffect(() => {
    return () => {
      handleWheelThrottled.cancel();
    };
  }, [handleWheelThrottled]);

  // 鼠标按下开始拖拽 - 使用React合成事件
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // 检查是否点击在便签上，如果是则不处理画布拖拽
      const target = e.target as HTMLElement;
      if (target.closest(".sticky-note")) {
        return;
      }

      setDragState({
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX: canvasState.offsetX,
        startOffsetY: canvasState.offsetY,
      });
    },
    [canvasState.offsetX, canvasState.offsetY]
  );

  // 处理双击创建便签
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      // 检查是否双击在便签上，如果是则不创建新便签
      const target = e.target as HTMLElement;
      if (target.closest(".sticky-note")) {
        return;
      }

      // 阻止默认的画布重置行为
      e.preventDefault();
      e.stopPropagation();

      // 计算在画布逻辑坐标系中的位置
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        // 转换屏幕坐标为画布逻辑坐标
        const x =
          (e.clientX - rect.left - canvasState.offsetX) / canvasState.scale;
        const y =
          (e.clientY - rect.top - canvasState.offsetY) / canvasState.scale;
        createStickyNote(x, y);
      }
    },
    [
      canvasState.offsetX,
      canvasState.offsetY,
      canvasState.scale,
      createStickyNote,
    ]
  );

  // 使用 requestAnimationFrame 优化拖拽
  const updateDragPosition = useCallback(
    (clientX: number, clientY: number) => {
      if (dragState.isDragging) {
        const deltaX = clientX - dragState.startX;
        const deltaY = clientY - dragState.startY;

        setCanvasState((prev) => ({
          ...prev,
          offsetX: dragState.startOffsetX + deltaX,
          offsetY: dragState.startOffsetY + deltaY,
        }));

        requestRef.current = requestAnimationFrame(() =>
          updateDragPosition(clientX, clientY)
        );
      }
    },
    // 仅当拖拽状态相关值变化时才更新函数
    [
      dragState.isDragging,
      dragState.startX,
      dragState.startY,
      dragState.startOffsetX,
      dragState.startOffsetY,
    ]
  );

  // 优化后的鼠标移动处理函数
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragState.isDragging) {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
        requestRef.current = requestAnimationFrame(() =>
          updateDragPosition(e.clientX, e.clientY)
        );
      }
    },
    [dragState.isDragging, updateDragPosition]
  );

  // 鼠标松开结束拖拽
  const handleMouseUp = useCallback(() => {
    setDragState((prev) => ({ ...prev, isDragging: false }));
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  // 添加事件监听器
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // 使用React合成事件系统处理滚轮事件
      canvas.addEventListener("wheel", handleWheelThrottled, {
        passive: false,
      });
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      // 添加键盘快捷键支持
      const handleKeyDown = (e: KeyboardEvent) => {
        // 仅当没有输入框获得焦点时才处理快捷键
        if (
          !(
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement
          )
        ) {
          switch (e.key) {
            case "+":
            case "=": // 通常 = 和 + 在同一个键位
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                handleZoomIn();
              }
              break;
            case "-":
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                handleZoomOut();
              }
              break;
            case "0":
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                handleReset();
              }
              break;
            case "Delete":
            case "Backspace":
              // 删除选中的便签（这里需要实现选中状态）
              // TODO: 实现便签选中状态
              break;
            // 可以添加更多快捷键
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        canvas.removeEventListener("wheel", handleWheelThrottled);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("keydown", handleKeyDown);

        // 清理动画帧
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
          requestRef.current = null;
        }
      };
    }
  }, [
    handleWheelThrottled,
    handleMouseMove,
    handleMouseUp,
    handleZoomIn,
    handleZoomOut,
    handleReset,
  ]);

  // 计算一些性能关键参数，虽然我们已经移至CSS变量，但保留此逻辑以备未来使用
  // 并且可以用于某些需要JavaScript直接访问这些值的场景
  const _computedStyles = useMemo(() => {
    return {
      // 转换为像素值，便于JavaScript使用
      smallGridSizePx: GRID_CONSTANTS.SMALL_GRID_SIZE * canvasState.scale,
      largeGridSizePx: GRID_CONSTANTS.LARGE_GRID_SIZE * canvasState.scale,
      // 当前缩放比例的视口像素比
      devicePixelRatio: window.devicePixelRatio || 1,
      // 屏幕上可见的网格数量（近似值）
      visibleGridCellsX: canvasRef.current
        ? Math.ceil(
            canvasRef.current.clientWidth /
              (GRID_CONSTANTS.SMALL_GRID_SIZE * canvasState.scale)
          ) + 1
        : 0,
      visibleGridCellsY: canvasRef.current
        ? Math.ceil(
            canvasRef.current.clientHeight /
              (GRID_CONSTANTS.SMALL_GRID_SIZE * canvasState.scale)
          ) + 1
        : 0,
    };
  }, [canvasState.scale]); // 更新CSS变量 - 此处将JS状态同步到CSS变量
  useEffect(() => {
    if (canvasRef.current) {
      const container = canvasRef.current.parentElement;
      if (container) {
        // 优化：批量更新样式属性，减少重排
        const style = container.style;
        const { scale, offsetX, offsetY } = canvasState;

        // 更新主要变换变量
        style.setProperty("--canvas-scale", `${scale}`);

        // 计算网格位置偏移，使其能够正确对齐
        const smallGridSize = GRID_CONSTANTS.SMALL_GRID_SIZE * scale;
        const smallGridOffsetX = (offsetX % smallGridSize) + "px";
        const smallGridOffsetY = (offsetY % smallGridSize) + "px";

        // 设置基础偏移变量 - 对于简化版本，我们使用相同的偏移值
        style.setProperty("--canvas-offset-x", smallGridOffsetX);
        style.setProperty("--canvas-offset-y", smallGridOffsetY);

        // 设置内容偏移变量 (这是新增的，用于内容元素的变换)
        style.setProperty("--content-offset-x", `${offsetX}px`);
        style.setProperty("--content-offset-y", `${offsetY}px`);

        // 使用计算好的网格大小(仅做示例，实际上我们使用常量)
        console.log(
          "当前视口中预计可见网格单元数:",
          _computedStyles.visibleGridCellsX,
          _computedStyles.visibleGridCellsY
        );

        // 更新网格常量 - 理论上这些只需设置一次，但放在这里确保一致性
        container.style.setProperty(
          "--small-grid-size",
          `${GRID_CONSTANTS.SMALL_GRID_SIZE}px`
        );
        container.style.setProperty(
          "--large-grid-size",
          `${GRID_CONSTANTS.LARGE_GRID_SIZE}px`
        );
        container.style.setProperty(
          "--small-grid-color",
          GRID_CONSTANTS.SMALL_GRID_COLOR
        );
        container.style.setProperty(
          "--large-grid-color",
          GRID_CONSTANTS.LARGE_GRID_COLOR
        );
      }
    }
  }, [canvasState.scale, canvasState.offsetX, canvasState.offsetY]);

  return (
    <div className="infinite-canvas-container">
      {/* 使用拆分出的工具栏组件 */}
      <CanvasToolbar
        scale={canvasState.scale}
        zoomAnimating={zoomAnimating}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onCreateNote={createStickyNoteAtCenter}
        onClearDatabase={clearDatabase}
        minScale={CANVAS_CONSTANTS.MIN_SCALE}
        maxScale={CANVAS_CONSTANTS.MAX_SCALE}
      />

      {/* 画布区域 */}
      <div
        ref={canvasRef}
        className="infinite-canvas"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {/* 使用拆分出的网格组件 - 不再传递样式参数，而是使用CSS变量 */}
        <CanvasGrid showAxis={false} />

        {/* 
          内容区域 - 使用CSS变量控制变换，不再需要内联样式 
          注意：当有特殊需求时可以使用内联样式覆盖CSS变量
        */}
        <div className="canvas-content">
          {/* 便签组件 - 将便签放在独立的容器中，不受canvas-content变换影响 */}
        </div>
      </div>

      {/* 便签容器 - 独立于画布变换 */}
      <div className="sticky-notes-container">
        {/* 加载状态 */}
        {notesLoading && (
          <div
            className="loading-indicator"
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: "rgba(0, 0, 0, 0.7)",
              color: "white",
              padding: "8px 12px",
              borderRadius: "4px",
              fontSize: "14px",
              zIndex: 10000,
            }}
          >
            加载便签中...
          </div>
        )}

        {/* 错误状态 */}
        {notesError && (
          <div
            className="error-indicator"
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: "rgba(220, 53, 69, 0.9)",
              color: "white",
              padding: "8px 12px",
              borderRadius: "4px",
              fontSize: "14px",
              zIndex: 10000,
            }}
          >
            加载便签失败: {notesError}
          </div>
        )}

        {/* 便签列表 */}
        {!notesLoading &&
          !notesError &&
          stickyNotes
            .sort((a, b) => a.zIndex - b.zIndex) // 按 Z 索引排序
            .map((note) => {
              const screenNote = {
                ...note,
                x: note.x * canvasState.scale,
                y: note.y * canvasState.scale,
                width: note.width * canvasState.scale,
                height: note.height * canvasState.scale,
              };
              return (
                <StickyNote
                  key={note.id}
                  note={screenNote}
                  onUpdate={updateStickyNote}
                  onDelete={deleteStickyNote}
                  onBringToFront={bringNoteToFront}
                  canvasScale={canvasState.scale} // StickyNote still needs the raw scale for its internal logic
                  canvasOffset={{
                    x: canvasState.offsetX, // This is the offset of the sticky-notes-container
                    y: canvasState.offsetY, // This is the offset of the sticky-notes-container
                  }}
                />
              );
            })}
      </div>
    </div>
  );
};

export default InfiniteCanvas;
