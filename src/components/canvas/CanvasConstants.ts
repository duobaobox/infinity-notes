// 画布缩放常量
export const CANVAS_CONSTANTS = {
  MIN_SCALE: 0.3, // 最小缩放比例 (30%)
  MAX_SCALE: 2.0, // 最大缩放比例 (200%)
  DEFAULT_SCALE: 1.0, // 默认缩放比例
  ZOOM_FACTOR: 1.2, // 缩放因子
  ZOOM_STEP: 0.1, // 缩放步长
  WHEEL_THROTTLE_MS: 16, // 滚轮事件节流时间 (ms) - 60fps
  ZOOM_ANIMATION_DURATION: 200, // 缩放动画持续时间 (ms)
};

// 性能优化常量
export const PERFORMANCE_CONSTANTS = {
  DRAG_THROTTLE_MS: 16, // 拖拽事件节流时间 (ms) - 60fps
  CSS_UPDATE_DEBOUNCE_MS: 16, // CSS变量更新防抖时间 (ms) - 优化拖拽响应速度
  RENDER_THROTTLE_MS: 16, // 渲染节流时间 (ms)
  MAX_VISIBLE_NOTES: 100, // 最大可见便签数量（虚拟化阈值）
};

// 网格常量
export const GRID_CONSTANTS = {
  SMALL_GRID_SIZE: 10, // 小网格大小 (px)
  LARGE_GRID_SIZE: 50, // 大网格大小 (px)
  SMALL_GRID_COLOR: "rgba(226, 232, 240, 0.5)", // 小网格线颜色
  LARGE_GRID_COLOR: "rgba(203, 213, 225, 0.5)", // 大网格线颜色
};
