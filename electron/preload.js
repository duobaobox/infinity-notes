const { contextBridge, ipcRenderer } = require("electron");

// 暴露受保护的方法，允许渲染进程使用
contextBridge.exposeInMainWorld("electronAPI", {
  // 应用信息
  getVersion: () => ipcRenderer.invoke("app-version"),
  getAppPath: () => ipcRenderer.invoke("get-app-path"),

  // 菜单事件监听
  onMenuAction: (callback) => {
    ipcRenderer.on("menu-new-note", callback);
    ipcRenderer.on("menu-save", callback);
    ipcRenderer.on("menu-undo", callback);
    ipcRenderer.on("menu-redo", callback);
    ipcRenderer.on("menu-zoom-in", callback);
    ipcRenderer.on("menu-zoom-out", callback);
    ipcRenderer.on("menu-zoom-reset", callback);
  },

  // 移除监听器
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // 平台信息
  platform: process.platform,

  // 是否是开发环境
  isDev: process.env.NODE_ENV === "development",
});

// 在页面加载时设置一些全局变量
window.addEventListener("DOMContentLoaded", () => {
  // 标记这是 Electron 环境
  document.body.classList.add("electron-app");

  // 设置平台特定的样式
  document.body.classList.add(`platform-${process.platform}`);
});
