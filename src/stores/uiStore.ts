// UI状态管理Store
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// 模态框状态接口
export interface ModalState {
  searchModalOpen: boolean;
  settingsModalOpen: boolean;
  settingsDefaultTab: string;
}

// 搜索状态接口
export interface SearchState {
  searchQuery: string;
  searchResults: Array<{
    id: string;
    title: string;
    content: string;
    relevance: number;
  }>;
  isSearching: boolean;
}

// 通知状态接口
export interface NotificationState {
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    timestamp: Date;
  }>;
}

// 主题状态接口
export interface ThemeState {
  theme: 'light' | 'dark' | 'auto';
  isDarkMode: boolean;
}

// 外观设置状态接口
export interface AppearanceState {
  canvasBackground: string;
  gridVisible: boolean;
  gridSize: number;
  gridColor: string;
  gridMajorColor: string;
  noteDefaultColor: string;
  fontSize: number;
  fontFamily: string;
}

// 通用设置状态接口
export interface GeneralState {
  autoSave: boolean;
  language: string;
  saveInterval: number;
  username: string;
  email: string;
}

// UI状态接口
export interface UIState {
  // 模态框状态
  modals: ModalState;
  
  // 搜索状态
  search: SearchState;
  
  // 通知状态
  notifications: NotificationState;
  
  // 主题状态
  theme: ThemeState;

  // 外观设置状态
  appearance: AppearanceState;

  // 通用设置状态
  general: GeneralState;

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
  openSearchModal: () => void;
  closeSearchModal: () => void;
  openSettingsModal: (defaultTab?: string) => void;
  closeSettingsModal: () => void;
  
  // 搜索操作
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchState['searchResults']) => void;
  setSearching: (isSearching: boolean) => void;
  clearSearch: () => void;
  
  // 通知操作
  addNotification: (notification: Omit<NotificationState['notifications'][0], 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // 主题操作
  setTheme: (theme: ThemeState['theme']) => void;
  toggleTheme: () => void;

  // 外观设置操作
  setAppearance: (appearance: Partial<AppearanceState>) => void;
  updateCanvasBackground: (color: string) => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  setNoteDefaultColor: (color: string) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  applyPresetTheme: (themeId: string) => void;

  // 通用设置操作
  setGeneral: (general: Partial<GeneralState>) => void;
  toggleAutoSave: () => void;
  setLanguage: (language: string) => void;
  setSaveInterval: (interval: number) => void;
  setUserInfo: (username: string, email: string) => void;

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
  initialize: () => void;
}

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
    noteDefaultColor: string;
  };
}

export const PRESET_THEMES: PresetTheme[] = [
  {
    id: 'classic',
    name: '经典白',
    description: '简洁清爽的经典白色主题',
    icon: '🤍',
    colors: {
      canvasBackground: '#ffffff',
      gridColor: '#f5f5f5',
      gridMajorColor: '#ebebeb',
      noteDefaultColor: '#fffbf0',
    }
  },
  {
    id: 'graphite',
    name: '石墨灰',
    description: '苹果风格的高级石墨灰主题',
    icon: '⚫',
    colors: {
      canvasBackground: '#f5f6f7',
      gridColor: '#eaebec',
      gridMajorColor: '#e0e1e2',
      noteDefaultColor: '#f8f9fa',
    }
  },
  {
    id: 'silver',
    name: '银白色',
    description: '优雅的银白色专业主题',
    icon: '⚪',
    colors: {
      canvasBackground: '#f8f9fa',
      gridColor: '#eef0f2',
      gridMajorColor: '#e4e6e8',
      noteDefaultColor: '#f0f2f5',
    }
  },
  {
    id: 'sage',
    name: '鼠尾草',
    description: '温和的鼠尾草绿色主题',
    icon: '🌿',
    colors: {
      canvasBackground: '#f6f9f7',
      gridColor: '#e8efe9',
      gridMajorColor: '#dae6db',
      noteDefaultColor: '#f0f7f1',
    }
  },
  {
    id: 'sky',
    name: '天空蓝',
    description: '清淡的天空蓝色主题',
    icon: '☁️',
    colors: {
      canvasBackground: '#f7fafd',
      gridColor: '#e9f2f7',
      gridMajorColor: '#dbe9f3',
      noteDefaultColor: '#edf5fc',
    }
  },
  {
    id: 'sand',
    name: '沙漠色',
    description: '温暖的沙漠米色主题',
    icon: '🏜️',
    colors: {
      canvasBackground: '#fcf9f3',
      gridColor: '#f3e9d7',
      gridMajorColor: '#ead6b9',
      noteDefaultColor: '#fff5e6',
    }
  },
  {
    id: 'midnight',
    name: '午夜蓝',
    description: '深邃的午夜蓝色主题',
    icon: '🌙',
    colors: {
      canvasBackground: '#1a1f2b',
      gridColor: '#252b39',
      gridMajorColor: '#2f374a',
      noteDefaultColor: '#f0f2f5',
    }
  },
  {
    id: 'paper',
    name: '纸质感',
    description: '温暖的纸质纹理主题',
    icon: '📄',
    colors: {
      canvasBackground: '#fdfbf7',
      gridColor: '#f5f2ea',
      gridMajorColor: '#ece7db',
      noteDefaultColor: '#fffbf0'
    }
  }
];

