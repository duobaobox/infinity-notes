// 画布状态管理Store
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { CANVAS_CONSTANTS } from "../components/canvas/CanvasConstants";
import { getNearestScaleLevel } from "../utils/fontScaleUtils";

// 拖拽状态接口
export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startOffsetX: number;
  startOffsetY: number;
  isMiddleButtonDrag: boolean; // 新增：标记是否为中键拖拽
}

// 画布状态接口
export interface CanvasState {
  // 画布变换状态
  scale: number;
  offsetX: number;
  offsetY: number;

  // 拖拽状态
  dragState: DragState;

  // 动画状态
  zoomAnimating: boolean;

  // 交互模式
  isMoveModeActive: boolean;

  // 画布配置
  minScale: number;
  maxScale: number;

  // 网格显示
  showGrid: boolean;
  showAxis: boolean;
}

// 画布操作接口
export interface CanvasActions {
  // 缩放操作
  zoomIn: (centerX?: number, centerY?: number) => void;
  zoomOut: (centerX?: number, centerY?: number) => void;
  setScale: (scale: number, centerX?: number, centerY?: number) => void;

  // 平移操作
  setOffset: (offsetX: number, offsetY: number) => void;
  panTo: (x: number, y: number) => void;

  // 拖拽操作
  startDrag: (startX: number, startY: number, isMiddleButton?: boolean) => void;
  updateDrag: (currentX: number, currentY: number) => void;
  endDrag: () => void;

  // 重置操作
  resetView: () => void;
  fitToContent: (
    notes: Array<{ x: number; y: number; width: number; height: number }>
  ) => void;

  // 坐标转换
  screenToCanvas: (
    screenX: number,
    screenY: number
  ) => { x: number; y: number };
  canvasToScreen: (
    canvasX: number,
    canvasY: number
  ) => { x: number; y: number };

  // 动画控制
  setZoomAnimating: (animating: boolean) => void;

  // 交互模式控制
  toggleMoveMode: () => void;
  setMoveMode: (active: boolean) => void;

  // 网格控制
  toggleGrid: () => void;
  toggleAxis: () => void;

  // 获取画布中心点
  getCanvasCenter: () => { x: number; y: number };

  // 定位到指定便签
  centerOnNote: (
    noteX: number,
    noteY: number,
    noteWidth: number,
    noteHeight: number,
    noteId?: string
  ) => void;
}

