import {
  RedoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { Move } from "@icon-park/react";
import { Button, Space, Tooltip } from "antd";
import React, { memo } from "react";

interface CanvasToolbarProps {
  scale: number;
  zoomAnimating: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  isMoveModeActive: boolean;
  onToggleMoveMode: () => void;

  minScale: number;
  maxScale: number;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = memo(
  ({
    scale,
    zoomAnimating,
    onZoomIn,
    onZoomOut,
    onReset,
    isMoveModeActive,
    onToggleMoveMode,

    minScale,
    maxScale,
  }) => {
    return (
      <div className="canvas-toolbar">
        {" "}
        <Space size={8} direction="vertical" align="center">
          {" "}
          {/* 改为垂直方向 */}{" "}
          <Tooltip title="放大画布 (Ctrl/⌘ +)" placement="left">
            <Button
              icon={<ZoomInOutlined />}
              onClick={onZoomIn}
              disabled={scale >= maxScale}
              type="text"
              shape="circle"
            />
          </Tooltip>
          <Tooltip title="缩小画布 (Ctrl/⌘ -)" placement="left">
            <Button
              icon={<ZoomOutOutlined />}
              onClick={onZoomOut}
              disabled={scale <= minScale}
              type="text"
              shape="circle"
            />
          </Tooltip>
          <Tooltip title="重置画布位置和缩放 (Ctrl/⌘ 0)" placement="left">
            <Button
              icon={<RedoOutlined />}
              onClick={onReset}
              type="text"
              shape="circle"
            />
          </Tooltip>
          {/* 分隔线 */}
          <div className="toolbar-divider" />
          <Tooltip
            title={
              isMoveModeActive
                ? "退出移动模式"
                : "进入移动模式 (仅能移动和缩放画布)\n💡 提示：也可以按住鼠标中键拖拽画布"
            }
            placement="left"
          >
            <Button
              icon={<Move />}
              onClick={onToggleMoveMode}
              type={isMoveModeActive ? "primary" : "text"}
              shape="circle"
            />
          </Tooltip>
          {/* 分隔线 */}
          <div className="toolbar-divider" />
          <span
            className={`zoom-indicator ${zoomAnimating ? "zoom-change" : ""}`}
          >
            <div>{Math.round(scale * 100)}</div>
            <div>%</div>
          </span>
        </Space>
      </div>
    );
  }
);

CanvasToolbar.displayName = "CanvasToolbar";

export default CanvasToolbar;
