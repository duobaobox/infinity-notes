// AI错误处理工具 - 统一的错误处理和用户友好的错误消息
import { message } from 'antd';

/**
 * AI错误类型枚举
 */
export enum AIErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * AI错误接口
 */
export interface AIError {
  type: AIErrorType;
  message: string;
  originalError?: Error;
  suggestions?: string[];
}

/**
 * AI错误处理器
 */
export class AIErrorHandler {
  /**
   * 解析错误并返回用户友好的错误信息
   */
  static parseError(error: any): AIError {
    // 网络错误
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        type: AIErrorType.NETWORK_ERROR,
        message: '网络连接失败，请检查网络连接或API地址是否正确',
        originalError: error,
        suggestions: [
          '检查网络连接是否正常',
          '确认API地址格式正确',
          '检查是否需要代理或VPN'
        ]
      };
    }

    // 认证错误
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      return {
        type: AIErrorType.AUTH_ERROR,
        message: 'API密钥无效或已过期，请检查API密钥是否正确',
        originalError: error,
        suggestions: [
          '检查API密钥是否正确输入',
          '确认API密钥是否已过期',
          '联系AI服务提供商确认账户状态'
        ]
      };
    }

    // API错误
    if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
      return {
        type: AIErrorType.API_ERROR,
        message: '请求参数错误，请检查AI模型名称和其他配置',
        originalError: error,
        suggestions: [
          '检查AI模型名称是否正确',
          '确认API地址是否支持所选模型',
          '检查温度和Token参数是否在有效范围内'
        ]
      };
    }

    // 配置错误
    if (error.message?.includes('配置') || error.message?.includes('validation')) {
      return {
        type: AIErrorType.CONFIG_ERROR,
        message: error.message || '配置验证失败',
        originalError: error,
        suggestions: [
          '检查所有必填字段是否已填写',
          '确认API地址格式正确',
          '验证API密钥和模型名称'
        ]
      };
    }

    // 验证错误
    if (error.message?.includes('请输入') || error.message?.includes('请选择')) {
      return {
        type: AIErrorType.VALIDATION_ERROR,
        message: error.message,
        originalError: error,
        suggestions: [
          '完善所有必填的配置项',
          '检查输入格式是否正确'
        ]
      };
    }

    // 未知错误
    return {
      type: AIErrorType.UNKNOWN_ERROR,
      message: error.message || '发生未知错误，请稍后重试',
      originalError: error,
      suggestions: [
        '稍后重试',
        '检查控制台是否有详细错误信息',
        '联系技术支持'
      ]
    };
  }

  /**
   * 显示错误消息给用户
   */
  static showError(error: any, context?: string): void {
    const aiError = this.parseError(error);
    
    // 根据错误类型选择不同的显示方式
    switch (aiError.type) {
      case AIErrorType.NETWORK_ERROR:
        message.error({
          content: `${context ? context + ': ' : ''}${aiError.message}`,
          duration: 6,
        });
        break;
        
      case AIErrorType.AUTH_ERROR:
        message.error({
          content: `${context ? context + ': ' : ''}${aiError.message}`,
          duration: 8,
        });
        break;
        
      case AIErrorType.CONFIG_ERROR:
      case AIErrorType.VALIDATION_ERROR:
        message.warning({
          content: `${context ? context + ': ' : ''}${aiError.message}`,
          duration: 5,
        });
        break;
        
      default:
        message.error({
          content: `${context ? context + ': ' : ''}${aiError.message}`,
          duration: 4,
        });
    }

    // 在开发环境下输出详细错误信息
    if (process.env.NODE_ENV === 'development') {
      console.error('AI Error Details:', {
        type: aiError.type,
        message: aiError.message,
        suggestions: aiError.suggestions,
        originalError: aiError.originalError
      });
    }
  }

  /**
   * 显示成功消息
   */
  static showSuccess(message_text: string, context?: string): void {
    message.success({
      content: `${context ? context + ': ' : ''}${message_text}`,
      duration: 3,
    });
  }

  /**
   * 显示警告消息
   */
  static showWarning(message_text: string, context?: string): void {
    message.warning({
      content: `${context ? context + ': ' : ''}${message_text}`,
      duration: 4,
    });
  }

  /**
   * 显示信息消息
   */
  static showInfo(message_text: string, context?: string): void {
    message.info({
      content: `${context ? context + ': ' : ''}${message_text}`,
      duration: 3,
    });
  }

  /**
   * 获取错误的建议解决方案
   */
  static getSuggestions(error: any): string[] {
    const aiError = this.parseError(error);
    return aiError.suggestions || [];
  }

  /**
   * 检查错误是否可以自动重试
   */
  static isRetryable(error: any): boolean {
    const aiError = this.parseError(error);
    return aiError.type === AIErrorType.NETWORK_ERROR || 
           aiError.type === AIErrorType.UNKNOWN_ERROR;
  }

  /**
   * 获取错误的严重程度
   */
  static getSeverity(error: any): 'low' | 'medium' | 'high' {
    const aiError = this.parseError(error);
    
    switch (aiError.type) {
      case AIErrorType.AUTH_ERROR:
      case AIErrorType.CONFIG_ERROR:
        return 'high';
        
      case AIErrorType.API_ERROR:
      case AIErrorType.VALIDATION_ERROR:
        return 'medium';
        
      default:
        return 'low';
    }
  }
}

/**
 * 便捷的错误处理函数
 */
export const handleAIError = (error: any, context?: string) => {
  AIErrorHandler.showError(error, context);
};

export const showAISuccess = (message: string, context?: string) => {
  AIErrorHandler.showSuccess(message, context);
};

export const showAIWarning = (message: string, context?: string) => {
  AIErrorHandler.showWarning(message, context);
};

export const showAIInfo = (message: string, context?: string) => {
  AIErrorHandler.showInfo(message, context);
};
