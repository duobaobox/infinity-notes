// Electron API 类型定义
declare global {
  interface Window {
    electronAPI?: {
      // 应用信息
      getVersion: () => Promise<string>;
      getAppPath: () => Promise<string>;

      // 应用设置
      getAppSettings: () => Promise<{
        minimizeToTray: boolean;
        showNotifications: boolean;
        autoHideMenuBar: boolean;
      }>;
      updateAppSettings: (
        settings: Partial<{
          minimizeToTray: boolean;
          showNotifications: boolean;
          autoHideMenuBar: boolean;
        }>
      ) => Promise<{
        minimizeToTray: boolean;
        showNotifications: boolean;
        autoHideMenuBar: boolean;
      }>;

      // 通知
      showNotification: (
        title: string,
        body: string,
        options?: {
          silent?: boolean;
          timeoutType?: "default" | "never";
        }
      ) => Promise<void>;

      // 窗口控制
      toggleWindow: () => Promise<void>;
      minimizeToTray: () => Promise<void>;
      getWindowState: () => Promise<{
        isMaximized: boolean;
        isMinimized: boolean;
        isVisible: boolean;
        isFocused: boolean;
      } | null>;
      restartApp: () => Promise<void>;

      // 菜单事件监听
      onMenuAction: (callback: (event: any, data?: any) => void) => () => void;
      removeAllListeners: (channel: string) => void;

      // 平台信息
      platform: string;
      isDev: boolean;
      isElectron: boolean;
    };
  }
}

export {};
