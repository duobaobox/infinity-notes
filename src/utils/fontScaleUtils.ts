import React from "react";
import { CANVAS_CONSTANTS } from "../components/canvas/CanvasConstants";

/**
 * 字体缩放工具函数
 * 根据画布缩放级别计算相应的字体大小
 */

/**
 * 直接缩放字体大小，避免CSS transform的双重缩放问题
 * @param baseSize 基础字体大小 (px)
 * @param scale 当前缩放级别 (0.25 - 2.0)
 * @returns 计算后的最终字体大小 (px)，确保像素完美对齐
 */
export const calculateFontSize = (baseSize: number, scale: number): number => {
  // 直接计算最终字体大小：baseSize * scale
  const finalSize = baseSize * scale;

  // 确保字体大小在合理范围内
  const clampedSize = Math.max(
    CANVAS_CONSTANTS.FONT_MIN_SIZE,
    Math.min(CANVAS_CONSTANTS.FONT_MAX_SIZE, finalSize)
  );

  // 设备像素比对齐，确保文本清晰
  const dpr = window.devicePixelRatio || 1;
  const devicePixelSize = clampedSize * dpr;
  const alignedDevicePixelSize = Math.round(devicePixelSize);

  return Math.max(CANVAS_CONSTANTS.FONT_MIN_SIZE, alignedDevicePixelSize / dpr);
};

/**
 * 获取便签标题的字体大小
 * @param scale 当前缩放级别
 * @returns 标题字体大小 (px)
 */
export const getTitleFontSize = (scale: number): number => {
  return calculateFontSize(14, scale); // 基础标题字体大小 14px
};

/**
 * 获取便签内容的字体大小
 * @param scale 当前缩放级别
 * @returns 内容字体大小 (px)
 */
export const getContentFontSize = (scale: number): number => {
  return calculateFontSize(14, scale); // 基础内容字体大小 14px
};

/**
 * 获取Markdown各级标题的字体大小
 * @param scale 当前缩放级别
 * @param level 标题级别 (1-6)
 * @returns 标题字体大小 (px)
 */
export const getMarkdownHeadingFontSize = (
  scale: number,
  level: number
): number => {
  const baseSizes = {
    1: 18, // h1
    2: 16, // h2
    3: 15, // h3
    4: 14, // h4
    5: 13, // h5
    6: 12, // h6
  };

  const baseSize = baseSizes[level as keyof typeof baseSizes] || 14;
  return calculateFontSize(baseSize, scale);
};

/**
 * 获取代码块的字体大小
 * @param scale 当前缩放级别
 * @returns 代码字体大小 (px)
 */
export const getCodeFontSize = (scale: number): number => {
  return calculateFontSize(12, scale); // 基础代码字体大小 12px
};

/**
 * 获取表格的字体大小
 * @param scale 当前缩放级别
 * @returns 表格字体大小 (px)
 */
export const getTableFontSize = (scale: number): number => {
  return calculateFontSize(12, scale); // 基础表格字体大小 12px
};

/**
 * 获取工具栏徽章的字体大小
 * @param scale 当前缩放级别
 * @returns 徽章字体大小 (px)
 */
export const getBadgeFontSize = (scale: number): number => {
  return calculateFontSize(8, scale); // 基础徽章字体大小 8px
};

/**
 * 获取最接近的缩放档位
 * @param scale 当前缩放值
 * @returns 最接近的标准缩放档位
 */
export const getNearestScaleLevel = (scale: number): number => {
  const levels = CANVAS_CONSTANTS.SCALE_LEVELS;

  // 找到最接近的缩放档位
  let nearestLevel: number = levels[0]; // 显式声明为 number 类型
  let minDiff = Math.abs(scale - levels[0]);

  for (const level of levels) {
    const diff = Math.abs(scale - level);
    if (diff < minDiff) {
      minDiff = diff;
      nearestLevel = level;
    }
  }

  return nearestLevel;
};

/**
 * 简化的像素对齐函数
 * @param value 要对齐的值
 * @returns 像素对齐后的值
 */
export const getPixelAlignedValue = (value: number): number => {
  const dpr = window.devicePixelRatio || 1;
  return Math.round(value * dpr) / dpr;
};

/**
 * 获取基于缩放级别的字体样式对象
 * 用于便签组件应用字体大小样式
 * @param scale 当前缩放级别 (0.25 - 2.0)
 * @returns 包含字体大小的样式对象
 */
export const getFontSizeStyles = (scale: number): React.CSSProperties => {
  return {
    fontSize: `${getContentFontSize(scale)}px`, // 使用内容字体大小作为基础字体大小
  };
};
