// 连接线管理器 - 使用Leader Line实现便签到插槽的连接线
import type { StickyNote } from '../components/types';

// Leader Line类型定义
declare class LeaderLineClass {
  constructor(start: HTMLElement, end: HTMLElement, options?: any);
  position(): void;
  remove(): void;
  show(showEffectName?: string, animOptions?: object): void;
  hide(hideEffectName?: string, animOptions?: object): void;
  setOptions(options: any): void;
}

// 全局Leader Line变量
declare global {
  interface Window {
    LeaderLine: typeof LeaderLineClass;
  }
}

// 动态加载Leader Line
let LeaderLine: typeof LeaderLineClass | null = null;
let loadPromise: Promise<typeof LeaderLineClass> | null = null;

// 异步加载Leader Line
const loadLeaderLine = async (): Promise<typeof LeaderLineClass> => {
  if (LeaderLine) return LeaderLine;

  if (loadPromise) return loadPromise;

  loadPromise = new Promise(async (resolve, reject) => {
    try {
      // 检查是否已经在全局作用域中
      if (window.LeaderLine) {
        LeaderLine = window.LeaderLine;
        resolve(LeaderLine);
        return;
      }

      // 动态加载脚本
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/leader-line@1.0.7/leader-line.min.js';
      script.onload = () => {
        if (window.LeaderLine) {
          LeaderLine = window.LeaderLine;
          resolve(LeaderLine);
        } else {
          reject(new Error('Leader Line failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Leader Line script'));
      document.head.appendChild(script);
    } catch (error) {
      reject(error);
    }
  });

  return loadPromise;
};

// 连接线实例接口
interface ConnectionLine {
  id: string; // 连接线唯一标识
  noteId: string; // 便签ID
  slotIndex: number; // 插槽索引
  line: any; // Leader Line实例
  startElement: HTMLElement; // 起始元素（便签连接点）
  endElement: HTMLElement; // 结束元素（插槽）
}

// 连接线管理器类
class ConnectionLineManager {
  private connections: Map<string, ConnectionLine> = new Map(); // 连接线映射表
  private isInitialized = false; // 是否已初始化

  constructor() {
    this.init();
  }

  // 初始化管理器
  private init() {
    if (this.isInitialized) return;

    // 监听窗口大小变化，自动更新连接线位置
    window.addEventListener('resize', this.handleWindowResize);
    
    // 监听滚动事件，更新连接线位置
    window.addEventListener('scroll', this.handleScroll, true);

    this.isInitialized = true;
    console.log('🔗 连接线管理器已初始化');
  }

  // 创建连接线
  async createConnection(note: StickyNote, slotIndex: number): Promise<boolean> {
    try {
      const connectionId = this.getConnectionId(note.id, slotIndex);

      // 检查是否已存在连接
      if (this.connections.has(connectionId)) {
        console.warn(`连接线 ${connectionId} 已存在`);
        return false;
      }

      // 等待DOM更新完成
      await new Promise(resolve => setTimeout(resolve, 150));

      // 获取便签连接点元素 - 使用连接点容器作为连接目标
      const noteElement = document.querySelector(`[data-note-id="${note.id}"]`);
      const connectionPoint = noteElement?.querySelector('.connection-point') as HTMLElement;

      if (!connectionPoint) {
        console.error(`未找到便签 ${note.id} 的连接点`);
        console.log('便签元素:', noteElement);
        console.log('连接点容器:', noteElement?.querySelector('.connection-point'));
        return false;
      }

      // 获取对应的插槽元素 - 直接使用slot-circle作为连接目标
      const slotElement = document.querySelector(`.note-slot[data-note-id="${note.id}"][data-index="${slotIndex}"] .slot-circle`) as HTMLElement;

      if (!slotElement) {
        console.error(`未找到插槽索引 ${slotIndex} 对应的元素`);
        console.log('查找的选择器:', `.note-slot[data-note-id="${note.id}"][data-index="${slotIndex}"] .slot-circle`);
        return false;
      }

      console.log('🔍 连接元素信息:', {
        connectionPoint: connectionPoint.getBoundingClientRect(),
        slotElement: slotElement.getBoundingClientRect(),
        noteId: note.id,
        slotIndex
      });

      // 加载Leader Line
      const LeaderLineClass = await loadLeaderLine();

      // 强制刷新元素位置
      connectionPoint.getBoundingClientRect();
      slotElement.getBoundingClientRect();

      // 创建Leader Line连接线 - 使用贝塞尔曲线，无端点圆点
      const line = new LeaderLineClass(connectionPoint, slotElement, {
        color: '#1677ff', // 蓝色连接线
        size: 4, // 线条粗细
        path: 'fluid', // 使用流畅的贝塞尔曲线
        startSocket: 'auto', // 让Leader Line自动选择最佳连接点
        endSocket: 'auto', // 让Leader Line自动选择最佳连接点
        startSocketGravity: 'auto', // 使用auto让Leader Line自动计算
        endSocketGravity: 'auto', // 使用auto让Leader Line自动计算
        startPlug: 'behind', // 隐藏起始点圆点
        endPlug: 'behind', // 隐藏结束点圆点
        outline: true, // 启用轮廓
        outlineColor: 'rgba(255, 255, 255, 0.8)', // 白色轮廓
        outlineSize: 1.2, // 轮廓大小
        animate: { // 连接动画
          duration: 400,
          timing: 'ease-in-out'
        }
      });

      // 立即更新位置确保精确连接
      setTimeout(() => {
        line.position();
      }, 50);

      // 创建连接线记录
      const connection: ConnectionLine = {
        id: connectionId,
        noteId: note.id,
        slotIndex,
        line,
        startElement: connectionPoint,
        endElement: slotElement
      };

      // 保存连接线
      this.connections.set(connectionId, connection);

      console.log(`✅ 已创建连接线: ${note.title || '无标题'} -> 插槽${slotIndex}`);
      return true;

    } catch (error) {
      console.error('创建连接线失败:', error);
      return false;
    }
  }

  // 移除连接线
  removeConnection(noteId: string, slotIndex?: number): boolean {
    try {
      if (slotIndex !== undefined) {
        // 移除特定连接线
        const connectionId = this.getConnectionId(noteId, slotIndex);
        const connection = this.connections.get(connectionId);
        
        if (connection) {
          connection.line.remove();
          this.connections.delete(connectionId);
          console.log(`🗑️ 已移除连接线: ${noteId} -> 插槽${slotIndex}`);
          return true;
        }
      } else {
        // 移除便签的所有连接线
        let removed = false;
        for (const [connectionId, connection] of this.connections.entries()) {
          if (connection.noteId === noteId) {
            connection.line.remove();
            this.connections.delete(connectionId);
            removed = true;
          }
        }
        
        if (removed) {
          console.log(`🗑️ 已移除便签 ${noteId} 的所有连接线`);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('移除连接线失败:', error);
      return false;
    }
  }

  // 清空所有连接线
  clearAllConnections(): void {
    try {
      for (const connection of this.connections.values()) {
        connection.line.remove();
      }
      this.connections.clear();
      console.log('🧹 已清空所有连接线');
    } catch (error) {
      console.error('清空连接线失败:', error);
    }
  }

  // 更新连接线位置
  updateConnectionPositions(): void {
    try {
      for (const connection of this.connections.values()) {
        connection.line.position();
      }
    } catch (error) {
      console.error('更新连接线位置失败:', error);
    }
  }

  // 更新特定便签的连接线位置
  updateNoteConnections(noteId: string): void {
    try {
      for (const connection of this.connections.values()) {
        if (connection.noteId === noteId) {
          connection.line.position();
        }
      }
    } catch (error) {
      console.error('更新便签连接线位置失败:', error);
    }
  }

  // 获取连接线数量
  getConnectionCount(): number {
    return this.connections.size;
  }

  // 检查便签是否有连接线
  hasConnection(noteId: string): boolean {
    for (const connection of this.connections.values()) {
      if (connection.noteId === noteId) {
        return true;
      }
    }
    return false;
  }

  // 获取便签的连接线数量
  getNoteConnectionCount(noteId: string): number {
    let count = 0;
    for (const connection of this.connections.values()) {
      if (connection.noteId === noteId) {
        count++;
      }
    }
    return count;
  }

  // 生成连接线ID
  private getConnectionId(noteId: string, slotIndex: number): string {
    return `${noteId}-slot-${slotIndex}`;
  }

  // 处理窗口大小变化
  private handleWindowResize = (): void => {
    // 延迟更新，避免频繁调用
    setTimeout(() => {
      this.updateConnectionPositions();
    }, 100);
  };

  // 处理滚动事件
  private handleScroll = (): void => {
    // 节流处理，避免频繁更新
    if (!this.scrollTimeout) {
      this.scrollTimeout = setTimeout(() => {
        this.updateConnectionPositions();
        this.scrollTimeout = null;
      }, 16); // 约60fps
    }
  };

  private scrollTimeout: NodeJS.Timeout | null = null;

  // 销毁管理器
  destroy(): void {
    this.clearAllConnections();
    
    if (this.isInitialized) {
      window.removeEventListener('resize', this.handleWindowResize);
      window.removeEventListener('scroll', this.handleScroll, true);
      this.isInitialized = false;
    }

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }

    console.log('🔗 连接线管理器已销毁');
  }
}

// 创建全局连接线管理器实例
export const connectionLineManager = new ConnectionLineManager();

// 导出管理器类
export { ConnectionLineManager };
export type { ConnectionLine };
