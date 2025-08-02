/**
 * TipTap 扩展动态加载器
 */

import type { Extension, Node, Mark } from "@tiptap/core";
import type { ExtensionLoadResult, ExtensionConfig } from "./types";

/**
 * 扩展加载器类
 * 负责动态加载和配置TipTap扩展
 */
export class ExtensionLoader {
  private static instance: ExtensionLoader;
  private loadedExtensions = new Map<string, Extension | Node | Mark>();
  private loadingPromises = new Map<string, Promise<ExtensionLoadResult>>();

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ExtensionLoader {
    if (!ExtensionLoader.instance) {
      ExtensionLoader.instance = new ExtensionLoader();
    }
    return ExtensionLoader.instance;
  }

  /**
   * 加载基础扩展 (StarterKit)
   */
  async loadStarterKit(
    options: Record<string, any> = {}
  ): Promise<ExtensionLoadResult> {
    const startTime = performance.now();

    try {
      const { default: StarterKit } = await import("@tiptap/starter-kit");
      const extension = StarterKit.configure(options);

      this.loadedExtensions.set("starterKit", extension);

      return {
        success: true,
        extension,
        loadTime: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load StarterKit: ${error}`,
        loadTime: performance.now() - startTime,
      };
    }
  }

  /**
   * 加载占位符扩展
   */
  async loadPlaceholder(
    options: Record<string, any> = {}
  ): Promise<ExtensionLoadResult> {
    const startTime = performance.now();

    try {
      const { default: Placeholder } = await import(
        "@tiptap/extension-placeholder"
      );
      const extension = Placeholder.configure(options);

      this.loadedExtensions.set("placeholder", extension);

      return {
        success: true,
        extension,
        loadTime: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load Placeholder: ${error}`,
        loadTime: performance.now() - startTime,
      };
    }
  }

  /**
   * 加载图片扩展
   */
  async loadImage(
    options: Record<string, any> = {}
  ): Promise<ExtensionLoadResult> {
    const startTime = performance.now();

    try {
      const { default: Image } = await import("@tiptap/extension-image");
      const extension = Image.configure(options);

      this.loadedExtensions.set("image", extension);

      return {
        success: true,
        extension,
        loadTime: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load Image: ${error}`,
        loadTime: performance.now() - startTime,
      };
    }
  }

  /**
   * 加载任务列表扩展
   */
  async loadTaskList(
    options: Record<string, any> = {}
  ): Promise<ExtensionLoadResult> {
    const startTime = performance.now();

    try {
      const { default: TaskList } = await import("@tiptap/extension-task-list");
      const extension = TaskList.configure(options);

      this.loadedExtensions.set("taskList", extension);

      return {
        success: true,
        extension,
        loadTime: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load TaskList: ${error}`,
        loadTime: performance.now() - startTime,
      };
    }
  }

  /**
   * 加载任务项扩展
   */
  async loadTaskItem(
    options: Record<string, any> = {}
  ): Promise<ExtensionLoadResult> {
    const startTime = performance.now();

    try {
      const { default: TaskItem } = await import("@tiptap/extension-task-item");
      const extension = TaskItem.configure(options);

      this.loadedExtensions.set("taskItem", extension);

      return {
        success: true,
        extension,
        loadTime: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load TaskItem: ${error}`,
        loadTime: performance.now() - startTime,
      };
    }
  }

  /**
   * 加载表格扩展 (新增)
   */
  async loadTable(
    options: Record<string, any> = {}
  ): Promise<ExtensionLoadResult> {
    const startTime = performance.now();

    try {
      const [{ Table }, { TableRow }, { TableCell }, { TableHeader }] =
        await Promise.all([
          import("@tiptap/extension-table"),
          import("@tiptap/extension-table-row"),
          import("@tiptap/extension-table-cell"),
          import("@tiptap/extension-table-header"),
        ]);

      // 配置表格扩展
      const tableExtension = Table.configure({
        resizable: true,
        handleWidth: 5,
        cellMinWidth: 25,
        ...options,
      });

      // 存储所有表格相关扩展
      this.loadedExtensions.set("table", tableExtension);
      this.loadedExtensions.set("tableRow", TableRow);
      this.loadedExtensions.set("tableCell", TableCell);
      this.loadedExtensions.set("tableHeader", TableHeader);

      return {
        success: true,
        extension: tableExtension,
        loadTime: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load Table extensions: ${error}`,
        loadTime: performance.now() - startTime,
      };
    }
  }