// 生成唯一ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 检测系统主题
const getSystemTheme = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

// 创建UI Store
export const useUIStore = create<UIState & UIActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // 初始状态
      modals: {
        searchModalOpen: false,
        settingsModalOpen: false,
        settingsDefaultTab: 'general',
      },
      search: {
        searchQuery: '',
        searchResults: [],
        isSearching: false,
      },
      notifications: {
        notifications: [],
      },
      theme: {
        theme: 'auto',
        isDarkMode: getSystemTheme(),
      },
      appearance: {
        canvasBackground: '#ffffff',
        gridVisible: true,
        gridSize: 20,
        gridColor: '#e2e8f0',
        gridMajorColor: '#cbd5e1',
        noteDefaultColor: '#fef3c7',
        fontSize: 14,
        fontFamily: 'system-ui',
      },
      general: {
        autoSave: true,
        language: 'zh-CN',
        saveInterval: 30,
        username: '用户名称',
        email: 'user@example.com',
      },
      sidebarCollapsed: false,
      sidebarVisible: true,
      toolbarVisible: true,
      globalLoading: false,
      shortcutsEnabled: true,

      // 模态框操作
      openSearchModal: () => {
        set(state => ({
          modals: { ...state.modals, searchModalOpen: true }
        }));
      },

      closeSearchModal: () => {
        set(state => ({
          modals: { ...state.modals, searchModalOpen: false }
        }));
        // 关闭时清空搜索
        get().clearSearch();
      },

      openSettingsModal: (defaultTab = 'general') => {
        set(state => ({
          modals: { 
            ...state.modals, 
            settingsModalOpen: true,
            settingsDefaultTab: defaultTab
          }
        }));
      },

      closeSettingsModal: () => {
        set(state => ({
          modals: { ...state.modals, settingsModalOpen: false }
        }));
      },

      // 搜索操作
      setSearchQuery: (query) => {
        set(state => ({
          search: { ...state.search, searchQuery: query }
        }));
      },

      setSearchResults: (results) => {
        set(state => ({
          search: { ...state.search, searchResults: results }
        }));
      },

      setSearching: (isSearching) => {
        set(state => ({
          search: { ...state.search, isSearching }
        }));
      },

      clearSearch: () => {
        set(state => ({
          search: {
            ...state.search,
            searchQuery: '',
            searchResults: [],
            isSearching: false,
          }
        }));
      },

      // 通知操作
      addNotification: (notification) => {
        const id = generateId();
        const newNotification = {
          ...notification,
          id,
          timestamp: new Date(),
        };
        
        set(state => ({
          notifications: {
            notifications: [...state.notifications.notifications, newNotification]
          }
        }));
        
        // 自动移除通知（如果设置了duration）
        if (notification.duration && notification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration);
        }
        
        return id;
      },

      removeNotification: (id) => {
        set(state => ({
          notifications: {
            notifications: state.notifications.notifications.filter(n => n.id !== id)
          }
        }));
      },

      clearNotifications: () => {
        set(_state => ({
          notifications: { notifications: [] }
        }));
      },

      // 主题操作
      setTheme: (theme) => {
        let isDarkMode = false;
        
        if (theme === 'dark') {
          isDarkMode = true;
        } else if (theme === 'light') {
          isDarkMode = false;
        } else {
          isDarkMode = getSystemTheme();
        }
        
        set(state => ({
          theme: { ...state.theme, theme, isDarkMode }
        }));
        
        // 保存到localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('ui-theme', theme);
        }
      },

      toggleTheme: () => {
        const currentTheme = get().theme.theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },

      // 外观设置操作
      setAppearance: (appearance) => {
        set(state => ({
          appearance: { ...state.appearance, ...appearance }
        }));

        // 保存到localStorage
        if (typeof window !== 'undefined') {
          const currentAppearance = get().appearance;
          localStorage.setItem('ui-appearance', JSON.stringify(currentAppearance));

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

      setNoteDefaultColor: (color) => {
        get().setAppearance({ noteDefaultColor: color });
      },

      setFontSize: (size) => {
        get().setAppearance({ fontSize: size });
      },

      setFontFamily: (family) => {
        get().setAppearance({ fontFamily: family });
      },

      // 通用设置操作
      setGeneral: (general) => {
        set(state => ({
          general: { ...state.general, ...general }
        }));

        // 保存到localStorage
        if (typeof window !== 'undefined') {
          const currentGeneral = get().general;
          localStorage.setItem('ui-general', JSON.stringify(currentGeneral));
        }
      },

      toggleAutoSave: () => {
        const currentAutoSave = get().general.autoSave;
        get().setGeneral({ autoSave: !currentAutoSave });
      },

      setLanguage: (language) => {
        get().setGeneral({ language });
      },

      setSaveInterval: (interval) => {
        get().setGeneral({ saveInterval: interval });
      },

      setUserInfo: (username, email) => {
        get().setGeneral({ username, email });
      },

      // 应用预制主题
      applyPresetTheme: (themeId) => {
        const theme = PRESET_THEMES.find(t => t.id === themeId);
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
          noteDefaultColor: theme.colors.noteDefaultColor,
        };

        // 直接更新状态，不通过setAppearance避免重复保存
        set(_state => ({
          appearance: newAppearance
        }));

        // 保存到localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('ui-appearance', JSON.stringify(newAppearance));
        }

        // 立即应用到DOM
        get().applyAppearanceSettings();


        return true;
      },

      // 应用外观设置到DOM
      applyAppearanceSettings: () => {
        const { appearance } = get();
        const container = document.querySelector('.infinite-canvas-container') as HTMLElement;

        if (container) {
          // 应用画布背景色
          container.style.setProperty('--canvas-background', appearance.canvasBackground);

          // 应用网格设置 - 确保大网格是小网格的整数倍
          const smallGridSize = appearance.gridSize;
          const largeGridSize = smallGridSize * 5; // 大网格是小网格的5倍，确保对齐

          container.style.setProperty('--grid-visible', appearance.gridVisible ? '1' : '0');
          container.style.setProperty('--small-grid-size', `${smallGridSize}px`);
          container.style.setProperty('--large-grid-size', `${largeGridSize}px`);

          // 应用网格颜色
          container.style.setProperty('--small-grid-color', appearance.gridColor);
          container.style.setProperty('--large-grid-color', appearance.gridMajorColor);

          // 应用字体设置
          document.documentElement.style.setProperty('--note-font-size', `${appearance.fontSize}px`);
          document.documentElement.style.setProperty('--note-font-family', appearance.fontFamily);
          document.documentElement.style.setProperty('--note-default-color', appearance.noteDefaultColor);
        }
      },

      // 侧边栏操作
      toggleSidebar: () => {
        set(state => ({
          sidebarCollapsed: !state.sidebarCollapsed
        }));
      },

      setSidebarVisible: (visible) => {
        set({ sidebarVisible: visible });
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
      },

      // 工具栏操作
      toggleToolbar: () => {
        set(state => ({
          toolbarVisible: !state.toolbarVisible
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
        set(state => ({
          shortcutsEnabled: !state.shortcutsEnabled
        }));
      },

      setShortcutsEnabled: (enabled) => {
        set({ shortcutsEnabled: enabled });
      },

      // 初始化
      initialize: () => {
        if (typeof window !== 'undefined') {
          // 从localStorage加载主题设置
          const savedTheme = localStorage.getItem('ui-theme') as ThemeState['theme'];
          if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
            get().setTheme(savedTheme);
          }

          // 从localStorage加载外观设置
          const savedAppearance = localStorage.getItem('ui-appearance');
          if (savedAppearance) {
            try {
              const appearance = JSON.parse(savedAppearance) as AppearanceState;
              set(state => ({
                appearance: { ...state.appearance, ...appearance }
              }));
            } catch (error) {
              console.warn('加载外观设置失败:', error);
            }
          }

          // 从localStorage加载通用设置
          const savedGeneral = localStorage.getItem('ui-general');
          if (savedGeneral) {
            try {
              const general = JSON.parse(savedGeneral) as GeneralState;
              set(state => ({
                general: { ...state.general, ...general }
              }));
            } catch (error) {
              console.warn('加载通用设置失败:', error);
            }
          }

          // 应用外观设置到DOM
          setTimeout(() => {
            get().applyAppearanceSettings();
          }, 100);

          // 监听系统主题变化
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleThemeChange = () => {
            const currentTheme = get().theme.theme;
            if (currentTheme === 'auto') {
              set(state => ({
                theme: { ...state.theme, isDarkMode: mediaQuery.matches }
              }));
            }
          };

          mediaQuery.addEventListener('change', handleThemeChange);

          // 清理函数（在实际应用中可能需要在组件卸载时调用）
          return () => {
            mediaQuery.removeEventListener('change', handleThemeChange);
          };
        }


      },
    })),
    {
      name: 'ui-store', // DevTools中的名称
    }
  )
);