// 创建画布Store
export const useCanvasStore = create<CanvasState & CanvasActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // 初始状态
      scale: CANVAS_CONSTANTS.DEFAULT_SCALE,
      offsetX: 0,
      offsetY: 0,
      dragState: {
        isDragging: false,
        startX: 0,
        startY: 0,
        startOffsetX: 0,
        startOffsetY: 0,
        isMiddleButtonDrag: false,
      },
      zoomAnimating: false,
      minScale: CANVAS_CONSTANTS.MIN_SCALE,
      maxScale: CANVAS_CONSTANTS.MAX_SCALE,
      showGrid: true,
      showAxis: false,
      isMoveModeActive: false, // 初始为false，表示默认是正常模式

      // 缩放操作 - 简化的单级缩放
      zoomIn: (centerX = 0, centerY = 0) => {
        const { scale, offsetX, offsetY } = get();

        // 找到当前缩放级别的索引
        let currentIndex = -1;
        for (let i = 0; i < CANVAS_CONSTANTS.SCALE_LEVELS.length; i++) {
          if (Math.abs(CANVAS_CONSTANTS.SCALE_LEVELS[i] - scale) < 0.01) {
            currentIndex = i;
            break;
          }
        }

        // 如果没有找到精确匹配，找到最接近的档位
        if (currentIndex === -1) {
          // 使用getNearestScaleLevel找到最接近的档位，然后找到其索引
          const nearestScale = getNearestScaleLevel(scale);
          currentIndex = CANVAS_CONSTANTS.SCALE_LEVELS.findIndex(
            (level) => Math.abs(level - nearestScale) < 0.01
          );
          // 如果还是找不到，默认为中间档位
          if (currentIndex === -1) {
            currentIndex = Math.floor(CANVAS_CONSTANTS.SCALE_LEVELS.length / 2);
          }
        }

        // 获取下一个缩放档位（单级跳跃）
        const targetIndex = Math.min(
          currentIndex + 1,
          CANVAS_CONSTANTS.SCALE_LEVELS.length - 1
        );
        const newScale = CANVAS_CONSTANTS.SCALE_LEVELS[targetIndex];

        if (newScale !== scale) {
          // 计算缩放后的偏移量，使缩放中心保持不变
          const scaleFactor = newScale / scale;
          const rawOffsetX = centerX - (centerX - offsetX) * scaleFactor;
          const rawOffsetY = centerY - (centerY - offsetY) * scaleFactor;

          // 关键修复：引入设备像素比，将偏移量对齐到物理像素，避免文本模糊
          const dpr = window.devicePixelRatio || 1;
          const newOffsetX = Math.round(rawOffsetX * dpr) / dpr;
          const newOffsetY = Math.round(rawOffsetY * dpr) / dpr;

          set({
            scale: newScale,
            offsetX: newOffsetX,
            offsetY: newOffsetY,
            zoomAnimating: true,
          });

          // 动画结束后重置动画状态
          setTimeout(() => {
            set({ zoomAnimating: false });
          }, CANVAS_CONSTANTS.ZOOM_ANIMATION_DURATION);
        }
      },

      zoomOut: (centerX = 0, centerY = 0) => {
        const { scale, offsetX, offsetY } = get();

        // 找到当前缩放级别的索引
        let currentIndex = -1;
        for (let i = 0; i < CANVAS_CONSTANTS.SCALE_LEVELS.length; i++) {
          if (Math.abs(CANVAS_CONSTANTS.SCALE_LEVELS[i] - scale) < 0.01) {
            currentIndex = i;
            break;
          }
        }

        // 如果没有找到精确匹配，找到最接近的档位
        if (currentIndex === -1) {
          // 使用getNearestScaleLevel找到最接近的档位，然后找到其索引
          const nearestScale = getNearestScaleLevel(scale);
          currentIndex = CANVAS_CONSTANTS.SCALE_LEVELS.findIndex(
            (level) => Math.abs(level - nearestScale) < 0.01
          );
          // 如果还是找不到，默认为中间档位
          if (currentIndex === -1) {
            currentIndex = Math.floor(CANVAS_CONSTANTS.SCALE_LEVELS.length / 2);
          }
        }

        // 获取上一个缩放档位（单级跳跃）
        const targetIndex = Math.max(currentIndex - 1, 0);
        const newScale = CANVAS_CONSTANTS.SCALE_LEVELS[targetIndex];

        if (newScale !== scale) {
          // 计算缩放后的偏移量，使缩放中心保持不变
          const scaleFactor = newScale / scale;
          const rawOffsetX = centerX - (centerX - offsetX) * scaleFactor;
          const rawOffsetY = centerY - (centerY - offsetY) * scaleFactor;

          // 关键修复：引入设备像素比，将偏移量对齐到物理像素，避免文本模糊
          const dpr = window.devicePixelRatio || 1;
          const newOffsetX = Math.round(rawOffsetX * dpr) / dpr;
          const newOffsetY = Math.round(rawOffsetY * dpr) / dpr;

          set({
            scale: newScale,
            offsetX: newOffsetX,
            offsetY: newOffsetY,
            zoomAnimating: true,
          });

          // 动画结束后重置动画状态
          setTimeout(() => {
            set({ zoomAnimating: false });
          }, CANVAS_CONSTANTS.ZOOM_ANIMATION_DURATION);
        }
      },

      setScale: (newScale, centerX = 0, centerY = 0) => {
        const { scale, offsetX, offsetY } = get();

        // 将输入的缩放值调整到最接近的标准档位
        const nearestScale = getNearestScaleLevel(newScale);
        const clampedScale = Math.max(
          CANVAS_CONSTANTS.MIN_SCALE,
          Math.min(CANVAS_CONSTANTS.MAX_SCALE, nearestScale)
        );

        if (clampedScale !== scale) {
          // 计算缩放后的偏移量，使缩放中心保持不变
          const scaleFactor = clampedScale / scale;
          const rawOffsetX = centerX - (centerX - offsetX) * scaleFactor;
          const rawOffsetY = centerY - (centerY - offsetY) * scaleFactor;

          // 关键修复：引入设备像素比，将偏移量对齐到物理像素，避免文本模糊
          const dpr = window.devicePixelRatio || 1;
          const newOffsetX = Math.round(rawOffsetX * dpr) / dpr;
          const newOffsetY = Math.round(rawOffsetY * dpr) / dpr;

          set({
            scale: clampedScale,
            offsetX: newOffsetX,
            offsetY: newOffsetY,
          });
        }
      },

      // 平移操作
      setOffset: (offsetX, offsetY) => {
        set({ offsetX, offsetY });
      },

      panTo: (x, y) => {
        set({ offsetX: x, offsetY: y });
      },

      // 拖拽操作
      startDrag: (startX, startY, isMiddleButton = false) => {
        const { offsetX, offsetY } = get();
        set({
          dragState: {
            isDragging: true,
            startX,
            startY,
            startOffsetX: offsetX,
            startOffsetY: offsetY,
            isMiddleButtonDrag: isMiddleButton,
          },
        });
      },

      updateDrag: (currentX, currentY) => {
        const { dragState } = get();
        if (dragState.isDragging) {
          const deltaX = currentX - dragState.startX;
          const deltaY = currentY - dragState.startY;

          // 关键优化：在拖拽过程中实时将偏移量四舍五入到整数像素
          // 这可以显著减少拖拽时的文本模糊，但可能会在低性能设备上引入微小的“抖动”感
          // 引入设备像素比以在高清屏上获得更精确的对齐
          const dpr = window.devicePixelRatio || 1;
          const newOffsetX =
            Math.round((dragState.startOffsetX + deltaX) * dpr) / dpr;
          const newOffsetY =
            Math.round((dragState.startOffsetY + deltaY) * dpr) / dpr;

          set({
            offsetX: newOffsetX,
            offsetY: newOffsetY,
          });
        }
      },

      endDrag: () => {
        const { offsetX, offsetY } = get();

        // 关键修复：拖拽结束时，基于设备像素比对齐偏移量
        const dpr = window.devicePixelRatio || 1;
        const roundedOffsetX = Math.round(offsetX * dpr) / dpr;
        const roundedOffsetY = Math.round(offsetY * dpr) / dpr;

        if (process.env.NODE_ENV === "development") {
          console.log("🖱️ 结束拖拽画布", {
            finalOffset: {
              x: roundedOffsetX.toFixed(1),
              y: roundedOffsetY.toFixed(1),
            },
          });
        }

        set({
          offsetX: roundedOffsetX,
          offsetY: roundedOffsetY,
          dragState: {
            isDragging: false,
            startX: 0,
            startY: 0,
            startOffsetX: 0,
            startOffsetY: 0,
            isMiddleButtonDrag: false,
          },
        });
      },

      // 重置操作
      resetView: () => {
        if (process.env.NODE_ENV === "development") {
          console.log("🔄 开始重置画布视图状态");
        }

        set({
          scale: CANVAS_CONSTANTS.DEFAULT_SCALE,
          offsetX: 0,
          offsetY: 0,
          zoomAnimating: true,
        });

        // 修复：确保重置后便签虚拟化状态能正确更新
        // 通过延迟执行确保状态变更能被React正确检测到
        setTimeout(() => {
          set({ zoomAnimating: false });

          if (process.env.NODE_ENV === "development") {
            console.log("✅ 画布视图重置完成", {
              scale: CANVAS_CONSTANTS.DEFAULT_SCALE,
              offsetX: 0,
              offsetY: 0,
            });
          }
        }, CANVAS_CONSTANTS.ZOOM_ANIMATION_DURATION);
      },

      fitToContent: (notes) => {
        if (notes.length === 0) {
          get().resetView();
          return;
        }

        // 计算所有便签的边界框
        let minX = Infinity,
          minY = Infinity;
        let maxX = -Infinity,
          maxY = -Infinity;

        notes.forEach((note) => {
          minX = Math.min(minX, note.x);
          minY = Math.min(minY, note.y);
          maxX = Math.max(maxX, note.x + note.width);
          maxY = Math.max(maxY, note.y + note.height);
        });

        // 添加边距
        const padding = 50;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        // 计算内容的中心点和尺寸
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        const contentCenterX = (minX + maxX) / 2;
        const contentCenterY = (minY + maxY) / 2;

        // 计算合适的缩放比例（假设视口大小为800x600）
        const viewportWidth = 800;
        const viewportHeight = 600;
        const scaleX = viewportWidth / contentWidth;
        const scaleY = viewportHeight / contentHeight;
        const calculatedScale = Math.min(
          scaleX,
          scaleY,
          CANVAS_CONSTANTS.MAX_SCALE
        );

        // 将计算出的缩放值调整到最接近的标准档位
        const newScale = getNearestScaleLevel(calculatedScale);

        // 计算偏移量并四舍五入到整数像素，避免文本模糊
        const rawOffsetX = -contentCenterX * newScale + viewportWidth / 2;
        const rawOffsetY = -contentCenterY * newScale + viewportHeight / 2;

        // 关键修复：引入设备像素比，将偏移量对齐到物理像素
        const dpr = window.devicePixelRatio || 1;
        const newOffsetX = Math.round(rawOffsetX * dpr) / dpr;
        const newOffsetY = Math.round(rawOffsetY * dpr) / dpr;

        // 设置新的视图状态
        set({
          scale: newScale,
          offsetX: newOffsetX,
          offsetY: newOffsetY,
          zoomAnimating: true,
        });

        setTimeout(() => {
          set({ zoomAnimating: false });
        }, CANVAS_CONSTANTS.ZOOM_ANIMATION_DURATION);
      },

      // 坐标转换
      screenToCanvas: (screenX, screenY) => {
        const { scale, offsetX, offsetY } = get();
        return {
          x: (screenX - offsetX) / scale,
          y: (screenY - offsetY) / scale,
        };
      },

      canvasToScreen: (canvasX, canvasY) => {
        const { scale, offsetX, offsetY } = get();
        return {
          x: canvasX * scale + offsetX,
          y: canvasY * scale + offsetY,
        };
      },

      // 动画控制
      setZoomAnimating: (animating) => {
        set({ zoomAnimating: animating });
      },

      // 交互模式控制
      toggleMoveMode: () => {
        set((state) => ({ isMoveModeActive: !state.isMoveModeActive }));
      },

      setMoveMode: (active: boolean) => {
        set({ isMoveModeActive: active });
      },

      // 网格控制
      toggleGrid: () => {
        set((state) => ({ showGrid: !state.showGrid }));
      },

      toggleAxis: () => {
        set((state) => ({ showAxis: !state.showAxis }));
      },

      // 获取画布中心点
      getCanvasCenter: () => {
        // 获取实际的视口大小
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        return {
          x: viewportWidth / 2,
          y: viewportHeight / 2,
        };
      },

      // 定位到指定便签
      centerOnNote: (noteX, noteY, noteWidth, noteHeight, noteId) => {
        // 获取视口中心点
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const viewportCenterX = viewportWidth / 2;
        const viewportCenterY = viewportHeight / 2;

        // 计算便签中心点
        const noteCenterX = noteX + noteWidth / 2;
        const noteCenterY = noteY + noteHeight / 2;

        // 计算需要的偏移量，使便签中心对齐到视口中心
        const { scale } = get();
        const rawOffsetX = viewportCenterX - noteCenterX * scale;
        const rawOffsetY = viewportCenterY - noteCenterY * scale;

        // 关键修复：将偏移量四舍五入到最近的物理像素，避免亚像素渲染导致的文本模糊
        const dpr = window.devicePixelRatio || 1;
        const newOffsetX = Math.round(rawOffsetX * dpr) / dpr;
        const newOffsetY = Math.round(rawOffsetY * dpr) / dpr;

        // 设置新的偏移量
        set({
          offsetX: newOffsetX,
          offsetY: newOffsetY,
          zoomAnimating: true,
        });

        // 如果提供了便签ID，将便签置顶
        if (noteId) {
          // 由于 centerOnNote 在 canvasStore 中，我们需要通过导入来访问 stickyNotesStore
          import("./stickyNotesStore").then(({ useStickyNotesStore }) => {
            const { bringNoteToFront } = useStickyNotesStore.getState();
            bringNoteToFront(noteId).catch((error) => {
              console.error("便签置顶失败:", error);
            });
          });
        }

        // 动画结束后重置动画状态
        setTimeout(() => {
          set({ zoomAnimating: false });
        }, CANVAS_CONSTANTS.ZOOM_ANIMATION_DURATION);

        if (process.env.NODE_ENV === "development") {
          console.log("📍 定位到便签:", {
            notePosition: { x: noteX, y: noteY },
            noteSize: { width: noteWidth, height: noteHeight },
            newOffset: { x: newOffsetX.toFixed(1), y: newOffsetY.toFixed(1) },
            bringToFront: !!noteId,
          });
        }
      },
    })),
    {
      name: "canvas-store", // DevTools中的名称
    }
  )
);
