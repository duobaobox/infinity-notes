// 连接线管理器 - 使用Leader Line实现便签到插槽的连接线
import { PERFORMANCE_CONSTANTS } from "../components/canvas/CanvasConstants";
import type { StickyNote } from "../components/types";
import { loadLeaderLine } from "./leaderLineLoader";

// Leader Line类型定义
interface LeaderLineOptions {
  color?: string;
  size?: number;
  path?: string;
  startSocket?: string;
  endSocket?: string;
  startSocketGravity?: string;
  endSocketGravity?: string;
  startPlug?: string;
  endPlug?: string;
  outline?: boolean;
  outlineColor?: string;
  outlineSize?: number;
  dash?: {
    len?: number;
    gap?: number;
  };
  animate?: {
    duration?: number;
    timing?: string;
  };
}

declare class LeaderLineClass {
  constructor(
    start: HTMLElement,
    end: HTMLElement,
    options?: LeaderLineOptions
  );
  position(): void;
  remove(): void;
  show(showEffectName?: string, animOptions?: object): void;
  hide(hideEffectName?: string, animOptions?: object): void;
  setOptions(options: LeaderLineOptions): void;
}

// 连接线类型常量
const ConnectionType = {
  NORMAL: "normal",
  SOURCE: "source",
} as const;

// 连接线实例接口
interface ConnectionLine {
  id: string; // 连接线唯一标识
  type: "normal" | "source"; // 连接线类型
  noteId: string; // 便签ID
  slotIndex?: number; // 插槽索引（普通连接线使用）
  targetNoteId?: string; // 目标便签ID（溯源连接线使用）
  line: LeaderLineClass; // Leader Line实例
  startElement: HTMLElement; // 起始元素（便签连接点）
  endElement: HTMLElement; // 结束元素（插槽或溯源连接点）
}

// 溯源连接线实例接口
interface SourceConnectionLine extends ConnectionLine {
  type: "source";
  targetNoteId: string; // 目标便签ID（汇总便签）
  sourceNoteId: string; // 源便签ID
}

// 性能监控数据接口
interface PerformanceMetrics {
  updateCount: number; // 更新次数
  totalUpdateTime: number; // 总更新时间
  maxUpdateTime: number; // 最大更新时间
  throttleHits: number; // 节流命中次数
  lastUpdateTime: number; // 最后更新时间
  updateFrequency: number; // 更新频率 (Hz)
}

// 连接线管理器类
class ConnectionLineManager {
  private connections: Map<string, ConnectionLine> = new Map(); // 连接线映射表
  private isInitialized = false; // 是否已初始化
  private updateThrottleTimeout: NodeJS.Timeout | null = null; // 更新节流定时器
  private rafId: number | null = null; // requestAnimationFrame ID
  private pendingUpdates = new Set<string>(); // 待更新的连接线ID

  // 性能监控数据
  private performanceMetrics: PerformanceMetrics = {
    updateCount: 0,
    totalUpdateTime: 0,
    maxUpdateTime: 0,
    throttleHits: 0,
    lastUpdateTime: 0,
    updateFrequency: 0,
  };

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

