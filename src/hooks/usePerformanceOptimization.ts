import { useEffect, useState, useCallback } from 'react';
import { performanceDetector, type PerformanceProfile, DevicePerformanceLevel } from '../utils/performanceDetector';
import { PERFORMANCE_CONSTANTS } from '../components/canvas/CanvasConstants';

/**
 * 性能优化Hook
 * 自动检测设备性能并提供动态的性能配置
 */
export interface PerformanceConfig {
  virtualizationThreshold: number;
  renderBatchSize: number;
  updateThrottleMs: number;
  viewportMargin: number;
  isVirtualizationEnabled: boolean;
  performanceLevel: DevicePerformanceLevel;
  performanceScore: number;
}

export const usePerformanceOptimization = () => {
  const [performanceProfile, setPerformanceProfile] = useState<PerformanceProfile | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [config, setConfig] = useState<PerformanceConfig>(() => {
    // 提供默认配置，在检测完成前使用
    return {
      virtualizationThreshold: PERFORMANCE_CONSTANTS.DEFAULT_MAX_VISIBLE_NOTES,
      renderBatchSize: 30,
      updateThrottleMs: 16,
      viewportMargin: PERFORMANCE_CONSTANTS.VIEWPORT_MARGIN,
      isVirtualizationEnabled: true,
      performanceLevel: DevicePerformanceLevel.MEDIUM,
      performanceScore: 50,
    };
  });

  /**
   * 初始化性能检测
   */
  const initializePerformanceDetection = useCallback(async () => {
    if (performanceProfile) return; // 已经检测过了

    setIsDetecting(true);
    
    try {
      // 首先尝试从本地存储加载
      const cachedProfile = performanceDetector.loadProfileFromStorage();
      if (cachedProfile) {
        console.log('📋 使用缓存的性能配置:', cachedProfile);
        setPerformanceProfile(cachedProfile);
        updateConfig(cachedProfile);
        setIsDetecting(false);
        return;
      }

      // 如果没有缓存，进行性能检测
      console.log('🔍 开始设备性能检测...');
      const profile = await performanceDetector.detectPerformance();
      setPerformanceProfile(profile);
      updateConfig(profile);
      
    } catch (error) {
      console.error('❌ 性能检测失败，使用默认配置:', error);
      // 使用保守的默认配置
      const fallbackConfig = {
        virtualizationThreshold: 75,
        renderBatchSize: 25,
        updateThrottleMs: 24,
        viewportMargin: PERFORMANCE_CONSTANTS.VIEWPORT_MARGIN,
        isVirtualizationEnabled: true,
        performanceLevel: DevicePerformanceLevel.MEDIUM,
        performanceScore: 50,
      };
      setConfig(fallbackConfig);
    } finally {
      setIsDetecting(false);
    }
  }, [performanceProfile]);

  /**
   * 根据性能配置文件更新配置
   */
  const updateConfig = useCallback((profile: PerformanceProfile) => {
    // 确保阈值在合理范围内
    const clampedThreshold = Math.max(
      PERFORMANCE_CONSTANTS.MIN_VIRTUALIZATION_THRESHOLD,
      Math.min(
        PERFORMANCE_CONSTANTS.MAX_VIRTUALIZATION_THRESHOLD,
        profile.virtualizationThreshold
      )
    );

    // 根据性能等级调整视口边距
    const getViewportMargin = (level: DevicePerformanceLevel): number => {
      switch (level) {
        case DevicePerformanceLevel.HIGH:
          return PERFORMANCE_CONSTANTS.VIEWPORT_MARGIN * 1.5; // 高性能设备可以预加载更多
        case DevicePerformanceLevel.LOW:
          return PERFORMANCE_CONSTANTS.VIEWPORT_MARGIN * 0.5; // 低性能设备减少预加载
        default:
          return PERFORMANCE_CONSTANTS.VIEWPORT_MARGIN;
      }
    };

    const newConfig: PerformanceConfig = {
      virtualizationThreshold: clampedThreshold,
      renderBatchSize: profile.renderBatchSize,
      updateThrottleMs: profile.updateThrottleMs,
      viewportMargin: getViewportMargin(profile.level),
      isVirtualizationEnabled: true,
      performanceLevel: profile.level,
      performanceScore: profile.score,
    };

    setConfig(newConfig);

    console.log('⚙️ 性能配置已更新:', {
      level: profile.level,
      score: profile.score.toFixed(1),
      threshold: clampedThreshold,
      margin: newConfig.viewportMargin,
    });
  }, []);

  /**
   * 强制重新检测性能
   */
  const forceRedetect = useCallback(async () => {
    setIsDetecting(true);
    setPerformanceProfile(null);
    
    try {
      const profile = await performanceDetector.forceRedetect();
      setPerformanceProfile(profile);
      updateConfig(profile);
    } catch (error) {
      console.error('❌ 强制重新检测失败:', error);
    } finally {
      setIsDetecting(false);
    }
  }, [updateConfig]);

  /**
   * 获取针对特定便签数量的虚拟化建议
   */
  const getVirtualizationAdvice = useCallback((noteCount: number) => {
    if (!config) return null;

    const shouldVirtualize = noteCount > config.virtualizationThreshold;
    const performanceImpact = shouldVirtualize 
      ? 'low' 
      : noteCount > config.virtualizationThreshold * 0.8 
        ? 'medium' 
        : 'none';

    return {
      shouldVirtualize,
      performanceImpact,
      recommendedAction: shouldVirtualize 
        ? '已启用虚拟化渲染' 
        : noteCount > config.virtualizationThreshold * 0.8
          ? '接近虚拟化阈值，建议清理不需要的便签'
          : '性能良好',
      threshold: config.virtualizationThreshold,
      currentLoad: (noteCount / config.virtualizationThreshold * 100).toFixed(1) + '%'
    };
  }, [config]);

  /**
   * 获取性能等级的显示信息
   */
  const getPerformanceLevelInfo = useCallback(() => {
    if (!performanceProfile) return null;

    const levelInfo = {
      [DevicePerformanceLevel.HIGH]: {
        label: '高性能',
        color: '#52c41a',
        description: '设备性能优秀，可以流畅处理大量便签',
        icon: '🚀'
      },
      [DevicePerformanceLevel.MEDIUM]: {
        label: '中等性能',
        color: '#faad14',
        description: '设备性能良好，适合中等规模的便签使用',
        icon: '⚡'
      },
      [DevicePerformanceLevel.LOW]: {
        label: '低性能',
        color: '#ff4d4f',
        description: '设备性能较低，建议控制便签数量以保持流畅',
        icon: '🐌'
      },
      [DevicePerformanceLevel.UNKNOWN]: {
        label: '未知',
        color: '#8c8c8c',
        description: '无法确定设备性能，使用保守配置',
        icon: '❓'
      }
    };

    return levelInfo[performanceProfile.level];
  }, [performanceProfile]);

  // 组件挂载时自动初始化性能检测
  useEffect(() => {
    initializePerformanceDetection();
  }, [initializePerformanceDetection]);

  return {
    // 状态
    performanceProfile,
    config,
    isDetecting,
    
    // 方法
    forceRedetect,
    getVirtualizationAdvice,
    getPerformanceLevelInfo,
    
    // 便捷访问的配置值
    virtualizationThreshold: config.virtualizationThreshold,
    viewportMargin: config.viewportMargin,
    performanceLevel: config.performanceLevel,
    performanceScore: config.performanceScore,
  };
};
