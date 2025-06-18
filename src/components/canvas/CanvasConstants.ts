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
  DRAG_THROTTLE_MS: 8, // 拖拽事件节流时间 (ms) - 120fps，提升响应性
  CSS_UPDATE_DEBOUNCE_MS: 0, // CSS变量更新防抖时间 (ms) - 立即更新，避免延迟
  RENDER_THROTTLE_MS: 16, // 渲染节流时间 (ms)
  CONNECTION_UPDATE_THROTTLE_MS: 32, // 连接线更新节流时间 (ms) - 降低频率，减少卡顿
  CONNECTION_UPDATE_IMMEDIATE_THROTTLE_MS: 16, // 立即连接线更新节流时间 (ms) - 拖拽时使用
  MAX_VISIBLE_NOTES: 100, // 最大可见便签数量（虚拟化阈值）
};

// 网格常量
export const GRID_CONSTANTS = {
  SMALL_GRID_SIZE: 10, // 小网格大小 (px)
  LARGE_GRID_SIZE: 50, // 大网格大小 (px)
  SMALL_GRID_COLOR: "rgba(226, 232, 240, 0.2)", // 小网格线颜色
  LARGE_GRID_COLOR: "rgba(203, 213, 225, 0.4)", // 大网格线颜色
};
