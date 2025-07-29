// UI状态管理Store
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { IndexedDBUISettingsStorage } from "../database/IndexedDBUISettingsStorage";

// 模态框状态接口
export interface ModalState {
  settingsModalOpen: boolean;
  settingsDefaultTab: string;
}

// 主题状态接口
export interface ThemeState {
  theme: "light" | "dark" | "auto";
  isDarkMode: boolean;
}

// 外观设置状态接口
export interface AppearanceState {
  canvasBackground: string;
  gridVisible: boolean;
  gridSize: number;
  gridColor: string;
  gridMajorColor: string;
  // 便签默认尺寸设置
  manualNoteDefaultWidth: number; // 手动便签默认宽度
  manualNoteDefaultHeight: number; // 手动便签默认高度
  aiNoteDefaultWidth: number; // AI便签默认宽度
  aiNoteDefaultHeight: number; // AI便签默认高度
}

// 基础设置状态接口
export interface BasicSettingsState {
  showThinkingMode: boolean; // 是否显示思维模式
}

// UI状态接口
export interface UIState {
  // 模态框状态
  modals: ModalState;

  // 主题状态
  theme: ThemeState;

  // 外观设置状态
  appearance: AppearanceState;

  // 基础设置状态
  basicSettings: BasicSettingsState;

  // 侧边栏状态
  sidebarCollapsed: boolean;
  sidebarVisible: boolean;

  // 工具栏状态
  toolbarVisible: boolean;

  // 加载状态
  globalLoading: boolean;

  // 快捷键状态
  shortcutsEnabled: boolean;
}

// UI操作接口
export interface UIActions {
  // 应用外观设置到DOM
  applyAppearanceSettings: () => void;
  // 模态框操作
  openSettingsModal: (defaultTab?: string) => void;
  closeSettingsModal: () => void;

  // 主题操作
  setTheme: (theme: ThemeState["theme"]) => void;
  toggleTheme: () => void;

  // 外观设置操作
  setAppearance: (appearance: Partial<AppearanceState>) => void;
  updateCanvasBackground: (color: string) => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;

  // 便签尺寸设置操作
  setNoteDefaultSize: (
    type: "manual" | "ai",
    width: number,
    height: number
  ) => void;
  setManualNoteDefaultSize: (width: number, height: number) => void;
  setAINoteDefaultSize: (width: number, height: number) => void;
  resetNoteDefaultSizes: () => void; // 重置便签尺寸到默认值

  applyPresetTheme: (themeId: string) => void;
  getCurrentTheme: () => PresetTheme | null; // 获取当前选中的主题

  // 基础设置操作
  setBasicSettings: (settings: Partial<BasicSettingsState>) => void;
  toggleThinkingMode: () => void;

  // 侧边栏操作
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // 工具栏操作
  toggleToolbar: () => void;
  setToolbarVisible: (visible: boolean) => void;

  // 全局加载状态
  setGlobalLoading: (loading: boolean) => void;

  // 快捷键操作
  toggleShortcuts: () => void;
  setShortcutsEnabled: (enabled: boolean) => void;
  // 初始化
  initialize: () => Promise<void>;
}

// 便签默认尺寸常量
export const DEFAULT_NOTE_SIZES = {
  manualNoteDefaultWidth: 330, // 手动便签默认宽度
  manualNoteDefaultHeight: 290, // 手动便签默认高度
  aiNoteDefaultWidth: 380, // AI便签默认宽度
  aiNoteDefaultHeight: 330, // AI便签默认高度
} as const;

// 预制主题配置
export interface PresetTheme {
  id: string;
  name: string;
  description: string;
  icon: string;
  colors: {
    canvasBackground: string;
    gridColor: string;
    gridMajorColor: string;
  };
}

