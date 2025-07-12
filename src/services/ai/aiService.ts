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
  // 新增：思维链相关数据
  thinkingChain?: {
    id: string;
    prompt: string;
    steps: Array<{
      id: string;
      content: string;
      stepType: "analysis" | "reasoning" | "conclusion" | "question" | "idea";
      timestamp: Date;
      order: number;
    }>;
    finalAnswer: string;
    totalThinkingTime: number;
    createdAt: Date;
  };
  hasThinking?: boolean;
}

// 简化的流式回调接口
export interface StreamingCallbacks {
  onNoteStart?: (noteIndex: number, title: string) => void;
  onContentChunk?: (
    noteIndex: number,
    chunk: string,
    fullContent: string
  ) => void;
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

  // 获取当前配置
  getConfig(): AIConfig {
    return { ...this.config };
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
      return;
    }

    if (this.isPreconnected || this.preconnectPromise) {
      return;
    }

    this.preconnectController = new AbortController();
    this.preconnectPromise = this.performPreconnect();

    try {
      await this.preconnectPromise;
      this.isPreconnected = true;
    } catch (error) {
      console.warn("AI服务预连接失败:", error);
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
    const preconnectRequest: any = {
      model: this.config.aiModel,
      messages: [
        { role: "system" as const, content: "预连接测试" },
        { role: "user" as const, content: "ping" },
      ],
      max_tokens: 1,
      temperature: 0,
      stream: false,
    };

    // 对于支持思维链的模型（如阿里百炼），在非流式调用中必须禁用思维链
    if (
      this.config.apiUrl.includes("dashscope.aliyuncs.com") ||
      this.config.apiUrl.includes("bailian") ||
      this.config.aiModel.includes("qwen")
    ) {
      preconnectRequest.enable_thinking = false;
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(preconnectRequest),
      signal: this.preconnectController?.signal,
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
      console.log("🔗 开始测试AI连接...");

      if (!this.validateConfig()) {
        return { success: false, error: "配置信息不完整" };
      }

      // 直接使用用户配置的API地址，确保URL拼接正确
      const baseUrl = this.config.apiUrl.endsWith("/")
        ? this.config.apiUrl.slice(0, -1)
        : this.config.apiUrl;
      const apiUrl = `${baseUrl}/chat/completions`;

      // 构建请求体，确保非流式调用时禁用思维链功能
      const requestBody: any = {
        model: this.config.aiModel,
        messages: [
          {
            role: "user",
            content: "Hello, this is a connection test.",
          },
        ],
        max_tokens: 10,
        temperature: 0.1,
        stream: false, // 明确指定非流式调用
      };

      // 对于支持思维链的模型（如阿里百炼），在非流式调用中必须禁用思维链
      // 检查是否为阿里百炼或其他需要特殊处理的API
      if (
        this.config.apiUrl.includes("dashscope.aliyuncs.com") ||
        this.config.apiUrl.includes("bailian") ||
        this.config.aiModel.includes("qwen")
      ) {
        requestBody.enable_thinking = false;
        console.log("🧠 阿里百炼API：测试连接时禁用思维链");
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ 连接测试失败:", errorData);
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}`,
        };
      }

      console.log("✅ 连接测试成功");
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
    callbacks: StreamingCallbacks,
    options?: { showThinkingMode?: boolean } // 新增：选项参数
  ): Promise<{
    success: boolean;
    notes?: StickyNoteData[];
    error?: string;
  }> {
    // 创建AbortController用于取消请求
    const abortController = new AbortController();
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    console.log("🚀 开始AI流式生成，prompt:", prompt.substring(0, 50) + "...");

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

      // 根据提示词内容决定是否添加系统消息
      if (!isNormalMode) {
        messages.push({ role: "system", content: currentSystemPrompt });
        console.log(
          "📝 使用自定义prompt模式，提示词长度:",
          currentSystemPrompt.length
        );
      } else {
        console.log("💬 使用正常对话模式");
      }

      messages.push({ role: "user", content: prompt });

      // 构建API请求
      const baseUrl = this.config.apiUrl.endsWith("/")
        ? this.config.apiUrl.slice(0, -1)
        : this.config.apiUrl;
      const apiUrl = `${baseUrl}/chat/completions`;

      // 设置30秒超时
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 30000);

      // 构建请求体，根据思维模式设置决定是否启用思维链
      const requestBody: any = {
        model: this.config.aiModel,
        messages,
        max_tokens: this.config.maxTokens || 1000,
        temperature: this.config.temperature || 0.7,
        stream: true, // 启用流式响应
      };

      // 对于支持思维链的模型（如阿里百炼），根据用户设置决定是否启用思维链
      // 在流式调用中，可以根据showThinkingMode参数来控制
      if (
        this.config.apiUrl.includes("dashscope.aliyuncs.com") ||
        this.config.apiUrl.includes("bailian") ||
        this.config.aiModel.includes("qwen")
      ) {
        // 流式调用中，根据用户的思维模式设置来决定是否启用思维链
        const showThinkingMode = options?.showThinkingMode ?? true;
        requestBody.enable_thinking = showThinkingMode;
        console.log(
          "🧠 阿里百炼思维链设置:",
          showThinkingMode ? "启用" : "禁用"
        );
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal, // 添加取消信号
      });

      // 清除超时定时器
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        const error =
          errorData.error?.message || `API请求失败 (${response.status})`;
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

      let fullResponse = "";
      const decoder = new TextDecoder();

      // 流式状态管理
      const currentNoteIndex = 0;
      let currentNoteContent = "";
      let isStreamingNote = false;
      // jsonBuffer 用于调试，当前版本暂时不使用
      // let jsonBuffer = "";

      // 思考过程状态管理
      let thinkingContent = ""; // 存储思考过程内容
      let hasStartedThinking = false; // 是否已开始显示思考过程
      let hasFinishedThinking = false; // 是否已完成思考过程
      let displayedContent = ""; // 当前显示的完整内容（思考过程 + 答案）
      const showThinkingMode = options?.showThinkingMode ?? true; // 获取思维模式设置

      try {
        // 先创建第一个便签开始流式显示
        callbacks.onNoteStart?.(0, "AI正在生成...");
        isStreamingNote = true;

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("✅ 流式响应读取完成，开始解析内容");
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                // 检查是否有DeepSeek的reasoning_content字段
                const reasoningContent =
                  parsed.choices?.[0]?.delta?.reasoning_content;

                if (content) {
                  fullResponse += content;
                  // jsonBuffer 用于调试，但当前未使用
                  // jsonBuffer += content;

                  // 现在统一使用直接显示原始AI回复的方式
                  // 因为我们使用了简化的系统提示词，AI回复的都是自然语言
                  if (
                    content &&
                    content !== currentNoteContent.slice(-content.length)
                  ) {
                    currentNoteContent += content;

                    if (isStreamingNote) {
                      // 如果开启了思维模式且有思考过程，需要在思考过程后显示答案
                      if (showThinkingMode && hasStartedThinking) {
                        // 如果还没有添加分隔线，说明思考刚完成，添加分隔线
                        if (!hasFinishedThinking) {
                          hasFinishedThinking = true;
                          const separator = "\n\n---\n\n## ✨ 最终答案\n\n";
                          displayedContent += separator;
                          callbacks.onContentChunk?.(
                            currentNoteIndex,
                            separator,
                            displayedContent
                          );
                        }

                        // 添加答案内容
                        displayedContent += content;
                        callbacks.onContentChunk?.(
                          currentNoteIndex,
                          content,
                          displayedContent
                        );
                      } else {
                        // 没有思考过程或关闭了思维模式，直接显示内容
                        displayedContent += content;
                        callbacks.onContentChunk?.(
                          currentNoteIndex,
                          content,
                          displayedContent
                        );
                      }
                    }
                  }
                }

                // 如果有reasoning_content，根据思维模式设置决定是否显示
                if (reasoningContent) {
                  // 只在第一次检测到时记录日志，避免重复输出
                  if (!hasStartedThinking) {
                    console.log("🧠 检测到思维链内容，开始流式显示");
                  }
                  // 将reasoning_content添加到完整响应中
                  if (!fullResponse.includes("<think>")) {
                    fullResponse =
                      `<think>${reasoningContent}</think>\n` + fullResponse;
                  } else {
                    // 更新现有的thinking标签内容
                    const thinkingMatch = fullResponse.match(
                      /<think>([\s\S]*?)<\/think>/
                    );
                    if (thinkingMatch) {
                      const existingThinking = thinkingMatch[1];
                      fullResponse = fullResponse.replace(
                        /<think>[\s\S]*?<\/think>/,
                        `<think>${existingThinking}${reasoningContent}</think>`
                      );
                    }
                  }

                  // 只有在开启思维模式时才实时流式显示思考过程
                  if (showThinkingMode) {
                    thinkingContent += reasoningContent;

                    if (!hasStartedThinking && isStreamingNote) {
                      // 第一次检测到思考内容，显示思考标题
                      // 🔧 修改：使用与最终格式一致的标题，提示用户这是思考过程
                      hasStartedThinking = true;
                      displayedContent = "🤔 **AI正在思考中...**\n\n";
                      callbacks.onContentChunk?.(
                        currentNoteIndex,
                        displayedContent,
                        displayedContent
                      );
                    }

                    if (isStreamingNote && hasStartedThinking) {
                      // 实时追加思考内容，保持自然的流式体验
                      displayedContent += reasoningContent;
                      callbacks.onContentChunk?.(
                        currentNoteIndex,
                        reasoningContent,
                        displayedContent
                      );
                    }
                  }
                }
              } catch (parseError) {
                // 忽略解析错误，继续处理下一行
                console.debug("JSON解析错误:", parseError);
              }
            }
          }
        }

        // 流式响应完成，解析最终结果
        console.log("🔍 处理完整响应，长度:", fullResponse.length);
        console.log(
          "🔍 完整响应内容预览:",
          fullResponse.substring(0, 500) + "..."
        );

        // 现在统一使用智能解析方式
        // 先尝试JSON解析，失败则使用自然语言解析
        const finalNotes = this.parseResponseIntelligently(
          fullResponse,
          prompt,
          showThinkingMode
        );

        if (finalNotes.success && finalNotes.notes) {
          console.log("✅ 内容解析成功，便签数量:", finalNotes.notes.length);
          // 如果只有一个便签，直接完成当前流式便签
          if (finalNotes.notes.length === 1) {
            const note = finalNotes.notes[0];

            // 🔧 修复：始终使用解析后的标准格式化内容，确保折叠功能生效
            // 不再使用流式显示的临时内容，而是使用经过formatThinkingChainAsMarkdown格式化的内容
            console.log("📝 使用解析后的标准格式化内容（支持折叠）");
            // note.content 已经是经过 formatThinkingChainAsMarkdown 处理的内容

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
                await new Promise((resolve) => setTimeout(resolve, 10));
              }

              callbacks.onNoteComplete?.(i, note);
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }

          if (callbacks.onAllComplete) {
            callbacks.onAllComplete(finalNotes.notes);
          }
          return { success: true, notes: finalNotes.notes };
        } else {
          // 解析失败，但流式内容已经显示，创建一个便签保存内容
          const fallbackNote: StickyNoteData = {
            title: this.generateTitleFromContent(
              currentNoteContent || fullResponse
            ),
            content: currentNoteContent || fullResponse,
            // 🔧 不设置颜色，让前端使用临时便签的颜色
          };

          callbacks.onNoteComplete?.(0, fallbackNote);
          if (callbacks.onAllComplete) {
            callbacks.onAllComplete([fallbackNote]);
          }
          return { success: true, notes: [fallbackNote] };
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "流式处理失败";
        console.error("❌ 流式处理异常:", error);
        callbacks.onError?.(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        // 确保正确清理资源
        if (reader) {
          try {
            reader.releaseLock();
          } catch (e) {
            console.warn("⚠️ 释放Reader锁时出错:", e);
          }
        }

        // 取消任何未完成的请求
        if (!abortController.signal.aborted) {
          abortController.abort();
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
  private parseResponseIntelligently(
    aiResponse: string,
    originalPrompt: string = "",
    showThinkingMode: boolean = true
  ): {
    success: boolean;
    notes?: StickyNoteData[];
    error?: string;
  } {
    try {
      const cleanResponse = aiResponse.trim();

      if (!cleanResponse) {
        return { success: false, error: "AI回复为空" };
      }

      console.log("🔍 开始智能解析AI回复，内容长度:", cleanResponse.length);

      // 现在优先使用自然语言解析，因为我们已经简化了所有系统提示词
      // 只有在明确是JSON格式时才尝试JSON解析（兼容旧数据或特殊情况）
      if (
        (cleanResponse.startsWith("[") || cleanResponse.startsWith("{")) &&
        cleanResponse.includes('"title"') &&
        cleanResponse.includes('"content"')
      ) {
        try {
          let notes: StickyNoteData[];

          if (cleanResponse.startsWith("[")) {
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
          const validNotes = notes
            .filter(
              (note) => typeof note === "object" && note.title && note.content
            )
            .map((note) => ({
              title: String(note.title).slice(0, 100),
              content: String(note.content).slice(0, 1000),
              color: note.color, // 🔧 保持AI返回的颜色，如果没有则为undefined，让前端使用临时便签颜色
              tags: Array.isArray(note.tags)
                ? note.tags.slice(0, 5)
                : undefined,
            }));

          if (validNotes.length > 0) {
            console.log("✅ JSON解析成功，便签数量:", validNotes.length);
            return { success: true, notes: validNotes };
          }
        } catch (jsonError) {
          console.log("⚠️ JSON解析失败，转为自然语言解析");
        }
      }

      // 使用自然语言解析（现在是主要方式）
      // 解析思维链内容
      const { thinkingChain, cleanContent, contentWithThinking } =
        this.parseThinkingChain(
          cleanResponse,
          originalPrompt,
          showThinkingMode
        );

      const note: StickyNoteData = {
        title: this.generateTitleFromContent(cleanContent),
        // 使用包含思维链的内容，这样便签会直接显示思考过程
        content: contentWithThinking,
        // 🔧 不设置颜色，让前端使用临时便签的颜色
        // 新增：思维链相关数据
        thinkingChain,
        hasThinking: !!thinkingChain,
      };

      console.log("✅ 自然语言解析完成:", {
        hasThinking: note.hasThinking,
        thinkingSteps: thinkingChain?.steps.length || 0,
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
    const cleanContent = content
      .replace(/[#*`_~\\[\]()]/g, "") // 移除Markdown符号
      .replace(/\n+/g, " ") // 换行替换为空格
      .trim();

