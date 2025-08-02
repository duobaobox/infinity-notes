/**
 * 编辑器内容存储管理器
 *
 * 提供统一的编辑器内容序列化、反序列化和验证功能
 * 支持 TipTap JSON 格式和向后兼容的 Markdown/HTML 格式
 */

import { generateHTML, generateJSON } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

/**
 * 编辑器扩展配置
 * 与编辑器组件保持一致的扩展配置
 */
const EDITOR_EXTENSIONS = [
  StarterKit.configure({
    // 确保斜体功能启用
    italic: {
      HTMLAttributes: {
        class: "italic-text",
      },
    },
  }),
  Placeholder.configure({
    placeholder: "开始输入...",
    emptyEditorClass: "is-editor-empty",
  }),
  Image.configure({
    inline: true,
    allowBase64: true,
  }),
  TaskList.configure({
    HTMLAttributes: {
      class: "task-list",
    },
  }),
  TaskItem.configure({
    nested: true,
    HTMLAttributes: {
      class: "task-item",
    },
  }),
];

/**
 * 编辑器内容类型枚举
 */
export const ContentType = {
  JSON: "json",
  HTML: "html",
  MARKDOWN: "markdown",
  UNKNOWN: "unknown",
} as const;

export type ContentType = (typeof ContentType)[keyof typeof ContentType];

/**
 * 编辑器内容接口
 */
export interface EditorContent {
  type: ContentType;
  data: any;
  version?: string; // 内容版本，用于迁移
  timestamp?: number; // 最后更新时间
}

/**
 * 编辑器存储管理器类
 */
export class EditorStorageManager {
  private static readonly CURRENT_VERSION = "3.0";

  /**
   * 检测内容类型
   */
  static detectContentType(content: any): ContentType {
    if (!content) return ContentType.UNKNOWN;

    // 检查是否为 TipTap JSON 格式
    if (
      typeof content === "object" &&
      content.type &&
      content.content &&
      Array.isArray(content.content)
    ) {
      return ContentType.JSON;
    }

    // 检查是否为字符串
    if (typeof content === "string") {
      const trimmed = content.trim();

      // 检查是否为 JSON 字符串
      try {
        const parsed = JSON.parse(trimmed);
        if (
          parsed &&
          typeof parsed === "object" &&
          parsed.type &&
          parsed.content
        ) {
          return ContentType.JSON;
        }
      } catch {
        // 不是 JSON
      }

      // 检查是否为 HTML
      if (trimmed.startsWith("<") && trimmed.includes(">")) {
        return ContentType.HTML;
      }

      // 默认为 Markdown
      return ContentType.MARKDOWN;
    }

    return ContentType.UNKNOWN;
  }

  /**
   * 序列化编辑器内容为存储格式
   */
  static serialize(content: any): EditorContent {
    const type = this.detectContentType(content);

    return {
      type,
      data: content,
      version: this.CURRENT_VERSION,
      timestamp: Date.now(),
    };
  }

  /**
   * 反序列化存储内容为编辑器格式
   */
  static deserialize(storedContent: EditorContent | any): any {
    // 如果是新格式的 EditorContent
    if (
      storedContent &&
      typeof storedContent === "object" &&
      storedContent.type
    ) {
      return this.convertToEditorFormat(storedContent.data, storedContent.type);
    }

    // 如果是旧格式，直接检测类型并转换
    const type = this.detectContentType(storedContent);
    return this.convertToEditorFormat(storedContent, type);
  }

  /**
   * 转换内容为编辑器可用格式
   */
  private static convertToEditorFormat(content: any, type: ContentType): any {
    switch (type) {
      case ContentType.JSON:
        // 如果是字符串形式的 JSON，解析它
        if (typeof content === "string") {
          try {
            return JSON.parse(content);
          } catch {
            return this.createEmptyContent();
          }
        }
        // 验证 JSON 结构
        return this.validateJsonContent(content)
          ? content
          : this.createEmptyContent();

      case ContentType.HTML:
        // 将 HTML 转换为 JSON
        try {
          return generateJSON(content, EDITOR_EXTENSIONS);
        } catch (error) {
          console.warn("HTML 转换失败:", error);
          return this.createEmptyContent();
        }

      case ContentType.MARKDOWN:
        // 将 Markdown 转换为 HTML，再转换为 JSON
        try {
          const html = this.markdownToHtml(content);
          return generateJSON(html, EDITOR_EXTENSIONS);
        } catch (error) {
          console.warn("Markdown 转换失败:", error);
          return this.createEmptyContent();
        }

      default:
        return this.createEmptyContent();
    }
  }

