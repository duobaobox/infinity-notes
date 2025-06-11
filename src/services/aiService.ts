// AI服务模块 - 处理AI API调用和便签生成
export interface AIConfig {
  apiUrl: string;
  apiKey: string;
  aiModel: string;
  enableAI?: boolean; // 新增：是否启用AI功能
  temperature?: number; // 新增：AI温度参数
  maxTokens?: number; // 新增：最大token数
  streamingMode?: 'simulate' | 'websocket' | 'real' | 'auto'; // 新增：流式模式配置
  websocketUrl?: string; // 新增：WebSocket服务器地址
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

// 流式数据块类型
export interface StreamChunk {
  type: 'note_start' | 'content_chunk' | 'note_complete' | 'all_complete' | 'error';
  noteIndex?: number;
  title?: string;
  chunk?: string;
  fullContent?: string;
  note?: StickyNoteData;
  notes?: StickyNoteData[];
  error?: string;
  timestamp?: number;
}

// 流式生成便签内容的回调接口（保持向后兼容）
export interface StreamingCallbacks {
  onNoteStart?: (noteIndex: number, title: string) => void;
  onContentChunk?: (noteIndex: number, chunk: string, fullContent: string) => void;
  onNoteComplete?: (noteIndex: number, note: StickyNoteData) => void;
  onAllComplete?: (notes: StickyNoteData[]) => void;
  onError?: (error: string) => void;
}

// 新的流式处理接口
export interface StreamProcessor {
  processChunk(chunk: StreamChunk): void;
  onComplete?(): void;
  onError?(error: string): void;
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

  // 流式生成便签内容
  async generateStickyNotesStreaming(
    prompt: string,
    callbacks: StreamingCallbacks
  ): Promise<{
    success: boolean;
    notes?: StickyNoteData[];
    error?: string;
  }> {
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

      // 处理流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        const error = "无法读取响应流";
        callbacks.onError?.(error);
        return { success: false, error };
      }

