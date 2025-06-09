// AI服务模块 - 处理AI API调用和便签生成
export interface AIConfig {
  apiUrl: string;
  apiKey: string;
  aiModel: string;
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

  // 生成便签内容
  async generateStickyNotes(prompt: string): Promise<{
    success: boolean;
    notes?: StickyNoteData[];
    error?: string;
  }> {
    try {
      if (!this.validateConfig()) {
        return {
          success: false,
          error: "AI配置未完成，请先在设置中配置AI服务",
        };
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
          max_tokens: 1000, // 固定最大令牌数
          temperature: 0.7, // 固定温度值
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.message || `API请求失败 (${response.status})`,
        };
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;

      if (!aiResponse) {
        return { success: false, error: "未收到AI响应" };
      }

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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "AI请求失败",
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
          max_tokens: 200, // 分析功能使用较少令牌
          temperature: 0.3, // 分析功能使用较低温度
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
};
