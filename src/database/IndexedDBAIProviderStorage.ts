// 使用 IndexedDB 存储多AI供应商配置
import { IndexedDBService } from "./IndexedDBService";

// 定义存储在 IndexedDB 中的供应商配置结构
export interface StoredProviderConfig {
  id: string; // 供应商ID (deepseek, alibaba, openai, custom等)
  user_id: string;
  apiUrl: string;
  apiKey: string; // 加密存储
  aiModel: string;
  temperature?: number;
  maxTokens?: number;
  updated_at: string;
  created_at: string;
}

export class IndexedDBAIProviderStorage {
  private static readonly DEFAULT_USER_ID = "default";
  private static readonly STORE_NAME = "ai_provider_configs";

  /**
   * 保存单个供应商配置
   */
  static async saveProviderConfig(
    providerId: string,
    config: {
      apiUrl: string;
      apiKey: string;
      aiModel: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<void> {
    console.log("💾 IndexedDBAIProviderStorage: 保存供应商配置", {
      providerId,
      config: { ...config, apiKey: "******" },
    });

    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();

      const configToSave: StoredProviderConfig = {
        id: providerId,
        user_id: this.DEFAULT_USER_ID,
        apiUrl: config.apiUrl,
        apiKey: config.apiKey ? this.encryptKey(config.apiKey) : "",
        aiModel: config.aiModel,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      await db.putItem(this.STORE_NAME, configToSave);
      console.log(
        "💾 IndexedDBAIProviderStorage: 供应商配置保存成功",
        providerId
      );
    } catch (error) {
      console.error(
        "💾 IndexedDBAIProviderStorage: 保存供应商配置失败:",
        error
      );
      throw new Error(`保存${providerId}配置失败`);
    }
  }

  /**
   * 加载单个供应商配置
   */
  static async loadProviderConfig(providerId: string): Promise<{
    apiUrl: string;
    apiKey: string;
    aiModel: string;
    temperature?: number;
    maxTokens?: number;
  } | null> {
    console.log("📥 IndexedDBAIProviderStorage: 加载供应商配置", providerId);

    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();

      const config = await db.getItem<StoredProviderConfig>(
        this.STORE_NAME,
        providerId
      );

      if (!config) {
        console.log(
          "📥 IndexedDBAIProviderStorage: 未找到供应商配置",
          providerId
        );
        return null;
      }

      const result = {
        apiUrl: config.apiUrl,
        apiKey: config.apiKey ? this.decryptKey(config.apiKey) : "",
        aiModel: config.aiModel,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      };

      console.log("📥 IndexedDBAIProviderStorage: 供应商配置加载成功", {
        providerId,
        config: { ...result, apiKey: "******" },
      });
      return result;
    } catch (error) {
      console.error(
        "📥 IndexedDBAIProviderStorage: 加载供应商配置失败:",
        error
      );
      return null;
    }
  }

  /**
   * 加载所有供应商配置
   */
  static async loadAllProviderConfigs(): Promise<
    Record<
      string,
      {
        apiUrl: string;
        apiKey: string;
        aiModel: string;
        temperature?: number;
        maxTokens?: number;
      }
    >
  > {
    console.log("📥 IndexedDBAIProviderStorage: 加载所有供应商配置");

    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();

      // 使用queryByIndex方法获取所有配置，通过user_id索引
      const allConfigs = await this.getAllProviderConfigs(db);
      const result: Record<string, any> = {};

      allConfigs.forEach((config) => {
        result[config.id] = {
          apiUrl: config.apiUrl,
          apiKey: config.apiKey ? this.decryptKey(config.apiKey) : "",
          aiModel: config.aiModel,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        };
      });

      console.log(
        "📥 IndexedDBAIProviderStorage: 所有供应商配置加载成功",
        Object.keys(result)
      );
      return result;
    } catch (error) {
      console.error(
        "📥 IndexedDBAIProviderStorage: 加载所有供应商配置失败:",
        error
      );
      return {};
    }
  }

  /**
   * 获取所有供应商配置的私有方法
   */
  private static async getAllProviderConfigs(
    db: IndexedDBService
  ): Promise<StoredProviderConfig[]> {
    return new Promise((resolve, reject) => {
      if (!db.isInitialized()) {
        reject(new Error("数据库未初始化"));
        return;
      }

      const transaction = (db as any).db.transaction(
        [this.STORE_NAME],
        "readonly"
      );
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 删除供应商配置
   */
  static async deleteProviderConfig(providerId: string): Promise<void> {
    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();
      await db.deleteItem(this.STORE_NAME, providerId);
      console.log(
        "🗑️ IndexedDBAIProviderStorage: 供应商配置删除成功",
        providerId
      );
    } catch (error) {
      console.error(
        "🗑️ IndexedDBAIProviderStorage: 删除供应商配置失败:",
        error
      );
    }
  }

  /**
   * 清除所有供应商配置
   */
  static async clearAllProviderConfigs(): Promise<void> {
    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();

      const allConfigs = await db.getAllItems<StoredProviderConfig>(
        this.STORE_NAME
      );
      for (const config of allConfigs) {
        await db.deleteItem(this.STORE_NAME, config.id);
      }

      console.log("🗑️ IndexedDBAIProviderStorage: 所有供应商配置清除成功");
    } catch (error) {
      console.error(
        "🗑️ IndexedDBAIProviderStorage: 清除所有供应商配置失败:",
        error
      );
    }
  }

  /**
   * 简单的API密钥加密（Base64编码）
   * 注意：这不是真正的加密，只是简单的编码，用于基本的隐私保护
   */
  private static encryptKey(key: string): string {
    try {
      return btoa(key);
    } catch (error) {
      console.warn("API密钥编码失败，使用原始值");
      return key;
    }
  }

  /**
   * 简单的API密钥解密（Base64解码）
   */
  private static decryptKey(encryptedKey: string): string {
    try {
      return atob(encryptedKey);
    } catch (error) {
      console.warn("API密钥解码失败，使用原始值");
      return encryptedKey;
    }
  }

  /**
   * 从localStorage迁移数据到IndexedDB
   */
  static async migrateFromLocalStorage(): Promise<void> {
    try {
      const saved = localStorage.getItem("ai-provider-configs");
      if (saved) {
        const configs = JSON.parse(saved);
        console.log(
          "🔄 IndexedDBAIProviderStorage: 开始从localStorage迁移数据",
          Object.keys(configs)
        );

        for (const [providerId, config] of Object.entries(configs)) {
          await this.saveProviderConfig(providerId, config as any);
        }

        // 迁移完成后清除localStorage数据
        localStorage.removeItem("ai-provider-configs");
        console.log(
          "🔄 IndexedDBAIProviderStorage: 数据迁移完成，已清除localStorage数据"
        );
      }
    } catch (error) {
      console.error("🔄 IndexedDBAIProviderStorage: 数据迁移失败:", error);
    }
  }
}
