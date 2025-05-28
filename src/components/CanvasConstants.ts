// 画布缩放常量
export const CANVAS_CONSTANTS = {
  MIN_SCALE: 0.3, // 最小缩放比例 (30%)
  MAX_SCALE: 2.0, // 最大缩放比例 (200%)
  DEFAULT_SCALE: 1.0, // 默认缩放比例
  ZOOM_FACTOR: 1.2, // 缩放因子
  WHEEL_THROTTLE_MS: 16, // 滚轮事件节流时间 (ms)
  ZOOM_ANIMATION_DURATION: 1500, // 缩放动画持续时间 (ms)
};

// 网格常量
export const GRID_CONSTANTS = {
  SMALL_GRID_SIZE: 10, // 小网格大小 (px)
  LARGE_GRID_SIZE: 50, // 大网格大小 (px)
  SMALL_GRID_COLOR: "rgba(226, 232, 240, 0.5)", // 小网格线颜色
  LARGE_GRID_COLOR: "rgba(203, 213, 225, 0.5)", // 大网格线颜色
};
