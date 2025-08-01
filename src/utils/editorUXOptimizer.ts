/**
 * 编辑器用户体验优化工具
 * 
 * 提供智能滚动、响应式优化和用户交互改进功能
 */

/**
 * 滚动配置接口
 */
export interface ScrollConfig {
  smoothScrolling: boolean;
  autoScrollToNewContent: boolean;
  scrollMargin: number;
  scrollDuration: number;
}

/**
 * 用户体验配置接口
 */
export interface UXConfig {
  scroll: ScrollConfig;
  responsiveTyping: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  focusManagement: boolean;
  keyboardShortcuts: boolean;
}

/**
 * 编辑器用户体验优化器类
 */
export class EditorUXOptimizer {
  private editor: any;
  private config: UXConfig;
  private scrollObserver?: IntersectionObserver;
  private resizeObserver?: ResizeObserver;
  private autoSaveTimer?: NodeJS.Timeout;
  private lastContentLength = 0;
  private isStreamingContent = false;

  // 默认配置
  private static readonly DEFAULT_CONFIG: UXConfig = {
    scroll: {
      smoothScrolling: true,
      autoScrollToNewContent: true,
      scrollMargin: 20,
      scrollDuration: 300,
    },
    responsiveTyping: true,
    autoSave: true,
    autoSaveDelay: 2000,
    focusManagement: true,
    keyboardShortcuts: true,
  };

  constructor(editor: any, config: Partial<UXConfig> = {}) {
    this.editor = editor;
    this.config = { ...EditorUXOptimizer.DEFAULT_CONFIG, ...config };
    this.initialize();
  }

  /**
   * 初始化优化器
   */
  private initialize() {
    if (!this.editor || this.editor.isDestroyed) return;

    this.setupScrollOptimization();
    this.setupResponsiveTyping();
    this.setupAutoSave();
    this.setupFocusManagement();
    this.setupKeyboardShortcuts();
    this.setupContentStreaming();
  }

