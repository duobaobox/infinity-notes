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
