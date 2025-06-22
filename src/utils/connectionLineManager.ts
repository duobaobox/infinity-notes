// 连接线管理器 - 使用Leader Line实现便签到插槽的连接线
import type { StickyNote } from "../components/types";
import { PERFORMANCE_CONSTANTS } from "../components/canvas/CanvasConstants";

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
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/leader-line@1.0.7/leader-line.min.js";
      script.onload = () => {
        if (window.LeaderLine) {
          LeaderLine = window.LeaderLine;
          resolve(LeaderLine);
        } else {
          reject(new Error("Leader Line failed to load"));
        }
      };
      script.onerror = () =>
        reject(new Error("Failed to load Leader Line script"));
      document.head.appendChild(script);
    } catch (error) {
      reject(error);
    }
  });

  return loadPromise;
};

// 连接线类型枚举
enum ConnectionType {
  NORMAL = "normal", // 普通连接线（便签到插槽）
  SOURCE = "source", // 溯源连接线（源便签到汇总便签）
}

// 连接线实例接口
interface ConnectionLine {
  id: string; // 连接线唯一标识
  type: ConnectionType; // 连接线类型
  noteId: string; // 便签ID
  slotIndex?: number; // 插槽索引（普通连接线使用）
  targetNoteId?: string; // 目标便签ID（溯源连接线使用）
  line: any; // Leader Line实例
  startElement: HTMLElement; // 起始元素（便签连接点）
  endElement: HTMLElement; // 结束元素（插槽或溯源连接点）
}

// 溯源连接线实例接口
interface SourceConnectionLine extends ConnectionLine {
  type: ConnectionType.SOURCE;
  targetNoteId: string; // 目标便签ID（汇总便签）
  sourceNoteId: string; // 源便签ID
}

// 连接线管理器类
class ConnectionLineManager {
  private connections: Map<string, ConnectionLine> = new Map(); // 连接线映射表
  private isInitialized = false; // 是否已初始化
  private updateThrottleTimeout: NodeJS.Timeout | null = null; // 更新节流定时器
  private rafId: number | null = null; // requestAnimationFrame ID
  private pendingUpdates = new Set<string>(); // 待更新的连接线ID

  constructor() {
    this.init();
  }

  // 初始化管理器
  private init() {
    if (this.isInitialized) return;

    // 监听窗口大小变化，自动更新连接线位置
    window.addEventListener("resize", this.handleWindowResize);

    // 监听滚动事件，更新连接线位置
    window.addEventListener("scroll", this.handleScroll, true);

    this.isInitialized = true;
    console.log("🔗 连接线管理器已初始化");
  }

