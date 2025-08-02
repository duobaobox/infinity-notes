import {
  RedoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { Move } from "@icon-park/react";
import { Button, Space, Tooltip } from "antd";
import React, { memo, useCallback, useRef } from "react";

interface CanvasToolbarProps {
  scale: number;
  zoomAnimating: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  isMoveModeActive: boolean;
  onToggleMoveMode: () => void;
  isWheelZoomDisabled: boolean;
  onToggleWheelZoom: () => void;

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
    isWheelZoomDisabled,
    onToggleWheelZoom,

    minScale,
    maxScale,
  }) => {
    // 重置按钮连续点击计数器
    const resetClickCountRef = useRef(0);
    const resetClickTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 处理重置按钮点击，实现连续点击3次切换滚轮缩放功能
    const handleResetClick = useCallback(() => {
      // 执行正常的重置功能
      onReset();

      // 增加点击计数
      resetClickCountRef.current += 1;

      // 清除之前的定时器
      if (resetClickTimerRef.current) {
        clearTimeout(resetClickTimerRef.current);
      }

      // 检查是否达到3次点击
      if (resetClickCountRef.current >= 3) {
        // 切换滚轮缩放功能
        onToggleWheelZoom();

        // 重置计数器
        resetClickCountRef.current = 0;

        console.log("🖱️ 重置按钮连续点击3次，切换滚轮缩放功能", {
          newState: !isWheelZoomDisabled ? "禁用" : "启用",
        });
      } else {
        console.log(`🖱️ 重置按钮点击计数: ${resetClickCountRef.current}/3`);

        // 设置2秒后重置计数器
        resetClickTimerRef.current = setTimeout(() => {
          resetClickCountRef.current = 0;
          console.log("🖱️ 重置按钮点击计数器已重置");
        }, 2000);
      }
    }, [onReset, onToggleWheelZoom]);
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
          <Tooltip
            title={
              isWheelZoomDisabled
                ? "重置画布位置和缩放 (Ctrl/⌘ 0)\n💡 鼠标滚轮缩放已禁用，连续点击3次可恢复"
                : "重置画布位置和缩放 (Ctrl/⌘ 0)\n💡 连续点击3次可禁用鼠标滚轮缩放"
            }
            placement="left"
          >
            <Button
              icon={<RedoOutlined />}
              onClick={handleResetClick}
              type="text"
              shape="circle"
              style={{
                // 当滚轮缩放被禁用时，给重置按钮添加视觉提示
                backgroundColor: isWheelZoomDisabled
                  ? "rgba(255, 193, 7, 0.1)"
                  : undefined,
                borderColor: isWheelZoomDisabled
                  ? "rgba(255, 193, 7, 0.3)"
                  : undefined,
              }}
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