      let fullResponse = "";
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

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
                  // 这里我们先收集完整响应，然后模拟流式效果
                }
              } catch (e) {
                // 忽略解析错误，继续处理下一行
              }
            }
          }
        }

        // 解析完整的JSON响应
        const notes = this.parseNotesResponse(fullResponse);
        if (!notes.success) {
          callbacks.onError?.(notes.error || "解析响应失败");
          return notes;
        }

        // 模拟流式效果，逐个便签逐字显示
        await this.simulateStreamingEffect(notes.notes!, callbacks);

        callbacks.onAllComplete?.(notes.notes!);
        return { success: true, notes: notes.notes };

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

  // 新的真实流式生成方法 - 使用AsyncGenerator
  async* generateStickyNotesStreamingReal(
    prompt: string
  ): AsyncGenerator<StreamChunk, void, unknown> {
    console.log("🔥 AsyncGenerator开始，prompt:", prompt);
    try {
      console.log("🔧 验证配置...");
      if (!this.validateConfig()) {
        console.error("❌ 配置验证失败");
        yield {
          type: 'error',
          error: "AI配置未完成，请先在设置中配置AI服务",
          timestamp: Date.now()
        };
        return;
      }
      console.log("✅ 配置验证通过");

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
        maxTokens: this.config.maxTokens || 1000,
        temperature: this.config.temperature || 0.7,
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

      console.log("📡 API响应状态:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        yield {
          type: 'error',
          error: errorData.error?.message || `API请求失败 (${response.status})`,
          timestamp: Date.now()
        };
        return;
      }

      // 处理真实的流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        console.error("❌ 无法获取响应流读取器");
        yield {
          type: 'error',
          error: "无法读取响应流",
          timestamp: Date.now()
        };
        return;
      }

      console.log("📖 开始读取流式响应");
      let fullResponse = "";
      const decoder = new TextDecoder();
      let currentNoteIndex = 0;
      let currentContent = "";
      let isInJsonBlock = false;
      let jsonBuffer = "";
      let chunkCount = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("📖 流式响应读取完成");
            break;
          }

          chunkCount++;
          const chunk = decoder.decode(value, { stream: true });
          console.log(`📖 收到第${chunkCount}个数据块，长度:`, chunk.length);
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

                  // 收集响应内容
                  fullResponse += content;
                }
              } catch (e) {
                // 忽略解析错误，继续处理下一行
              }
            }
          }
        }

        // 处理完整响应 - 立即开始流式显示
        console.log("🔍 处理完整响应，长度:", fullResponse.length);
        console.log("🔍 完整响应内容:", fullResponse.substring(0, 500) + (fullResponse.length > 500 ? "..." : ""));

        const finalNotes = this.parseNotesResponse(fullResponse);
        console.log("🔍 解析结果:", finalNotes);

        if (finalNotes.success && finalNotes.notes) {
          console.log("✅ 解析成功，立即开始流式显示", finalNotes.notes.length, "个便签");

          // 立即开始流式显示每个便签
          for (let i = 0; i < finalNotes.notes.length; i++) {
            const note = finalNotes.notes[i];

            console.log("🚀 开始流式显示便签:", i, note.title);

            // 便签开始
            yield {
              type: 'note_start',
              noteIndex: i,
              title: note.title,
              timestamp: Date.now()
            };

            // 逐字显示内容
            let currentContent = "";
            for (let j = 0; j < note.content.length; j++) {
              currentContent += note.content[j];
              yield {
                type: 'content_chunk',
                noteIndex: i,
                chunk: note.content[j],
                fullContent: currentContent,
                timestamp: Date.now()
              };

              // 控制打字速度
              const char = note.content[j];
              const delay = /[\u4e00-\u9fa5]/.test(char) ? 50 : 30;
              await new Promise(resolve => setTimeout(resolve, delay));
            }

            // 便签完成
            yield {
              type: 'note_complete',
              noteIndex: i,
              note: note,
              timestamp: Date.now()
            };

            // 便签之间的间隔
            if (i < finalNotes.notes.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }

          // 全部完成
          yield {
            type: 'all_complete',
            notes: finalNotes.notes,
            timestamp: Date.now()
          };
        } else {
          console.error("❌ 解析失败:", finalNotes.error);
          yield {
            type: 'error',
            error: finalNotes.error || "解析响应失败",
            timestamp: Date.now()
          };
        }

      } catch (error) {
        yield {
          type: 'error',
          error: error instanceof Error ? error.message : "流式处理失败",
          timestamp: Date.now()
        };
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : "AI请求失败",
        timestamp: Date.now()
      };
    }
  }

  // 解析部分JSON的辅助方法
  private parsePartialJson(jsonStr: string): StickyNoteData[] {
    try {
      // 尝试修复不完整的JSON
      let fixedJson = jsonStr;

      // 如果JSON不完整，尝试补全
      if (!fixedJson.endsWith(']')) {
        // 计算未闭合的对象数量
        const openBraces = (fixedJson.match(/\{/g) || []).length;
        const closeBraces = (fixedJson.match(/\}/g) || []).length;
        const missingBraces = openBraces - closeBraces;

        // 补全缺失的闭合括号
        for (let i = 0; i < missingBraces; i++) {
          fixedJson += '}';
        }

        if (!fixedJson.endsWith(']')) {
          fixedJson += ']';
        }
      }

      const parsed = JSON.parse(fixedJson);
      return Array.isArray(parsed) ? parsed.filter(note => note.title && note.content) : [];
    } catch (e) {
      return [];
    }
  }

  // 统一的流式生成方法 - 根据配置选择模式
  async generateStickyNotesStreamingUnified(
    prompt: string,
    callbacks: StreamingCallbacks
  ): Promise<{
    success: boolean;
    notes?: StickyNoteData[];
    error?: string;
  }> {
    const mode = this.config.streamingMode || 'auto';
    console.log("🚀 开始统一流式生成，模式:", mode, "prompt:", prompt);

    // 根据配置选择流式模式
    switch (mode) {
      case 'real':
        console.log("📡 使用真实流式模式");
        return this.handleRealStreaming(prompt, callbacks);
      case 'websocket':
        console.log("🔌 使用WebSocket流式模式");
        return this.handleWebSocketStreaming(prompt, callbacks);
      case 'simulate':
        console.log("🎭 使用模拟流式模式");
        return this.generateStickyNotesStreaming(prompt, callbacks);
      case 'auto':
      default:
        console.log("🤖 使用自动选择模式，优先真实流式");
        // 自动选择：优先使用真实流式，失败时回退到模拟
        try {
          return await this.handleRealStreaming(prompt, callbacks);
        } catch (error) {
          console.warn('真实流式处理失败，回退到模拟模式:', error);
          return this.generateStickyNotesStreaming(prompt, callbacks);
        }
    }
  }

  // 处理真实流式的包装方法
  private async handleRealStreaming(
    prompt: string,
    callbacks: StreamingCallbacks
  ): Promise<{
    success: boolean;
    notes?: StickyNoteData[];
    error?: string;
  }> {
    console.log("📡 开始真实流式处理");
    try {
      const streamGenerator = this.generateStickyNotesStreamingReal(prompt);
      let finalNotes: StickyNoteData[] = [];
      let chunkCount = 0;

      console.log("📡 开始迭代流式数据");
      for await (const chunk of streamGenerator) {
        chunkCount++;
        console.log(`📡 收到第${chunkCount}个数据块:`, chunk.type, chunk);

        switch (chunk.type) {
          case 'note_start':
            if (chunk.noteIndex !== undefined && chunk.title) {
              console.log("📝 便签开始:", chunk.noteIndex, chunk.title);
              callbacks.onNoteStart?.(chunk.noteIndex, chunk.title);
            }
            break;
          case 'content_chunk':
            if (chunk.noteIndex !== undefined && chunk.chunk && chunk.fullContent) {
              console.log("📝 内容块:", chunk.noteIndex, chunk.chunk);
              callbacks.onContentChunk?.(chunk.noteIndex, chunk.chunk, chunk.fullContent);
            }
            break;
          case 'note_complete':
            if (chunk.noteIndex !== undefined && chunk.note) {
              console.log("✅ 便签完成:", chunk.noteIndex, chunk.note);
              callbacks.onNoteComplete?.(chunk.noteIndex, chunk.note);
            }
            break;
          case 'all_complete':
            if (chunk.notes) {
              console.log("🎉 全部完成:", chunk.notes.length, "个便签");
              finalNotes = chunk.notes;
              callbacks.onAllComplete?.(chunk.notes);
            }
            break;
          case 'error':
            if (chunk.error) {
              console.error("❌ 流式处理错误:", chunk.error);
              callbacks.onError?.(chunk.error);
              return { success: false, error: chunk.error };
            }
            break;
        }
      }

      console.log("📡 流式处理完成，总共处理了", chunkCount, "个数据块");
      return { success: true, notes: finalNotes };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "真实流式处理失败";
      console.error("❌ 真实流式处理异常:", error);
      callbacks.onError?.(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  // WebSocket流式处理（占位符，第二阶段实现）
  private async handleWebSocketStreaming(
    prompt: string,
    callbacks: StreamingCallbacks
  ): Promise<{
    success: boolean;
    notes?: StickyNoteData[];
    error?: string;
  }> {
    // TODO: 第二阶段实现WebSocket流式处理
    console.warn('WebSocket流式处理尚未实现，回退到真实流式模式');
    return this.handleRealStreaming(prompt, callbacks);
  }

  // 模拟流式效果的私有方法
  private async simulateStreamingEffect(
    notes: StickyNoteData[],
    callbacks: StreamingCallbacks
  ): Promise<void> {
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      callbacks.onNoteStart?.(i, note.title);

      // 逐字显示内容
      let currentContent = "";
      const content = note.content;

      for (let j = 0; j < content.length; j++) {
        currentContent += content[j];
        callbacks.onContentChunk?.(i, content[j], currentContent);

        // 控制打字速度，中文字符稍慢，英文和符号较快
        const char = content[j];
        const delay = /[\u4e00-\u9fa5]/.test(char) ? 50 : 30; // 中文50ms，其他30ms
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      callbacks.onNoteComplete?.(i, note);

      // 便签之间的间隔
      if (i < notes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
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
  streamingMode: 'auto', // 默认自动选择流式模式
  websocketUrl: '', // WebSocket服务器地址（第二阶段使用）
};