  // 创建连接线
  async createConnection(
    note: StickyNote,
    slotIndex: number
  ): Promise<boolean> {
    try {
      const connectionId = this.getConnectionId(note.id, slotIndex);

      // 检查是否已存在连接
      if (this.connections.has(connectionId)) {
        console.warn(`连接线 ${connectionId} 已存在`);
        return false;
      }

      // 使用requestAnimationFrame等待DOM更新，减少延迟
      await new Promise((resolve) => requestAnimationFrame(resolve));

      // 获取便签连接点元素 - 使用连接点容器作为连接目标
      const noteElement = document.querySelector(`[data-note-id="${note.id}"]`);
      const connectionPoint = noteElement?.querySelector(
        ".connection-point"
      ) as HTMLElement;

      if (!connectionPoint) {
        console.error(`未找到便签 ${note.id} 的连接点`);
        console.log("便签元素:", noteElement);
        console.log(
          "连接点容器:",
          noteElement?.querySelector(".connection-point")
        );
        return false;
      }

      // 获取对应的插槽元素 - 直接使用slot-circle作为连接目标
      const slotElement = document.querySelector(
        `.note-slot[data-note-id="${note.id}"][data-index="${slotIndex}"] .slot-circle`
      ) as HTMLElement;

      if (!slotElement) {
        console.error(`未找到插槽索引 ${slotIndex} 对应的元素`);
        console.log(
          "查找的选择器:",
          `.note-slot[data-note-id="${note.id}"][data-index="${slotIndex}"] .slot-circle`
        );
        return false;
      }

      console.log("🔍 连接元素信息:", {
        connectionPoint: connectionPoint.getBoundingClientRect(),
        slotElement: slotElement.getBoundingClientRect(),
        noteId: note.id,
        slotIndex,
      });

      // 加载Leader Line
      const LeaderLineClass = await loadLeaderLine();

      // 强制刷新元素位置
      connectionPoint.getBoundingClientRect();
      slotElement.getBoundingClientRect();

      // 创建Leader Line连接线 - 使用贝塞尔曲线，无端点圆点
      const line = new LeaderLineClass(connectionPoint, slotElement, {
        color: "#1677ff", // 蓝色连接线
        size: 4, // 线条粗细
        path: "fluid", // 使用流畅的贝塞尔曲线
        startSocket: "auto", // 让Leader Line自动选择最佳连接点
        endSocket: "auto", // 让Leader Line自动选择最佳连接点
        startSocketGravity: "auto", // 使用auto让Leader Line自动计算
        endSocketGravity: "auto", // 使用auto让Leader Line自动计算
        startPlug: "behind", // 隐藏起始点圆点
        endPlug: "behind", // 隐藏结束点圆点
        outline: true, // 启用轮廓
        outlineColor: "rgba(255, 255, 255, 0.8)", // 白色轮廓
        outlineSize: 1.2, // 轮廓大小
        animate: {
          // 连接动画
          duration: 400,
          timing: "ease-in-out",
        },
      });

      // 立即更新位置确保精确连接
      requestAnimationFrame(() => {
        line.position();
      });

      // 创建连接线记录
      const connection: ConnectionLine = {
        id: connectionId,
        type: ConnectionType.NORMAL,
        noteId: note.id,
        slotIndex,
        line,
        startElement: connectionPoint,
        endElement: slotElement,
      };

      // 保存连接线
      this.connections.set(connectionId, connection);

      console.log(
        `✅ 已创建连接线: ${note.title || "无标题"} -> 插槽${slotIndex}`
      );
      return true;
    } catch (error) {
      console.error("创建连接线失败:", error);
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
      console.error("移除连接线失败:", error);
      return false;
    }
  }
  // 清空所有连接线
  clearAllConnections(): void {
    try {
      console.log("🔍 开始清空连接线，当前连接数:", this.connections.size);

      // 逐个移除连接线
      for (const [id, connection] of this.connections.entries()) {
        try {
          console.log(`📌 正在移除连接线: ${id}`);
          connection.line.remove();
          this.connections.delete(id);
        } catch (lineError) {
          console.error(`❌ 移除连接线 ${id} 失败:`, lineError);
        }
      }

      // 确保完全清空
      this.connections.clear();

      console.log("🧹 已清空所有连接线");
    } catch (error) {
      console.error("❌ 清空连接线失败:", error);
      // 出错时也要尝试强制清空
      this.connections.clear();
      throw error; // 抛出错误以便上层处理
    }
  }

  // 更新连接线位置 - 使用节流优化性能
  updateConnectionPositions(): void {
    // 如果没有连接线，直接返回
    if (this.connections.size === 0) {
      return;
    }

    // 如果已有待处理的更新，直接返回
    if (this.updateThrottleTimeout) {
      return;
    }

    // 节流处理，避免频繁更新
    this.updateThrottleTimeout = setTimeout(() => {
      this.performConnectionUpdate();
      this.updateThrottleTimeout = null;
    }, PERFORMANCE_CONSTANTS.CONNECTION_UPDATE_THROTTLE_MS);
  }

  // 执行连接线位置更新
  private performConnectionUpdate(): void {
    // 取消之前的动画帧
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    // 使用 requestAnimationFrame 优化性能
    this.rafId = requestAnimationFrame(() => {
      try {
        for (const connection of this.connections.values()) {
          connection.line.position();
        }
      } catch (error) {
        console.error("更新连接线位置失败:", error);
      }
      this.rafId = null;
    });
  }

  // 更新特定便签的连接线位置 - 使用节流优化性能
  updateNoteConnections(noteId: string): void {
    // 检查该便签是否有连接线
    let hasConnection = false;
    for (const connection of this.connections.values()) {
      if (connection.noteId === noteId) {
        hasConnection = true;
        break;
      }
    }

    // 如果该便签没有连接线，直接返回
    if (!hasConnection) {
      return;
    }

    // 将便签ID添加到待更新列表
    this.pendingUpdates.add(noteId);

    // 如果已有待处理的更新，直接返回
    if (this.updateThrottleTimeout) {
      return;
    }

    // 节流处理，避免频繁更新
    this.updateThrottleTimeout = setTimeout(() => {
      this.performNoteConnectionUpdate();
      this.updateThrottleTimeout = null;
    }, PERFORMANCE_CONSTANTS.CONNECTION_UPDATE_THROTTLE_MS);
  }

