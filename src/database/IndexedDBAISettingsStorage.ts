// 使用 IndexedDB 存储 AI 设置 - 优化版本
import { type AIConfig, defaultAIConfig } from "../services/ai/aiService";
import { AIConfigValidator } from "../utils/aiValidation";
import { IndexedDBService } from "./IndexedDBService";

// 定义存储在 IndexedDB 中的 AI 设置结构
interface StoredAISettings extends AIConfig {
  id: string;
  user_id: string;
  updated_at: string;
}

export class IndexedDBAISettingsStorage {
  private static readonly DEFAULT_USER_ID = "default";

  // 保存AI配置到IndexedDB（优化版本）
  static async saveConfig(config: AIConfig): Promise<void> {
    try {
      // 验证配置
      const validation = AIConfigValidator.validateConfig(config);
      if (!validation.isValid) {
        throw new Error(`配置验证失败: ${validation.errors.join(", ")}`);
      }

      const db = IndexedDBService.getInstance();
      await db.initialize();

      // 加密API密钥并准备保存的数据
      const configToSave = {
        id: "ai-settings", // 使用固定ID，方便查询
        user_id: this.DEFAULT_USER_ID, // 将来可支持多用户
        ...config,
        // 出于安全考虑，API密钥单独处理
        apiKey: config.apiKey ? this.encryptKey(config.apiKey) : "",
        updated_at: new Date().toISOString(),
      };

      await db.putItem("ai_settings", configToSave);
    } catch (error) {
      console.error("保存AI配置到IndexedDB失败:", error);
      throw error instanceof Error ? error : new Error("保存AI配置失败");
    }
  }

  // 从IndexedDB加载AI配置（优化版本）
  static async loadConfig(): Promise<AIConfig> {
    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();

      // 尝试从 IndexedDB 获取配置
      const settings = await db.getItem<StoredAISettings>(
        "ai_settings",
        "ai-settings"
      );

      // 如果没有找到配置，尝试从localStorage迁移
      if (!settings) {
        return await this.migrateFromLocalStorage();
      }

      // 移除与数据库相关的字段，只保留 AIConfig 相关字段
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, user_id, updated_at, ...configData } = settings;

      const finalConfig = {
        ...defaultAIConfig,
        ...configData,
        // 解密API密钥
        apiKey: configData.apiKey ? this.decryptKey(configData.apiKey) : "",
      };

