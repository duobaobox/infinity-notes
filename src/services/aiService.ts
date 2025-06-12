// AI服务模块 - 处理AI API调用和便签生成
export interface AIConfig {
  apiUrl: string;
  apiKey: string;
  aiModel: string;
  enableAI?: boolean; // 是否启用AI功能
  temperature?: number; // AI温度参数
  maxTokens?: number; // 最大token数
  systemPrompt?: string; // 系统提示词（空字符串表示无提示词模式，有内容表示自定义prompt模式）
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StickyNoteData {
  title: string;
  content: string;
  color?: string;
  tags?: string[];
}

// 简化的流式回调接口
export interface StreamingCallbacks {
  onNoteStart?: (noteIndex: number, title: string) => void;
  onContentChunk?: (noteIndex: number, chunk: string, fullContent: string) => void;
  onNoteComplete?: (noteIndex: number, note: StickyNoteData) => void;
  onAllComplete?: (notes: StickyNoteData[]) => void;
  onError?: (error: string) => void;
}



export class AIService {
  private config: AIConfig;
  private preconnectController: AbortController | null = null;
  private isPreconnected: boolean = false;
  private preconnectPromise: Promise<void> | null = null;

  constructor(config: AIConfig) {
    this.config = config;
  }

  // 更新AI配置
  updateConfig(config: AIConfig): void {
    console.log("🔄 AIService.updateConfig: 更新配置", {
      oldSystemPrompt: this.config.systemPrompt ? "已设置" : "未设置",
      newSystemPrompt: config.systemPrompt ? "已设置" : "未设置",
      oldSystemPromptLength: this.config.systemPrompt?.length || 0,
      newSystemPromptLength: config.systemPrompt?.length || 0
    });

    this.config = config;
    // 配置更新后重置预连接状态
    this.resetPreconnection();
  }

  // 预连接到AI服务 - 用户输入时调用
  async preconnectToAI(): Promise<void> {
    if (!this.validateConfig()) {
      console.log("⚠️ AI配置未完成，跳过预连接");
      return;
    }

    if (this.isPreconnected || this.preconnectPromise) {
      console.log("🔗 AI服务已预连接或正在连接中");
      return;
    }

    console.log("🚀 开始预连接到AI服务...");

    this.preconnectController = new AbortController();
    this.preconnectPromise = this.performPreconnect();

    try {
      await this.preconnectPromise;
      this.isPreconnected = true;
      console.log("✅ AI服务预连接成功");
    } catch (error) {
      console.warn("⚠️ AI服务预连接失败:", error);
      this.isPreconnected = false;
    } finally {
      this.preconnectPromise = null;
    }
  }

  // 执行预连接的具体逻辑
  private async performPreconnect(): Promise<void> {
    const baseUrl = this.config.apiUrl.endsWith("/")
      ? this.config.apiUrl.slice(0, -1)
      : this.config.apiUrl;
    const apiUrl = `${baseUrl}/chat/completions`;

    // 发送一个轻量级的预连接请求
    const preconnectRequest = {
      model: this.config.aiModel,
      messages: [
        { role: "system" as const, content: "预连接测试" },
        { role: "user" as const, content: "ping" }
      ],
      max_tokens: 1,
      temperature: 0,
      stream: false
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(preconnectRequest),
      signal: this.preconnectController?.signal
    });

    if (!response.ok) {
      throw new Error(`预连接失败: ${response.status}`);
    }

    // 读取响应以完成连接
    await response.json();
  }

  // 重置预连接状态
  private resetPreconnection(): void {
    if (this.preconnectController) {
      this.preconnectController.abort();
      this.preconnectController = null;
    }
    this.isPreconnected = false;
    this.preconnectPromise = null;
  }

  // 等待预连接完成（如果正在进行中）
  private async waitForPreconnection(): Promise<void> {
    if (this.preconnectPromise) {
      console.log("⏳ 等待预连接完成...");
      try {
        await this.preconnectPromise;
      } catch (error) {
        console.warn("⚠️ 预连接等待失败:", error);
      }
    }
  }

  // 验证配置是否有效
  validateConfig(): boolean {
    return !!(this.config.apiKey && this.config.apiUrl && this.config.aiModel);
  }

