import React, { memo } from "react";

interface CanvasGridProps {
  // 不再需要样式参数，使用CSS变量
  showAxis?: boolean; // 是否显示中心轴线
}

const CanvasGrid: React.FC<CanvasGridProps> = memo(({ showAxis = false }) => {
  return (
    <>
      {/* 统一的网格背景 - 同时包含小网格和大网格 */}
      <div className="canvas-grid"></div>

      {/* 中心轴线 - 可选显示 */}
      {showAxis && <div className="canvas-axis"></div>}

      {/* 添加内阴影效果增强立体感 */}
      <div className="canvas-shadow"></div>
    </>
  );
});

CanvasGrid.displayName = "CanvasGrid";

export default CanvasGrid;
