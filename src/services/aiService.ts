// AI服务模块 - 处理AI API调用和便签生成
export interface AIConfig {
  apiUrl: string;
  apiKey: string;
  aiModel: string;
  enableAI?: boolean; // 是否启用AI功能
  temperature?: number; // AI温度参数
  maxTokens?: number; // 最大token数
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

  constructor(config: AIConfig) {
    this.config = config;
  }

  // 更新AI配置
  updateConfig(config: AIConfig): void {
    this.config = config;
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

      const systemPrompt = `你是一个智能便签助手。根据用户的输入，生成结构化的便签内容。

请按照以下格式返回JSON数组，每个便签包含title（标题）、content（内容）、color（颜色，可选）、tags（标签数组，可选）：

[
  {
    "title": "便签标题",
    "content": "便签的详细内容",
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
3. 内容具体实用
4. 合理添加相关标签
5. 如果输入内容较多，可以拆分成多个便签
6. 确保返回的是有效的JSON格式`;

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

                  // 实时显示内容 - 直接将API响应内容显示在便签中
                  if (isStreamingNote) {
                    currentNoteContent += content;
                    callbacks.onContentChunk?.(currentNoteIndex, content, currentNoteContent);
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
            if (isStreamingNote) {
              callbacks.onNoteComplete?.(0, {
                title: "AI生成的内容",
                content: currentNoteContent,
                color: "#fef3c7"
              });
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
            title: "AI生成的内容",
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

// 默认AI配置
export const defaultAIConfig: AIConfig = {
  apiUrl: "",
  apiKey: "",
  aiModel: "",
  enableAI: true, // 默认启用（只要配置完整就可用）
  temperature: 0.7, // 默认温度值
  maxTokens: 1000, // 默认最大token数
};
