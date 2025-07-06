/**
 * 字体大小变化分析脚本
 * 用于展示不同缩放档位下各种字体的大小变化
 */

import {
  getBadgeFontSize,
  getCodeFontSize,
  getContentFontSize,
  getMarkdownHeadingFontSize,
  getTableFontSize,
  getTitleFontSize,
} from "../src/utils/fontScaleUtils";

// 缩放档位
const SCALE_LEVELS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

// 分析字体大小变化
const analyzeFontSizes = () => {
  console.log("=".repeat(120));
  console.log("字体大小变化分析表");
  console.log("=".repeat(120));

  // 表头
  console.log(
    "缩放档位\t",
    "Title\t",
    "Content\t",
    "H1\t",
    "H2\t",
    "H3\t",
    "H4\t",
    "H5\t",
    "H6\t",
    "Code\t",
    "Table\t",
    "Badge"
  );
  console.log("-".repeat(120));

  // 计算每个档位的字体大小
  SCALE_LEVELS.forEach((scale) => {
    const scalePercent = `${Math.round(scale * 100)}%`;
    const title = getTitleFontSize(scale);
    const content = getContentFontSize(scale);
    const h1 = getMarkdownHeadingFontSize(scale, 1);
    const h2 = getMarkdownHeadingFontSize(scale, 2);
    const h3 = getMarkdownHeadingFontSize(scale, 3);
    const h4 = getMarkdownHeadingFontSize(scale, 4);
    const h5 = getMarkdownHeadingFontSize(scale, 5);
    const h6 = getMarkdownHeadingFontSize(scale, 6);
    const code = getCodeFontSize(scale);
    const table = getTableFontSize(scale);
    const badge = getBadgeFontSize(scale);

    console.log(
      `${scalePercent}\t\t`,
      `${title}px\t`,
      `${content}px\t`,
      `${h1}px\t`,
      `${h2}px\t`,
      `${h3}px\t`,
      `${h4}px\t`,
      `${h5}px\t`,
      `${h6}px\t`,
      `${code}px\t`,
      `${table}px\t`,
      `${badge}px`
    );
  });

  console.log("=".repeat(120));

  // 详细分析公式
  console.log("\n字体大小计算公式分析:");
  console.log("adjustedSize = baseSize + (scale - 1) * 4");
  console.log(
    "最终大小 = Math.max(10, Math.min(22, Math.round(adjustedSize)))"
  );

  console.log("\n基础字体大小:");
  console.log("- Title: 14px");
  console.log("- Content: 14px");
  console.log("- H1: 18px");
  console.log("- H2: 16px");
  console.log("- H3: 15px");
  console.log("- H4: 14px");
  console.log("- H5: 13px");
  console.log("- H6: 12px");
  console.log("- Code: 12px");
  console.log("- Table: 12px");
  console.log("- Badge: 8px");

  console.log("\n缩放调整说明:");
  console.log("每25%缩放变化调整4px字体大小");
  console.log("例如: 1.25倍缩放 = (1.25 - 1) * 4 = +1px");
  console.log("     1.5倍缩放 = (1.5 - 1) * 4 = +2px");
};

// 运行分析
analyzeFontSizes();

export { analyzeFontSizes };