  /**
   * 设置滚动优化
   */
  private setupScrollOptimization() {
    if (!this.config.scroll.smoothScrolling) return;

    const editorDOM = this.editor.view?.dom;
    if (!editorDOM) return;

    // 启用平滑滚动
    editorDOM.style.scrollBehavior = 'smooth';

    // 设置滚动观察器
    this.scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && this.config.scroll.autoScrollToNewContent) {
            this.smartScrollToContent();
          }
        });
      },
      {
        root: editorDOM,
        threshold: 0.1,
      }
    );

    // 观察编辑器内容变化
    this.editor.on('update', () => {
      this.handleContentUpdate();
    });
  }

  /**
   * 智能滚动到内容
   */
  private smartScrollToContent() {
    if (!this.editor?.view?.dom) return;

    const editorDOM = this.editor.view.dom;
    const selection = this.editor.state.selection;
    
    // 获取当前光标位置
    const { from } = selection;
    const pos = this.editor.view.coordsAtPos(from);
    
    if (pos) {
      const editorRect = editorDOM.getBoundingClientRect();
      const scrollTop = editorDOM.scrollTop;
      const targetY = pos.top - editorRect.top + scrollTop - this.config.scroll.scrollMargin;
      
      // 平滑滚动到目标位置
      editorDOM.scrollTo({
        top: targetY,
        behavior: 'smooth',
      });
    }
  }

  /**
   * 处理内容更新
   */
  private handleContentUpdate() {
    const currentContent = this.editor.getJSON();
    const currentLength = JSON.stringify(currentContent).length;
    
    // 检测新内容添加
    if (currentLength > this.lastContentLength && this.config.scroll.autoScrollToNewContent) {
      // 延迟滚动，确保内容已渲染
      setTimeout(() => {
        this.scrollToBottom();
      }, 50);
    }
    
    this.lastContentLength = currentLength;
  }

  /**
   * 滚动到底部
   */
  private scrollToBottom() {
    if (!this.editor?.view?.dom) return;

    const editorDOM = this.editor.view.dom;
    const maxScroll = editorDOM.scrollHeight - editorDOM.clientHeight;
    
    editorDOM.scrollTo({
      top: maxScroll,
      behavior: this.config.scroll.smoothScrolling ? 'smooth' : 'auto',
    });
  }

  /**
   * 设置响应式输入优化
   */
  private setupResponsiveTyping() {
    if (!this.config.responsiveTyping) return;

    let typingTimer: NodeJS.Timeout;
    
    this.editor.on('update', () => {
      // 清除之前的计时器
      clearTimeout(typingTimer);
      
      // 设置新的计时器，在用户停止输入后执行优化
      typingTimer = setTimeout(() => {
        this.optimizeAfterTyping();
      }, 500);
    });
  }

  /**
   * 输入后的优化
   */
  private optimizeAfterTyping() {
    // 清理空的段落
    this.cleanupEmptyParagraphs();
    
    // 优化格式
    this.optimizeFormatting();
  }

  /**
   * 清理空段落
   */
  private cleanupEmptyParagraphs() {
    if (!this.editor || this.editor.isDestroyed) return;

    try {
      const { state, view } = this.editor;
      const { tr } = state;
      let modified = false;

      state.doc.descendants((node: any, pos: number) => {
        if (node.type.name === 'paragraph' && node.content.size === 0) {
          // 检查是否有相邻的空段落
          const nextNode = state.doc.nodeAt(pos + node.nodeSize);
          if (nextNode && nextNode.type.name === 'paragraph' && nextNode.content.size === 0) {
            tr.delete(pos, pos + node.nodeSize);
            modified = true;
          }
        }
      });

      if (modified) {
        view.dispatch(tr);
      }
    } catch (error) {
      console.warn("清理空段落失败:", error);
    }
  }

  /**
   * 优化格式
   */
  private optimizeFormatting() {
    // 这里可以添加格式优化逻辑
    // 例如：合并相邻的相同格式、清理冗余标记等
  }

  /**
   * 设置自动保存
   */
  private setupAutoSave() {
    if (!this.config.autoSave) return;

    this.editor.on('update', () => {
      this.scheduleAutoSave();
    });
  }

  /**
   * 安排自动保存
   */
  private scheduleAutoSave() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    this.autoSaveTimer = setTimeout(() => {
      this.performAutoSave();
    }, this.config.autoSaveDelay);
  }

  /**
   * 执行自动保存
   */
  private performAutoSave() {
    // 这里应该调用外部的保存函数
    // 由于我们不知道具体的保存逻辑，这里只是触发一个事件
    const event = new CustomEvent('editorAutoSave', {
      detail: {
        content: this.editor.getJSON(),
        timestamp: Date.now(),
      },
    });
    
    if (this.editor.view?.dom) {
      this.editor.view.dom.dispatchEvent(event);
    }
  }

  /**
   * 设置焦点管理
   */
  private setupFocusManagement() {
    if (!this.config.focusManagement) return;

    // 处理焦点丢失和恢复
    this.editor.on('blur', () => {
      this.handleBlur();
    });

    this.editor.on('focus', () => {
      this.handleFocus();
    });
  }

  /**
   * 处理失去焦点
   */
  private handleBlur() {
    // 保存当前光标位置
    const selection = this.editor.state.selection;
    this.editor.view.dom.dataset.lastCursorPos = JSON.stringify({
      from: selection.from,
      to: selection.to,
    });
  }

  /**
   * 处理获得焦点
   */
  private handleFocus() {
    // 恢复光标位置
    const lastPos = this.editor.view.dom.dataset.lastCursorPos;
    if (lastPos) {
      try {
        const { from, to } = JSON.parse(lastPos);
        this.editor.commands.setTextSelection({ from, to });
      } catch (error) {
        console.warn("恢复光标位置失败:", error);
      }
    }
  }

  /**
   * 设置键盘快捷键
   */
  private setupKeyboardShortcuts() {
    if (!this.config.keyboardShortcuts) return;

    // 这里可以添加自定义键盘快捷键
    // TipTap 已经提供了基本的快捷键，我们可以添加额外的
  }

  /**
   * 设置内容流式处理
   */
  private setupContentStreaming() {
    // 监听流式内容更新
    this.editor.on('update', ({ transaction }: any) => {
      if (transaction.getMeta('streaming')) {
        this.isStreamingContent = true;
        this.handleStreamingContent();
      } else {
        this.isStreamingContent = false;
      }
    });
  }

  /**
   * 处理流式内容
   */
  private handleStreamingContent() {
    if (!this.isStreamingContent) return;

    // 在流式内容期间，自动滚动到底部
    requestAnimationFrame(() => {
      this.scrollToBottom();
    });
  }

  /**
   * 启用流式模式
   */
  enableStreamingMode() {
    this.isStreamingContent = true;
    
    // 禁用一些可能影响性能的功能
    this.config.responsiveTyping = false;
    this.config.autoSave = false;
  }

  /**
   * 禁用流式模式
   */
  disableStreamingMode() {
    this.isStreamingContent = false;
    
    // 恢复正常功能
    this.config.responsiveTyping = true;
    this.config.autoSave = true;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<UXConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    // 重新初始化受影响的功能
    this.initialize();
  }

  /**
   * 获取当前配置
   */
  getConfig(): UXConfig {
    return { ...this.config };
  }

  /**
   * 销毁优化器
   */
  destroy() {
    // 清理观察器
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // 清理计时器
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    
    // 清理引用
    this.editor = null;
  }
}
