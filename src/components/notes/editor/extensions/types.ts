/**
 * TipTap 编辑器扩展系统类型定义
 */

import type { Extension, Node, Mark } from "@tiptap/core";
import type { Editor } from "@tiptap/react";

/**
 * 扩展配置接口
 */
export interface ExtensionConfig {
  /** 扩展名称 */
  name: string;
  /** 是否启用 */
  enabled: boolean;
  /** 扩展选项 */
  options?: Record<string, any>;
  /** 依赖的其他扩展 */
  dependencies?: string[];
  /** 优先级 (数字越小优先级越高) */
  priority?: number;
}

/**
 * 工具栏按钮配置
 */
export interface ToolbarButtonConfig {
  /** 按钮ID */
  id: string;
  /** 按钮标题 */
  title: string;
  /** 按钮图标 (HTML字符串或React组件) */
  icon: string | React.ComponentType;
  /** 是否激活的检查函数 */
  isActive?: (editor: Editor) => boolean;
  /** 点击事件处理函数 */
  onClick: (editor: Editor) => void;
  /** 是否禁用的检查函数 */
  isDisabled?: (editor: Editor) => boolean;
  /** 按钮分组 */
  group?: string;
  /** 在工具栏中的位置 */
  position?: number;
  /** 键盘快捷键 */
  shortcut?: string;
}

/**
 * 编辑器插件接口
 */
export interface EditorPlugin {
  /** 插件名称 */
  name: string;
  /** 插件版本 */
  version?: string;
  /** 插件描述 */
  description?: string;
  /** TipTap扩展实例 */
  extension: Extension | Node | Mark;
  /** 工具栏按钮配置 */
  toolbarButtons?: ToolbarButtonConfig[];
  /** 键盘快捷键配置 */
  keyboardShortcuts?: KeyboardShortcutConfig[];
  /** 插件初始化函数 */
  onInit?: (editor: Editor) => void;
  /** 插件销毁函数 */
  onDestroy?: (editor: Editor) => void;
  /** 依赖的其他插件 */
  dependencies?: string[];
  /** 插件优先级 */
  priority?: number;
}

/**
 * 键盘快捷键配置
 */
export interface KeyboardShortcutConfig {
  /** 快捷键组合 (如 'Mod-b', 'Ctrl-Shift-Enter') */
  key: string;
  /** 处理函数 */
  handler: (editor: Editor) => boolean;
  /** 描述 */
  description?: string;
}

/**
 * 扩展配置选项
 */
export interface ExtensionOptions {
  /** StarterKit 配置 */
  starterKit?: {
    enabled?: boolean;
    options?: Record<string, any>;
  };
  /** Placeholder 配置 */
  placeholder?: {
    enabled?: boolean;
    options?: {
      placeholder?: string;
      emptyEditorClass?: string;
    };
  };
  /** Image 配置 */
  image?: {
    enabled?: boolean;
    options?: {
      HTMLAttributes?: Record<string, any>;
      allowBase64?: boolean;
      inline?: boolean;
    };
  };
  /** TaskList 配置 */
  taskList?: {
    enabled?: boolean;
    options?: {
      HTMLAttributes?: Record<string, any>;
      itemTypeName?: string;
    };
  };
  /** TaskItem 配置 */
  taskItem?: {
    enabled?: boolean;
    options?: {
      nested?: boolean;
      HTMLAttributes?: Record<string, any>;
    };
  };
  /** Table 配置 */
  table?: {
    enabled?: boolean;
    options?: {
      resizable?: boolean;
      handleWidth?: number;
      cellMinWidth?: number;
      HTMLAttributes?: Record<string, any>;
    };
  };
  /** 自定义扩展 */
  custom?: Record<string, ExtensionConfig>;
}

/**
 * 编辑器配置接口
 */
export interface EditorConfiguration {
  /** 扩展配置 */
  extensions?: ExtensionOptions;
  /** 工具栏配置 */
  toolbar?: {
    enabled?: boolean;
    groups?: string[];
    customButtons?: ToolbarButtonConfig[];
  };
  /** 编辑器行为配置 */
  behavior?: {
    autoFocus?: boolean;
    editable?: boolean;
    debounceDelay?: number;
    smartScroll?: boolean;
  };
  /** 性能配置 */
  performance?: {
    enableMonitoring?: boolean;
    enableUXOptimizer?: boolean;
    maxContentLength?: number;
  };
  /** 主题配置 */
  theme?: {
    name?: string;
    customCSS?: string;
  };
}

/**
 * 扩展加载结果
 */
export interface ExtensionLoadResult {
  /** 是否成功 */
  success: boolean;
  /** 扩展实例 */
  extension?: Extension | Node | Mark;
  /** 错误信息 */
  error?: string;
  /** 加载耗时 */
  loadTime?: number;
}

/**
 * 插件注册结果
 */
export interface PluginRegistrationResult {
  /** 是否成功 */
  success: boolean;
  /** 注册的插件数量 */
  count: number;
  /** 失败的插件 */
  failed?: { name: string; error: string }[];
  /** 注册耗时 */
  registrationTime?: number;
}