      return finalConfig;
    } catch (error) {
      console.error("从IndexedDB加载AI配置失败:", error);

      // 如果从 IndexedDB 加载失败，尝试从 localStorage 加载
      try {
        const migratedConfig = await this.migrateFromLocalStorage();
        console.log("成功从localStorage迁移AI配置");
        return migratedConfig;
      } catch (migrationError) {
        console.error("从localStorage迁移配置失败:", migrationError);
        console.warn("使用默认AI配置，请在设置中重新配置AI");
        return { ...defaultAIConfig };
      }
    }
  }

  // 清除AI配置
  static async clearConfig(): Promise<void> {
    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();
      await db.deleteItem("ai_settings", "ai-settings"); // 同时清除localStorage中的旧配置
      localStorage.removeItem("ai-settings");
    } catch (error) {
      console.error("清除AI配置失败:", error);
    }
  }

  // 检查是否有有效的AI配置
  static async hasValidConfig(): Promise<boolean> {
    try {
      const config = await this.loadConfig();
      return !!(config.apiKey && config.apiUrl && config.aiModel);
    } catch {
      return false;
    }
  }
  // 从localStorage迁移数据到IndexedDB，改进迁移逻辑
  private static async migrateFromLocalStorage(): Promise<AIConfig> {
    try {
      // 直接从localStorage读取旧配置
      const savedConfig = localStorage.getItem("ai-settings");
      if (!savedConfig) {
        console.log("💾 localStorage中没有AI配置，返回默认配置");
        return { ...defaultAIConfig };
      }

      const oldConfig = JSON.parse(savedConfig);

      // 解密API密钥（使用与旧服务相同的方法）
      let decryptedApiKey = "";
      if (oldConfig.apiKey) {
        try {
          // 简单的Base64解码（与旧服务保持一致）
          decryptedApiKey = atob(oldConfig.apiKey);
        } catch {
          decryptedApiKey = oldConfig.apiKey; // 如果解码失败，使用原值
        }
      }

      const decodedConfig = {
        ...defaultAIConfig,
        ...oldConfig,
        apiKey: decryptedApiKey,
      };

      // 检查是否有任何有意义的配置(包括部分配置)
      const hasApiKey =
        decodedConfig.apiKey && decodedConfig.apiKey.trim() !== "";
      const hasApiUrl =
        decodedConfig.apiUrl && decodedConfig.apiUrl !== defaultAIConfig.apiUrl;
      const hasCustomModel =
        decodedConfig.aiModel &&
        decodedConfig.aiModel !== defaultAIConfig.aiModel;
      const hasAnyCustomConfig = hasApiKey || hasApiUrl || hasCustomModel;

      // 如果有任何自定义配置，保存到IndexedDB
      if (hasAnyCustomConfig) {
        await this.saveConfig(decodedConfig);
        console.log("成功将AI配置从localStorage迁移到IndexedDB，配置内容:", {
          ...decodedConfig,
          apiKey: hasApiKey ? "******" : "",
        });

        // 迁移完成后清除localStorage中的旧数据
        localStorage.removeItem("ai-settings");

        return decodedConfig;
      } else {
        console.log("未发现有效的自定义AI配置，使用默认配置");
        return { ...defaultAIConfig };
      }
    } catch (error) {
      console.error("迁移AI配置失败:", error);
      return { ...defaultAIConfig };
    }
  }

  // 改进的API密钥加密（基于AES-like XOR加密算法）
  // 仍然不是生产级安全加密，但比简单的Base64更安全
  private static encryptKey(key: string): string {
    try {
      // 固定的盐值，实际应用中应当使用动态生成的安全盐值
      const salt = "ai-sticky-notes-secret-salt-2025";
      // 使用XOR加密
      let encrypted = "";
      for (let i = 0; i < key.length; i++) {
        const charCode = key.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
        encrypted += String.fromCharCode(charCode);
      }
      // 最后再用Base64编码
      return btoa(unescape(encodeURIComponent(encrypted)));
    } catch (error) {
      console.error("加密API密钥失败:", error);
      // 降级处理，返回简单混淆
      return btoa(key + "-fallback");
    }
  }

  // 改进的API密钥解密
  private static decryptKey(encryptedKey: string): string {
    try {
      // 固定的盐值，必须与加密时使用的相同
      const salt = "ai-sticky-notes-secret-salt-2025";
      // 先Base64解码
      const decoded = decodeURIComponent(escape(atob(encryptedKey)));
      // 使用XOR解密
      let decrypted = "";
      for (let i = 0; i < decoded.length; i++) {
        const charCode =
          decoded.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
        decrypted += String.fromCharCode(charCode);
      }
      return decrypted;
    } catch (error) {
      console.error("解密API密钥失败:", error);
      // 尝试旧版解密方式（向后兼容）
      try {
        const decoded = decodeURIComponent(escape(atob(encryptedKey)));
        if (decoded.includes("ai-sticky-notes")) {
          return decoded.replace("ai-sticky-notes", "");
        }
        // 检查是否是fallback加密
        if (encryptedKey.endsWith("LWZhbGxiYWNr")) {
          // Base64编码的"-fallback"
          return atob(encryptedKey).replace("-fallback", "");
        }
      } catch (fallbackError) {
        console.warn("旧版解密方式也失败:", fallbackError);
      }

      return ""; // 解密完全失败，返回空字符串
    }
  }
}
