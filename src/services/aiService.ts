// AI服务模块 - 处理AI API调用和便签生成
export interface AIConfig {
  apiUrl: string;
  apiKey: string;
  aiModel: string;
  enableAI?: boolean; // 是否启用AI功能
  temperature?: number; // AI温度参数
  maxTokens?: number; // 最大token数
  systemPrompt?: string; // 自定义系统提示词
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
    console.log("🚀 开始真实流式生成，prompt:", prompt);

    try {
      if (!this.validateConfig()) {
        const error = "AI配置未完成，请先在设置中配置AI服务";
        callbacks.onError?.(error);
        return { success: false, error };
      }

      // 等待预连接完成（如果正在进行中）
      await this.waitForPreconnection();

      // 使用用户自定义的系统提示词，如果没有则使用默认的
      const systemPrompt = this.config.systemPrompt || defaultSystemPrompt;

      const messages: AIMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ];

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
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error = errorData.error?.message || `API请求失败 (${response.status})`;
        callbacks.onError?.(error);
        return { success: false, error };
      }

      // 处理真实流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        const error = "无法读取响应流";
        callbacks.onError?.(error);
        return { success: false, error };
      }

      console.log("📖 开始读取流式响应");
      let fullResponse = "";
      const decoder = new TextDecoder();

      // 流式状态管理
      let currentNoteIndex = 0;
      let currentNoteContent = "";
      let isStreamingNote = false;
      let streamingNoteTitle = "";
      let jsonBuffer = "";
      let isInContentField = false;
      let contentStarted = false;

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

                  // 尝试实时提取content字段的内容进行流式显示
                  const extractedContent = this.extractContentFromPartialJson(jsonBuffer);
                  if (extractedContent && extractedContent !== currentNoteContent) {
                    // 只显示新增的内容部分
                    const newContent = extractedContent.substring(currentNoteContent.length);
                    currentNoteContent = extractedContent;

                    if (isStreamingNote && newContent) {
                      callbacks.onContentChunk?.(currentNoteIndex, newContent, currentNoteContent);
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
        const finalNotes = this.parseNotesResponse(fullResponse);

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
          const fallbackNote: StickyNoteData = {
            title: this.generateTitleFromContent(currentNoteContent || fullResponse),
            content: currentNoteContent || fullResponse,
            color: "#fef3c7"
          };

          callbacks.onNoteComplete?.(0, fallbackNote);
          if (callbacks.onAllComplete) {
            callbacks.onAllComplete([fallbackNote]);
          }
          return { success: true, notes: [fallbackNote] };
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "流式处理失败";
        callbacks.onError?.(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "AI请求失败";
      callbacks.onError?.(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  // 从部分JSON中提取content字段的方法
  private extractContentFromPartialJson(jsonStr: string): string {
    try {
      // 尝试找到content字段的值
      const contentMatch = jsonStr.match(/"content"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
      if (contentMatch) {
        // 解码转义字符
        return contentMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }

      // 如果找不到完整的content字段，尝试部分匹配
      const partialMatch = jsonStr.match(/"content"\s*:\s*"([^"]*)/);
      if (partialMatch) {
        return partialMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }

      return "";
    } catch (e) {
      return "";
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

  // 解析便签响应的私有方法
  private parseNotesResponse(aiResponse: string): {
    success: boolean;
    notes?: StickyNoteData[];
    error?: string;
  } {
    try {
      // 尝试解析JSON响应
      let notes: StickyNoteData[];

      // 检查是否是JSON数组格式
      if (aiResponse.trim().startsWith("[")) {
        notes = JSON.parse(aiResponse);
      } else {
        // 尝试提取JSON对象中的数组
        const parsed = JSON.parse(aiResponse);
        if (parsed.notes && Array.isArray(parsed.notes)) {
          notes = parsed.notes;
        } else if (Array.isArray(parsed)) {
          notes = parsed;
        } else {
          // 如果不是预期格式，创建单个便签
          notes = [
            {
              title: "AI生成的便签",
              content: aiResponse,
              color: "#fef3c7",
            },
          ];
        }
      }

      // 验证便签数据格式
      const validNotes = notes
        .filter(
          (note) => typeof note === "object" && note.title && note.content
        )
        .map((note) => ({
          title: String(note.title).slice(0, 100), // 限制标题长度
          content: String(note.content).slice(0, 1000), // 限制内容长度
          color: note.color || "#fef3c7",
          tags: Array.isArray(note.tags) ? note.tags.slice(0, 5) : undefined,
        }));

      if (validNotes.length === 0) {
        return { success: false, error: "AI生成的内容格式不正确" };
      }

      return { success: true, notes: validNotes };
    } catch (parseError) {
      // 如果JSON解析失败，创建单个便签
      return {
        success: true,
        notes: [
          {
            title: "AI生成的便签",
            content: aiResponse,
            color: "#fef3c7",
          },
        ],
      };
    }
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

export const getAIService = (config?: AIConfig): AIService => {
  if (
    !aiServiceInstance ||
    (config && config !== aiServiceInstance["config"])
  ) {
    if (!config) {
      throw new Error("AI服务未初始化，请提供配置信息");
    }
    aiServiceInstance = new AIService(config);
  }
  return aiServiceInstance;
};

// 默认系统提示词
export const defaultSystemPrompt = `你是一个智能便签助手。根据用户的输入，生成结构化的便签内容。

请按照以下格式返回JSON数组，每个便签包含title（标题）、content（内容）、color（颜色，可选）、tags（标签数组，可选）：

[
  {
    "title": "便签标题",
    "content": "便签的详细内容，使用Markdown格式",
    "color": "#fef3c7",
    "tags": ["标签1", "标签2"]
  }
]

颜色选项：
- #fef3c7 (黄色，适合一般记录)
- #dbeafe (蓝色，适合重要事项)
- #d1fae5 (绿色，适合完成任务)
- #fce7f3 (粉色，适合个人事务)
- #e9d5ff (紫色，适合创意想法)

要求：
1. 根据内容类型选择合适的颜色
2. 每个便签标题简洁明了
3. 内容具体实用，支持Markdown格式
4. 合理添加相关标签
5. 如果输入内容较多，可以拆分成多个便签
6. 确保返回的是有效的JSON格式

示例：
用户输入："明天要开会"
返回：[{"title": "明天会议提醒", "content": "📅 **明天会议提醒**\\n\\n⏰ 时间：待确认\\n📍 地点：待确认\\n📋 议题：待确认\\n\\n💡 记得提前准备相关资料", "color": "#dbeafe", "tags": ["会议", "提醒"]}]`;

// 系统提示词预设模板
export const systemPromptTemplates = [
  {
    name: "默认便签助手",
    description: "通用的便签生成助手，适合各种场景",
    prompt: defaultSystemPrompt
  },
  {
    name: "工作任务助手",
    description: "专注于工作任务和项目管理的便签生成",
    prompt: `你是一个专业的工作任务管理助手。根据用户输入，生成工作相关的便签内容。

请按照以下格式返回JSON数组：
[
  {
    "title": "任务标题",
    "content": "任务详细描述，包含优先级、截止时间、负责人等信息",
    "color": "#dbeafe",
    "tags": ["工作", "任务", "优先级"]
  }
]

颜色规则：
- #ff6b6b (红色) - 紧急重要任务
- #ffa726 (橙色) - 重要但不紧急
- #dbeafe (蓝色) - 一般工作任务
- #d1fae5 (绿色) - 已完成或低优先级

要求：
1. 明确任务的优先级和紧急程度
2. 包含具体的行动步骤
3. 标注截止时间和负责人（如果提到）
4. 使用专业的项目管理术语
5. 合理拆分复杂任务为子任务`
  },
  {
    name: "学习笔记助手",
    description: "专门用于生成学习笔记和知识整理",
    prompt: `你是一个学习笔记整理专家。根据用户的学习内容，生成结构化的学习笔记。

请按照以下格式返回JSON数组：
[
  {
    "title": "知识点标题",
    "content": "详细的学习笔记，使用Markdown格式，包含要点、例子、总结",
    "color": "#e9d5ff",
    "tags": ["学习", "笔记", "知识点"]
  }
]

颜色规则：
- #e9d5ff (紫色) - 理论知识
- #dbeafe (蓝色) - 实践技能
- #d1fae5 (绿色) - 已掌握内容
- #fef3c7 (黄色) - 需要复习

要求：
1. 提取关键知识点和概念
2. 使用清晰的层次结构
3. 包含具体例子和应用场景
4. 添加记忆技巧或助记符
5. 标注难度级别和重要程度`
  },
  {
    name: "生活规划助手",
    description: "帮助整理生活事务和个人规划",
    prompt: `你是一个贴心的生活规划助手。根据用户的生活需求，生成实用的生活便签。

请按照以下格式返回JSON数组：
[
  {
    "title": "生活事项标题",
    "content": "详细的生活安排或建议，温馨实用",
    "color": "#fce7f3",
    "tags": ["生活", "规划", "日常"]
  }
]

颜色规则：
- #fce7f3 (粉色) - 个人生活事务
- #fef3c7 (黄色) - 日常提醒
- #d1fae5 (绿色) - 健康相关
- #dbeafe (蓝色) - 重要安排

要求：
1. 语言温馨友好，贴近生活
2. 提供具体可行的建议
3. 考虑时间安排的合理性
4. 包含必要的提醒和注意事项
5. 适当添加生活小贴士`
  },
  {
    name: "创意灵感助手",
    description: "激发创意思维，整理创意想法",
    prompt: `你是一个富有创意的灵感助手。根据用户的想法，生成富有创意的便签内容。

请按照以下格式返回JSON数组：
[
  {
    "title": "创意标题",
    "content": "详细的创意描述，包含实现思路和发展方向",
    "color": "#e9d5ff",
    "tags": ["创意", "灵感", "想法"]
  }
]

颜色规则：
- #e9d5ff (紫色) - 创意想法
- #fce7f3 (粉色) - 艺术创作
- #fef3c7 (黄色) - 商业创意
- #d1fae5 (绿色) - 可行性高的想法

要求：
1. 鼓励创新思维和想象力
2. 提供具体的实现路径
3. 分析创意的可行性和价值
4. 激发更多相关联想
5. 使用生动有趣的表达方式`
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
  systemPrompt: defaultSystemPrompt, // 默认系统提示词
};
