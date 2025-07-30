const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";

// 保持对主窗口的全局引用
let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
      webSecurity: !isDev, // 开发环境允许跨域
    },
    icon: path.join(__dirname, "../public/icon.png"), // 应用窗口图标
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    show: false, // 先不显示，等内容加载完再显示
  });

  // 加载应用
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173/app.html");
    // 开发环境打开开发者工具
    mainWindow.webContents.openDevTools();
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

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
  createWindow();

  // 创建应用菜单
  createMenu();

  app.on("activate", () => {
    // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，
    // 通常会重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
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

// 在这个文件中，你可以包含应用特定的其他主进程代码
// 也可以将它们放在单独的文件中，然后在这里引入

// 创建应用菜单
function createMenu() {
  const template = [
    {
      label: "文件",
      submenu: [
        {
          label: "新建便签",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            mainWindow.webContents.send("menu-new-note");
          },
        },
        {
          label: "保存",
          accelerator: "CmdOrCtrl+S",
          click: () => {
            mainWindow.webContents.send("menu-save");
          },
        },
        { type: "separator" },
        {
          label: "退出",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "编辑",
      submenu: [
        {
          label: "撤销",
          accelerator: "CmdOrCtrl+Z",
          click: () => {
            mainWindow.webContents.send("menu-undo");
          },
        },
        {
          label: "重做",
          accelerator: "CmdOrCtrl+Y",
          click: () => {
            mainWindow.webContents.send("menu-redo");
          },
        },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
      ],
    },
    {
      label: "视图",
      submenu: [
        {
          label: "放大",
          accelerator: "CmdOrCtrl+Plus",
          click: () => {
            mainWindow.webContents.send("menu-zoom-in");
          },
        },
        {
          label: "缩小",
          accelerator: "CmdOrCtrl+-",
          click: () => {
            mainWindow.webContents.send("menu-zoom-out");
          },
        },
        {
          label: "重置缩放",
          accelerator: "CmdOrCtrl+0",
          click: () => {
            mainWindow.webContents.send("menu-zoom-reset");
          },
        },
        { type: "separator" },
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "窗口",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
    {
      label: "帮助",
      submenu: [
        {
          label: "关于",
          click: () => {
            shell.openExternal("https://github.com/duobaobox/infinity-notes");
          },
        },
      ],
    },
  ];

  // macOS 菜单调整
  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    });

    // 窗口菜单
    template[4].submenu = [
      { role: "close" },
      { role: "minimize" },
      { role: "zoom" },
      { type: "separator" },
      { role: "front" },
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC 处理程序
ipcMain.handle("app-version", () => {
  return app.getVersion();
});

ipcMain.handle("get-app-path", () => {
  return app.getAppPath();
});