  // 立即更新特定便签的连接线位置 - 用于拖动时的实时同步
  updateNoteConnectionsImmediate(noteId: string): void {
    try {
      // 检查该便签是否有连接线
      let hasConnection = false;
      const connectionsToUpdate: ConnectionLine[] = [];

      for (const connection of this.connections.values()) {
        if (connection.noteId === noteId) {
          hasConnection = true;
          connectionsToUpdate.push(connection);
        }
      }

      // 如果该便签没有连接线，直接返回
      if (!hasConnection) {
        return;
      }

      // 批量更新连接线位置
      for (const connection of connectionsToUpdate) {
        connection.line.position();
      }
    } catch (error) {
      console.error("立即更新便签连接线位置失败:", error);
    }
  }

  // 立即更新所有连接线位置 - 用于画布拖动时的实时同步
  updateConnectionPositionsImmediate(): void {
    try {
      // 如果没有连接线，直接返回
      if (this.connections.size === 0) {
        return;
      }

      // 立即更新所有连接线位置
      for (const connection of this.connections.values()) {
        connection.line.position();
      }
    } catch (error) {
      console.error("立即更新所有连接线位置失败:", error);
    }
  }

  // 执行特定便签的连接线位置更新
  private performNoteConnectionUpdate(): void {
    // 取消之前的动画帧
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    // 使用 requestAnimationFrame 优化性能
    this.rafId = requestAnimationFrame(() => {
      try {
        // 批量更新所有待更新的便签连接线
        for (const noteId of this.pendingUpdates) {
          for (const connection of this.connections.values()) {
            if (connection.noteId === noteId) {
              connection.line.position();
            }
          }
        }
        // 清空待更新列表
        this.pendingUpdates.clear();
      } catch (error) {
        console.error("更新便签连接线位置失败:", error);
      }
      this.rafId = null;
    });
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

  // 生成溯源连接线ID
  private getSourceConnectionId(
    sourceNoteId: string,
    targetNoteId: string
  ): string {
    return `source-${sourceNoteId}-to-${targetNoteId}`;
  }

  // 创建溯源连接线
  async createSourceConnection(
    sourceNoteId: string,
    targetNoteId: string
  ): Promise<boolean> {
    try {
      const connectionId = this.getSourceConnectionId(
        sourceNoteId,
        targetNoteId
      );

      // 检查是否已存在连接
      if (this.connections.has(connectionId)) {
        console.warn(`溯源连接线 ${connectionId} 已存在`);
        return false;
      }

      // 等待DOM更新
      await new Promise((resolve) => requestAnimationFrame(resolve));

      // 获取源便签的连接点
      const sourceNoteElement = document.querySelector(
        `[data-note-id="${sourceNoteId}"]`
      );
      const sourceConnectionPoint = sourceNoteElement?.querySelector(
        ".connection-point"
      ) as HTMLElement;

      if (!sourceConnectionPoint) {
        console.error(`未找到源便签 ${sourceNoteId} 的连接点`);
        return false;
      }

      // 获取目标便签的连接点（现在溯源功能已融合到普通连接点中）
      const targetNoteElement = document.querySelector(
        `[data-note-id="${targetNoteId}"]`
      );
      const targetConnectionPoint = targetNoteElement?.querySelector(
        ".connection-point"
      ) as HTMLElement;

      if (!targetConnectionPoint) {
        console.error(`未找到目标便签 ${targetNoteId} 的连接点`);
        return false;
      }

      console.log("🔍 溯源连接元素信息:", {
        sourceConnectionPoint: sourceConnectionPoint.getBoundingClientRect(),
        targetConnectionPoint: targetConnectionPoint.getBoundingClientRect(),
        sourceNoteId,
        targetNoteId,
      });

      // 加载Leader Line
      const LeaderLineClass = await loadLeaderLine();

      // 强制刷新元素位置
      sourceConnectionPoint.getBoundingClientRect();
      targetConnectionPoint.getBoundingClientRect();

      // 创建溯源连接线 - 使用不同的样式
      const line = new LeaderLineClass(
        sourceConnectionPoint,
        targetConnectionPoint,
        {
          color: "#fa8c16", // 橙色连接线，与溯源连接点颜色一致
          size: 3, // 稍细一些
          path: "fluid", // 使用流畅的贝塞尔曲线
          startSocket: "auto",
          endSocket: "auto",
          startSocketGravity: "auto",
          endSocketGravity: "auto",
          startPlug: "behind", // 隐藏起始点圆点
          endPlug: "behind", // 隐藏结束点圆点
          outline: true, // 启用轮廓
          outlineColor: "rgba(255, 255, 255, 0.9)", // 白色轮廓
          outlineSize: 1, // 轮廓大小
          dash: { len: 8, gap: 4 }, // 虚线样式，区分普通连接线
          animate: {
            // 连接动画
            duration: 500,
            timing: "ease-in-out",
          },
        }
      );

      // 立即更新位置确保精确连接
      requestAnimationFrame(() => {
        line.position();
      });

      // 创建溯源连接线记录
      const connection: SourceConnectionLine = {
        id: connectionId,
        type: ConnectionType.SOURCE,
        noteId: sourceNoteId,
        targetNoteId: targetNoteId,
        sourceNoteId: sourceNoteId,
        line,
        startElement: sourceConnectionPoint,
        endElement: targetConnectionPoint,
      };

      // 保存连接线
      this.connections.set(connectionId, connection);

      console.log(`✅ 已创建溯源连接线: ${sourceNoteId} -> ${targetNoteId}`);
      return true;
    } catch (error) {
      console.error("创建溯源连接线失败:", error);
      return false;
    }
  }

  // 移除溯源连接线
  removeSourceConnection(sourceNoteId: string, targetNoteId: string): boolean {
    try {
      const connectionId = this.getSourceConnectionId(
        sourceNoteId,
        targetNoteId
      );
      const connection = this.connections.get(connectionId);

      if (connection) {
        connection.line.remove();
        this.connections.delete(connectionId);
        console.log(`🗑️ 已移除溯源连接线: ${sourceNoteId} -> ${targetNoteId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error("移除溯源连接线失败:", error);
      return false;
    }
  }

  // 移除便签的所有溯源连接线（作为目标便签）
  removeAllSourceConnectionsToNote(targetNoteId: string): boolean {
    try {
      let removed = false;
      for (const [connectionId, connection] of this.connections.entries()) {
        if (
          connection.type === ConnectionType.SOURCE &&
          connection.targetNoteId === targetNoteId
        ) {
          connection.line.remove();
          this.connections.delete(connectionId);
          removed = true;
        }
      }

      if (removed) {
        console.log(`🗑️ 已移除目标便签 ${targetNoteId} 的所有溯源连接线`);
        return true;
      }

      return false;
    } catch (error) {
      console.error("移除溯源连接线失败:", error);
      return false;
    }
  }

  // 检查是否存在溯源连接线
  hasSourceConnection(sourceNoteId: string, targetNoteId: string): boolean {
    const connectionId = this.getSourceConnectionId(sourceNoteId, targetNoteId);
    return this.connections.has(connectionId);
  }

  // 检查便签是否正在被溯源连接线连接（作为源便签）
  isNoteBeingSourceConnected(noteId: string): boolean {
    for (const connection of this.connections.values()) {
      if (
        connection.type === ConnectionType.SOURCE &&
        connection.noteId === noteId
      ) {
        return true;
      }
    }
    return false;
  }

  // 移除便签的所有溯源连接线（作为源便签）
  removeAllSourceConnectionsFromNote(sourceNoteId: string): boolean {
    try {
      let removed = false;
      for (const [connectionId, connection] of this.connections.entries()) {
        if (
          connection.type === ConnectionType.SOURCE &&
          connection.noteId === sourceNoteId
        ) {
          connection.line.remove();
          this.connections.delete(connectionId);
          removed = true;
        }
      }

      if (removed) {
        console.log(`🗑️ 已移除源便签 ${sourceNoteId} 的所有溯源连接线`);
        return true;
      }

      return false;
    } catch (error) {
      console.error("移除源便签溯源连接线失败:", error);
      return false;
    }
  }

  // 获取便签的溯源连接线数量（作为目标便签）
  getSourceConnectionCount(targetNoteId: string): number {
    let count = 0;
    for (const connection of this.connections.values()) {
      if (
        connection.type === ConnectionType.SOURCE &&
        connection.targetNoteId === targetNoteId
      ) {
        count++;
      }
    }
    return count;
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
      }, PERFORMANCE_CONSTANTS.CONNECTION_UPDATE_THROTTLE_MS);
    }
  };

  private scrollTimeout: NodeJS.Timeout | null = null;

  // 销毁管理器
  destroy(): void {
    this.clearAllConnections();

    if (this.isInitialized) {
      window.removeEventListener("resize", this.handleWindowResize);
      window.removeEventListener("scroll", this.handleScroll, true);
      this.isInitialized = false;
    }

    // 清理所有定时器和动画帧
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }

    if (this.updateThrottleTimeout) {
      clearTimeout(this.updateThrottleTimeout);
      this.updateThrottleTimeout = null;
    }

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // 清空待更新列表
    this.pendingUpdates.clear();

    console.log("🔗 连接线管理器已销毁");
  }
}

// 创建全局连接线管理器实例
export const connectionLineManager = new ConnectionLineManager();

// 导出管理器类
export { ConnectionLineManager, ConnectionType };
export type { ConnectionLine, SourceConnectionLine };
