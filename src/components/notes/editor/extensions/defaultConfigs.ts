/**
 * 默认扩展配置
 */

import type { ExtensionOptions, EditorConfiguration } from "./types";

/**
 * 基础扩展配置
 */
export const DEFAULT_EXTENSION_OPTIONS: ExtensionOptions = {
  starterKit: {
    enabled: true,
    options: {
      // 配置内置扩展
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
      bulletList: {
        keepMarks: true,
        keepAttributes: false,
      },
      orderedList: {
        keepMarks: true,
        keepAttributes: false,
      },
      // 启用斜体功能
      italic: {
        HTMLAttributes: {
          class: "italic-text",
        },
      },
      // 配置代码块扩展
      codeBlock: {
        HTMLAttributes: {
          class: "code-block",
        },
      },
      // 配置链接扩展
      link: {
        openOnClick: false,
        HTMLAttributes: {
          class: "editor-link",
        },
      },
    },
  },
  placeholder: {
    enabled: true,
    options: {
      placeholder: "开始输入...",
      emptyEditorClass: "is-editor-empty",
    },
  },
  image: {
    enabled: true,
    options: {
      HTMLAttributes: {
        class: "editor-image",
      },
      allowBase64: true,
      inline: false,
    },
  },
  taskList: {
    enabled: true,
    options: {
      HTMLAttributes: {
        class: "task-list",
      },
      itemTypeName: "taskItem",
    },
  },
  taskItem: {
    enabled: true,
    options: {
      nested: true,
      HTMLAttributes: {
        class: "task-item",
      },
    },
  },
  table: {
    enabled: true,
    options: {
      resizable: true,
      handleWidth: 5,
      cellMinWidth: 25,
      HTMLAttributes: {
        class: "editor-table",
      },
    },
  },
};

/**
 * 表格扩展专用配置
 */
export const TABLE_EXTENSION_CONFIG = {
  table: {
    enabled: true,
    options: {
      resizable: true,
      handleWidth: 5,
      cellMinWidth: 25,
      View: undefined, // 使用默认视图
      lastColumnResizable: true,
      allowTableNodeSelection: false,
      HTMLAttributes: {
        class: "editor-table",
      },
    },
  },
  tableRow: {
    enabled: true,
    options: {
      HTMLAttributes: {
        class: "editor-table-row",
      },
    },
  },
  tableCell: {
    enabled: true,
    options: {
      HTMLAttributes: {
        class: "editor-table-cell",
      },
    },
  },
  tableHeader: {
    enabled: true,
    options: {
      HTMLAttributes: {
        class: "editor-table-header",
      },
    },
  },
};

/**
 * 精简版扩展配置 (用于性能敏感场景)
 */
export const MINIMAL_EXTENSION_OPTIONS: ExtensionOptions = {
  starterKit: {
    enabled: true,
    options: {
      // 只启用基础功能
      heading: { levels: [1, 2, 3] },
      bulletList: { keepMarks: false },
      orderedList: { keepMarks: false },
      italic: true,
      bold: true,
      // 禁用一些重型功能
      codeBlock: false,
      blockquote: false,
    },
  },
  placeholder: {
    enabled: true,
    options: {
      placeholder: "开始输入...",
    },
  },
  // 其他扩展默认禁用
  image: { enabled: false },
  taskList: { enabled: false },
  taskItem: { enabled: false },
  table: { enabled: false },
};

/**
 * 功能完整版扩展配置
 */
export const FULL_EXTENSION_OPTIONS: ExtensionOptions = {
  ...DEFAULT_EXTENSION_OPTIONS,
  // 启用所有功能
  table: {
    enabled: true,
    options: {
      ...TABLE_EXTENSION_CONFIG.table.options,
      // 使用支持的表格配置选项
      resizable: true,
      handleWidth: 5,
      cellMinWidth: 25,
    },
  },
  // 可以在这里添加更多高级扩展
  custom: {
    mathematics: {
      name: "mathematics",
      enabled: false, // 默认禁用，需要额外安装
      options: {},
    },
    collaboration: {
      name: "collaboration",
      enabled: false, // 默认禁用，需要额外配置
      options: {},
    },
  },
};

/**
 * 默认编辑器配置
 */