  /**
   * 验证 JSON 内容结构
   */
  private static validateJsonContent(content: any): boolean {
    return (
      content &&
      typeof content === "object" &&
      typeof content.type === "string" &&
      Array.isArray(content.content)
    );
  }

  /**
   * 创建空的编辑器内容
   */
  private static createEmptyContent(): any {
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [],
        },
      ],
    };
  }

  /**
   * 简化的 Markdown 到 HTML 转换
   */
  private static markdownToHtml(markdown: string): string {
    if (!markdown.trim()) return "<p></p>";

    let html = markdown
      // 标题
      .replace(/^(#{1,6}) (.*$)/gm, (_match, hashes, content) => {
        const level = hashes.length;
        return `<h${level}>${content}</h${level}>`;
      })
      // 粗体
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      // 斜体
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      // 删除线
      .replace(/~~([^~]+)~~/g, "<s>$1</s>")
      // 链接
      .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2">$1</a>')
      // 图片
      .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, '<img src="$2" alt="$1" />');

    // 段落处理
    const paragraphs = html.split("\n\n").filter((p) => p.trim());
    const processedParagraphs = paragraphs
      .map((p) => {
        const trimmed = p.trim();
        if (trimmed.match(/^<(h[1-6]|ul|ol|blockquote|pre|hr)/)) {
          return trimmed;
        }
        if (!trimmed) return "";
        return `<p>${trimmed}</p>`;
      })
      .filter((p) => p);

    return processedParagraphs.join("") || "<p></p>";
  }

  /**
   * 将编辑器 JSON 内容转换为 HTML
   */
  static jsonToHtml(jsonContent: any): string {
    try {
      return generateHTML(jsonContent, EDITOR_EXTENSIONS);
    } catch (error) {
      console.warn("JSON 转 HTML 失败:", error);
      return "<p></p>";
    }
  }

  /**
   * 将编辑器 JSON 内容转换为 Markdown
   */
  static jsonToMarkdown(jsonContent: any): string {
    try {
      const html = this.jsonToHtml(jsonContent);
      return this.htmlToMarkdown(html);
    } catch (error) {
      console.warn("JSON 转 Markdown 失败:", error);
      return "";
    }
  }

  /**
   * 简化的 HTML 到 Markdown 转换
   */
  private static htmlToMarkdown(html: string): string {
    if (!html || html === "<p></p>") return "";

    return (
      html
        // 标题
        .replace(/<h([1-6])>(.*?)<\/h[1-6]>/g, (_match, level, content) => {
          return "#".repeat(parseInt(level)) + " " + content + "\n\n";
        })
        // 粗体
        .replace(/<strong>(.*?)<\/strong>/g, "**$1**")
        .replace(/<b>(.*?)<\/b>/g, "**$1**")
        // 斜体
        .replace(/<em>(.*?)<\/em>/g, "*$1*")
        .replace(/<i>(.*?)<\/i>/g, "*$1*")
        // 删除线
        .replace(/<s>(.*?)<\/s>/g, "~~$1~~")
        // 链接
        .replace(/<a href="([^"]*)"[^>]*>(.*?)<\/a>/g, "[$2]($1)")
        // 图片
        .replace(/<img src="([^"]*)" alt="([^"]*)"[^>]*>/g, "![$2]($1)")
        // 段落
        .replace(/<p>(.*?)<\/p>/g, "$1\n\n")
        // 清理多余的换行
        .replace(/\n{3,}/g, "\n\n")
        .trim()
    );
  }

  /**
   * 检查内容是否为空
   */
  static isEmpty(content: any): boolean {
    if (!content) return true;

    const type = this.detectContentType(content);

    switch (type) {
      case ContentType.JSON:
        const jsonContent =
          typeof content === "string" ? JSON.parse(content) : content;
        return this.isEmptyJsonContent(jsonContent);

      case ContentType.HTML:
        return content.trim() === "" || content.trim() === "<p></p>";

      case ContentType.MARKDOWN:
        return content.trim() === "";

      default:
        return true;
    }
  }

  /**
   * 检查 JSON 内容是否为空
   */
  private static isEmptyJsonContent(jsonContent: any): boolean {
    if (
      !jsonContent ||
      !jsonContent.content ||
      !Array.isArray(jsonContent.content)
    ) {
      return true;
    }

    // 检查是否只有空段落
    return jsonContent.content.every((node: any) => {
      if (node.type === "paragraph") {
        return !node.content || node.content.length === 0;
      }
      return false;
    });
  }
}