export const PRESET_THEMES: PresetTheme[] = [
  {
    id: "classic",
    name: "经典白",
    description: "简洁清爽的经典白色主题",
    icon: "🤍",
    colors: {
      canvasBackground: "#ffffff",
      gridColor: "#f5f5f5",
      gridMajorColor: "#ebebeb",
    },
  },
  {
    id: "graphite",
    name: "石墨灰",
    description: "苹果风格的高级石墨灰主题",
    icon: "⚫",
    colors: {
      canvasBackground: "#f5f6f7",
      gridColor: "#eaebec",
      gridMajorColor: "#e0e1e2",
    },
  },
  {
    id: "silver",
    name: "银白色",
    description: "优雅的银白色专业主题",
    icon: "⚪",
    colors: {
      canvasBackground: "#f8f9fa",
      gridColor: "#eef0f2",
      gridMajorColor: "#e4e6e8",
    },
  },
  {
    id: "sage",
    name: "鼠尾草",
    description: "温和的鼠尾草绿色主题",
    icon: "🌿",
    colors: {
      canvasBackground: "#f6f9f7",
      gridColor: "#e8efe9",
      gridMajorColor: "#dae6db",
    },
  },
  {
    id: "sky",
    name: "天空蓝",
    description: "清淡的天空蓝色主题",
    icon: "☁️",
    colors: {
      canvasBackground: "#f7fafd",
      gridColor: "#e9f2f7",
      gridMajorColor: "#dbe9f3",
    },
  },
  {
    id: "sand",
    name: "沙漠色",
    description: "温暖的沙漠米色主题",
    icon: "🏜️",
    colors: {
      canvasBackground: "#fcf9f3",
      gridColor: "#f3e9d7",
      gridMajorColor: "#ead6b9",
    },
  },
  {
    id: "midnight",
    name: "午夜蓝",
    description: "深邃的午夜蓝色主题",
    icon: "🌙",
    colors: {
      canvasBackground: "#1a1f2b",
      gridColor: "#252b39",
      gridMajorColor: "#2f374a",
    },
  },
  {
    id: "paper",
    name: "纸质感",
    description: "温暖的纸质纹理主题",
    icon: "📄",
    colors: {
      canvasBackground: "#fdfbf7",
      gridColor: "#f5f2ea",
      gridMajorColor: "#ece7db",
    },
  },
];

// 生成唯一ID

// 检测系统主题
const getSystemTheme = (): boolean => {
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
};

