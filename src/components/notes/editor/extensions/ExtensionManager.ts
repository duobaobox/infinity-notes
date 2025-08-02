/**
 * TipTap 扩展管理器
 * 统一管理扩展加载和插件注册
 */

import type { Extension, Node, Mark } from "@tiptap/core";
import type { Editor } from "@tiptap/react";
import type {
  EditorConfiguration,
  EditorPlugin,
  ToolbarButtonConfig,
} from "./types";
import { ExtensionLoader } from "./ExtensionLoader";
import { PluginRegistry } from "./PluginRegistry";
import {
  DEFAULT_EDITOR_CONFIGURATION,
  TABLE_TOOLBAR_CONFIG,
  getPresetConfiguration,
} from "./defaultConfigs";

/**
 * 扩展管理器类
 * 提供统一的扩展和插件管理接口
 */
export class ExtensionManager {
  private static instance: ExtensionManager;
  private loader: ExtensionLoader;
  private registry: PluginRegistry;
  private configuration: EditorConfiguration;
  private initialized = false;

  private constructor() {
    this.loader = ExtensionLoader.getInstance();
    this.registry = PluginRegistry.getInstance();
    this.configuration = DEFAULT_EDITOR_CONFIGURATION;
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ExtensionManager {
    if (!ExtensionManager.instance) {
      ExtensionManager.instance = new ExtensionManager();
    }
    return ExtensionManager.instance;
  }

  /**
   * 初始化扩展管理器
   */
  async initialize(config?: Partial<EditorConfiguration>): Promise<void> {
    if (this.initialized) {
      console.warn("ExtensionManager is already initialized");
      return;
    }

    // 合并配置
    this.configuration = {
      ...DEFAULT_EDITOR_CONFIGURATION,
      ...config,
    };

    // 注册内置插件
    await this.registerBuiltinPlugins();

    this.initialized = true;
    console.log("✅ ExtensionManager initialized");
  }

  /**
   * 设置配置
   */
  setConfiguration(config: Partial<EditorConfiguration>): void {
    this.configuration = {
      ...this.configuration,
      ...config,
    };
  }

  /**
   * 获取配置
   */
  getConfiguration(): EditorConfiguration {
    return { ...this.configuration };
  }

  /**
   * 使用预设配置
   */
  usePreset(preset: "minimal" | "default" | "full"): void {
    this.configuration = getPresetConfiguration(preset);
  }

  /**
   * 加载所有扩展
   */
  async loadExtensions(): Promise<(Extension | Node | Mark)[]> {
    if (!this.configuration.extensions) {
      return [];
    }

    // 转换配置格式
    const extensionConfigs: Record<string, any> = {};

    Object.entries(this.configuration.extensions).forEach(([name, config]) => {
      if (config && typeof config === "object" && "enabled" in config) {
        extensionConfigs[name] = {
          name,
          enabled: config.enabled,
          options: config.options || {},
        };
      }
    });

    return this.loader.loadExtensions(extensionConfigs);
  }

  /**
   * 注册内置插件
   */
  private async registerBuiltinPlugins(): Promise<void> {
    const plugins: EditorPlugin[] = [];

    // 表格插件
    if (this.configuration.extensions?.table?.enabled) {
      plugins.push(this.createTablePlugin());
    }

    // 注册所有插件
    if (plugins.length > 0) {
      const result = this.registry.registerMultiple(plugins);
      if (!result.success) {
        console.warn("Some plugins failed to register:", result.failed);
      }
    }
  }

  /**
   * 创建表格插件
   */
  private createTablePlugin(): EditorPlugin {
    return {
      name: "table",
      version: "1.0.0",
      description: "表格编辑功能",
      extension: {} as Extension, // 实际扩展由loader提供
      toolbarButtons: this.createTableToolbarButtons(),
      keyboardShortcuts: [
        {
          key: "Mod-Alt-t",
          handler: (editor: Editor) => {
            return editor
              .chain()
              .focus()
              .insertTable({
                rows: 3,
                cols: 3,
                withHeaderRow: true,
              })
              .run();
          },
          description: "插入表格",
        },
      ],
      onInit: (_editor: Editor) => {
        console.log("Table plugin initialized");
      },
      priority: 10,
    };
  }

  /**
   * 创建表格工具栏按钮
   */
  private createTableToolbarButtons(): ToolbarButtonConfig[] {
    return [
      {
        ...TABLE_TOOLBAR_CONFIG.insertTable,
        onClick: (editor: Editor) => {
          editor
            .chain()
            .focus()
            .insertTable({
              rows: 3,
              cols: 3,
              withHeaderRow: true,
            })
            .run();
        },
        isDisabled: (editor: Editor) => !editor.can().insertTable(),
      },
      {
        ...TABLE_TOOLBAR_CONFIG.deleteTable,
        onClick: (editor: Editor) => {
          editor.chain().focus().deleteTable().run();
        },
        isActive: (editor: Editor) => editor.isActive("table"),
        isDisabled: (editor: Editor) => !editor.can().deleteTable(),
      },
      {
        ...TABLE_TOOLBAR_CONFIG.addColumnBefore,
        onClick: (editor: Editor) => {
          editor.chain().focus().addColumnBefore().run();
        },
        isDisabled: (editor: Editor) => !editor.can().addColumnBefore(),
      },
      {
        ...TABLE_TOOLBAR_CONFIG.addColumnAfter,
        onClick: (editor: Editor) => {
          editor.chain().focus().addColumnAfter().run();
        },
        isDisabled: (editor: Editor) => !editor.can().addColumnAfter(),
      },
      {
        ...TABLE_TOOLBAR_CONFIG.deleteColumn,
        onClick: (editor: Editor) => {
          editor.chain().focus().deleteColumn().run();
        },
        isDisabled: (editor: Editor) => !editor.can().deleteColumn(),
      },
      {
        ...TABLE_TOOLBAR_CONFIG.addRowBefore,
        onClick: (editor: Editor) => {
          editor.chain().focus().addRowBefore().run();
        },
        isDisabled: (editor: Editor) => !editor.can().addRowBefore(),
      },
      {
        ...TABLE_TOOLBAR_CONFIG.addRowAfter,
        onClick: (editor: Editor) => {
          editor.chain().focus().addRowAfter().run();
        },
        isDisabled: (editor: Editor) => !editor.can().addRowAfter(),
      },
      {
        ...TABLE_TOOLBAR_CONFIG.deleteRow,
        onClick: (editor: Editor) => {
          editor.chain().focus().deleteRow().run();
        },
        isDisabled: (editor: Editor) => !editor.can().deleteRow(),
      },
      {
        ...TABLE_TOOLBAR_CONFIG.mergeCells,
        onClick: (editor: Editor) => {
          editor.chain().focus().mergeCells().run();
        },
        isDisabled: (editor: Editor) => !editor.can().mergeCells(),
      },
      {
        ...TABLE_TOOLBAR_CONFIG.splitCell,
        onClick: (editor: Editor) => {
          editor.chain().focus().splitCell().run();
        },
        isDisabled: (editor: Editor) => !editor.can().splitCell(),
      },
      {
        ...TABLE_TOOLBAR_CONFIG.toggleHeaderColumn,
        onClick: (editor: Editor) => {
          editor.chain().focus().toggleHeaderColumn().run();
        },
        isActive: (editor: Editor) => editor.isActive("tableHeader"),
      },
      {
        ...TABLE_TOOLBAR_CONFIG.toggleHeaderRow,
        onClick: (editor: Editor) => {
          editor.chain().focus().toggleHeaderRow().run();
        },
        isActive: (editor: Editor) => editor.isActive("tableHeader"),
      },
    ];
  }

  /**
   * 获取工具栏按钮
   */
  getToolbarButtons(): ToolbarButtonConfig[] {
    return this.registry.getToolbarButtons();
  }

  /**
   * 初始化编辑器插件
   */
  initializeEditor(editor: Editor): void {
    this.registry.initializePlugins(editor);
  }

  /**
   * 销毁编辑器插件
   */
  destroyEditor(editor: Editor): void {
    this.registry.destroyPlugins(editor);
  }

  /**
   * 注册自定义插件
   */
  registerPlugin(plugin: EditorPlugin): boolean {
    return this.registry.register(plugin);
  }

  /**
   * 获取插件
   */
  getPlugin(name: string): EditorPlugin | undefined {
    return this.registry.getPlugin(name);
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): EditorPlugin[] {
    return this.registry.getAllPlugins();
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    extensions: ReturnType<ExtensionLoader["getLoadStats"]>;
    plugins: ReturnType<PluginRegistry["getStats"]>;
    configuration: EditorConfiguration;
  } {
    return {
      extensions: this.loader.getLoadStats(),
      plugins: this.registry.getStats(),
      configuration: this.configuration,
    };
  }

  /**
   * 验证配置
   */
  validateConfiguration(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // 检查插件依赖
    const dependencyCheck = this.registry.validateDependencies();
    if (!dependencyCheck.valid) {
      issues.push(...dependencyCheck.issues);
    }

    // 检查扩展配置
    if (this.configuration.extensions) {
      for (const [name, config] of Object.entries(
        this.configuration.extensions
      )) {
        if (config && config.enabled && !this.loader.isLoaded(name)) {
          issues.push(`Extension '${name}' is enabled but not loaded`);
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * 重置管理器
   */
  reset(): void {
    this.loader.clear();
    this.registry.clear();
    this.configuration = DEFAULT_EDITOR_CONFIGURATION;
    this.initialized = false;
  }

  /**
   * 热重载配置
   */
  async hotReload(config: Partial<EditorConfiguration>): Promise<void> {
    this.setConfiguration(config);

    // 重新加载扩展
    await this.loadExtensions();

    // 重新注册插件
    await this.registerBuiltinPlugins();

    console.log("🔄 Configuration hot reloaded");
  }
}