  // 测试API连接
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.validateConfig()) {
        return { success: false, error: "配置信息不完整" };
      }

      // 直接使用用户配置的API地址，确保URL拼接正确
      const baseUrl = this.config.apiUrl.endsWith("/")
        ? this.config.apiUrl.slice(0, -1)
        : this.config.apiUrl;
      const apiUrl = `${baseUrl}/chat/completions`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.aiModel,
          messages: [
            {
              role: "user",
              content: "Hello, this is a connection test.",
            },
          ],
          max_tokens: 10,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}`,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "连接失败",
      };
    }
  }

  // 真实流式生成便签内容 - 实时显示版本
  async generateStickyNotesStreaming(
    prompt: string,
    callbacks: StreamingCallbacks
  ): Promise<{
    success: boolean;
    notes?: StickyNoteData[];
    error?: string;
  }> {
    // 创建AbortController用于取消请求
    const abortController = new AbortController();
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    console.log("🚀 开始真实流式生成，prompt:", prompt);

    try {
      if (!this.validateConfig()) {
        const error = "AI配置未完成，请先在设置中配置AI服务";
        callbacks.onError?.(error);
        return { success: false, error };
      }

      // 等待预连接完成（如果正在进行中）
      await this.waitForPreconnection();

      // 构建消息数组，根据系统提示词内容决定模式
      const messages: AIMessage[] = [];

      // 获取当前的系统提示词设置
      const currentSystemPrompt = (this.config.systemPrompt || "").trim();
      const isNormalMode = currentSystemPrompt === "";

      // 调试日志：检查AI模式
      console.log("🎯 AI模式检查:", {
        systemPromptLength: currentSystemPrompt.length,
        isNormalMode: isNormalMode,
        mode: isNormalMode ? "正常对话模式" : "自定义prompt模式"
      });

      // 根据提示词内容决定是否添加系统消息
      if (!isNormalMode) {
        messages.push({ role: "system", content: currentSystemPrompt });
        console.log("✅ 使用自定义prompt模式，提示词长度:", currentSystemPrompt.length);
      } else {
        console.log("✅ 使用正常对话模式，直接与AI对话");
      }

      messages.push({ role: "user", content: prompt });

      // 构建API请求
      const baseUrl = this.config.apiUrl.endsWith("/")
        ? this.config.apiUrl.slice(0, -1)
        : this.config.apiUrl;
      const apiUrl = `${baseUrl}/chat/completions`;

      console.log("🌐 发送API请求:", {
        url: apiUrl,
        model: this.config.aiModel,
        stream: true
      });

      // 设置30秒超时
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 30000);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.aiModel,
          messages,
          max_tokens: this.config.maxTokens || 1000,
          temperature: this.config.temperature || 0.7,
          stream: true, // 启用流式响应
        }),
        signal: abortController.signal, // 添加取消信号
      });

      // 清除超时定时器
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        const error = errorData.error?.message || `API请求失败 (${response.status})`;
        callbacks.onError?.(error);
        return { success: false, error };
      }

      // 处理真实流式响应
      reader = response.body?.getReader() || null;
      if (!reader) {
        const error = "无法读取响应流";
        callbacks.onError?.(error);
        return { success: false, error };
      }

      console.log("📖 开始读取流式响应");
      let fullResponse = "";
      const decoder = new TextDecoder();

      // 流式状态管理
      let currentNoteIndex = 0;      let currentNoteContent = "";
      let isStreamingNote = false;
      let jsonBuffer = "";

      try {
        // 先创建第一个便签开始流式显示
        callbacks.onNoteStart?.(0, "AI正在生成...");
        isStreamingNote = true;

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("📖 流式响应读取完成");
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  jsonBuffer += content;

                  // 现在统一使用直接显示原始AI回复的方式
                  // 因为我们使用了简化的系统提示词，AI回复的都是自然语言
                  if (content && content !== currentNoteContent.slice(-content.length)) {
                    currentNoteContent += content;
                    if (isStreamingNote) {
                      callbacks.onContentChunk?.(currentNoteIndex, content, currentNoteContent);
                    }
                  }
                }
              } catch (e) {
                // 忽略解析错误，继续处理下一行
              }
            }
          }
        }

        // 流式响应完成，解析最终结果
        console.log("🔍 处理完整响应，长度:", fullResponse.length);

        // 现在统一使用智能解析方式
        // 先尝试JSON解析，失败则使用自然语言解析
        const finalNotes = this.parseResponseIntelligently(fullResponse);

        if (finalNotes.success && finalNotes.notes) {
          console.log("✅ 解析成功，共", finalNotes.notes.length, "个便签");

          // 如果只有一个便签，直接完成当前流式便签
          if (finalNotes.notes.length === 1) {
            const note = finalNotes.notes[0];
            // 更新标题
            callbacks.onNoteStart?.(0, note.title);
            // 完成便签
            callbacks.onNoteComplete?.(0, note);
          } else {
            // 多个便签的情况，需要重新组织显示
            // 先完成当前流式便签
            if (isStreamingNote && finalNotes.notes.length > 0) {
              const firstNote = finalNotes.notes[0];
              callbacks.onNoteStart?.(0, firstNote.title);
              callbacks.onNoteComplete?.(0, firstNote);
            }

            // 然后显示其他便签（如果有的话）
            for (let i = 1; i < finalNotes.notes.length; i++) {
              const note = finalNotes.notes[i];
              callbacks.onNoteStart?.(i, note.title);

              // 快速显示内容
              let content = "";
              for (let j = 0; j < note.content.length; j++) {
                content += note.content[j];
                callbacks.onContentChunk?.(i, note.content[j], content);
                // 较快的显示速度
                await new Promise(resolve => setTimeout(resolve, 10));
              }

              callbacks.onNoteComplete?.(i, note);
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }

          if (callbacks.onAllComplete) {
            callbacks.onAllComplete(finalNotes.notes);
          }
          return { success: true, notes: finalNotes.notes };
        } else {
          // 解析失败，但流式内容已经显示，创建一个便签保存内容
          const currentSystemPrompt = (this.config.systemPrompt || "").trim();
          const isNormalMode = currentSystemPrompt === "";

          const fallbackNote: StickyNoteData = {
            title: this.generateTitleFromContent(currentNoteContent || fullResponse),
            content: currentNoteContent || fullResponse,
            color: isNormalMode ? "#e3f2fd" : "#fef3c7" // 正常对话模式使用蓝色，自定义prompt模式使用黄色
          };

          callbacks.onNoteComplete?.(0, fallbackNote);
          if (callbacks.onAllComplete) {
            callbacks.onAllComplete([fallbackNote]);
          }
          return { success: true, notes: [fallbackNote] };
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "流式处理失败";
        console.error("❌ 流式处理异常:", error);
        callbacks.onError?.(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        // 确保正确清理资源
        if (reader) {
          try {
            reader.releaseLock();
            console.log("🔒 Reader锁已释放");
          } catch (e) {
            console.warn("⚠️ 释放Reader锁时出错:", e);
          }
        }

        // 取消任何未完成的请求
        if (!abortController.signal.aborted) {
          abortController.abort();
          console.log("🚫 请求已取消");
        }
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "AI请求失败";
      console.error("❌ AI请求异常:", error);
      callbacks.onError?.(errorMsg);

      // 确保在异常情况下也清理资源
      if (reader) {
        try {
          reader.releaseLock();
        } catch (e) {
          console.warn("⚠️ 异常情况下释放Reader锁时出错:", e);
        }
      }

      if (!abortController.signal.aborted) {
        abortController.abort();
      }

      return { success: false, error: errorMsg };
    }
  }

  // 智能解析AI回复的方法
  private parseResponseIntelligently(aiResponse: string): {
    success: boolean;
    notes?: StickyNoteData[];
    error?: string;
  } {
    try {
      const cleanResponse = aiResponse.trim();

      if (!cleanResponse) {
        return { success: false, error: "AI回复为空" };
      }

      console.log("🧠 智能解析AI回复:", {
        length: cleanResponse.length,
        preview: cleanResponse.substring(0, 100) + (cleanResponse.length > 100 ? '...' : '')
      });

      // 现在优先使用自然语言解析，因为我们已经简化了所有系统提示词
      // 只有在明确是JSON格式时才尝试JSON解析（兼容旧数据或特殊情况）
      if ((cleanResponse.startsWith('[') || cleanResponse.startsWith('{')) &&
          cleanResponse.includes('"title"') && cleanResponse.includes('"content"')) {
        try {
          let notes: StickyNoteData[];

          if (cleanResponse.startsWith('[')) {
            notes = JSON.parse(cleanResponse);
          } else {
            const parsed = JSON.parse(cleanResponse);
            if (parsed.notes && Array.isArray(parsed.notes)) {
              notes = parsed.notes;
            } else if (Array.isArray(parsed)) {
              notes = parsed;
            } else {
              notes = [parsed];
            }
          }

          // 验证便签数据格式
          const currentSystemPrompt = (this.config.systemPrompt || "").trim();
          const isNormalMode = currentSystemPrompt === "";
          const defaultColor = isNormalMode ? "#e3f2fd" : "#fef3c7";

          const validNotes = notes
            .filter((note) => typeof note === "object" && note.title && note.content)
            .map((note) => ({
              title: String(note.title).slice(0, 100),
              content: String(note.content).slice(0, 1000),
              color: note.color || defaultColor, // 根据模式使用不同的默认颜色
              tags: Array.isArray(note.tags) ? note.tags.slice(0, 5) : undefined,
            }));

          if (validNotes.length > 0) {
            console.log("✅ JSON解析成功，便签数量:", validNotes.length);
            return { success: true, notes: validNotes };
          }
        } catch (jsonError) {
          console.log("❌ JSON解析失败，使用自然语言解析");
        }
      }

      // 使用自然语言解析（现在是主要方式）
      const currentSystemPrompt = (this.config.systemPrompt || "").trim();
      const isNormalMode = currentSystemPrompt === "";

      const note: StickyNoteData = {
        title: this.generateTitleFromContent(cleanResponse),
        content: cleanResponse,
        color: isNormalMode ? "#e3f2fd" : "#fef3c7", // 正常对话模式使用蓝色，自定义prompt模式使用黄色
      };

      console.log("✅ 自然语言解析成功:", {
        title: note.title,
        contentLength: note.content.length,
        color: note.color
      });

      return { success: true, notes: [note] };
    } catch (error) {
      console.error("❌ 智能解析失败:", error);
      return { success: false, error: "解析AI回复失败" };
    }
  }


  // 从内容生成标题的辅助方法
  private generateTitleFromContent(content: string): string {
    if (!content || content.trim().length === 0) {
      return "AI便签";
    }

    // 移除Markdown格式符号
    let cleanContent = content
      .replace(/[#*`_~\[\]()]/g, '') // 移除Markdown符号
      .replace(/\n+/g, ' ') // 换行替换为空格
      .trim();

    // 提取第一行或前30个字符作为标题
    const firstLine = cleanContent.split('\n')[0] || cleanContent;
    const title = firstLine.length > 30
      ? firstLine.substring(0, 30) + '...'
      : firstLine;

    return title || "AI便签";
  }




  // 智能分析文本并提供建议
  async analyzeText(text: string): Promise<{
    success: boolean;
    suggestions?: {
      category: string;
      priority: "high" | "medium" | "low";
      color: string;
      tags: string[];
    };
    error?: string;
  }> {
    try {
      if (!this.validateConfig()) {
        return { success: false, error: "AI配置未完成" };
      }

      const analysisPrompt = `分析以下文本内容，返回分类建议：

文本内容：${text}

请返回JSON格式：
{
  "category": "分类（如：工作、学习、生活、想法等）",
  "priority": "优先级（high/medium/low）",
  "color": "建议颜色代码",
  "tags": ["相关标签数组"]
}`;

      // 直接使用用户配置的API地址，确保URL拼接正确
      const baseUrl = this.config.apiUrl.endsWith("/")
        ? this.config.apiUrl.slice(0, -1)
        : this.config.apiUrl;
      const apiUrl = `${baseUrl}/chat/completions`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.aiModel,
          messages: [{ role: "user", content: analysisPrompt }],
          max_tokens: Math.min(this.config.maxTokens || 1000, 500), // 分析功能限制最大500令牌
          temperature: Math.min(this.config.temperature || 0.7, 0.5), // 分析功能使用较低温度
        }),
      });

      if (!response.ok) {
        return { success: false, error: "分析请求失败" };
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;

      try {
        const suggestions = JSON.parse(aiResponse);
        return { success: true, suggestions };
      } catch {
        return { success: false, error: "分析结果解析失败" };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "分析失败",
      };
    }
  }
}

