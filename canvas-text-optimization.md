# Canvas 文本模糊优化方案

## 问题描述

在 Canvas 缩放过程中，便签文本会出现模糊的问题，特别是在高 DPI 屏幕上。这是因为 CSS 的`transform: scale()`直接拉伸已渲染的像素，而不是重新渲染文本。

## 优化方案

### 1. 高 DPI 屏幕适配 (HighDPIUtils)

#### 核心功能：

- **设备像素比检测**：自动检测当前设备的像素比（devicePixelRatio）
- **字体大小动态调整**：根据缩放比例和 DPI 自动调整字体大小
- **文本渲染优化**：针对不同缩放级别提供最优的文本渲染样式
- **GPU 加速**：启用硬件加速提升渲染性能

#### 关键方法：

```typescript
// 获取最优字体大小
getOptimalFontSize(baseFontSize: number, scale: number): number

// 获取文本渲染样式
getTextRenderingStyles(scale: number): React.CSSProperties

// 应用高DPI优化
applyHighDPIOptimization(element: HTMLElement): void
```

### 2. StickyNote 组件优化

#### 改进点：

- **动态样式计算**：根据当前缩放比例实时计算最优样式
- **高 DPI 适配**：自动应用高清屏幕优化
- **文本渲染增强**：使用最优的文本渲染属性

#### 新增属性：

```typescript
interface StickyNoteProps {
  scale?: number; // 当前缩放比例
  // ...其他属性
}
```

### 3. CSS 优化

#### 文本渲染优化：

```css
/* 基础文本渲染优化 */
text-rendering: optimizeLegibility;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
font-optical-sizing: auto;

/* 高DPI屏幕特殊优化 */
@media (-webkit-min-device-pixel-ratio: 2) {
  -webkit-font-smoothing: subpixel-antialiased;
}
```

#### GPU 加速：

```css
transform: translateZ(0);
backface-visibility: hidden;
will-change: transform;
```

#### 缩放级别适配：

```css
/* 小缩放时优化 */
.canvas-content[data-scale-level="small"] {
  image-rendering: pixelated;
  text-rendering: geometricPrecision;
}

/* 大缩放时优化 */
.canvas-content[data-scale-level="large"] {
  image-rendering: -webkit-optimize-contrast;
  text-rendering: optimizeSpeed;
}
```

### 4. InfiniteCanvas 增强

#### 缩放级别管理：

- 自动检测缩放级别（small/normal/large）
- 为内容区域设置对应的`data-scale-level`属性
- 传递缩放比例给子组件

## 技术细节

### 字体大小动态调整算法：

```typescript
static getOptimalFontSize(baseFontSize: number, scale: number): number {
  const dpr = this.getDevicePixelRatio();

  if (dpr > 1) {
    if (scale < 0.8) {
      // 小缩放时适当增大字体
      return baseFontSize * Math.max(1, 1 / scale * 0.8);
    } else if (scale > 1.5) {
      // 大缩放时适当减小字体
      return baseFontSize * Math.min(1.2, scale * 0.9);
    }
  }

  return baseFontSize;
}
```

### 文本渲染策略：

- **小缩放（< 0.7）**：使用`geometricPrecision`，增强字体重量
- **正常缩放（0.7-1.3）**：使用`optimizeLegibility`
- **大缩放（> 1.3）**：使用`optimizeSpeed`，在高 DPI 上启用子像素抗锯齿

## 性能优化

1. **GPU 加速**：使用`transform3d`和`translateZ(0)`
2. **缓存优化**：使用`useMemo`缓存计算结果
3. **批量样式更新**：减少 DOM 重排
4. **智能渲染**：根据缩放级别选择最优渲染策略

## 浏览器兼容性

- **现代浏览器**：完全支持所有优化特性
- **Safari**：特别优化了 WebKit 的字体渲染
- **Firefox**：支持 Mozilla 特定的文本渲染优化
- **移动设备**：自动适配高 DPI 屏幕

## 使用方法

1. **自动优化**：组件会自动检测并应用最优设置
2. **手动调整**：可通过传递`scale`属性手动控制
3. **CSS 覆盖**：支持通过 CSS 自定义样式覆盖

## 效果验证

优化后的效果包括：

- ✅ 文本在各种缩放级别下保持清晰
- ✅ 高 DPI 屏幕上的文本渲染质量提升
- ✅ 缩放动画更加流畅
- ✅ 减少了视觉模糊和像素化问题
- ✅ 提升了整体用户体验
