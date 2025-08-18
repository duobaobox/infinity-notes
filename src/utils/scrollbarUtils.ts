/**
 * 滚动条检测工具函数
 * 提供统一的滚动条状态检测和 padding 调整逻辑
 */

/**
 * 滚动条检测结果接口
 */
interface ScrollbarDetectionResult {
  hasScrollbar: boolean;
  scrollHeight: number;
  clientHeight: number;
  element: HTMLElement;
  contentContainer: Element | null;
}

/**
 * 检测配置接口
 */
interface ScrollbarDetectionConfig {
  /** 容错像素，默认为1px */
  tolerance?: number;
  /** 是否启用调试信息 */
  debug?: boolean;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<ScrollbarDetectionConfig> = {
  tolerance: 1,
  debug: false,
};

/**
 * 验证元素是否有效
 */
function isElementValid(element: HTMLElement | null): element is HTMLElement {
  if (!element) return false;

  return (
    element.isConnected &&
    element.offsetHeight > 0 &&
    element.offsetWidth > 0 &&
    // 检查元素是否可见
    getComputedStyle(element).display !== "none" &&
    getComputedStyle(element).visibility !== "hidden"
  );
}

/**
 * 获取滚动条状态
 */
function getScrollbarState(
  element: HTMLElement,
  config: Required<ScrollbarDetectionConfig>
): ScrollbarDetectionResult | null {
  if (!isElementValid(element)) {
    return null;
  }

  try {
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    // 处理极端情况：scrollHeight 或 clientHeight 为负数或 NaN
    if (
      !Number.isFinite(scrollHeight) ||
      !Number.isFinite(clientHeight) ||
      scrollHeight < 0 ||
      clientHeight < 0
    ) {
      if (config.debug) {
        console.warn("Invalid scroll dimensions:", {
          scrollHeight,
          clientHeight,
        });
      }
      return null;
    }

    const hasScrollbar = scrollHeight > clientHeight + config.tolerance;
    const contentContainer = element.closest(".sticky-note-content");

    return {
      hasScrollbar,
      scrollHeight,
      clientHeight,
      element,
      contentContainer,
    };
  } catch (error) {
    if (config.debug) {
      console.error("Error detecting scrollbar state:", error);
    }
    return null;
  }
}

/**
 * 应用滚动条状态到DOM
 */
function applyScrollbarState(
  result: ScrollbarDetectionResult,
  config: Required<ScrollbarDetectionConfig>
): void {
  const { hasScrollbar, element, contentContainer } = result;

  try {
    // 设置元素自身的属性
    element.setAttribute("data-scrollable", hasScrollbar.toString());

    // 更新父容器的状态
    if (contentContainer) {
      if (hasScrollbar) {
        contentContainer.classList.add("has-scrollbar");
        contentContainer.setAttribute("data-has-scrollbar", "true");
      } else {
        contentContainer.classList.remove("has-scrollbar");
        contentContainer.setAttribute("data-has-scrollbar", "false");
      }
    }

    if (config.debug) {
      console.debug("Applied scrollbar state:", {
        hasScrollbar,
        scrollHeight: result.scrollHeight,
        clientHeight: result.clientHeight,
        difference: result.scrollHeight - result.clientHeight,
        elementId: element.id || "unnamed",
      });
    }
  } catch (error) {
    if (config.debug) {
      console.error("Error applying scrollbar state:", error);
    }
  }
}

/**
 * 主要的滚动条检测和应用函数
 */
export function detectAndApplyScrollbarStateSync(
  element: HTMLElement | null,
  config: Partial<ScrollbarDetectionConfig> = {}
): boolean {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  if (!element) {
    return false;
  }

  const result = getScrollbarState(element, mergedConfig);

  if (result) {
    applyScrollbarState(result, mergedConfig);
    return true;
  }

  return false;
}

/**
 * 查找编辑器元素的工具函数
 */
export function findEditorElement(
  container: Element | null
): HTMLElement | null {
  if (!container) return null;

  // 尝试多种选择器，确保能找到编辑器元素
  const selectors = [
    ".ProseMirror",
    ".tiptap",
    '[contenteditable="true"]',
    ".wysiwyg-editor .ProseMirror",
    ".editor-content .ProseMirror",
  ];

  for (const selector of selectors) {
    const element = container.querySelector(selector) as HTMLElement;
    if (isElementValid(element)) {
      return element;
    }
  }

  return null;
}

/**
 * 创建一个防抖的滚动条检测函数
 */
export function createDebouncedScrollbarDetector(
  delay: number = 16,
  config: Partial<ScrollbarDetectionConfig> = {}
) {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debouncedDetect(element: HTMLElement | null): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      detectAndApplyScrollbarStateSync(element, config);
      timeoutId = null;
    }, delay);
  };
}

/**
 * 兜底检测函数 - 定期检查和修复状态不一致的情况
 */
export function createScrollbarStateWatchdog(
  container: Element,
  interval: number = 5000, // 5秒检查一次
  config: Partial<ScrollbarDetectionConfig> = {}
) {
  const intervalId = setInterval(() => {
    const editorElement = findEditorElement(container);
    if (editorElement) {
      detectAndApplyScrollbarStateSync(editorElement, {
        ...config,
        debug: false, // 兜底检测时不输出调试信息，避免污染控制台
      });
    }
  }, interval);

  return () => {
    clearInterval(intervalId);
  };
}
