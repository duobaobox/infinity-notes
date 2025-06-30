// AI供应商和模型的类型定义和预设数据

/**
 * AI模型分类
 */
export type AIModelCategory =
  | "flagship"
  | "balanced"
  | "economical"
  | "coding"
  | "multimodal";

/**
 * AI模型接口
 */
export interface AIModel {
  id: string; // 模型的唯一标识符
  name: string; // 模型的API调用名称
  displayName: string; // 用户界面显示名称
  category: AIModelCategory; // 模型分类
  description: string; // 模型描述
  contextLength?: number; // 上下文长度
  pricing?: {
    input: number; // 输入价格（每1K tokens）
    output: number; // 输出价格（每1K tokens）
  };
}

/**
 * AI供应商接口
 */
export interface AIProvider {
  id: string; // 供应商唯一标识符
  name: string; // 供应商名称
  displayName: string; // 用户界面显示名称
  logo?: string; // 供应商logo URL或图标
  apiUrl: string; // API基础地址
  models: AIModel[]; // 支持的模型列表
  description: string; // 供应商描述
  website?: string; // 官方网站
  docUrl?: string; // 文档地址
  popular?: boolean; // 是否为热门供应商
}

/**
 * 预设的AI供应商数据
 */
export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    displayName: "OpenAI",
    logo: "🤖",
    apiUrl: "https://api.openai.com/v1",
    description: "全球领先的AI研究公司，GPT系列模型的创造者",
    website: "https://openai.com",
    docUrl: "https://platform.openai.com/docs",
    popular: true,
    models: [
      {
        id: "gpt-4o",
        name: "gpt-4o",
        displayName: "GPT-4o",
        category: "flagship",
        description: "最新的多模态旗舰模型，支持文本、图像和音频",
        contextLength: 128000,
        pricing: { input: 5, output: 15 },
      },
      {
        id: "gpt-4o-mini",
        name: "gpt-4o-mini",
        displayName: "GPT-4o Mini",
        category: "balanced",
        description: "高性价比的智能模型，适合大多数应用场景",
        contextLength: 128000,
        pricing: { input: 0.15, output: 0.6 },
      },
      {
        id: "gpt-3.5-turbo",
        name: "gpt-3.5-turbo",
        displayName: "GPT-3.5 Turbo",
        category: "economical",
        description: "经济实用的对话模型，响应速度快",
        contextLength: 16385,
        pricing: { input: 0.5, output: 1.5 },
      },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    displayName: "DeepSeek",
    logo: "🔍",
    apiUrl: "https://api.deepseek.com/v1",
    description: "专注于推理和编程的高性能AI模型",
    website: "https://deepseek.com",
    docUrl: "https://platform.deepseek.com/api-docs",
    popular: true,
    models: [
      {
        id: "deepseek-chat",
        name: "deepseek-chat",
        displayName: "DeepSeek Chat",
        category: "flagship",
        description: "强大的对话模型，擅长复杂推理和分析",
        contextLength: 32768,
        pricing: { input: 0.14, output: 0.28 },
      },
      {
        id: "deepseek-coder",
        name: "deepseek-coder",
        displayName: "DeepSeek Coder",
        category: "coding",
        description: "专业的代码生成和编程助手模型",
        contextLength: 16384,
        pricing: { input: 0.14, output: 0.28 },
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    displayName: "Anthropic",
    logo: "🎭",
    apiUrl: "https://api.anthropic.com/v1",
    description: "Claude系列模型，注重安全性和有用性",
    website: "https://anthropic.com",
    docUrl: "https://docs.anthropic.com",
    popular: false,
    models: [
      {
        id: "claude-3-5-sonnet",
        name: "claude-3-5-sonnet-20241022",
        displayName: "Claude 3.5 Sonnet",
        category: "flagship",
        description: "最新的Claude模型，在推理和创作方面表现卓越",
        contextLength: 200000,
        pricing: { input: 3, output: 15 },
      },
      {
        id: "claude-3-haiku",
        name: "claude-3-haiku-20240307",
        displayName: "Claude 3 Haiku",
        category: "economical",
        description: "快速响应的轻量级模型，适合简单任务",
        contextLength: 200000,
        pricing: { input: 0.25, output: 1.25 },
      },
    ],
  },
  {
    id: "alibaba",
    name: "Alibaba",
    displayName: "阿里云百炼",
    logo: "☁️",
    apiUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    description: "阿里云百炼通义千问系列模型，中文理解能力强",
    website: "https://tongyi.aliyun.com",
    docUrl: "https://help.aliyun.com/zh/dashscope",
    popular: true,
    models: [
      {
        id: "qwen-turbo",
        name: "qwen-turbo",
        displayName: "通义千问 Turbo",
        category: "balanced",
        description: "平衡性能和成本的中文大模型",
        contextLength: 8192,
        pricing: { input: 0.3, output: 0.6 },
      },
      {
        id: "qwen-plus",
        name: "qwen-plus",
        displayName: "通义千问 Plus",
        category: "flagship",
        description: "高性能的中文大模型，适合复杂任务",
        contextLength: 32768,
        pricing: { input: 0.8, output: 2.0 },
      },
      {
        id: "qwen-max",
        name: "qwen-max",
        displayName: "通义千问 Max",
        category: "flagship",
        description: "最强的中文大模型，顶级性能",
        contextLength: 8192,
        pricing: { input: 20, output: 60 },
      },
    ],
  },
  {
    id: "baidu",
    name: "Baidu",
    displayName: "百度",
    logo: "🐻",
    apiUrl: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat",
    description: "百度文心一言系列模型，中文能力优秀",
    website: "https://yiyan.baidu.com",
    docUrl: "https://cloud.baidu.com/doc/WENXINWORKSHOP",
    models: [
      {
        id: "ernie-bot-turbo",
        name: "ernie-bot-turbo",
        displayName: "文心一言 Turbo",
        category: "balanced",
        description: "高性价比的中文对话模型",
        contextLength: 8192,
        pricing: { input: 0.8, output: 2.0 },
      },
      {
        id: "ernie-bot-4",
        name: "ernie-bot-4",
        displayName: "文心一言 4.0",
        category: "flagship",
        description: "百度最新的旗舰级大模型",
        contextLength: 8192,
        pricing: { input: 30, output: 90 },
      },
    ],
  },
  {
    id: "zhipu",
    name: "Zhipu",
    displayName: "智谱AI",
    logo: "🧠",
    apiUrl: "https://open.bigmodel.cn/api/paas/v4",
    description: "智谱AI GLM系列模型，多模态能力强",
    website: "https://zhipuai.cn",
    docUrl: "https://open.bigmodel.cn/dev/api",
    models: [
      {
        id: "glm-4",
        name: "glm-4",
        displayName: "GLM-4",
        category: "flagship",
        description: "智谱AI的旗舰模型，支持多模态",
        contextLength: 128000,
        pricing: { input: 50, output: 50 },
      },
      {
        id: "glm-4-flash",
        name: "glm-4-flash",
        displayName: "GLM-4 Flash",
        category: "balanced",
        description: "高速响应的智能模型",
        contextLength: 128000,
        pricing: { input: 0.1, output: 0.1 },
      },
    ],
  },
  {
    id: "siliconflow",
    name: "SiliconFlow",
    displayName: "硅基流动",
    logo: "⚡",
    apiUrl: "https://api.siliconflow.cn/v1",
    description: "高速AI推理平台",
    website: "https://siliconflow.cn",
    docUrl: "https://docs.siliconflow.cn",
    popular: true,
    models: [
      {
        id: "deepseek-chat",
        name: "deepseek-chat",
        displayName: "DeepSeek Chat",
        category: "flagship",
        description: "强大的对话模型，擅长复杂推理和分析",
        contextLength: 32768,
        pricing: { input: 0.14, output: 0.28 },
      },
      {
        id: "qwen-turbo",
        name: "Qwen/Qwen2.5-7B-Instruct",
        displayName: "通义千问 2.5-7B",
        category: "balanced",
        description: "平衡性能和成本的中文大模型",
        contextLength: 8192,
        pricing: { input: 0.3, output: 0.6 },
      },
      {
        id: "llama-3.1-8b",
        name: "meta-llama/Meta-Llama-3.1-8B-Instruct",
        displayName: "Llama 3.1 8B",
        category: "economical",
        description: "开源的高性价比模型",
        contextLength: 128000,
        pricing: { input: 0.1, output: 0.1 },
      },
    ],
  },
];

/**
 * 根据供应商ID获取供应商信息
 */
export function getProviderById(providerId: string): AIProvider | undefined {
  return AI_PROVIDERS.find((provider) => provider.id === providerId);
}

/**
 * 根据模型名称查找对应的供应商
 */
export function getProviderByModel(modelName: string): AIProvider | undefined {
  return AI_PROVIDERS.find((provider) =>
    provider.models.some((model) => model.name === modelName)
  );
}

/**
 * 获取热门供应商
 */
export function getPopularProviders(): AIProvider[] {
  return AI_PROVIDERS.filter((provider) => provider.popular);
}

/**
 * 根据分类获取模型
 */
export function getModelsByCategory(
  providerId: string,
  category: AIModelCategory
): AIModel[] {
  const provider = getProviderById(providerId);
  return provider?.models.filter((model) => model.category === category) || [];
}

/**
 * 模型分类的显示名称
 */
export const MODEL_CATEGORY_LABELS: Record<AIModelCategory, string> = {
  flagship: "旗舰模型",
  balanced: "平衡型",
  economical: "经济型",
  coding: "编程专用",
  multimodal: "多模态",
};
