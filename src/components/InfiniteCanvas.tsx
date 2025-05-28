import React, { useRef, useState, useCallback, useEffect } from "react";
import { Button, Space, Tooltip } from "antd";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  RedoOutlined,
} from "@ant-design/icons";
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
  const [canvasState, setCanvasState] = useState<CanvasState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });

  // 缩放功能
  const handleZoomIn = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 3), // 最大缩放3倍
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      scale: Math.max(prev.scale / 1.2, 0.2), // 最小缩放0.2倍
    }));
  }, []);

  // 重置画布
  const handleReset = useCallback(() => {
    setCanvasState({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    });
  }, []);

  // 鼠标滚轮缩放
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(canvasState.scale * delta, 0.2), 3);

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
      }
    },
    [canvasState]
  );

  // 鼠标按下开始拖拽
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

  // 鼠标移动时拖拽
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragState.isDragging) {
        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;

        setCanvasState((prev) => ({
          ...prev,
          offsetX: dragState.startOffsetX + deltaX,
          offsetY: dragState.startOffsetY + deltaY,
        }));
      }
    },
    [dragState]
  );

  // 鼠标松开结束拖拽
  const handleMouseUp = useCallback(() => {
    setDragState((prev) => ({ ...prev, isDragging: false }));
  }, []);

  // 添加事件监听器
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("wheel", handleWheel, { passive: false });
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        canvas.removeEventListener("wheel", handleWheel);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [handleWheel, handleMouseMove, handleMouseUp]);

  // 创建网格背景
  const gridSize = 50;
  const gridStyle = {
    backgroundImage: `
      linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)
    `,
    backgroundSize: `${gridSize * canvasState.scale}px ${
      gridSize * canvasState.scale
    }px`,
    backgroundPosition: `${
      canvasState.offsetX % (gridSize * canvasState.scale)
    }px ${canvasState.offsetY % (gridSize * canvasState.scale)}px`,
  };

  return (
    <div className="infinite-canvas-container">
      {/* 控制工具栏 */}
      <div className="canvas-toolbar">
        <Space>
          <Tooltip title="放大画布">
            <Button
              icon={<ZoomInOutlined />}
              onClick={handleZoomIn}
              disabled={canvasState.scale >= 3}
            >
              放大
            </Button>
          </Tooltip>
          <Tooltip title="缩小画布">
            <Button
              icon={<ZoomOutOutlined />}
              onClick={handleZoomOut}
              disabled={canvasState.scale <= 0.2}
            >
              缩小
            </Button>
          </Tooltip>
          <Tooltip title="重置画布位置和缩放">
            <Button icon={<RedoOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Tooltip>
          <span className="zoom-indicator">
            {Math.round(canvasState.scale * 100)}%
          </span>
        </Space>
      </div>

      {/* 画布区域 */}
      <div
        ref={canvasRef}
        className="infinite-canvas"
        style={gridStyle}
        onMouseDown={handleMouseDown}
      >
        <div
          className="canvas-content"
          style={{
            transform: `translate(${canvasState.offsetX}px, ${canvasState.offsetY}px) scale(${canvasState.scale})`,
          }}
        >
          {/* 画布内容区域 - 可以在这里添加你的内容 */}
        </div>
      </div>
    </div>
  );
};

export default InfiniteCanvas;