export const DEFAULT_EDITOR_CONFIGURATION: EditorConfiguration = {
  extensions: DEFAULT_EXTENSION_OPTIONS,
  toolbar: {
    enabled: true,
    groups: ["format", "list", "table", "insert"],
    customButtons: [],
  },
  behavior: {
    autoFocus: false,
    editable: true,
    debounceDelay: 100,
    smartScroll: true,
  },
  performance: {
    enableMonitoring: false,
    enableUXOptimizer: false,
    maxContentLength: 100000,
  },
  theme: {
    name: "default",
  },
};

/**
 * 表格工具栏配置
 */
export const TABLE_TOOLBAR_CONFIG = {
  insertTable: {
    id: "insertTable",
    title: "插入表格",
    icon: "📋",
    group: "table",
    position: 1,
  },
  deleteTable: {
    id: "deleteTable",
    title: "删除表格",
    icon: "🗑️",
    group: "table",
    position: 2,
  },
  addColumnBefore: {
    id: "addColumnBefore",
    title: "在前面插入列",
    icon: "⬅️",
    group: "table",
    position: 3,
  },
  addColumnAfter: {
    id: "addColumnAfter",
    title: "在后面插入列",
    icon: "➡️",
    group: "table",
    position: 4,
  },
  deleteColumn: {
    id: "deleteColumn",
    title: "删除列",
    icon: "🗑️",
    group: "table",
    position: 5,
  },
  addRowBefore: {
    id: "addRowBefore",
    title: "在上面插入行",
    icon: "⬆️",
    group: "table",
    position: 6,
  },
  addRowAfter: {
    id: "addRowAfter",
    title: "在下面插入行",
    icon: "⬇️",
    group: "table",
    position: 7,
  },
  deleteRow: {
    id: "deleteRow",
    title: "删除行",
    icon: "🗑️",
    group: "table",
    position: 8,
  },
  mergeCells: {
    id: "mergeCells",
    title: "合并单元格",
    icon: "🔗",
    group: "table",
    position: 9,
  },
  splitCell: {
    id: "splitCell",
    title: "拆分单元格",
    icon: "✂️",
    group: "table",
    position: 10,
  },
  toggleHeaderColumn: {
    id: "toggleHeaderColumn",
    title: "切换标题列",
    icon: "📋",
    group: "table",
    position: 11,
  },
  toggleHeaderRow: {
    id: "toggleHeaderRow",
    title: "切换标题行",
    icon: "📋",
    group: "table",
    position: 12,
  },
};

/**
 * 获取预设配置
 */
export const getPresetConfiguration = (
  preset: "minimal" | "default" | "full"
): EditorConfiguration => {
  switch (preset) {
    case "minimal":
      return {
        ...DEFAULT_EDITOR_CONFIGURATION,
        extensions: MINIMAL_EXTENSION_OPTIONS,
        toolbar: {
          enabled: true,
          groups: ["format"],
        },
      };
    case "full":
      return {
        ...DEFAULT_EDITOR_CONFIGURATION,
        extensions: FULL_EXTENSION_OPTIONS,
        toolbar: {
          enabled: true,
          groups: ["format", "list", "table", "insert", "advanced"],
        },
      };
    case "default":
    default:
      return DEFAULT_EDITOR_CONFIGURATION;
  }
};

/**
 * 创建自定义配置
 */
export const createCustomConfiguration = (
  overrides: Partial<EditorConfiguration>
): EditorConfiguration => {
  return {
    ...DEFAULT_EDITOR_CONFIGURATION,
    ...overrides,
    extensions: {
      ...DEFAULT_EDITOR_CONFIGURATION.extensions,
      ...overrides.extensions,
    },
    toolbar: {
      ...DEFAULT_EDITOR_CONFIGURATION.toolbar,
      ...overrides.toolbar,
    },
    behavior: {
      ...DEFAULT_EDITOR_CONFIGURATION.behavior,
      ...overrides.behavior,
    },
    performance: {
      ...DEFAULT_EDITOR_CONFIGURATION.performance,
      ...overrides.performance,
    },
    theme: {
      ...DEFAULT_EDITOR_CONFIGURATION.theme,
      ...overrides.theme,
    },
  };
};
