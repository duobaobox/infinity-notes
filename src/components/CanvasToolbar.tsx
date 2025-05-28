import React, { memo } from "react";
import { Button, Space, Tooltip } from "antd";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  RedoOutlined,
} from "@ant-design/icons";

interface CanvasToolbarProps {
  scale: number;
  zoomAnimating: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
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
    minScale,
    maxScale,
  }) => {
    return (
      <div className="canvas-toolbar">
        <Space>
          <Tooltip title="放大画布 (Ctrl/⌘ +)" placement="bottom">
            <Button
              icon={<ZoomInOutlined />}
              onClick={onZoomIn}
              disabled={scale >= maxScale}
              type="text"
              shape="circle"
            />
          </Tooltip>
          <Tooltip title="缩小画布 (Ctrl/⌘ -)" placement="bottom">
            <Button
              icon={<ZoomOutOutlined />}
              onClick={onZoomOut}
              disabled={scale <= minScale}
              type="text"
              shape="circle"
            />
          </Tooltip>
          <Tooltip title="重置画布位置和缩放 (Ctrl/⌘ 0)" placement="bottom">
            <Button
              icon={<RedoOutlined />}
              onClick={onReset}
              type="text"
              shape="circle"
            />
          </Tooltip>
          <span
            className={`zoom-indicator ${zoomAnimating ? "zoom-change" : ""}`}
          >
            {Math.round(scale * 100)}%
          </span>
        </Space>
        {/* <div className="canvas-tooltip-help">拖拽移动 • 滚轮缩放</div> */}
      </div>
    );
  }
);

CanvasToolbar.displayName = "CanvasToolbar";

export default CanvasToolbar;
