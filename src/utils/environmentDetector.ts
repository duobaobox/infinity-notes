/**
 * 环境检测工具
 * 用于检测当前运行环境（Electron客户端 vs 浏览器网页端）
 * 并提供相应的环境特定信息
 */

/**
 * 运行环境类型
 */
export const EnvironmentType = {
  ELECTRON: "electron", // Electron 客户端
  BROWSER: "browser", // 浏览器网页端
  UNKNOWN: "unknown", // 未知环境
} as const;

export type EnvironmentType =
  (typeof EnvironmentType)[keyof typeof EnvironmentType];

/**
 * 环境信息接口
 */
export interface EnvironmentInfo {
  type: EnvironmentType;
  isElectron: boolean;
  isBrowser: boolean;
  platform?: string;
  isDev: boolean;
  userAgent: string;
  storageDescription: string;
  dataLocationDescription: string;
}

/**
 * 环境检测器类
 */
class EnvironmentDetector {
  private static instance: EnvironmentDetector;
  private environmentInfo: EnvironmentInfo | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): EnvironmentDetector {
    if (!EnvironmentDetector.instance) {
      EnvironmentDetector.instance = new EnvironmentDetector();
    }
    return EnvironmentDetector.instance;
  }

  /**
   * 检测当前运行环境
   */
  detectEnvironment(): EnvironmentInfo {
    if (this.environmentInfo) {
      return this.environmentInfo;
    }

    // 检查是否在 Electron 环境中
    const isElectron = !!window.electronAPI?.isElectron;
    const isBrowser = !isElectron;

    // 确定环境类型
    const type = isElectron
      ? EnvironmentType.ELECTRON
      : EnvironmentType.BROWSER;

    // 获取平台信息
    const platform = window.electronAPI?.platform || "unknown";

    // 检查是否为开发环境
    const isDev =
      window.electronAPI?.isDev || process.env.NODE_ENV === "development";

    // 获取用户代理
    const userAgent = navigator.userAgent;

    // 生成存储描述
    const storageDescription = this.generateStorageDescription(isElectron);

    // 生成数据位置描述
    const dataLocationDescription =
      this.generateDataLocationDescription(isElectron);

    this.environmentInfo = {
      type,
      isElectron,
      isBrowser,
      platform,
      isDev,
      userAgent,
      storageDescription,
      dataLocationDescription,
    };

    console.log("🔍 环境检测结果:", this.environmentInfo);

    return this.environmentInfo;
  }

  /**
   * 生成存储方式描述
   */
  private generateStorageDescription(isElectron: boolean): string {
    if (isElectron) {
      return "本地文件系统 + IndexedDB";
    } else {
      return "浏览器本地 IndexedDB";
    }
  }

  /**
   * 生成数据位置描述
   */
  private generateDataLocationDescription(isElectron: boolean): string {
    if (isElectron) {
      return "客户端应用数据目录，可通过应用菜单查看具体路径";
    } else {
      return "浏览器数据目录，仅限当前浏览器访问";
    }
  }

  /**
   * 获取隐私安全描述
   */
  getPrivacyDescription(): string {
    const env = this.detectEnvironment();

    if (env.isElectron) {
      return "所有数据存储在您的设备本地文件系统中，配置信息使用 IndexedDB 存储，完全离线运行，绝对保护您的隐私安全";
    } else {
      return "所有数据存储在您的浏览器本地 IndexedDB 中，无需网络连接，完全保护您的隐私安全";
    }
  }

  /**
   * 获取特性描述（用于应用介绍）
   */
  getFeatureDescription(): string {
    const env = this.detectEnvironment();

    if (env.isElectron) {
      return "本地存储 - 客户端数据完全离线";
    } else {
      return "本地存储 - 浏览器数据保护隐私";
    }
  }

  /**
   * 检查是否为 Electron 环境
   */
  isElectron(): boolean {
    return this.detectEnvironment().isElectron;
  }

  /**
   * 检查是否为浏览器环境
   */
  isBrowser(): boolean {
    return this.detectEnvironment().isBrowser;
  }

  /**
   * 获取平台信息
   */
  getPlatform(): string {
    return this.detectEnvironment().platform || "unknown";
  }

  /**
   * 检查是否为开发环境
   */
  isDevelopment(): boolean {
    return this.detectEnvironment().isDev;
  }

  /**
   * 重置环境信息（用于测试）
   */
  reset(): void {
    this.environmentInfo = null;
  }
}

// 导出单例实例
export const environmentDetector = EnvironmentDetector.getInstance();

// 导出便捷函数
export const isElectronEnvironment = () => environmentDetector.isElectron();
export const isBrowserEnvironment = () => environmentDetector.isBrowser();
export const getEnvironmentInfo = () => environmentDetector.detectEnvironment();
export const getStorageDescription = () =>
  environmentDetector.detectEnvironment().storageDescription;
export const getDataLocationDescription = () =>
  environmentDetector.detectEnvironment().dataLocationDescription;
export const getPrivacyDescription = () =>
  environmentDetector.getPrivacyDescription();
export const getFeatureDescription = () =>
  environmentDetector.getFeatureDescription();
