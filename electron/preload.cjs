const { contextBridge, ipcRenderer } = require("electron");

// 暴露受保护的方法，允许渲染进程使用
contextBridge.exposeInMainWorld("electronAPI", {
  // 应用信息
  getVersion: () => ipcRenderer.invoke("app-version"),
  getAppPath: () => ipcRenderer.invoke("get-app-path"),

  // 应用设置
  getAppSettings: () => ipcRenderer.invoke("get-app-settings"),
  updateAppSettings: (settings) =>
    ipcRenderer.invoke("update-app-settings", settings),

  // 通知
  showNotification: (title, body, options) =>
    ipcRenderer.invoke("show-notification", title, body, options),

  // 窗口控制
  toggleWindow: () => ipcRenderer.invoke("toggle-window"),
  minimizeToTray: () => ipcRenderer.invoke("minimize-to-tray"),
  getWindowState: () => ipcRenderer.invoke("get-window-state"),
  restartApp: () => ipcRenderer.invoke("restart-app"),

  // 菜单事件监听
  onMenuAction: (callback) => {
    const menuEvents = [
      "menu-new-note",
      "menu-save",
      "menu-undo",
      "menu-redo",
      "menu-zoom-in",
      "menu-zoom-out",
      "menu-zoom-reset",
      "menu-settings",
    ];

    menuEvents.forEach((event) => {
      ipcRenderer.on(event, callback);
    });

    // 返回清理函数
    return () => {
      menuEvents.forEach((event) => {
        ipcRenderer.removeAllListeners(event);
      });
    };
  },

  // 移除监听器
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // 平台信息
  platform: process.platform,

  // 是否是开发环境
  isDev: process.env.NODE_ENV === "development",

  // Electron 特性检测
  isElectron: true,
});

// 在页面加载时设置一些全局变量
window.addEventListener("DOMContentLoaded", () => {
  // 标记这是 Electron 环境
  document.body.classList.add("electron-app");

  // 设置平台特定的样式
  document.body.classList.add(`platform-${process.platform}`);

  // 添加 Electron 版本信息到 body 数据属性
  document.body.setAttribute("data-electron", "true");
});