    // 提取第一行或前30个字符作为标题
    const firstLine = cleanContent.split("\n")[0] || cleanContent;
    const title =
      firstLine.length > 30 ? firstLine.substring(0, 30) + "..." : firstLine;

    return title || "AI便签";
  }

  // 解析AI响应中的思维链内容并格式化为Markdown
  private parseThinkingChain(
    response: string,
    originalPrompt: string,
    showThinkingMode: boolean = true // 新增：是否显示思维模式的参数
  ): {
    thinkingChain?: StickyNoteData["thinkingChain"];
    cleanContent: string;
    contentWithThinking: string; // 新增：包含思维链的完整内容
  } {
    try {
      // 如果不显示思维模式，直接返回清理后的内容
      if (!showThinkingMode) {
        // 移除思维链标记，只保留最终内容
        let cleanContent = response
          .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
          .replace(/<think>[\s\S]*?<\/think>/gi, "")
          .trim();

        return {
          cleanContent,
          contentWithThinking: cleanContent,
        };
      }

      // 检查响应中是否包含思维链标记
      // 支持多种格式：<thinking>、<think>（DeepSeek格式）
      const thinkingPatterns = [
        /<thinking>([\s\S]*?)<\/thinking>/i, // 通用格式
        /<think>([\s\S]*?)<\/think>/i, // DeepSeek格式
      ];

      let thinkingMatch: RegExpMatchArray | null = null;
      let usedPattern: RegExp | null = null;

      // 尝试匹配不同的思维链格式
      for (const pattern of thinkingPatterns) {
        thinkingMatch = response.match(pattern);
        if (thinkingMatch) {
          usedPattern = pattern;
          break;
        }
      }

      if (!thinkingMatch || !usedPattern) {
        // 没有思维链，返回原始内容
        console.log("💭 未检测到思维链标记");
        return { cleanContent: response, contentWithThinking: response };
      }

      const thinkingContent = thinkingMatch[1].trim();
      const cleanContent = response.replace(usedPattern, "").trim();

      console.log("🧠 解析思维链:", {
        thinkingLength: thinkingContent.length,
        cleanLength: cleanContent.length,
      });

      // 解析思维链步骤
      const steps = this.parseThinkingSteps(thinkingContent);

      // 如果思维链内容为空或步骤为0，但有<think>标签，说明AI没有进行复杂思考
      if (steps.length === 0) {
        console.log("⚠️ 思维链步骤解析失败或为空");
        return { cleanContent: response, contentWithThinking: response };
      }

      console.log("✅ 思维链步骤解析成功，步骤数:", steps.length);

      // 创建思维链对象
      const thinkingChain: StickyNoteData["thinkingChain"] = {
        id: `thinking-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 11)}`,
        prompt: originalPrompt,
        steps,
        finalAnswer: cleanContent,
        totalThinkingTime: steps.length * 1000, // 估算思考时间
        createdAt: new Date(),
      };

      // 生成包含思维链的Markdown内容
      const contentWithThinking = this.formatThinkingChainAsMarkdown(
        thinkingChain,
        cleanContent
      );

      return { thinkingChain, cleanContent, contentWithThinking };
    } catch (error) {
      console.warn("解析思维链失败:", error);
      return { cleanContent: response, contentWithThinking: response };
    }
  }

  // 解析思维链步骤
  private parseThinkingSteps(thinkingContent: string): Array<{
    id: string;
    content: string;
    stepType: "analysis" | "reasoning" | "conclusion" | "question" | "idea";
    timestamp: Date;
    order: number;
  }> {
    const steps: Array<{
      id: string;
      content: string;
      stepType: "analysis" | "reasoning" | "conclusion" | "question" | "idea";
      timestamp: Date;
      order: number;
    }> = [];

    // 按段落分割思考内容
    const paragraphs = thinkingContent
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    paragraphs.forEach((paragraph, index) => {
      // 根据内容特征判断步骤类型
      let stepType:
        | "analysis"
        | "reasoning"
        | "conclusion"
        | "question"
        | "idea" = "reasoning";

      if (
        paragraph.includes("分析") ||
        paragraph.includes("观察") ||
        paragraph.includes("数据")
      ) {
        stepType = "analysis";
      } else if (
        paragraph.includes("结论") ||
        paragraph.includes("总结") ||
        paragraph.includes("因此")
      ) {
        stepType = "conclusion";
      } else if (
        paragraph.includes("?") ||
        paragraph.includes("？") ||
        paragraph.includes("如何") ||
        paragraph.includes("为什么")
      ) {
        stepType = "question";
      } else if (
        paragraph.includes("想法") ||
        paragraph.includes("建议") ||
        paragraph.includes("可以")
      ) {
        stepType = "idea";
      }

      steps.push({
        id: `step-${Date.now()}-${index}-${Math.random()
          .toString(36)
          .substring(2, 8)}`,
        content: paragraph,
        stepType,
        timestamp: new Date(Date.now() + index * 100), // 模拟时间间隔
        order: index + 1,
      });
    });

    return steps;
  }

  // 将思维链格式化为Markdown内容（使用details/summary实现默认折叠）
  private formatThinkingChainAsMarkdown(
    thinkingChain: StickyNoteData["thinkingChain"],
    finalAnswer: string
  ): string {
    if (!thinkingChain || thinkingChain.steps.length === 0) {
      return finalAnswer;
    }

    let markdown = "";

    // 🔧 修复：按照用户偏好格式，先添加思考过程标题
    markdown += "## 🤔 AI思考过程\n\n";

    // 使用details/summary标签实现默认折叠的思考过程
    markdown += "<details>\n";
    markdown += "<summary>点击展开思考过程</summary>\n\n";

    // 如果有原始提示，添加它
    if (thinkingChain.prompt) {
      markdown += `**原始提示：** ${thinkingChain.prompt}\n\n`;
    }

    // 添加思考步骤
    thinkingChain.steps.forEach((step, index) => {
      const stepIcon = this.getStepIconText(step.stepType);
      markdown += `### ${stepIcon} 步骤 ${index + 1}: ${this.getStepTypeLabel(
        step.stepType
      )}\n\n`;
      markdown += `${step.content}\n\n`;
    });

    // 添加思考时间统计
    if (thinkingChain.totalThinkingTime > 0) {
      const thinkingTimeSeconds = Math.round(
        thinkingChain.totalThinkingTime / 1000
      );
      markdown += `---\n\n`;
      markdown += `⏱️ **思考时长：** 约 ${thinkingTimeSeconds} 秒\n\n`;
    }

    markdown += "</details>\n\n";

    // 添加最终答案
    markdown += "## ✨ 最终答案\n\n";
    markdown += finalAnswer;

    return markdown;
  }

  // 获取步骤类型的图标文本
  private getStepIconText(stepType: string): string {
    switch (stepType) {
      case "analysis":
        return "🔍";
      case "reasoning":
        return "🧠";
      case "conclusion":
        return "🎯";
      case "question":
        return "❓";
      case "idea":
        return "💡";
      default:
        return "🤔";
    }
  }

  // 获取步骤类型的中文标签
  private getStepTypeLabel(stepType: string): string {
    switch (stepType) {
      case "analysis":
        return "分析";
      case "reasoning":
        return "推理";
      case "conclusion":
        return "结论";
      case "question":
        return "疑问";
      case "idea":
        return "想法";
      default:
        return "思考";
    }
  }

  // 测试思维链功能
  async testThinkingChain(): Promise<{
    success: boolean;
    hasThinking?: boolean;
    thinkingSteps?: number;
    error?: string;
  }> {
    try {
      if (!this.validateConfig()) {
        return { success: false, error: "AI配置未完成" };
      }

      const testPrompt = "请简单分析一下如何提高工作效率，并展示你的思考过程";

      // 直接使用用户配置的API地址，确保URL拼接正确
      const baseUrl = this.config.apiUrl.endsWith("/")
        ? this.config.apiUrl.slice(0, -1)
        : this.config.apiUrl;
      const apiUrl = `${baseUrl}/chat/completions`;

      // 构建请求体，确保非流式调用时禁用思维链功能
      const requestBody: any = {
        model: this.config.aiModel,
        messages: [{ role: "user", content: testPrompt }],
        max_tokens: Math.min(this.config.maxTokens || 1000, 500),
        temperature: Math.min(this.config.temperature || 0.7, 0.5),
        stream: false, // 明确指定非流式调用
      };

      // 对于支持思维链的模型（如阿里百炼），在非流式调用中必须禁用思维链
      if (
        this.config.apiUrl.includes("dashscope.aliyuncs.com") ||
        this.config.apiUrl.includes("bailian") ||
        this.config.aiModel.includes("qwen")
      ) {
        requestBody.enable_thinking = false;
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        return { success: false, error: "思维链测试请求失败" };
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || "";
      const reasoningContent =
        data.choices?.[0]?.message?.reasoning_content || "";

      // 解析思维链内容
      const { thinkingChain } = this.parseThinkingChain(
        aiResponse,
        testPrompt,
        true
      );

      // 如果有reasoning_content但没有解析到思维链，说明是DeepSeek格式
      if (!thinkingChain && reasoningContent) {
        return {
          success: true,
          hasThinking: true,
          thinkingSteps: 1, // reasoning_content作为一个整体步骤
        };
      }

      return {
        success: true,
        hasThinking: !!thinkingChain,
        thinkingSteps: thinkingChain?.steps.length || 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "思维链测试失败",
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

      // 构建请求体，确保非流式调用时禁用思维链功能
      const requestBody: any = {
        model: this.config.aiModel,
        messages: [{ role: "user", content: analysisPrompt }],
        max_tokens: Math.min(this.config.maxTokens || 1000, 500), // 分析功能限制最大500令牌
        temperature: Math.min(this.config.temperature || 0.7, 0.5), // 分析功能使用较低温度
        stream: false, // 明确指定非流式调用
      };

      // 对于支持思维链的模型（如阿里百炼），在非流式调用中必须禁用思维链
      if (
        this.config.apiUrl.includes("dashscope.aliyuncs.com") ||
        this.config.apiUrl.includes("bailian") ||
        this.config.aiModel.includes("qwen")
      ) {
        requestBody.enable_thinking = false;
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
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
    "apiUrl",
    "apiKey",
    "aiModel",
    "temperature",
    "maxTokens",
    "systemPrompt",
  ];

  const changedFields = keyFields.filter(
    (field) => newConfig[field] !== oldConfig[field]
  );

  if (changedFields.length > 0) {
    console.log("🔍 配置变化检测:", {
      changedFields,
      oldSystemPrompt: oldConfig.systemPrompt
        ? `"${oldConfig.systemPrompt.substring(0, 50)}..."`
        : "空",
      newSystemPrompt: newConfig.systemPrompt
        ? `"${newConfig.systemPrompt.substring(0, 50)}..."`
        : "空",
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
  if (
    !aiServiceInstance ||
    isConfigChanged(config, aiServiceInstance.getConfig())
  ) {
    console.log("🔄 AI服务配置发生变化，更新实例", {
      hasInstance: !!aiServiceInstance,
      configChanged: aiServiceInstance
        ? isConfigChanged(config, aiServiceInstance.getConfig())
        : true,
    });

    if (aiServiceInstance) {
      // 如果已有实例，使用updateConfig方法更新配置
      aiServiceInstance.updateConfig(config);
    } else {
      // 如果没有实例，创建新实例
      aiServiceInstance = new AIService(config);
    }
  } else {
    console.log("🔄 AI服务配置未变化，使用现有实例");
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

/**
 * AI提示词角色模板接口
 */
export interface AIPromptTemplate {
  id: string; // 模板唯一标识符
  name: string; // 模板名称
  description: string; // 模板描述
  prompt: string; // 提示词内容
  icon?: string; // 图标
  category?: string; // 分类
  popular?: boolean; // 是否为热门模板
}

/**
 * 系统提示词预设模板
 * 提供多种AI角色设定，用户可以快速选择适合的AI助手类型
 */
export const systemPromptTemplates: AIPromptTemplate[] = [
  {
    id: "normal",
    name: "正常对话模式",
    description: "直接与AI对话，获得原始API回复，不添加任何角色设定",
    prompt: "", // 空字符串表示正常对话模式
    icon: "MessageOutlined", // 对话图标
    category: "基础",
    popular: true,
  },
  {
    id: "default-assistant",
    name: "默认便签助手",
    description: "通用的便签生成助手，适合各种场景",
    prompt: defaultSystemPrompt,
    icon: "EditOutlined", // 编辑图标
    category: "基础",
    popular: true,
  },
  {
    id: "work-assistant",
    name: "工作任务助手",
    description: "专注于工作任务和项目管理的便签生成",
    prompt: `你是一个专业的工作任务管理助手。你的特点是：

- 专注于工作效率和任务管理
- 善于分析任务优先级和紧急程度
- 提供具体可行的行动步骤
- 使用专业的项目管理术语
- 能够合理拆分复杂任务

请根据用户的工作需求，生成专业的任务管理建议和工作计划。回复要简洁明了，重点突出，包含具体的执行步骤和时间安排。`,
    icon: "BriefcaseOutlined", // 任务执行图标
    category: "工作",
    popular: true,
  },
  {
    id: "study-assistant",
    name: "学习笔记助手",
    description: "专门用于生成学习笔记和知识整理",
    prompt: `你是一个学习笔记整理专家。你的特点是：

- 善于提取关键知识点和概念
- 使用清晰的层次结构组织信息
- 提供具体例子和应用场景
- 添加记忆技巧和助记符
- 标注难度级别和重要程度

请根据用户的学习内容，生成结构化的学习笔记。回复要条理清晰，重点突出，便于理解和记忆。`,
    icon: "BookOutlined", // 书本图标
    category: "学习",
    popular: true,
  },
  {
    id: "life-assistant",
    name: "生活规划助手",
    description: "帮助整理生活事务和个人规划",
    prompt: `你是一个贴心的生活规划助手。你的特点是：

- 语言温馨友好，贴近生活
- 提供具体可行的建议
- 考虑时间安排的合理性
- 包含必要的提醒和注意事项
- 适当添加生活小贴士

请根据用户的生活需求，生成实用的生活建议和规划。回复要温馨实用，关注生活品质和个人成长。`,
    icon: "HomeOutlined", // 家庭图标
    category: "生活",
  },
  {
    id: "creative-assistant",
    name: "创意灵感助手",
    description: "激发创意思维，整理创意想法",
    prompt: `你是一个富有创意的灵感助手。你的特点是：

- 鼓励创新思维和想象力
- 提供具体的实现路径
- 分析创意的可行性和价值
- 激发更多相关联想
- 使用生动有趣的表达方式

请根据用户的想法，生成富有创意的内容和建议。回复要充满想象力，同时保持实用性，帮助用户将创意转化为可行的方案。`,
    icon: "BulbOutlined", // 灯泡图标（创意）
    category: "创意",
  },
];

/**
 * 获取热门提示词模板
 * @returns 热门提示词模板列表
 */
export const getPopularPromptTemplates = (): AIPromptTemplate[] => {
  return systemPromptTemplates.filter((template) => template.popular);
};

/**
 * 根据ID查找提示词模板
 * @param id 模板ID
 * @returns 找到的模板或undefined
 */
export const findPromptTemplateById = (
  id: string
): AIPromptTemplate | undefined => {
  return systemPromptTemplates.find((template) => template.id === id);
};

/**
 * 根据分类获取提示词模板
 * @param category 分类名称
 * @returns 该分类下的模板列表
 */
export const getPromptTemplatesByCategory = (
  category: string
): AIPromptTemplate[] => {
  return systemPromptTemplates.filter(
    (template) => template.category === category
  );
};

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