  /**
   * 加载代码块扩展
   */
  async loadCodeBlock(
    options: Record<string, any> = {}
  ): Promise<ExtensionLoadResult> {
    const startTime = performance.now();

    try {
      const { default: CodeBlock } = await import(
        "@tiptap/extension-code-block"
      );
      const extension = CodeBlock.configure(options);

      this.loadedExtensions.set("codeBlock", extension);

      return {
        success: true,
        extension,
        loadTime: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load CodeBlock: ${error}`,
        loadTime: performance.now() - startTime,
      };
    }
  }

  /**
   * 加载链接扩展
   */
  async loadLink(
    options: Record<string, any> = {}
  ): Promise<ExtensionLoadResult> {
    const startTime = performance.now();

    try {
      const { default: Link } = await import("@tiptap/extension-link");
      const extension = Link.configure(options);

      this.loadedExtensions.set("link", extension);

      return {
        success: true,
        extension,
        loadTime: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load Link: ${error}`,
        loadTime: performance.now() - startTime,
      };
    }
  }

  /**
   * 通用扩展加载方法
   */
  async loadExtension(
    name: string,
    config: ExtensionConfig
  ): Promise<ExtensionLoadResult> {
    // 防止重复加载
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name)!;
    }

    const loadPromise = this.doLoadExtension(name, config);
    this.loadingPromises.set(name, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.loadingPromises.delete(name);
    }
  }

  /**
   * 实际执行扩展加载
   */
  private async doLoadExtension(
    name: string,
    config: ExtensionConfig
  ): Promise<ExtensionLoadResult> {
    if (!config.enabled) {
      return {
        success: false,
        error: `Extension ${name} is disabled`,
      };
    }

    switch (name) {
      case "starterKit":
        return this.loadStarterKit(config.options);
      case "placeholder":
        return this.loadPlaceholder(config.options);
      case "image":
        return this.loadImage(config.options);
      case "taskList":
        return this.loadTaskList(config.options);
      case "taskItem":
        return this.loadTaskItem(config.options);
      case "table":
        return this.loadTable(config.options);
      case "codeBlock":
        return this.loadCodeBlock(config.options);
      case "link":
        return this.loadLink(config.options);
      default:
        return {
          success: false,
          error: `Unknown extension: ${name}`,
        };
    }
  }

  /**
   * 批量加载扩展
   */
  async loadExtensions(
    configs: Record<string, ExtensionConfig>
  ): Promise<(Extension | Node | Mark)[]> {
    const loadPromises = Object.entries(configs)
      .filter(([_, config]) => config.enabled)
      .sort(([_, a], [__, b]) => (a.priority || 100) - (b.priority || 100))
      .map(([name, config]) => this.loadExtension(name, config));

    const results = await Promise.all(loadPromises);
    const extensions: (Extension | Node | Mark)[] = [];

    for (const result of results) {
      if (result.success && result.extension) {
        extensions.push(result.extension);
      } else {
        console.warn("Failed to load extension:", result.error);
      }
    }

    // 对于表格功能，需要额外添加相关扩展
    if (configs.table?.enabled && this.loadedExtensions.has("table")) {
      const tableExtensions = [
        this.loadedExtensions.get("tableRow"),
        this.loadedExtensions.get("tableCell"),
        this.loadedExtensions.get("tableHeader"),
      ].filter(Boolean) as (Extension | Node | Mark)[];

      extensions.push(...tableExtensions);
    }

    return extensions;
  }

  /**
   * 获取已加载的扩展
   */
  getLoadedExtension(name: string): Extension | Node | Mark | undefined {
    return this.loadedExtensions.get(name);
  }

  /**
   * 获取所有已加载的扩展
   */
  getAllLoadedExtensions(): Map<string, Extension | Node | Mark> {
    return new Map(this.loadedExtensions);
  }

  /**
   * 清理加载的扩展
   */
  clear(): void {
    this.loadedExtensions.clear();
    this.loadingPromises.clear();
  }

  /**
   * 检查扩展是否已加载
   */
  isLoaded(name: string): boolean {
    return this.loadedExtensions.has(name);
  }

  /**
   * 获取加载统计信息
   */
  getLoadStats(): {
    totalLoaded: number;
    loadedExtensions: string[];
    pendingLoads: string[];
  } {
    return {
      totalLoaded: this.loadedExtensions.size,
      loadedExtensions: Array.from(this.loadedExtensions.keys()),
      pendingLoads: Array.from(this.loadingPromises.keys()),
    };
  }
}
