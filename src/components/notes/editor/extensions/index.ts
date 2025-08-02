/**
 * TipTap 扩展系统主入口
 * 提供统一的导出接口
 */

// 类型定义 - 首先导出类型
export type {
  ExtensionConfig,
  ToolbarButtonConfig,
  KeyboardShortcutConfig,
  EditorPlugin,
  ExtensionOptions,
  EditorConfiguration,
  ExtensionLoadResult,
  PluginRegistrationResult,
} from "./types";

// 默认配置
export {
  DEFAULT_EXTENSION_OPTIONS,
  TABLE_EXTENSION_CONFIG,
  MINIMAL_EXTENSION_OPTIONS,
  FULL_EXTENSION_OPTIONS,
  DEFAULT_EDITOR_CONFIGURATION,
  TABLE_TOOLBAR_CONFIG,
  getPresetConfiguration,
  createCustomConfiguration,
} from "./defaultConfigs";

// 核心类
export { ExtensionLoader } from "./ExtensionLoader";
export { PluginRegistry } from "./PluginRegistry";
export { ExtensionManager } from "./ExtensionManager";

// 导入类型用于内部使用
import type {
  EditorConfiguration,
  ExtensionOptions,
  ExtensionConfig,
  ToolbarButtonConfig,
  KeyboardShortcutConfig,
} from "./types";
import { ExtensionManager } from "./ExtensionManager";

/**
 * 快速创建扩展管理器实例
 */
export const createExtensionManager = async (
  config?: Partial<EditorConfiguration>
): Promise<ExtensionManager> => {
  const manager = ExtensionManager.getInstance();
  await manager.initialize(config);
  return manager;
};

/**
 * 扩展系统工具函数
 */
export const ExtensionUtils = {
  /**
   * 创建自定义工具栏按钮
   */
  createToolbarButton: (
    config: Partial<ToolbarButtonConfig>
  ): ToolbarButtonConfig => ({
    id: config.id || "custom-button",
    title: config.title || "Custom Button",
    icon: config.icon || "🔧",
    group: config.group || "custom",
    position: config.position || 100,
    onClick: config.onClick || (() => {}),
    isActive: config.isActive,
    isDisabled: config.isDisabled,
    shortcut: config.shortcut,
  }),

  /**
   * 创建自定义键盘快捷键
   */
  createKeyboardShortcut: (
    config: Partial<KeyboardShortcutConfig>
  ): KeyboardShortcutConfig => ({
    key: config.key || "Mod-k",
    handler: config.handler || (() => false),
    description: config.description || "Custom shortcut",
  }),

  /**
   * 验证扩展配置
   */
  validateExtensionConfig: (
    config: ExtensionConfig
  ): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!config.name) {
      errors.push("Extension name is required");
    }

    if (typeof config.enabled !== "boolean") {
      errors.push("Extension enabled property must be a boolean");
    }

    if (
      config.priority !== undefined &&
      (typeof config.priority !== "number" || config.priority < 0)
    ) {
      errors.push("Extension priority must be a non-negative number");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * 合并扩展配置
   */
  mergeExtensionConfigs: (
    base: ExtensionOptions,
    override: Partial<ExtensionOptions>
  ): ExtensionOptions => {
    const merged = { ...base };

    Object.entries(override).forEach(([key, value]) => {
      if (value && typeof value === "object" && "enabled" in value) {
        merged[key as keyof ExtensionOptions] = {
          ...merged[key as keyof ExtensionOptions],
          ...value,
        } as any;
      }
    });

    return merged;
  },

  /**
   * 获取扩展依赖关系
   */
  resolveDependencies: (configs: Record<string, ExtensionConfig>): string[] => {
    const resolved: string[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (name: string): void => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }

      visiting.add(name);
      const config = configs[name];

      if (config?.dependencies) {
        for (const dep of config.dependencies) {
          if (configs[dep]) {
            visit(dep);
          }
        }
      }

      visiting.delete(name);
      visited.add(name);
      resolved.push(name);
    };

    Object.keys(configs).forEach(visit);
    return resolved;
  },
};
