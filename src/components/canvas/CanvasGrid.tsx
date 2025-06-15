import React, { memo } from "react";

interface CanvasGridProps {
  // 不再需要样式参数，使用CSS变量
  showAxis?: boolean; // 是否显示中心轴线
}

const CanvasGrid: React.FC<CanvasGridProps> = memo(({ showAxis = true }) => {
  return (
    <>
      {/* 网格背景 - 使用CSS变量而非内联样式 */}
      <div className="grid-light small-grid"></div>
      <div className="grid-light large-grid"></div>

      {/* 中心轴线 - 可选显示 */}
      {showAxis && <div className="canvas-axis"></div>}

      {/* 添加内阴影效果增强立体感 */}
      <div className="canvas-shadow"></div>
    </>
  );
});

CanvasGrid.displayName = "CanvasGrid";

export default CanvasGrid;
