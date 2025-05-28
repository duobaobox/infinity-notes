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
    setTimeout(() => setZoomAnimating(false), 1500);
  }, []);

  // 缩放功能
  const handleZoomIn = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 2), // 最大缩放2倍 (200%)
    }));
    triggerZoomAnimation();
  }, [triggerZoomAnimation]);

  const handleZoomOut = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      scale: Math.max(prev.scale / 1.2, 0.3), // 最小缩放0.3倍 (30%)
    }));
    triggerZoomAnimation();
  }, [triggerZoomAnimation]);

  // 重置画布
  const handleReset = useCallback(() => {
    setCanvasState({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    });
    triggerZoomAnimation();
  }, [triggerZoomAnimation]);

  // 鼠标滚轮缩放
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(canvasState.scale * delta, 0.3), 2);

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
    [canvasState, triggerZoomAnimation]
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
  }, [handleWheel, handleMouseMove, handleMouseUp]); // 创建网格背景 - 优化后的版本
  const smallGridSize = 10; // 小网格大小
  const largeGridSize = 50; // 大网格大小

  // 小网格线 - 更现代的配色
  const smallGridStyle = {
    backgroundImage: `
      linear-gradient(rgba(226, 232, 240, 0.5) 1px, transparent 1px),
      linear-gradient(90deg, rgba(226, 232, 240, 0.5) 1px, transparent 1px)
    `,
    backgroundSize: `${smallGridSize * canvasState.scale}px ${
      smallGridSize * canvasState.scale
    }px`,
    backgroundPosition: `${
      canvasState.offsetX % (smallGridSize * canvasState.scale)
    }px ${canvasState.offsetY % (smallGridSize * canvasState.scale)}px`,
  };

  // 大网格线 - 更现代的配色
  const largeGridStyle = {
    backgroundImage: `
      linear-gradient(rgba(203, 213, 225, 0.5) 1px, transparent 1px),
      linear-gradient(90deg, rgba(203, 213, 225, 0.5) 1px, transparent 1px)
    `,
    backgroundSize: `${largeGridSize * canvasState.scale}px ${
      largeGridSize * canvasState.scale
    }px`,
    backgroundPosition: `${
      canvasState.offsetX % (largeGridSize * canvasState.scale)
    }px ${canvasState.offsetY % (largeGridSize * canvasState.scale)}px`,
  };

  // 将性能优化添加到transform样式中
  const contentStyle = {
    transform: `translate3d(${canvasState.offsetX}px, ${canvasState.offsetY}px, 0) scale(${canvasState.scale})`,
  };

  return (
    <div className="infinite-canvas-container">
      {/* 控制工具栏 */}
      <div className="canvas-toolbar">
        <Space>
          <Tooltip title="放大画布" placement="bottom">
            <Button
              icon={<ZoomInOutlined />}
              onClick={handleZoomIn}
              disabled={canvasState.scale >= 2}
              type="text"
              shape="circle"
            />
          </Tooltip>
          <Tooltip title="缩小画布" placement="bottom">
            <Button
              icon={<ZoomOutOutlined />}
              onClick={handleZoomOut}
              disabled={canvasState.scale <= 0.3}
              type="text"
              shape="circle"
            />
          </Tooltip>
          <Tooltip title="重置画布位置和缩放" placement="bottom">
            <Button
              icon={<RedoOutlined />}
              onClick={handleReset}
              type="text"
              shape="circle"
            />
          </Tooltip>
          <span
            className={`zoom-indicator ${zoomAnimating ? "zoom-change" : ""}`}
          >
            {Math.round(canvasState.scale * 100)}%
          </span>
        </Space>
      </div>

      {/* 画布区域 */}
      <div
        ref={canvasRef}
        className="infinite-canvas"
        onMouseDown={handleMouseDown}
      >
        {/* 网格背景 - 分层渲染以获得更好的视觉效果 */}
        <div className="grid-light" style={smallGridStyle}></div>
        <div className="grid-light" style={largeGridStyle}></div>

        <div className="canvas-content" style={contentStyle}>
          {/* 画布内容区域 - 可以在这里添加你的内容 */}
        </div>

        {/* 添加内阴影效果增强立体感 */}
        <div className="canvas-shadow"></div>
      </div>
    </div>
  );
};

export default InfiniteCanvas;