    // 初始化缓存
    this.buildConnectionCache();

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
        type: "normal",
        noteId: note.id,
        slotIndex,
        line,
        startElement: connectionPoint,
        endElement: slotElement,
      };

      // 保存连接线
      this.connections.set(connectionId, connection);

      // 更新缓存
      this.updateConnectionCache(connectionId, connection);

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
        // 移除特定普通连接线（不影响溯源连接线）
        const connectionId = this.getConnectionId(noteId, slotIndex);
        const connection = this.connections.get(connectionId);

        if (connection && connection.type === "normal") {
          connection.line.remove();
          this.connections.delete(connectionId);
          // 更新缓存
          this.removeConnectionFromCache(connectionId, connection);
          console.log(`🗑️ 已移除普通连接线: ${noteId} -> 插槽${slotIndex}`);
          return true;
        } else if (connection && connection.type === "source") {
          console.warn(
            `⚠️ 尝试通过插槽索引删除溯源连接线被阻止: ${connectionId}`
          );
          return false;
        }
      } else {
        // 移除便签的所有普通连接线（不包括溯源连接线）
        console.log(
          `🔍 准备删除便签 ${noteId} 的普通连接线，当前连接总数: ${this.connections.size}`
        );

        // 先统计当前连接线类型
        const normalConnections = [];
        const sourceConnections = [];
        for (const [id, connection] of this.connections.entries()) {
          if (connection.noteId === noteId) {
            if (connection.type === "normal") {
              normalConnections.push(id);
            } else if (connection.type === "source") {
              sourceConnections.push(id);
            }
          }
        }

        console.log(
          `📊 便签 ${noteId} 的连接线统计: 普通连接 ${normalConnections.length} 个, 溯源连接 ${sourceConnections.length} 个`
        );
        console.log(`📊 普通连接线IDs: ${normalConnections.join(", ")}`);
        console.log(`📊 溯源连接线IDs: ${sourceConnections.join(", ")}`);

        let removed = false;
        for (const [connectionId, connection] of this.connections.entries()) {
          if (connection.noteId === noteId && connection.type === "normal") {
            console.log(`🗑️ 删除普通连接线: ${connectionId}`);
            connection.line.remove();
            this.connections.delete(connectionId);
            // 更新缓存
            this.removeConnectionFromCache(connectionId, connection);
            removed = true;
          }
        }

        if (removed) {
          console.log(`✅ 已移除便签 ${noteId} 的所有普通连接线`);

          // 再次统计剩余连接线
          const remainingConnections = [];
          for (const [id, connection] of this.connections.entries()) {
            if (connection.noteId === noteId) {
              remainingConnections.push(`${id} (${connection.type})`);
            }
          }
          console.log(
            `📊 便签 ${noteId} 的剩余连接线: ${remainingConnections.join(", ")}`
          );

          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("移除连接线失败:", error);
      return false;
    }
  }
  // 清空所有普通连接线（不包括溯源连接）
  clearAllConnections(): void {
    try {
      console.log("🔍 开始清空普通连接线，当前连接数:", this.connections.size);

      const connectionsToRemove: string[] = [];

      // 找到所有普通连接线
      for (const [id, connection] of this.connections.entries()) {
        if (connection.type === "normal") {
          connectionsToRemove.push(id);
        }
      }

      console.log(`📌 找到 ${connectionsToRemove.length} 个普通连接线需要移除`);

      // 逐个移除普通连接线
      for (const id of connectionsToRemove) {
        try {
          const connection = this.connections.get(id);
          if (connection) {
            console.log(`📌 正在移除普通连接线: ${id}`);
            connection.line.remove();
            this.connections.delete(id);
          }
        } catch (lineError) {
          console.error(`❌ 移除连接线 ${id} 失败:`, lineError);
        }
      }

      console.log(
        `✅ 普通连接线清空完成，剩余连接数: ${this.connections.size}`
      );
    } catch (error) {
      console.error("❌ 清空普通连接线失败:", error);
    }
  }

  // 清空所有连接线（包括普通连接线和溯源连接线）
  clearAllConnectionsIncludingSource(): void {
    try {
      console.log("🔍 开始清空所有连接线，当前连接数:", this.connections.size);

      const connectionsToRemove: string[] = [];

      // 找到所有连接线
      for (const [id] of this.connections.entries()) {
        connectionsToRemove.push(id);
      }

      console.log(`📌 找到 ${connectionsToRemove.length} 个连接线需要移除`);

      // 逐个移除所有连接线
      for (const id of connectionsToRemove) {
        try {
          const connection = this.connections.get(id);
          if (connection) {
            console.log(`📌 正在移除连接线: ${id} (类型: ${connection.type})`);
            connection.line.remove();
            this.connections.delete(id);
          }
        } catch (lineError) {
          console.error(`❌ 移除连接线 ${id} 失败:`, lineError);
        }
      }

      const sourceConnectionCount = Array.from(
        this.connections.values()
      ).filter((conn) => conn.type === "source").length;

      // 清空缓存并重新构建
      this.buildConnectionCache();

      console.log(
        `🧹 已清空所有普通连接线，保留 ${sourceConnectionCount} 个溯源连接线`
      );
    } catch (error) {
      console.error("❌ 清空普通连接线失败:", error);
      throw error; // 抛出错误以便上层处理
    }
  }

  // 连接线索引缓存 - 优化查找性能
  private noteConnectionsCache = new Map<string, Set<string>>();

  // 更新连接线位置 - 使用节流优化性能
  updateConnectionPositions(): void {
    // 如果没有连接线，直接返回
    if (this.connections.size === 0) {
      return;
    }

    // 如果已有待处理的更新，记录节流命中并直接返回
    if (this.updateThrottleTimeout) {
      this.recordThrottleHit();
      return;
    }

    // 节流处理，避免频繁更新
    this.updateThrottleTimeout = setTimeout(() => {
      this.performConnectionUpdate();
      this.updateThrottleTimeout = null;
    }, PERFORMANCE_CONSTANTS.CONNECTION_UPDATE_THROTTLE_MS);
  }

  // 构建连接线索引缓存 - 优化查找性能
  private buildConnectionCache(): void {
    this.noteConnectionsCache.clear();

    for (const [connectionId, connection] of this.connections) {
      // 为源便签建立索引
      if (!this.noteConnectionsCache.has(connection.noteId)) {
        this.noteConnectionsCache.set(connection.noteId, new Set());
      }
      this.noteConnectionsCache.get(connection.noteId)!.add(connectionId);

      // 为目标便签建立索引（仅溯源连接线）
      if (connection.type === "source" && connection.targetNoteId) {
        if (!this.noteConnectionsCache.has(connection.targetNoteId)) {
          this.noteConnectionsCache.set(connection.targetNoteId, new Set());
        }
        this.noteConnectionsCache
          .get(connection.targetNoteId)!
          .add(connectionId);
      }
    }
  }

  // 获取便签相关的连接线ID列表 - 使用缓存优化性能
  private getNoteConnectionIds(noteId: string): string[] {
    const connectionIds = this.noteConnectionsCache.get(noteId);
    return connectionIds ? Array.from(connectionIds) : [];
  }

  // 更新单个连接线的缓存
  private updateConnectionCache(
    connectionId: string,
    connection: ConnectionLine
  ): void {
    // 为源便签建立索引
    if (!this.noteConnectionsCache.has(connection.noteId)) {
      this.noteConnectionsCache.set(connection.noteId, new Set());
    }
    this.noteConnectionsCache.get(connection.noteId)!.add(connectionId);

    // 为目标便签建立索引（仅溯源连接线）
    if (connection.type === "source" && connection.targetNoteId) {
      if (!this.noteConnectionsCache.has(connection.targetNoteId)) {
        this.noteConnectionsCache.set(connection.targetNoteId, new Set());
      }
      this.noteConnectionsCache.get(connection.targetNoteId)!.add(connectionId);
    }
  }

  // 从缓存中移除连接线
  private removeConnectionFromCache(
    connectionId: string,
    connection: ConnectionLine
  ): void {
    // 从源便签的缓存中移除
    const sourceConnections = this.noteConnectionsCache.get(connection.noteId);
    if (sourceConnections) {
      sourceConnections.delete(connectionId);
      if (sourceConnections.size === 0) {
        this.noteConnectionsCache.delete(connection.noteId);
      }
    }

    // 从目标便签的缓存中移除（仅溯源连接线）
    if (connection.type === "source" && connection.targetNoteId) {
      const targetConnections = this.noteConnectionsCache.get(
        connection.targetNoteId
      );
      if (targetConnections) {
        targetConnections.delete(connectionId);
        if (targetConnections.size === 0) {
          this.noteConnectionsCache.delete(connection.targetNoteId);
        }
      }
    }
  }

  // 执行连接线位置更新
  private performConnectionUpdate(): void {
    // 取消之前的动画帧
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    // 使用 requestAnimationFrame 优化性能
    this.rafId = requestAnimationFrame(() => {
      const startTime = performance.now();

      try {
        for (const connection of this.connections.values()) {
          connection.line.position();
        }

        // 记录性能指标
        const endTime = performance.now();
        const updateTime = endTime - startTime;
        this.recordPerformanceMetric(updateTime);
      } catch (error) {
        console.error("更新连接线位置失败:", error);
      }
      this.rafId = null;
    });
  }

  // 更新特定便签的连接线位置 - 使用缓存优化性能
  updateNoteConnections(noteId: string): void {
    // 使用缓存快速检查该便签是否有连接线
    const connectionIds = this.getNoteConnectionIds(noteId);
    if (connectionIds.length === 0) {
      return;
    }

    // 将便签ID添加到待更新列表
    this.pendingUpdates.add(noteId);

    // 如果已有待处理的更新，直接返回
    if (this.updateThrottleTimeout) {
      return;
    }

    // 节流处理，避免频繁更新 - 使用与便签拖拽相同的频率
    this.updateThrottleTimeout = setTimeout(() => {
      this.performNoteConnectionUpdate();
      this.updateThrottleTimeout = null;
    }, PERFORMANCE_CONSTANTS.CONNECTION_UPDATE_IMMEDIATE_THROTTLE_MS); // 改为16ms，与便签拖拽同步
  }

  // 立即更新特定便签的连接线位置 - 用于拖动时的实时同步（优化版）
  updateNoteConnectionsImmediate(noteId: string): void {
    try {
      // 使用缓存快速获取相关连接线
      const connectionIds = this.getNoteConnectionIds(noteId);
      if (connectionIds.length === 0) {
        return;
      }

      const connectionsToUpdate: ConnectionLine[] = [];
      let normalConnections = 0;
      let sourceConnections = 0;

      // 收集需要更新的连接线
      for (const connectionId of connectionIds) {
        const connection = this.connections.get(connectionId);
        if (connection) {
          connectionsToUpdate.push(connection);
          if (connection.type === "normal") {
            normalConnections++;
          } else if (connection.type === "source") {
            sourceConnections++;
          }
        }
      }

      if (connectionsToUpdate.length === 0) {
        return;
      }

      // 输出调试信息（仅在有溯源连接线时）
      if (sourceConnections > 0 && process.env.NODE_ENV === "development") {
        console.log(
          `🔄 立即更新便签 ${noteId} 的连接线: ${normalConnections} 个普通连接线, ${sourceConnections} 个溯源连接线`
        );
      }

      // 优化的DOM位置同步策略 - 减少强制重排次数
      // 只在必要时进行一次性的强制重排，而不是每个连接线都重排
      if (connectionsToUpdate.length > 0) {
        // 收集所有需要更新的元素，避免重复操作
        const elements = new Set<HTMLElement>();
        for (const connection of connectionsToUpdate) {
          elements.add(connection.startElement);
          elements.add(connection.endElement);
        }

        // 一次性强制重排所有相关元素，减少重排次数
        for (const element of elements) {
          element.offsetHeight; // 触发重排
        }
      }

      // 批量更新连接线位置 - 使用requestAnimationFrame确保在下一帧执行
      // 这样可以避免阻塞当前帧的渲染
      requestAnimationFrame(() => {
        for (const connection of connectionsToUpdate) {
          try {
            connection.line.position();
          } catch (error) {
            console.warn(`更新连接线 ${connection.noteId} 位置失败:`, error);
          }
        }
      });
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
        const connectionsToUpdate: ConnectionLine[] = [];

        for (const noteId of this.pendingUpdates) {
          for (const connection of this.connections.values()) {
            // 检查以该便签为起点的连接线（普通连接线和溯源连接线的源便签）
            if (connection.noteId === noteId) {
              connectionsToUpdate.push(connection);
            }
            // 检查以该便签为终点的溯源连接线（目标便签）
            else if (
              connection.type === "source" &&
              connection.targetNoteId === noteId
            ) {
              connectionsToUpdate.push(connection);
            }
          }
        }

        // 强制DOM位置刷新，确保连接线获取到最新位置
        for (const connection of connectionsToUpdate) {
          // 强制重排，确保CSS left/top属性已应用
          connection.startElement.offsetHeight;
          connection.endElement.offsetHeight;

          // 获取最新位置
          connection.startElement.getBoundingClientRect();
          connection.endElement.getBoundingClientRect();

          // 再次强制重排确保位置准确
          connection.startElement.offsetTop;
          connection.endElement.offsetTop;
          connection.startElement.offsetLeft;
          connection.endElement.offsetLeft;
        }

        // 批量更新连接线位置
        for (const connection of connectionsToUpdate) {
          connection.line.position();
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
      // 检查以该便签为起点的连接线（普通连接线和溯源连接线的源便签）
      if (connection.noteId === noteId) {
        return true;
      }
      // 检查以该便签为终点的溯源连接线（目标便签）
      if (connection.type === "source" && connection.targetNoteId === noteId) {
        return true;
      }
    }
    return false;
  }

  // 获取便签的连接线数量
  getNoteConnectionCount(noteId: string): number {
    let count = 0;
    for (const connection of this.connections.values()) {
      // 检查以该便签为起点的连接线（普通连接线和溯源连接线的源便签）
      if (connection.noteId === noteId) {
        count++;
      }
      // 检查以该便签为终点的溯源连接线（目标便签）
      else if (
        connection.type === "source" &&
        connection.targetNoteId === noteId
      ) {
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
        type: "source",
        noteId: sourceNoteId,
        targetNoteId: targetNoteId,
        sourceNoteId: sourceNoteId,
        line,
        startElement: sourceConnectionPoint,
        endElement: targetConnectionPoint,
      };

      // 保存连接线
      this.connections.set(connectionId, connection);

      // 更新缓存
      this.updateConnectionCache(connectionId, connection);

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

      if (connection && connection.type === "source") {
        console.log(`🗑️ 删除溯源连接线: ${connectionId}`);
        connection.line.remove();
        this.connections.delete(connectionId);
        // 更新缓存
        this.removeConnectionFromCache(connectionId, connection);
        console.log(`✅ 已移除溯源连接线: ${sourceNoteId} -> ${targetNoteId}`);
        return true;
      } else if (connection && connection.type !== "source") {
        console.warn(
          `⚠️ 尝试删除非溯源连接线被阻止: ${connectionId} (类型: ${connection.type})`
        );
        return false;
      }

      console.warn(`⚠️ 未找到溯源连接线: ${connectionId}`);
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
          connection.type === "source" &&
          connection.targetNoteId === targetNoteId
        ) {
          connection.line.remove();
          this.connections.delete(connectionId);
          // 更新缓存
          this.removeConnectionFromCache(connectionId, connection);
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
      if (connection.type === "source" && connection.noteId === noteId) {
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
          connection.type === "source" &&
          connection.noteId === sourceNoteId
        ) {
          connection.line.remove();
          this.connections.delete(connectionId);
          // 更新缓存
          this.removeConnectionFromCache(connectionId, connection);
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
        connection.type === "source" &&
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

  // 记录性能指标
  private recordPerformanceMetric(updateTime: number): void {
    const now = Date.now();

    this.performanceMetrics.updateCount++;
    this.performanceMetrics.totalUpdateTime += updateTime;
    this.performanceMetrics.maxUpdateTime = Math.max(
      this.performanceMetrics.maxUpdateTime,
      updateTime
    );

    // 计算更新频率 (Hz) - 基于最近1秒内的更新次数
    if (this.performanceMetrics.lastUpdateTime > 0) {
      const timeDiff = now - this.performanceMetrics.lastUpdateTime;
      if (timeDiff > 0) {
        this.performanceMetrics.updateFrequency = 1000 / timeDiff;
      }
    }

    this.performanceMetrics.lastUpdateTime = now;
  }

  // 获取性能统计数据
  getPerformanceMetrics(): PerformanceMetrics & {
    averageUpdateTime: number;
    normalConnections: number;
    sourceConnections: number;
  } {
    let normalConnections = 0;
    let sourceConnections = 0;

    for (const connection of this.connections.values()) {
      if (connection.type === "normal") {
        normalConnections++;
      } else if (connection.type === "source") {
        sourceConnections++;
      }
    }

    return {
      ...this.performanceMetrics,
      averageUpdateTime:
        this.performanceMetrics.updateCount > 0
          ? this.performanceMetrics.totalUpdateTime /
            this.performanceMetrics.updateCount
          : 0,
      normalConnections,
      sourceConnections,
    };
  }

  // 重置性能统计数据
  resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      updateCount: 0,
      totalUpdateTime: 0,
      maxUpdateTime: 0,
      throttleHits: 0,
      lastUpdateTime: 0,
      updateFrequency: 0,
    };
  }

  // 记录节流命中
  private recordThrottleHit(): void {
    this.performanceMetrics.throttleHits++;
  }

  // 销毁管理器 - 完整的内存清理
  destroy(): void {
    console.log("🔗 开始销毁连接线管理器...");

    // 清理所有连接线
    this.clearAllConnections();

    // 移除事件监听器
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

    // 清空缓存
    this.noteConnectionsCache.clear();

    // 重置性能监控数据
    this.resetPerformanceMetrics();

    // 连接线池功能已移除

    console.log("🔗 连接线管理器已完全销毁，内存已清理");
  }
}

// 创建全局连接线管理器实例
export const connectionLineManager = new ConnectionLineManager();

// 导出管理器类
export { ConnectionLineManager, ConnectionType };
export type { ConnectionLine, SourceConnectionLine };