// AI服务单例
let aiServiceInstance: AIService | null = null;

// 深度比较配置是否发生变化的辅助函数
const isConfigChanged = (newConfig: AIConfig, oldConfig: AIConfig): boolean => {
  // 比较关键配置字段
  const keyFields: (keyof AIConfig)[] = [
    'apiUrl', 'apiKey', 'aiModel', 'temperature', 'maxTokens', 'systemPrompt'
  ];

  const changedFields = keyFields.filter(field => newConfig[field] !== oldConfig[field]);

  if (changedFields.length > 0) {
    console.log("🔍 配置变化检测:", {
      changedFields,
      oldSystemPrompt: oldConfig.systemPrompt ? `"${oldConfig.systemPrompt.substring(0, 50)}..."` : "空",
      newSystemPrompt: newConfig.systemPrompt ? `"${newConfig.systemPrompt.substring(0, 50)}..."` : "空"
    });
    return true;
  }

  return false;
};

export const getAIService = (config?: AIConfig): AIService => {
  if (!config) {
    throw new Error("AI服务未初始化，请提供配置信息");
  }

  // 如果没有实例，或者配置发生了变化，就创建/更新实例
  if (!aiServiceInstance || isConfigChanged(config, aiServiceInstance["config"])) {
    console.log("🔄 AI服务配置发生变化，更新实例");

    if (aiServiceInstance) {
      // 如果已有实例，使用updateConfig方法更新配置
      aiServiceInstance.updateConfig(config);
    } else {
      // 如果没有实例，创建新实例
      aiServiceInstance = new AIService(config);
    }
  }

  return aiServiceInstance;
};

