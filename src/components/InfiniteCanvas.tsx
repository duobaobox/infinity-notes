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
import { CANVAS_CONSTANTS, GRID_CONSTANTS } from "./CanvasConstants";
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

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });

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

          const delta = e.deltaY > 0 ? 0.9 : 1.1;
          const newScale = Math.min(
            Math.max(canvasState.scale * delta, CANVAS_CONSTANTS.MIN_SCALE),
            CANVAS_CONSTANTS.MAX_SCALE
          );

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
    [dragState]
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

      return () => {
        canvas.removeEventListener("wheel", handleWheelThrottled);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        // 清理动画帧
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
          requestRef.current = null;
        }
      };
    }
  }, [handleWheelThrottled, handleMouseMove, handleMouseUp]);

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
  }, [canvasState.scale]);

  // 更新CSS变量 - 此处将JS状态同步到CSS变量
  useEffect(() => {
    if (canvasRef.current) {
      const container = canvasRef.current.parentElement;
      if (container) {
        // 更新主要变换变量
        container.style.setProperty("--canvas-scale", `${canvasState.scale}`);

        // 计算网格位置偏移，使其能够正确对齐
        const smallGridOffset = {
          x:
            (canvasState.offsetX %
              (GRID_CONSTANTS.SMALL_GRID_SIZE * canvasState.scale)) +
            "px",
          y:
            (canvasState.offsetY %
              (GRID_CONSTANTS.SMALL_GRID_SIZE * canvasState.scale)) +
            "px",
        };

        // 设置基础偏移变量 - 对于简化版本，我们使用相同的偏移值
        container.style.setProperty("--canvas-offset-x", smallGridOffset.x);
        container.style.setProperty("--canvas-offset-y", smallGridOffset.y);

        // 设置内容偏移变量 (这是新增的，用于内容元素的变换)
        container.style.setProperty(
          "--content-offset-x",
          `${canvasState.offsetX}px`
        );
        container.style.setProperty(
          "--content-offset-y",
          `${canvasState.offsetY}px`
        );

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
        minScale={CANVAS_CONSTANTS.MIN_SCALE}
        maxScale={CANVAS_CONSTANTS.MAX_SCALE}
      />

      {/* 画布区域 */}
      <div
        ref={canvasRef}
        className="infinite-canvas"
        onMouseDown={handleMouseDown}
      >
        {/* 使用拆分出的网格组件 - 不再传递样式参数，而是使用CSS变量 */}
        <CanvasGrid showAxis={true} />

        {/* 
          内容区域 - 使用CSS变量控制变换，不再需要内联样式 
          注意：当有特殊需求时可以使用内联样式覆盖CSS变量
        */}
        <div className="canvas-content">
          {/* 画布内容区域 - 可以在这里添加你的内容 */}
        </div>
      </div>
    </div>
  );
};

export default InfiniteCanvas;
