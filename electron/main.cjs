const {
  app,
  BrowserWindow,
  // Menu, // 已屏蔽应用菜单
  ipcMain,
  shell,
  // Tray, // 已屏蔽系统托盘
  Notification,
  globalShortcut,
} = require("electron");
const path = require("path");

const isDev = process.env.NODE_ENV === "development";

// 保持对主窗口的全局引用
let mainWindow;
// 已屏蔽系统托盘功能
// let tray = null;
// let isQuitting = false;

// 初始化设置存储（延迟加载）
let store;
let Store;

// 确保只有一个应用实例运行
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // 当运行第二个实例时，聚焦到主窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.show();
    }
  });
}

// 初始化存储
function initStore() {
  try {
    Store = require("electron-store");
    store = new Store({
      defaults: {
        windowState: {
          width: 1200,
          height: 800,
          x: undefined,
          y: undefined,
          maximized: false,
        },
        settings: {
          minimizeToTray: true,
          showNotifications: true,
          autoHideMenuBar: false,
        },
      },
    });
  } catch (error) {
    console.warn("Failed to initialize electron-store:", error);
    // 回退到简单的内存存储
    store = {
      get: (key, defaultValue) => {
        switch (key) {
          case "windowState":
            return {
              width: 1200,
              height: 800,
              x: undefined,
              y: undefined,
              maximized: false,
            };
          case "settings.minimizeToTray":
            return true;
          case "settings.showNotifications":
            return true;
          case "settings":
            return {
              minimizeToTray: true,
              showNotifications: true,
              autoHideMenuBar: false,
            };
          default:
            return defaultValue;
        }
      },
      set: () => {}, // 无操作
    };
  }
}

function createWindow() {
  // 初始化存储
  initStore();

  // 恢复窗口状态
  const windowState = store.get("windowState");

  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800,
    minHeight: 600,
    show: false, // 延迟显示，等待内容加载
    autoHideMenuBar: true, // 自动隐藏菜单栏
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.cjs"),
      webSecurity: !isDev, // 开发环境允许跨域
    },
    icon: path.join(__dirname, "../public/icon.png"),
  });

  // 恢复最大化状态
  if (windowState.maximized) {
    mainWindow.maximize();
  }

  // 保存窗口状态
  const saveWindowState = () => {
    if (mainWindow.isDestroyed() || !store.set) return;

    const bounds = mainWindow.getBounds();
    const isMaximized = mainWindow.isMaximized();

    store.set("windowState", {
      ...bounds,
      maximized: isMaximized,
    });
  };

  // 监听窗口事件
  mainWindow.on("resize", saveWindowState);
  mainWindow.on("move", saveWindowState);
  mainWindow.on("maximize", saveWindowState);
  mainWindow.on("unmaximize", saveWindowState);

  // 窗口关闭事件处理 - 直接关闭应用，不使用系统托盘
  mainWindow.on("close", () => {
    saveWindowState();
    // 直接退出应用，不再使用系统托盘
    app.quit();
  });

  // 窗口最小化事件处理 - 保持默认行为
  mainWindow.on("minimize", () => {
    // 保持默认的最小化行为，不隐藏到托盘
  });

  // 准备好时显示窗口
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();

    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // 加载应用
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173/app.html");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/app.html"));
  }

  // 当窗口准备显示时
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();

    // 如果我们是开发环境并且窗口没有焦点，聚焦它
    if (isDev) {
      mainWindow.focus();
    }
  });

  // 当窗口被关闭时
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

// 系统托盘功能已被屏蔽
// function createTray() { ... }

// 显示系统通知
function showNotification(title, body, options = {}) {
  if (!store || !store.get("settings.showNotifications")) return;

  const notification = new Notification({
    title,
    body,
    icon: path.join(__dirname, "../public/icon.png"),
    silent: false,
    ...options,
  });

  notification.show();

  notification.on("click", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// 注册全局快捷键
function registerGlobalShortcuts() {
  // 全局快捷键：快速创建便签
  globalShortcut.register("CmdOrCtrl+Shift+N", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send("menu-new-note");
    }
  });

  // 全局快捷键：显示/隐藏窗口
  globalShortcut.register("CmdOrCtrl+Shift+I", () => {
    if (mainWindow) {
      if (mainWindow.isVisible() && mainWindow.isFocused()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
  createWindow();

  // 已屏蔽系统托盘功能
  // createTray();

  // 注册全局快捷键
  registerGlobalShortcuts();

  // 已屏蔽应用菜单功能
  // createMenu();

  app.on("activate", () => {
    // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，
    // 通常会重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

// 当所有窗口都被关闭时退出应用
app.on("window-all-closed", () => {
  // 在 macOS 上，应用通常会保持活跃状态，直到用户通过 Cmd + Q 明确退出
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// 应用即将退出时清理
app.on("before-quit", () => {
  isQuitting = true;
});

// 应用退出时注销全局快捷键
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// 在这个文件中，你可以包含应用特定的其他主进程代码
// 也可以将它们放在单独的文件中，然后在这里引入

// 应用菜单功能已被屏蔽
// function createMenu() { ... }

// IPC 处理程序
ipcMain.handle("app-version", () => {
  return app.getVersion();
});

ipcMain.handle("get-app-path", () => {
  return app.getAppPath();
});

// 获取应用设置
ipcMain.handle("get-app-settings", () => {
  return store
    ? store.get("settings")
    : { minimizeToTray: true, showNotifications: true, autoHideMenuBar: false };
});

// 更新应用设置
ipcMain.handle("update-app-settings", (event, settings) => {
  if (!store || !store.set) return settings;

  store.set("settings", { ...store.get("settings"), ...settings });
  return store.get("settings");
});

// 显示通知
ipcMain.handle("show-notification", (event, title, body, options) => {
  showNotification(title, body, options);
});

// 切换窗口显示状态
ipcMain.handle("toggle-window", () => {
  if (mainWindow) {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  }
});

// 托盘功能已被屏蔽
// ipcMain.handle("minimize-to-tray", () => { ... });

// 获取窗口状态
ipcMain.handle("get-window-state", () => {
  if (!mainWindow) return null;

  return {
    isMaximized: mainWindow.isMaximized(),
    isMinimized: mainWindow.isMinimized(),
    isVisible: mainWindow.isVisible(),
    isFocused: mainWindow.isFocused(),
  };
});

// 重启应用
ipcMain.handle("restart-app", () => {
  app.relaunch();
  app.exit();
});
