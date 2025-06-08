// AI设置存储服务
import { type AIConfig, defaultAIConfig } from "./aiService";

export class AISettingsStorage {
  private static readonly STORAGE_KEY = "ai-settings";

  // 保存AI配置到localStorage
  static async saveConfig(config: AIConfig): Promise<void> {
    try {
      const configToSave = {
        ...config,
        // 出于安全考虑，API密钥单独处理
        apiKey: config.apiKey ? this.encryptKey(config.apiKey) : "",
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configToSave));
    } catch (error) {
      console.error("保存AI配置失败:", error);
      throw new Error("保存AI配置失败");
    }
  }

  // 从localStorage加载AI配置
  static async loadConfig(): Promise<AIConfig> {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) {
        return { ...defaultAIConfig };
      }

      const config = JSON.parse(saved);

      return {
        ...defaultAIConfig,
        ...config,
        // 解密API密钥
        apiKey: config.apiKey ? this.decryptKey(config.apiKey) : "",
      };
    } catch (error) {
      console.error("加载AI配置失败:", error);
      return { ...defaultAIConfig };
    }
  }

  // 清除AI配置
  static async clearConfig(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error("清除AI配置失败:", error);
    }
  }

  // 检查是否有有效的AI配置
  static async hasValidConfig(): Promise<boolean> {
    try {
      const config = await this.loadConfig();
      return !!(
        config.enableAI &&
        config.apiKey &&
        config.apiUrl &&
        config.aiModel
      );
    } catch {
      return false;
    }
  }

  // 简单的API密钥加密（基于Base64，仅用于混淆）
  // 注意：这不是真正的安全加密，只是为了避免明文存储
  private static encryptKey(key: string): string {
    try {
      return btoa(unescape(encodeURIComponent(key + "ai-sticky-notes")));
    } catch {
      return key;
    }
  }

  // 简单的API密钥解密
  private static decryptKey(encryptedKey: string): string {
    try {
      const decoded = decodeURIComponent(escape(atob(encryptedKey)));
      return decoded.replace("ai-sticky-notes", "");
    } catch {
      return encryptedKey;
    }
  }

  // 验证配置格式
  static validateConfig(config: Partial<AIConfig>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

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
      }
    }

    if (
      typeof config.temperature !== "number" ||
      config.temperature < 0 ||
      config.temperature > 1
    ) {
      errors.push("温度值必须在0-1之间");
    }

    if (
      typeof config.maxTokens !== "number" ||
      config.maxTokens < 1 ||
      config.maxTokens > 4000
    ) {
      errors.push("最大Token数必须在1-4000之间");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // 获取预设配置
  static getPresetConfigs(): Array<{
    name: string;
    config: Partial<AIConfig>;
  }> {
    return [
      {
        name: "DeepSeek默认配置",
        config: {
          aiModel: "deepseek-chat",
          apiUrl: "https://api.deepseek.com/v1",
          temperature: 0.7,
          maxTokens: 1000,
        },
      },
      {
        name: "OpenAI GPT-3.5",
        config: {
          aiModel: "gpt-3.5-turbo",
          apiUrl: "https://api.openai.com/v1",
          temperature: 0.7,
          maxTokens: 1000,
        },
      },
      {
        name: "OpenAI GPT-4",
        config: {
          aiModel: "gpt-4",
          apiUrl: "https://api.openai.com/v1",
          temperature: 0.5,
          maxTokens: 1500,
        },
      },
    ];
  }
}
