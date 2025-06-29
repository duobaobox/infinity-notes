// AI配置验证工具 - 统一的验证逻辑
import type { AIConfig } from "../services/ai/aiService";

/**
 * 验证结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 字段验证结果接口
 */
export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

/**
 * AI配置验证器
 */
export class AIConfigValidator {
  /**
   * 验证API密钥
   */
  static validateApiKey(apiKey: string): FieldValidationResult {
    if (!apiKey || apiKey.trim() === "") {
      return {
        isValid: false,
        error: "请输入API密钥",
      };
    }

    if (apiKey.length < 10) {
      return {
        isValid: false,
        error: "API密钥长度不能少于10个字符",
      };
    }

    // 检查是否包含明显的占位符文本
    const placeholders = ["your-api-key", "sk-xxx", "请输入", "密钥"];
    if (placeholders.some(placeholder => apiKey.toLowerCase().includes(placeholder))) {
      return {
        isValid: false,
        error: "请输入有效的API密钥，不能使用占位符文本",
      };
    }

    return { isValid: true };
  }

  /**
   * 验证API地址
   */
  static validateApiUrl(apiUrl: string): FieldValidationResult {
    if (!apiUrl || apiUrl.trim() === "") {
      return {
        isValid: false,
        error: "请输入API地址",
      };
    }

    try {
      const url = new URL(apiUrl);
      
      // 检查协议
      if (!["http:", "https:"].includes(url.protocol)) {
        return {
          isValid: false,
          error: "API地址必须使用HTTP或HTTPS协议",
        };
      }

      // 检查是否是本地地址
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        return {
          isValid: true,
          warning: "检测到本地API地址，请确保服务正在运行",
        };
      }

      return { isValid: true };
    } catch {
      return {
        isValid: false,
        error: "API地址格式不正确，请输入有效的URL",
      };
    }
  }

  /**
   * 验证AI模型名称
   */
  static validateAiModel(aiModel: string): FieldValidationResult {
    if (!aiModel || aiModel.trim() === "") {
      return {
        isValid: false,
        error: "请选择或输入AI模型名称",
      };
    }

    // 检查是否包含明显的占位符文本
    const placeholders = ["请选择", "模型名称", "your-model"];
    if (placeholders.some(placeholder => aiModel.toLowerCase().includes(placeholder))) {
      return {
        isValid: false,
        error: "请输入有效的AI模型名称",
      };
    }

    return { isValid: true };
  }

  /**
   * 验证温度参数
   */
  static validateTemperature(temperature?: number): FieldValidationResult {
    if (temperature === undefined || temperature === null) {
      return { isValid: true }; // 温度参数是可选的
    }

    if (temperature < 0 || temperature > 2) {
      return {
        isValid: false,
        error: "温度参数必须在0-2之间",
      };
    }

    if (temperature > 1.5) {
      return {
        isValid: true,
        warning: "温度参数较高，可能导致回复不稳定",
      };
    }

    return { isValid: true };
  }

  /**
   * 验证最大Token数
   */
  static validateMaxTokens(maxTokens?: number): FieldValidationResult {
    if (maxTokens === undefined || maxTokens === null) {
      return { isValid: true }; // maxTokens是可选的
    }

    if (maxTokens < 1) {
      return {
        isValid: false,
        error: "最大Token数必须大于0",
      };
    }

    if (maxTokens > 32000) {
      return {
        isValid: true,
        warning: "最大Token数较大，可能增加API调用成本",
      };
    }

    return { isValid: true };
  }

  /**
   * 验证完整的AI配置
   */
  static validateConfig(config: Partial<AIConfig>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证必填字段
    const apiKeyResult = this.validateApiKey(config.apiKey || "");
    if (!apiKeyResult.isValid) {
      errors.push(apiKeyResult.error!);
    } else if (apiKeyResult.warning) {
      warnings.push(apiKeyResult.warning);
    }

    const apiUrlResult = this.validateApiUrl(config.apiUrl || "");
    if (!apiUrlResult.isValid) {
      errors.push(apiUrlResult.error!);
    } else if (apiUrlResult.warning) {
      warnings.push(apiUrlResult.warning);
    }

    const aiModelResult = this.validateAiModel(config.aiModel || "");
    if (!aiModelResult.isValid) {
      errors.push(aiModelResult.error!);
    } else if (aiModelResult.warning) {
      warnings.push(aiModelResult.warning);
    }

    // 验证可选字段
    const temperatureResult = this.validateTemperature(config.temperature);
    if (!temperatureResult.isValid) {
      errors.push(temperatureResult.error!);
    } else if (temperatureResult.warning) {
      warnings.push(temperatureResult.warning);
    }

    const maxTokensResult = this.validateMaxTokens(config.maxTokens);
    if (!maxTokensResult.isValid) {
      errors.push(maxTokensResult.error!);
    } else if (maxTokensResult.warning) {
      warnings.push(maxTokensResult.warning);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 检查配置是否完整（用于判断是否可以使用AI功能）
   */
  static isConfigComplete(config: Partial<AIConfig>): boolean {
    return !!(config.apiKey && config.apiUrl && config.aiModel);
  }

  /**
   * 获取配置完整度百分比
   */
  static getConfigCompleteness(config: Partial<AIConfig>): number {
    const requiredFields = ["apiKey", "apiUrl", "aiModel"];
    const completedFields = requiredFields.filter(field => {
      const value = config[field as keyof AIConfig];
      return value && String(value).trim() !== "";
    });

    return Math.round((completedFields.length / requiredFields.length) * 100);
  }

  /**
   * 获取友好的验证错误消息
   */
  static getFriendlyErrorMessage(errors: string[]): string {
    if (errors.length === 0) {
      return "";
    }

    if (errors.length === 1) {
      return errors[0];
    }

    return `配置存在${errors.length}个问题：${errors.join("；")}`;
  }
}
