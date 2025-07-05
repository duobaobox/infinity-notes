import { CANVAS_CONSTANTS } from "../components/canvas/CanvasConstants";

/**
 * 字体缩放工具函数
 * 根据画布缩放级别计算相应的字体大小
 */

/**
 * 计算基于缩放级别的字体大小
 * @param baseSize 基础字体大小 (px)
 * @param scale 当前缩放级别 (0.25 - 2.0)
 * @returns 计算后的字体大小 (px)，确保为整数像素值
 */
export const calculateFontSize = (baseSize: number, scale: number): number => {
  // 计算相对于100%缩放的调整量
  // 每25%缩放调整1px
  const scaleAdjustment = (scale - 1) * 4; // (scale - 1) * (1px / 0.25)
  const adjustedSize = baseSize + scaleAdjustment;

  // 确保字体大小在合理范围内，并强制取整到最近的整数像素
  const clampedSize = Math.max(
    CANVAS_CONSTANTS.FONT_MIN_SIZE,
    Math.min(CANVAS_CONSTANTS.FONT_MAX_SIZE, adjustedSize)
  );

  // 使用Math.round确保字体大小为整数像素，避免亚像素渲染导致的模糊
  return Math.round(clampedSize);
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
  let nearestLevel = levels[0];
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
 * 获取缩放级别的显示文本
 * @param scale 缩放级别
 * @returns 格式化的缩放显示文本 (如 "100%")
 */
export const getScaleDisplayText = (scale: number): string => {
  return `${Math.round(scale * 100)}%`;
};

/**
 * 获取所有字体大小的样式对象
 * @param scale 当前缩放级别
 * @returns 包含所有字体大小的CSS样式对象
 */
export const getFontSizeStyles = (scale: number) => {
  return {
    "--note-title-font-size": `${getTitleFontSize(scale)}px`,
    "--note-content-font-size": `${getContentFontSize(scale)}px`,
    "--note-h1-font-size": `${getMarkdownHeadingFontSize(scale, 1)}px`,
    "--note-h2-font-size": `${getMarkdownHeadingFontSize(scale, 2)}px`,
    "--note-h3-font-size": `${getMarkdownHeadingFontSize(scale, 3)}px`,
    "--note-h4-font-size": `${getMarkdownHeadingFontSize(scale, 4)}px`,
    "--note-h5-font-size": `${getMarkdownHeadingFontSize(scale, 5)}px`,
    "--note-h6-font-size": `${getMarkdownHeadingFontSize(scale, 6)}px`,
    "--note-code-font-size": `${getCodeFontSize(scale)}px`,
    "--note-table-font-size": `${getTableFontSize(scale)}px`,
    "--note-badge-font-size": `${getBadgeFontSize(scale)}px`,
  } as React.CSSProperties;
};

/**
 * 检查缩放级别是否有效
 * @param scale 缩放级别
 * @returns 是否为有效的缩放级别
 */
export const isValidScaleLevel = (scale: number): boolean => {
  return (
    scale >= CANVAS_CONSTANTS.MIN_SCALE && scale <= CANVAS_CONSTANTS.MAX_SCALE
  );
};
