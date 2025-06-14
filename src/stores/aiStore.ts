// AI状态管理Store
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { AIConfig } from '../services/aiService';
import { defaultAIConfig, getAIService } from '../services/aiService';
import { IndexedDBAISettingsStorage as AISettingsStorage } from '../database/IndexedDBAISettingsStorage';

// AI提示词配置接口
export interface AIPromptConfig {
  systemPrompt: string; // 系统提示词（空字符串=无提示词模式，有内容=自定义prompt模式）
}

// AI状态接口
export interface AIState {
  // AI配置
  config: AIConfig;
  promptConfig: AIPromptConfig;
  
  // 状态管理
  loading: boolean;
  error: string | null;
  
  // AI生成状态
  isGenerating: boolean;
  generationProgress: number; // 0-100
  
  // 连接状态
  isConnected: boolean;
  lastTestTime: Date | null;
  
  // 配置验证
  hasValidConfig: boolean;
  canConfigurePrompt: boolean;
}

// AI操作接口
export interface AIActions {
  // 配置管理
  saveConfig: (config: AIConfig) => Promise<boolean>;
  loadConfig: () => Promise<void>;
  clearConfig: () => Promise<void>;
  
  // 提示词管理
  savePromptConfig: (promptConfig: AIPromptConfig) => Promise<boolean>;
  loadPromptConfig: () => Promise<void>;
  resetPromptToDefault: () => Promise<boolean>;
  
  // 连接测试
  testConnection: () => Promise<{ success: boolean; error?: string }>;
  
  // AI生成控制
  startGeneration: () => void;
  updateGenerationProgress: (progress: number) => void;
  finishGeneration: () => void;
  cancelGeneration: () => void;
  
  // 状态管理
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 初始化
  initialize: () => Promise<void>;
  
  // 获取完整配置（合并基础配置和提示词配置）
  getFullConfig: () => AIConfig;
}

// 创建AI Store
export const useAIStore = create<AIState & AIActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // 初始状态
      config: defaultAIConfig,
      promptConfig: { systemPrompt: '' },
      loading: false,
      error: null,
      isGenerating: false,
      generationProgress: 0,
      isConnected: false,
      lastTestTime: null,
      hasValidConfig: false,
      canConfigurePrompt: false,

      // 配置管理
      saveConfig: async (newConfig) => {
        try {
          set({ loading: true, error: null });
          
          // 验证配置
          const validation = AISettingsStorage.validateConfig(newConfig);
          if (!validation.isValid) {
            const errorMsg = validation.errors.join(', ');
            set({ error: errorMsg, loading: false });
            return false;
          }
          
          // 保存配置
          await AISettingsStorage.saveConfig(newConfig);
          
          // 更新状态
          const hasValidConfig = !!(newConfig.apiKey && newConfig.apiUrl && newConfig.aiModel);
          set({ 
            config: newConfig,
            hasValidConfig,
            canConfigurePrompt: hasValidConfig,
            loading: false 
          });
          
          // 更新AI服务配置
          if (hasValidConfig) {
            const fullConfig = get().getFullConfig();
            getAIService(fullConfig);
          }
          
          return true;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '保存配置失败';
          set({ error: errorMsg, loading: false });
          return false;
        }
      },

      loadConfig: async () => {
        try {
          set({ loading: true, error: null });
          
          const loadedConfig = await AISettingsStorage.loadConfig();
          const hasValidConfig = !!(loadedConfig.apiKey && loadedConfig.apiUrl && loadedConfig.aiModel);
          
          set({ 
            config: loadedConfig,
            hasValidConfig,
            canConfigurePrompt: hasValidConfig,
            loading: false 
          });
          
          // 更新AI服务配置
          if (hasValidConfig) {
            const fullConfig = get().getFullConfig();
            getAIService(fullConfig);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '加载配置失败';
          set({ error: errorMsg, loading: false });
        }
      },

      clearConfig: async () => {
        try {
          set({ loading: true, error: null });
          
          await AISettingsStorage.clearConfig();
          
          set({ 
            config: defaultAIConfig,
            hasValidConfig: false,
            canConfigurePrompt: false,
            isConnected: false,
            lastTestTime: null,
            loading: false 
          });
          
          // 重置AI服务
          getAIService(defaultAIConfig);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '清除配置失败';
          set({ error: errorMsg, loading: false });
        }
      },

      // 提示词管理
      savePromptConfig: async (promptConfig) => {
        try {
          set({ loading: true, error: null });
          
          // 保存提示词配置（通过更新完整配置）
          const currentConfig = get().config;
          const updatedConfig = { ...currentConfig, systemPrompt: promptConfig.systemPrompt };
          
          await AISettingsStorage.saveConfig(updatedConfig);
          
          set({ 
            config: updatedConfig,
            promptConfig,
            loading: false 
          });
          
          // 更新AI服务配置
          if (get().hasValidConfig) {
            getAIService(updatedConfig);
          }
          
          return true;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '保存提示词配置失败';
          set({ error: errorMsg, loading: false });
          return false;
        }
      },

      loadPromptConfig: async () => {
        try {
          const config = get().config;
          set({ 
            promptConfig: { systemPrompt: config.systemPrompt || '' }
          });
        } catch (error) {
          console.error('加载提示词配置失败:', error);
        }
      },

      resetPromptToDefault: async () => {
        return await get().savePromptConfig({ systemPrompt: '' });
      },

      // 连接测试
      testConnection: async () => {
        try {
          set({ loading: true, error: null });
          
          const fullConfig = get().getFullConfig();
          
          // 检查配置完整性
          if (!fullConfig.apiKey || !fullConfig.apiUrl || !fullConfig.aiModel) {
            throw new Error('AI配置不完整');
          }
          
          // 获取AI服务并测试连接
          const aiService = getAIService(fullConfig);
          const testResult = await aiService.testConnection();
          
          set({ 
            isConnected: testResult.success,
            lastTestTime: new Date(),
            loading: false,
            error: testResult.success ? null : testResult.error || '连接测试失败'
          });
          
          return testResult;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '连接测试失败';
          set({ 
            isConnected: false,
            lastTestTime: new Date(),
            error: errorMsg,
            loading: false 
          });
          return { success: false, error: errorMsg };
        }
      },

      // AI生成控制
      startGeneration: () => {
        set({ 
          isGenerating: true, 
          generationProgress: 0,
          error: null 
        });
      },

      updateGenerationProgress: (progress) => {
        set({ generationProgress: Math.max(0, Math.min(100, progress)) });
      },

      finishGeneration: () => {
        set({ 
          isGenerating: false, 
          generationProgress: 100 
        });
        
        // 延迟重置进度
        setTimeout(() => {
          set({ generationProgress: 0 });
        }, 1000);
      },

      cancelGeneration: () => {
        set({ 
          isGenerating: false, 
          generationProgress: 0,
          error: 'AI生成已取消'
        });
      },

      // 状态管理
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // 初始化
      initialize: async () => {
        try {
          // 加载AI配置
          await get().loadConfig();
          
          // 加载提示词配置
          await get().loadPromptConfig();
          
          console.log('AI Store 初始化完成');
        } catch (error) {
          console.error('AI Store 初始化失败:', error);
          set({ error: '初始化失败' });
        }
      },

      // 获取完整配置（合并基础配置和提示词配置）
      getFullConfig: () => {
        const { config, promptConfig } = get();
        return {
          ...config,
          systemPrompt: promptConfig.systemPrompt,
        };
      },
    })),
    {
      name: 'ai-store', // DevTools中的名称
    }
  )
);
