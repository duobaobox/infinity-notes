// 画布缩放常量
export const CANVAS_CONSTANTS = {
  MIN_SCALE: 0.25, // 最小缩放比例 (25%)
  MAX_SCALE: 2.0, // 最大缩放比例 (200%)
  DEFAULT_SCALE: 1.0, // 默认缩放比例 (100%)
  ZOOM_STEP: 0.125, // 缩放步长 (12.5%) - 更精细的步长
  WHEEL_THROTTLE_MS: 50, // 滚轮事件节流时间 (ms) - 减少连续触发
  ZOOM_ANIMATION_DURATION: 200, // 缩放动画持续时间 (ms)

  // 字体缩放相关常量
  FONT_SCALE_BASE: 14, // 基础字体大小 (px)
  FONT_SCALE_STEP: 1, // 每25%缩放的字体大小调整 (px)
  FONT_MIN_SIZE: 10, // 最小字体大小 (px)
  FONT_MAX_SIZE: 22, // 最大字体大小 (px)

  // 缩放档位定义 - 8个标准档位，简洁清晰
  SCALE_LEVELS: [
    0.25, // 25%
    0.5, // 50%
    0.75, // 75%
    1.0, // 100% (默认)
    1.25, // 125%
    1.5, // 150%
    1.75, // 175%
    2.0, // 200%
  ] as const,
};

// 性能优化常量
export const PERFORMANCE_CONSTANTS = {
  DRAG_THROTTLE_MS: 4, // 拖拽事件节流时间 (ms) - 250fps，极高响应性，确保工具栏位置同步
  CSS_UPDATE_DEBOUNCE_MS: 0, // CSS变量更新防抖时间 (ms) - 立即更新，避免延迟
  RENDER_THROTTLE_MS: 16, // 渲染节流时间 (ms)
  CONNECTION_UPDATE_THROTTLE_MS: 32, // 连接线更新节流时间 (ms) - 降低频率，减少卡顿
  CONNECTION_UPDATE_IMMEDIATE_THROTTLE_MS: 8, // 立即连接线更新节流时间 (ms) - 拖拽时使用，提高响应性

  // 虚拟化相关常量 - 现在支持动态调整
  DEFAULT_MAX_VISIBLE_NOTES: 100, // 默认最大可见便签数量（虚拟化阈值）
  MIN_VIRTUALIZATION_THRESHOLD: 30, // 最小虚拟化阈值（保护低性能设备）
  MAX_VIRTUALIZATION_THRESHOLD: 300, // 最大虚拟化阈值（避免过度优化）
  VIEWPORT_MARGIN: 200, // 视口边距 (px)
};

// 网格常量
export const GRID_CONSTANTS = {
  SMALL_GRID_SIZE: 10, // 小网格大小 (px)
  LARGE_GRID_SIZE: 50, // 大网格大小 (px)
  SMALL_GRID_COLOR: "rgba(226, 232, 240, 0.2)", // 小网格线颜色
  LARGE_GRID_COLOR: "rgba(203, 213, 225, 0.4)", // 大网格线颜色
};
