/**
 * TipTap 编辑器插件注册系统
 */

import type { Editor } from "@tiptap/react";
import type { Extension, Node, Mark } from "@tiptap/core";
import type {
  EditorPlugin,
  ToolbarButtonConfig,
  KeyboardShortcutConfig,
  PluginRegistrationResult,
} from "./types";

/**
 * 插件注册表类
 * 负责管理和注册编辑器插件
 */
export class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins = new Map<string, EditorPlugin>();
  private registeredPlugins = new Set<string>();

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  /**
   * 注册插件
   */
  register(plugin: EditorPlugin): boolean {
    try {
      // 检查依赖
      if (plugin.dependencies) {
        for (const dep of plugin.dependencies) {
          if (!this.plugins.has(dep)) {
            console.warn(
              `Plugin ${plugin.name} depends on ${dep}, but ${dep} is not registered`
            );
            return false;
          }
        }
      }

      this.plugins.set(plugin.name, plugin);
      console.log(`✅ Plugin registered: ${plugin.name}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to register plugin ${plugin.name}:`, error);
      return false;
    }
  }

  /**
   * 批量注册插件
   */
  registerMultiple(plugins: EditorPlugin[]): PluginRegistrationResult {
    const startTime = performance.now();
    const failed: { name: string; error: string }[] = [];
    let successCount = 0;

    // 按优先级排序
    const sortedPlugins = [...plugins].sort(
      (a, b) => (a.priority || 100) - (b.priority || 100)
    );

    for (const plugin of sortedPlugins) {
      try {
        if (this.register(plugin)) {
          successCount++;
        } else {
          failed.push({
            name: plugin.name,
            error: "Registration failed (check dependencies)",
          });
        }
      } catch (error) {
        failed.push({
          name: plugin.name,
          error: String(error),
        });
      }
    }

    return {
      success: failed.length === 0,
      count: successCount,
      failed: failed.length > 0 ? failed : undefined,
      registrationTime: performance.now() - startTime,
    };
  }

  /**
   * 获取插件
   */
  getPlugin(name: string): EditorPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): EditorPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取已注册的插件名称
   */
  getRegisteredPluginNames(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * 检查插件是否已注册
   */
  isRegistered(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * 获取所有扩展
   */
  getExtensions(): (Extension | Node | Mark)[] {
    return Array.from(this.plugins.values()).map((plugin) => plugin.extension);
  }

  /**
   * 获取工具栏按钮配置
   */
  getToolbarButtons(): ToolbarButtonConfig[] {
    const buttons: ToolbarButtonConfig[] = [];

    for (const plugin of this.plugins.values()) {
      if (plugin.toolbarButtons) {
        buttons.push(...plugin.toolbarButtons);
      }
    }

    // 按分组和位置排序
    return buttons.sort((a, b) => {
      const groupA = a.group || "default";
      const groupB = b.group || "default";

      if (groupA !== groupB) {
        return groupA.localeCompare(groupB);
      }

      const posA = a.position || 100;
      const posB = b.position || 100;
      return posA - posB;
    });
  }

  /**
   * 获取键盘快捷键配置
   */
  getKeyboardShortcuts(): KeyboardShortcutConfig[] {
    const shortcuts: KeyboardShortcutConfig[] = [];

    for (const plugin of this.plugins.values()) {
      if (plugin.keyboardShortcuts) {
        shortcuts.push(...plugin.keyboardShortcuts);
      }
    }

    return shortcuts;
  }

  /**
   * 初始化所有插件
   */
  initializePlugins(editor: Editor): void {
    for (const plugin of this.plugins.values()) {
      try {
        if (plugin.onInit) {
          plugin.onInit(editor);
        }
        this.registeredPlugins.add(plugin.name);
      } catch (error) {
        console.error(`Failed to initialize plugin ${plugin.name}:`, error);
      }
    }
  }

  /**
   * 销毁所有插件
   */
  destroyPlugins(editor: Editor): void {
    for (const plugin of this.plugins.values()) {
      try {
        if (plugin.onDestroy && this.registeredPlugins.has(plugin.name)) {
          plugin.onDestroy(editor);
        }
      } catch (error) {
        console.error(`Failed to destroy plugin ${plugin.name}:`, error);
      }
    }
    this.registeredPlugins.clear();
  }

  /**
   * 取消注册插件
   */
  unregister(name: string): boolean {
    if (this.plugins.has(name)) {
      this.plugins.delete(name);
      this.registeredPlugins.delete(name);
      console.log(`🗑️ Plugin unregistered: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * 清空所有插件
   */
  clear(): void {
    this.plugins.clear();
    this.registeredPlugins.clear();
  }

  /**
   * 获取插件统计信息
   */
  getStats(): {
    totalPlugins: number;
    initializedPlugins: number;
    pluginNames: string[];
    toolbarButtonCount: number;
    shortcutCount: number;
  } {
    return {
      totalPlugins: this.plugins.size,
      initializedPlugins: this.registeredPlugins.size,
      pluginNames: Array.from(this.plugins.keys()),
      toolbarButtonCount: this.getToolbarButtons().length,
      shortcutCount: this.getKeyboardShortcuts().length,
    };
  }

  /**
   * 验证插件依赖关系
   */
  validateDependencies(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    for (const [name, plugin] of this.plugins) {
      if (plugin.dependencies) {
        for (const dep of plugin.dependencies) {
          if (!this.plugins.has(dep)) {
            issues.push(
              `Plugin '${name}' depends on '${dep}', but '${dep}' is not registered`
            );
          }
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * 获取插件的依赖图
   */
  getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};

    for (const [name, plugin] of this.plugins) {
      graph[name] = plugin.dependencies || [];
    }

    return graph;
  }

  /**
   * 按依赖顺序排序插件
   */
  sortByDependencies(): EditorPlugin[] {
    const sorted: EditorPlugin[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (name: string): void => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected involving ${name}`);
      }

      visiting.add(name);
      const plugin = this.plugins.get(name);

      if (plugin && plugin.dependencies) {
        for (const dep of plugin.dependencies) {
          visit(dep);
        }
      }

      visiting.delete(name);
      visited.add(name);

      if (plugin) {
        sorted.push(plugin);
      }
    };

    for (const name of this.plugins.keys()) {
      visit(name);
    }

    return sorted;
  }
}
