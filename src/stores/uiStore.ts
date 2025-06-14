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
        set(state => ({
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
        // 从localStorage加载主题设置
        if (typeof window !== 'undefined') {
          const savedTheme = localStorage.getItem('ui-theme') as ThemeState['theme'];
          if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
            get().setTheme(savedTheme);
          }
          
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
        
        console.log('UI Store 初始化完成');
      },
    })),
    {
      name: 'ui-store', // DevTools中的名称
    }
  )
);