// 默认系统提示词（简化版）
export const defaultSystemPrompt = `你是一个专业的个人助理，擅长帮助用户整理和记录信息。你的特点是：

- 回答简洁明了，重点突出
- 善于将复杂信息条理化
- 关注实用性和可操作性
- 语言友好亲切，但保持专业

请根据用户的需求，提供有用的信息和建议。`;

// 系统提示词预设模板
export const systemPromptTemplates = [
  {
    name: "正常对话模式",
    description: "直接与AI对话，获得原始API回复，不添加任何角色设定",
    prompt: "" // 空字符串表示正常对话模式
  },
  {
    name: "默认便签助手",
    description: "通用的便签生成助手，适合各种场景",
    prompt: defaultSystemPrompt
  },
  {
    name: "工作任务助手",
    description: "专注于工作任务和项目管理的便签生成",
    prompt: `你是一个专业的工作任务管理助手。你的特点是：

- 专注于工作效率和任务管理
- 善于分析任务优先级和紧急程度
- 提供具体可行的行动步骤
- 使用专业的项目管理术语
- 能够合理拆分复杂任务

请根据用户的工作需求，生成专业的任务管理建议和工作计划。回复要简洁明了，重点突出，包含具体的执行步骤和时间安排。`
  },
  {
    name: "学习笔记助手",
    description: "专门用于生成学习笔记和知识整理",
    prompt: `你是一个学习笔记整理专家。你的特点是：

- 善于提取关键知识点和概念
- 使用清晰的层次结构组织信息
- 提供具体例子和应用场景
- 添加记忆技巧和助记符
- 标注难度级别和重要程度

请根据用户的学习内容，生成结构化的学习笔记。回复要条理清晰，重点突出，便于理解和记忆。`
  },
  {
    name: "生活规划助手",
    description: "帮助整理生活事务和个人规划",
    prompt: `你是一个贴心的生活规划助手。你的特点是：

- 语言温馨友好，贴近生活
- 提供具体可行的建议
- 考虑时间安排的合理性
- 包含必要的提醒和注意事项
- 适当添加生活小贴士

请根据用户的生活需求，生成实用的生活建议和规划。回复要温馨实用，关注生活品质和个人成长。`
  },
  {
    name: "创意灵感助手",
    description: "激发创意思维，整理创意想法",
    prompt: `你是一个富有创意的灵感助手。你的特点是：

- 鼓励创新思维和想象力
- 提供具体的实现路径
- 分析创意的可行性和价值
- 激发更多相关联想
- 使用生动有趣的表达方式

请根据用户的想法，生成富有创意的内容和建议。回复要充满想象力，同时保持实用性，帮助用户将创意转化为可行的方案。`
  }
];

// 默认AI配置
export const defaultAIConfig: AIConfig = {
  apiUrl: "",
  apiKey: "",
  aiModel: "",
  enableAI: true, // 默认启用（只要配置完整就可用）
  temperature: 0.7, // 默认温度值
  maxTokens: 1000, // 默认最大token数
  systemPrompt: "", // 默认为无提示词模式（空字符串=正常API对话，有内容=自定义prompt回复）
};
