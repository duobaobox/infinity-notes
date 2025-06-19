// 使用 IndexedDB 存储 AI 设置
import { type AIConfig, defaultAIConfig } from "../services/ai/aiService";
import { IndexedDBService } from "./IndexedDBService";

// 定义存储在 IndexedDB 中的 AI 设置结构
interface StoredAISettings extends AIConfig {
  id: string;
  user_id: string;
  updated_at: string;
}

export class IndexedDBAISettingsStorage {
  private static readonly DEFAULT_USER_ID = "default";

  // 保存AI配置到IndexedDB，添加自动修正逻辑
  static async saveConfig(config: AIConfig): Promise<void> {
    console.log("💾 IndexedDBAISettingsStorage: 开始保存配置", config);

    try {
      // 验证配置，并获取可能的修正版本
      const validation = this.validateConfig(config);

      // 如果配置有错误但可以修正，使用修正后的版本
      let configToUse: AIConfig = { ...config };
      if (!validation.isValid && validation.correctedConfig) {
        console.warn("检测到无效的AI配置参数，已自动修正:", validation.errors);
        // 合并原始配置和修正后的配置
        configToUse = {
          ...config,
          ...(validation.correctedConfig as Partial<AIConfig>),
        };
      }

      const db = IndexedDBService.getInstance();
      await db.initialize();
      console.log("💾 IndexedDBAISettingsStorage: 数据库初始化完成");

      // 加密API密钥
      const configToSave = {
        id: "ai-settings", // 使用固定ID，方便查询
        user_id: this.DEFAULT_USER_ID, // 将来可支持多用户
        ...configToUse,
        // 出于安全考虑，API密钥单独处理
        apiKey: configToUse.apiKey ? this.encryptKey(configToUse.apiKey) : "",
        updated_at: new Date().toISOString(),
      };

      console.log("💾 IndexedDBAISettingsStorage: 准备保存到ai_settings表", {
        ...configToSave,
        apiKey: configToSave.apiKey ? "******" : "",
      });

      await db.putItem("ai_settings", configToSave);
      console.log("💾 IndexedDBAISettingsStorage: 配置保存成功");

      // 如果使用了修正后的配置，记录日志
      if (configToUse !== config) {
        console.info("已保存修正后的AI配置");
      }
    } catch (error) {
      console.error(
        "💾 IndexedDBAISettingsStorage: 保存AI配置到IndexedDB失败:",
        error
      );
      throw new Error("保存AI配置失败");
    }
  }

  // 从IndexedDB加载AI配置
  static async loadConfig(): Promise<AIConfig> {
    console.log("📥 IndexedDBAISettingsStorage: 开始加载AI配置");

    try {
      const db = IndexedDBService.getInstance();
      await db.initialize();
      console.log("📥 IndexedDBAISettingsStorage: 数据库初始化完成");

      // 尝试从 IndexedDB 获取配置
      const settings = await db.getItem<StoredAISettings>(
        "ai_settings",
        "ai-settings"
      );

      console.log(
        "📥 IndexedDBAISettingsStorage: 从数据库获取的原始数据",
        settings
      );

      // 如果没有找到配置，尝试从localStorage迁移
      if (!settings) {
        console.log(
          "📥 IndexedDBAISettingsStorage: 数据库中无配置，尝试从localStorage迁移"
        );
        return await this.migrateFromLocalStorage();
      }

      // 移除与数据库相关的字段，只保留 AIConfig 相关字段
      const { id, user_id, updated_at, ...configData } = settings;

      const finalConfig = {
        ...defaultAIConfig,
        ...configData,
        // 解密API密钥
        apiKey: configData.apiKey ? this.decryptKey(configData.apiKey) : "",
      };

      console.log("📥 IndexedDBAISettingsStorage: 最终解析的配置", {
        ...finalConfig,
        apiKey: finalConfig.apiKey ? "******" : "",
      });

      return finalConfig;
    } catch (error) {
      console.error(
        "📥 IndexedDBAISettingsStorage: 从IndexedDB加载AI配置失败:",
        error
      );

      // 如果从 IndexedDB 加载失败，尝试从 localStorage 加载
      try {
        const migratedConfig = await this.migrateFromLocalStorage();
        // 记录成功迁移的日志
        console.log("成功从localStorage迁移AI配置", migratedConfig);
        return migratedConfig;
      } catch (migrationError) {
        console.error("从localStorage迁移配置失败:", migrationError);
        // 添加更详细的错误日志
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
      await db.deleteItem("ai_settings", "ai-settings");      // 同时清除localStorage中的旧配置
      localStorage.removeItem('ai-settings');
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
      const savedConfig = localStorage.getItem('ai-settings');
      if (!savedConfig) {
        console.log("💾 localStorage中没有AI配置，返回默认配置");
        return { ...defaultAIConfig };
      }

      const oldConfig = JSON.parse(savedConfig);
      
      // 解密API密钥（使用与旧服务相同的方法）
      let decryptedApiKey = '';
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
      const hasApiKey = decodedConfig.apiKey && decodedConfig.apiKey.trim() !== "";
      const hasApiUrl = decodedConfig.apiUrl && decodedConfig.apiUrl !== defaultAIConfig.apiUrl;
      const hasCustomModel = decodedConfig.aiModel && decodedConfig.aiModel !== defaultAIConfig.aiModel;
      const hasAnyCustomConfig = hasApiKey || hasApiUrl || hasCustomModel;

      // 如果有任何自定义配置，保存到IndexedDB
      if (hasAnyCustomConfig) {        await this.saveConfig(decodedConfig);
        console.log("成功将AI配置从localStorage迁移到IndexedDB，配置内容:", {
          ...decodedConfig,
          apiKey: hasApiKey ? "******" : "",
        });

        // 迁移完成后清除localStorage中的旧数据
        localStorage.removeItem('ai-settings');
        
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
      } catch {}

      return ""; // 解密完全失败，返回空字符串
    }
  }

  // 验证配置格式，添加自动修正功能
  static validateConfig(config: Partial<AIConfig>): {
    isValid: boolean;
    errors: string[];
    correctedConfig?: Partial<AIConfig>; // 新增：返回修正后的配置
  } {
    const errors: string[] = [];
    // 创建修正后的配置副本
    const correctedConfig: Partial<AIConfig> = { ...config };

    if (!config.aiModel) {
      errors.push("请选择AI模型");
    }

    if (!config.apiKey || config.apiKey.trim() === "") {
      errors.push("请输入API密钥");
    }

    if (!config.apiUrl || config.apiUrl.trim() === "") {
      errors.push("请输入API地址");
    } else {
      try {
        new URL(config.apiUrl);
      } catch {
        errors.push("API地址格式不正确");
        // 尝试自动修正URL
        if (config.apiUrl.startsWith("http")) {
          try {
            // 尝试修复常见URL问题，例如缺少/v1等
            let fixedUrl = config.apiUrl;
            if (!fixedUrl.endsWith("/v1") && !fixedUrl.endsWith("/")) {
              fixedUrl += "/v1";
              new URL(fixedUrl); // 验证修复后的URL
              correctedConfig.apiUrl = fixedUrl;
              console.log(`自动修正API地址: ${config.apiUrl} -> ${fixedUrl}`);
            }
          } catch {
            // 如果无法修复，保留原始错误
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      correctedConfig: errors.length > 0 ? correctedConfig : undefined,
    };
  }
}
