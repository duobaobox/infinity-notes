// 画布状态管理Store
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// 拖拽状态接口
export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startOffsetX: number;
  startOffsetY: number;
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
  startDrag: (startX: number, startY: number) => void;
  updateDrag: (currentX: number, currentY: number) => void;
  endDrag: () => void;
  
  // 重置操作
  resetView: () => void;
  fitToContent: (notes: Array<{ x: number; y: number; width: number; height: number }>) => void;
  
  // 坐标转换
  screenToCanvas: (screenX: number, screenY: number) => { x: number; y: number };
  canvasToScreen: (canvasX: number, canvasY: number) => { x: number; y: number };
  
  // 动画控制
  setZoomAnimating: (animating: boolean) => void;
  
  // 网格控制
  toggleGrid: () => void;
  toggleAxis: () => void;
  
  // 获取画布中心点
  getCanvasCenter: () => { x: number; y: number };
}

// 画布常量
const CANVAS_CONSTANTS = {
  MIN_SCALE: 0.1,
  MAX_SCALE: 3.0,
  DEFAULT_SCALE: 1.0,
  ZOOM_STEP: 0.1,
  ZOOM_ANIMATION_DURATION: 200,
};

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
      },
      zoomAnimating: false,
      minScale: CANVAS_CONSTANTS.MIN_SCALE,
      maxScale: CANVAS_CONSTANTS.MAX_SCALE,
      showGrid: true,
      showAxis: false,

      // 缩放操作
      zoomIn: (centerX = 0, centerY = 0) => {
        const { scale, offsetX, offsetY } = get();
        const newScale = Math.min(scale + CANVAS_CONSTANTS.ZOOM_STEP, CANVAS_CONSTANTS.MAX_SCALE);
        
        if (newScale !== scale) {
          // 计算缩放后的偏移量，使缩放中心保持不变
          const scaleFactor = newScale / scale;
          const newOffsetX = centerX - (centerX - offsetX) * scaleFactor;
          const newOffsetY = centerY - (centerY - offsetY) * scaleFactor;
          
          set({ 
            scale: newScale, 
            offsetX: newOffsetX, 
            offsetY: newOffsetY,
            zoomAnimating: true 
          });
          
          // 动画结束后重置动画状态
          setTimeout(() => {
            set({ zoomAnimating: false });
          }, CANVAS_CONSTANTS.ZOOM_ANIMATION_DURATION);
        }
      },

      zoomOut: (centerX = 0, centerY = 0) => {
        const { scale, offsetX, offsetY } = get();
        const newScale = Math.max(scale - CANVAS_CONSTANTS.ZOOM_STEP, CANVAS_CONSTANTS.MIN_SCALE);
        
        if (newScale !== scale) {
          // 计算缩放后的偏移量，使缩放中心保持不变
          const scaleFactor = newScale / scale;
          const newOffsetX = centerX - (centerX - offsetX) * scaleFactor;
          const newOffsetY = centerY - (centerY - offsetY) * scaleFactor;
          
          set({ 
            scale: newScale, 
            offsetX: newOffsetX, 
            offsetY: newOffsetY,
            zoomAnimating: true 
          });
          
          // 动画结束后重置动画状态
          setTimeout(() => {
            set({ zoomAnimating: false });
          }, CANVAS_CONSTANTS.ZOOM_ANIMATION_DURATION);
        }
      },

      setScale: (newScale, centerX = 0, centerY = 0) => {
        const { scale, offsetX, offsetY, minScale, maxScale } = get();
        const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
        
        if (clampedScale !== scale) {
          // 计算缩放后的偏移量，使缩放中心保持不变
          const scaleFactor = clampedScale / scale;
          const newOffsetX = centerX - (centerX - offsetX) * scaleFactor;
          const newOffsetY = centerY - (centerY - offsetY) * scaleFactor;
          
          set({ 
            scale: clampedScale, 
            offsetX: newOffsetX, 
            offsetY: newOffsetY 
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
      startDrag: (startX, startY) => {
        const { offsetX, offsetY } = get();
        set({
          dragState: {
            isDragging: true,
            startX,
            startY,
            startOffsetX: offsetX,
            startOffsetY: offsetY,
          }
        });
      },

      updateDrag: (currentX, currentY) => {
        const { dragState } = get();
        if (dragState.isDragging) {
          const deltaX = currentX - dragState.startX;
          const deltaY = currentY - dragState.startY;
          
          set({
            offsetX: dragState.startOffsetX + deltaX,
            offsetY: dragState.startOffsetY + deltaY,
          });
        }
      },

      endDrag: () => {
        set({
          dragState: {
            isDragging: false,
            startX: 0,
            startY: 0,
            startOffsetX: 0,
            startOffsetY: 0,
          }
        });
      },

      // 重置操作
      resetView: () => {
        set({
          scale: CANVAS_CONSTANTS.DEFAULT_SCALE,
          offsetX: 0,
          offsetY: 0,
          zoomAnimating: true,
        });
        
        setTimeout(() => {
          set({ zoomAnimating: false });
        }, CANVAS_CONSTANTS.ZOOM_ANIMATION_DURATION);
      },

      fitToContent: (notes) => {
        if (notes.length === 0) {
          get().resetView();
          return;
        }
        
        // 计算所有便签的边界框
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        notes.forEach(note => {
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
        const newScale = Math.min(scaleX, scaleY, CANVAS_CONSTANTS.MAX_SCALE);
        
        // 设置新的视图状态
        set({
          scale: newScale,
          offsetX: -contentCenterX * newScale + viewportWidth / 2,
          offsetY: -contentCenterY * newScale + viewportHeight / 2,
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

      // 网格控制
      toggleGrid: () => {
        set(state => ({ showGrid: !state.showGrid }));
      },

      toggleAxis: () => {
        set(state => ({ showAxis: !state.showAxis }));
      },

      // 获取画布中心点
      getCanvasCenter: () => {
        // 获取实际的视口大小
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        return {
          x: viewportWidth / 2,
          y: viewportHeight / 2
        };
      },
    })),
    {
      name: 'canvas-store', // DevTools中的名称
    }
  )
);