// 创建UI Store
export const useUIStore = create<UIState & UIActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // 初始状态
      modals: {
        settingsModalOpen: false,
        settingsDefaultTab: "appearance",
      },
      theme: {
        theme: "auto",
        isDarkMode: getSystemTheme(),
      },
      appearance: {
        canvasBackground: "#ffffff", // 默认使用经典白主题
        gridVisible: true,
        gridSize: 10,
        gridColor: "#f5f5f5", // 默认使用经典白主题的网格颜色
        gridMajorColor: "#ebebeb", // 默认使用经典白主题的主网格颜色
        // 便签默认尺寸设置
        ...DEFAULT_NOTE_SIZES,
      },
      basicSettings: {
        showThinkingMode: false, // 默认关闭思维模式显示
      },

      sidebarCollapsed: true, // 默认折叠，将从持久化存储中加载
      sidebarVisible: true,
      toolbarVisible: true,
      globalLoading: false,
      shortcutsEnabled: true,

      // 模态框操作

      openSettingsModal: (defaultTab = "appearance") => {
        set((state) => ({
          modals: {
            ...state.modals,
            settingsModalOpen: true,
            settingsDefaultTab: defaultTab,
          },
        }));
      },

      closeSettingsModal: () => {
        set((state) => ({
          modals: { ...state.modals, settingsModalOpen: false },
        }));
      },

      // 主题操作
      setTheme: (theme) => {
        let isDarkMode = false;

        if (theme === "dark") {
          isDarkMode = true;
        } else if (theme === "light") {
          isDarkMode = false;
        } else {
          isDarkMode = getSystemTheme();
        }
        set((state) => ({
          theme: { ...state.theme, theme, isDarkMode },
        }));

        // 保存到IndexedDB
        if (typeof window !== "undefined") {
          const themeSettings = { theme, isDarkMode };
          IndexedDBUISettingsStorage.saveThemeSettings(themeSettings).catch(
            (error) => {
              console.error("保存主题设置失败:", error);
            }
          );
        }
      },

      toggleTheme: () => {
        const currentTheme = get().theme.theme;
        const newTheme = currentTheme === "light" ? "dark" : "light";
        get().setTheme(newTheme);
      }, // 外观设置操作
      setAppearance: (appearance) => {
        set((state) => ({
          appearance: { ...state.appearance, ...appearance },
        }));

        // 保存到IndexedDB
        if (typeof window !== "undefined") {
          const currentAppearance = get().appearance;
          IndexedDBUISettingsStorage.saveAppearanceSettings(
            currentAppearance
          ).catch((error) => {
            console.error("保存外观设置失败:", error);
          });

          // 立即应用画布背景色和网格设置
          get().applyAppearanceSettings();
        }
      },

      updateCanvasBackground: (color) => {
        get().setAppearance({ canvasBackground: color });
      },

      toggleGrid: () => {
        const currentVisible = get().appearance.gridVisible;
        get().setAppearance({ gridVisible: !currentVisible });
      },

      setGridSize: (size) => {
        get().setAppearance({ gridSize: size });
      },

      // 便签尺寸设置操作
      setNoteDefaultSize: (type, width, height) => {
        if (type === "manual") {
          get().setAppearance({
            manualNoteDefaultWidth: width,
            manualNoteDefaultHeight: height,
          });
        } else {
          get().setAppearance({
            aiNoteDefaultWidth: width,
            aiNoteDefaultHeight: height,
          });
        }
      },

      setManualNoteDefaultSize: (width, height) => {
        get().setAppearance({
          manualNoteDefaultWidth: width,
          manualNoteDefaultHeight: height,
        });
      },

      setAINoteDefaultSize: (width, height) => {
        get().setAppearance({
          aiNoteDefaultWidth: width,
          aiNoteDefaultHeight: height,
        });
      },

      resetNoteDefaultSizes: () => {
        get().setAppearance({
          ...DEFAULT_NOTE_SIZES,
        });
      },

      // 应用预制主题
      applyPresetTheme: (themeId) => {
        const theme = PRESET_THEMES.find((t) => t.id === themeId);
        if (!theme) {
          console.warn(`⚠️ 未找到主题: ${themeId}`);
          return false;
        }

        // 获取当前外观设置，保留非颜色相关的设置
        const currentAppearance = get().appearance;

        // 创建新的外观设置，只更新颜色相关的属性
        const newAppearance: AppearanceState = {
          ...currentAppearance,
          canvasBackground: theme.colors.canvasBackground,
          gridColor: theme.colors.gridColor,
          gridMajorColor: theme.colors.gridMajorColor,
        }; // 直接更新状态，不通过setAppearance避免重复保存
        set(() => ({
          appearance: newAppearance,
        }));

        // 保存到IndexedDB
        if (typeof window !== "undefined") {
          IndexedDBUISettingsStorage.saveAppearanceSettings(
            newAppearance
          ).catch((error) => {
            console.error("保存预设主题失败:", error);
          });
        }

        // 立即应用到DOM
        get().applyAppearanceSettings();

        return true;
      },

      // 获取当前选中的主题
      getCurrentTheme: () => {
        const { appearance } = get();
        // 根据当前画布背景色查找匹配的主题
        return (
          PRESET_THEMES.find(
            (theme) =>
              theme.colors.canvasBackground === appearance.canvasBackground
          ) || null
        );
      },

      // 应用外观设置到DOM
      applyAppearanceSettings: () => {
        const { appearance } = get();
        const container = document.querySelector(
          ".infinite-canvas-container"
        ) as HTMLElement;

        if (container) {
          // 应用画布背景色
          container.style.setProperty(
            "--canvas-background",
            appearance.canvasBackground
          );

          // 应用网格设置 - 确保大网格是小网格的整数倍
          const smallGridSize = appearance.gridSize;
          const largeGridSize = smallGridSize * 5; // 大网格是小网格的5倍，确保对齐

          container.style.setProperty(
            "--grid-visible",
            appearance.gridVisible ? "1" : "0"
          );
          container.style.setProperty(
            "--small-grid-size",
            `${smallGridSize}px`
          );
          container.style.setProperty(
            "--large-grid-size",
            `${largeGridSize}px`
          );

          // 应用网格颜色
          container.style.setProperty(
            "--small-grid-color",
            appearance.gridColor
          );
          container.style.setProperty(
            "--large-grid-color",
            appearance.gridMajorColor
          );
        }
      },

      // 基础设置操作
      setBasicSettings: (settings) => {
        set((state) => ({
          basicSettings: { ...state.basicSettings, ...settings },
        }));

        // 保存到IndexedDB
        if (typeof window !== "undefined") {
          const currentBasicSettings = get().basicSettings;
          IndexedDBUISettingsStorage.saveBasicSettings(
            currentBasicSettings
          ).catch((error) => {
            console.error("保存基础设置失败:", error);
          });
        }
      },

      toggleThinkingMode: () => {
        const currentSettings = get().basicSettings;
        get().setBasicSettings({
          showThinkingMode: !currentSettings.showThinkingMode,
        });
      },

      // 侧边栏操作
      toggleSidebar: () => {
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        }));
      },

      setSidebarVisible: (visible) => {
        set({ sidebarVisible: visible });
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });

        // 使用防抖延迟保存，避免频繁的数据库操作造成卡顿
        if (typeof window !== "undefined") {
          // 清除之前的定时器
          if ((window as any).__sidebarSaveTimeout) {
            clearTimeout((window as any).__sidebarSaveTimeout);
          }

          // 设置新的防抖定时器
          (window as any).__sidebarSaveTimeout = setTimeout(() => {
            const currentState = get();
            const layoutSettings = {
              sidebarCollapsed: collapsed,
              sidebarVisible: currentState.sidebarVisible,
              toolbarVisible: currentState.toolbarVisible,
            };
            IndexedDBUISettingsStorage.saveUILayoutSettings(
              layoutSettings
            ).catch((error) => {
              console.error("保存UI布局设置失败:", error);
            });
          }, 100); // 100ms防抖，减少频繁操作
        }
      },

      // 工具栏操作
      toggleToolbar: () => {
        set((state) => ({
          toolbarVisible: !state.toolbarVisible,
        }));
      },

      setToolbarVisible: (visible) => {
        set({ toolbarVisible: visible });
      },

      // 全局加载状态
      setGlobalLoading: (loading) => {
        set({ globalLoading: loading });
      },

      // 快捷键操作
      toggleShortcuts: () => {
        set((state) => ({
          shortcutsEnabled: !state.shortcutsEnabled,
        }));
      },

      setShortcutsEnabled: (enabled) => {
        set({ shortcutsEnabled: enabled });
      }, // 初始化
      initialize: async () => {
        if (typeof window !== "undefined") {
          try {
            // 首先执行数据迁移（从localStorage迁移到IndexedDB）
            await IndexedDBUISettingsStorage.migrateFromLocalStorage();

            // 从IndexedDB加载主题设置
            const savedTheme =
              await IndexedDBUISettingsStorage.loadThemeSettings();
            if (savedTheme) {
              set((state) => ({
                theme: { ...state.theme, ...savedTheme },
              }));
            }

            // 从IndexedDB加载外观设置
            const savedAppearance =
              await IndexedDBUISettingsStorage.loadAppearanceSettings();
            if (savedAppearance) {
              set((state) => ({
                appearance: { ...state.appearance, ...savedAppearance },
              }));
            }

            // 从IndexedDB加载UI布局设置
            const savedLayout =
              await IndexedDBUISettingsStorage.loadUILayoutSettings();
            if (savedLayout) {
              set((_state) => ({
                sidebarCollapsed: savedLayout.sidebarCollapsed,
                sidebarVisible: savedLayout.sidebarVisible,
                toolbarVisible: savedLayout.toolbarVisible,
              }));
              console.log("✅ UI布局设置加载成功:", savedLayout);
            }

            // 从IndexedDB加载基础设置
            const savedBasicSettings =
              await IndexedDBUISettingsStorage.loadBasicSettings();
            if (savedBasicSettings) {
              set((state) => ({
                basicSettings: {
                  ...state.basicSettings,
                  ...savedBasicSettings,
                },
              }));
              console.log("✅ 基础设置加载成功:", savedBasicSettings);
            }

            // 应用外观设置到DOM
            setTimeout(() => {
              get().applyAppearanceSettings();
            }, 100);

            console.log("✅ UI设置初始化完成");
          } catch (error) {
            console.error("UI设置初始化失败:", error);

            // 如果IndexedDB加载失败，回退到localStorage
            console.warn("回退到localStorage加载设置");

            const savedTheme = localStorage.getItem(
              "ui-theme"
            ) as ThemeState["theme"];
            if (savedTheme && ["light", "dark", "auto"].includes(savedTheme)) {
              get().setTheme(savedTheme);
            }

            const savedAppearance = localStorage.getItem("ui-appearance");
            if (savedAppearance) {
              try {
                const appearance = JSON.parse(
                  savedAppearance
                ) as AppearanceState;
                set((state) => ({
                  appearance: { ...state.appearance, ...appearance },
                }));
              } catch (error) {
                console.warn("加载外观设置失败:", error);
              }
            }
          }

          // 监听系统主题变化
          const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
          const handleThemeChange = () => {
            const currentTheme = get().theme.theme;
            if (currentTheme === "auto") {
              set((state) => ({
                theme: { ...state.theme, isDarkMode: mediaQuery.matches },
              }));
            }
          };

          mediaQuery.addEventListener("change", handleThemeChange);

          // 在这里我们不返回清理函数，而是将其存储到store中
          // 或者使用其他方式管理清理
        }
      },
    })),
    {
      name: "ui-store", // DevTools中的名称
    }
  )
);

// 设置全局引用，供其他模块使用（避免循环依赖）
if (typeof window !== "undefined") {
  (window as any).__uiStore = useUIStore;
}
