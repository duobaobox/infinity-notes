/**
 * 数据库缓存管理器
 * 提供内存缓存功能，减少数据库查询次数，提升性能
 */
export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<
    string,
    {
      data: any;
      timestamp: number;
      ttl: number; // 生存时间（毫秒）
    }
  > = new Map();

  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 默认5分钟过期
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // 启动定期清理过期缓存
    this.startCleanupTimer();
  }

  /**
   * 获取缓存管理器单例
   */
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    console.log(`💾 缓存已设置: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      console.log(`⏰ 缓存已过期并删除: ${key}`);
      return null;
    }

    console.log(`✅ 缓存命中: ${key}`);
    return cached.data as T;
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ 缓存已删除: ${key}`);
    }
    return deleted;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    console.log("🧹 所有缓存已清空");
  }

  /**
   * 检查缓存是否存在且未过期
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    totalKeys: number;
    expiredKeys: number;
    memoryUsage: number;
    hitRate: number;
  } {
    const totalKeys = this.cache.size;
    let expiredKeys = 0;
    let memoryUsage = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (Date.now() - cached.timestamp > cached.ttl) {
        expiredKeys++;
      }

      // 估算内存使用量（简单估算）
      memoryUsage += JSON.stringify(cached.data).length + key.length;
    }

    return {
      totalKeys,
      expiredKeys,
      memoryUsage,
      hitRate: 0, // 需要额外跟踪命中率
    };
  }

  /**
   * 批量设置缓存
   */
  setMultiple<T>(entries: Array<{ key: string; data: T; ttl?: number }>): void {
    entries.forEach(({ key, data, ttl }) => {
      this.set(key, data, ttl);
    });
  }

  /**
   * 批量获取缓存
   */
  getMultiple<T>(keys: string[]): Map<string, T | null> {
    const result = new Map<string, T | null>();
    keys.forEach((key) => {
      result.set(key, this.get<T>(key));
    });
    return result;
  }

  /**
   * 按前缀删除缓存
   */
  deleteByPrefix(prefix: string): number {
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    console.log(`🗑️ 按前缀删除缓存: ${prefix}* (${deletedCount}个)`);
    return deletedCount;
  }

  /**
   * 启动定期清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredCache();
    }, 60 * 1000); // 每分钟清理一次
  }

  /**
   * 清理过期缓存
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 定期清理过期缓存: ${cleanedCount}个`);
    }

    // 检查内存压力并进行额外清理
    this.checkMemoryPressure();
  }

  /**
   * 内存压力检测和自动清理
   */
  private checkMemoryPressure(): void {
    const MAX_CACHE_ITEMS = 1000; // 最大缓存项目数
    const CLEANUP_THRESHOLD = 0.8; // 清理阈值（80%）

    // 如果缓存项目数超过阈值，清理最旧的项目
    if (this.cache.size > MAX_CACHE_ITEMS * CLEANUP_THRESHOLD) {
      const itemsToRemove = Math.floor(this.cache.size * 0.2); // 清理20%的项目

      // 按时间戳排序，删除最旧的项目
      const sortedEntries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      for (let i = 0; i < itemsToRemove && i < sortedEntries.length; i++) {
        this.cache.delete(sortedEntries[i][0]);
      }

      if (itemsToRemove > 0) {
        console.log(`🧹 内存压力清理: 移除了 ${itemsToRemove} 个最旧的缓存项`);
      }
    }
  }

  /**
   * 停止清理定时器
   */
  stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * 销毁缓存管理器 - 完整的内存清理
   */
  destroy(): void {
    console.log("🧹 开始销毁缓存管理器...");

    // 停止清理定时器
    this.stopCleanupTimer();

    // 清空所有缓存
    this.clear();

    // 重置单例实例
    CacheManager.instance = null as any;

    console.log("🧹 缓存管理器已完全销毁");
  }

  /**
   * 生成缓存键
   */
  static generateKey(prefix: string, ...params: (string | number)[]): string {
    return `${prefix}:${params.join(":")}`;
  }
}

/**
 * 缓存装饰器工厂
 * 自动缓存方法返回值
 */
export function cached(keyPrefix: string, ttl?: number) {
  return function (
    target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cache = CacheManager.getInstance();

    descriptor.value = async function (...args: any[]) {
      // 生成缓存键
      const cacheKey = CacheManager.generateKey(
        `${target.constructor.name}.${keyPrefix}`,
        ...args.map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
      );

      // 尝试从缓存获取
      const cached = cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // 执行原方法并缓存结果
      const result = await originalMethod.apply(this, args);
      cache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * 全局缓存管理器实例
 */
export const cacheManager = CacheManager.getInstance();
