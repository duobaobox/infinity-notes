// 高清屏幕（Retina）适配工具函数
export class HighDPIUtils {
  // 获取设备像素比
  static getDevicePixelRatio(): number {
    return window.devicePixelRatio || 1;
  }

  // 检查是否为高DPI屏幕
  static isHighDPI(): boolean {
    return this.getDevicePixelRatio() > 1;
  }

  // 计算适用于高DPI的字体大小
  static getOptimalFontSize(baseFontSize: number, scale: number): number {
    const dpr = this.getDevicePixelRatio();

    // 在高DPI屏幕上，当缩放比例较小时，适当增加字体大小以保持清晰度
    if (dpr > 1) {
      if (scale < 0.8) {
        return baseFontSize * Math.max(1, (1 / scale) * 0.8);
      } else if (scale > 1.5) {
        // 在放大时，稍微减小字体以避免过度模糊
        return baseFontSize * Math.min(1.2, scale * 0.9);
      }
    }

    return baseFontSize;
  }

  // 获取最优的文本渲染样式
  static getTextRenderingStyles(scale: number): React.CSSProperties {
    const dpr = this.getDevicePixelRatio();

    const baseStyles: React.CSSProperties = {
      textRendering: "optimizeLegibility",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      fontOpticalSizing: "auto",
    };

    // 针对不同缩放级别的优化
    if (scale < 0.7) {
      // 小缩放时，确保文本足够清晰
      return {
        ...baseStyles,
        textRendering: "geometricPrecision",
        fontWeight: dpr > 1 ? "500" : "400",
      };
    } else if (scale > 1.3) {
      // 大缩放时，优化抗锯齿
      return {
        ...baseStyles,
        textRendering: "optimizeSpeed",
        WebkitFontSmoothing: dpr > 1 ? "subpixel-antialiased" : "antialiased",
      };
    }

    return baseStyles;
  }

  // 获取优化的变换样式
  static getOptimalTransformStyles(scale: number): React.CSSProperties {
    const dpr = this.getDevicePixelRatio();

    return {
      transformOrigin: "center center",
      backfaceVisibility: "hidden",
      willChange: "transform",
      // 在高DPI屏幕上使用3D变换启用GPU加速
      transform: dpr > 1 ? "translateZ(0)" : undefined,
      // 针对不同缩放级别的图像渲染优化
      imageRendering: scale < 1 ? "crisp-edges" : "auto",
    };
  }

  // 计算容器的最优尺寸（考虑DPI）
  static getOptimalContainerSize(
    width: number,
    height: number
  ): {
    width: number;
    height: number;
    style: React.CSSProperties;
  } {
    const dpr = this.getDevicePixelRatio();

    if (dpr > 1) {
      return {
        width: width * dpr,
        height: height * dpr,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${1 / dpr})`,
          transformOrigin: "0 0",
        },
      };
    }

    return {
      width,
      height,
      style: {},
    };
  }

  // 为特定元素设置高清适配
  static applyHighDPIOptimization(element: HTMLElement): void {
    if (!element) return;

    const dpr = this.getDevicePixelRatio();

    if (dpr > 1) {
      // 设置高清相关的CSS属性
      element.style.setProperty("-webkit-font-smoothing", "antialiased");
      element.style.setProperty("-moz-osx-font-smoothing", "grayscale");
      element.style.setProperty("text-rendering", "optimizeLegibility");
      element.style.setProperty("backface-visibility", "hidden");
      element.style.setProperty("transform", "translateZ(0)");
    }
  }
}
