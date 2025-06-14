// 重构后的无限画布组件 - 使用全局状态管理
import React, {
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useImperativeHandle,
  forwardRef,
} from "react";
import { throttle } from "lodash";
import { message } from "antd";
import CanvasToolbar from "./CanvasToolbar";
import CanvasGrid from "./CanvasGrid";
import CanvasConsole from "./CanvasConsole";
import StickyNote from "./StickyNote";
import SearchModal from "./SearchModal";
import SettingsModal from "./SettingsModal";
import { CANVAS_CONSTANTS, GRID_CONSTANTS } from "./CanvasConstants";
import type { StickyNote as StickyNoteType } from "./types";
import "./InfiniteCanvas.css";

// 全局状态管理导入
import { 
  useStickyNotesStore, 
  useCanvasStore, 
  useAIStore, 
  useUIStore 
} from "../stores";

// AI服务导入
import { getAIService } from "../services/aiService";

// 生成智能标题的工具函数
const generateSmartTitle = (prompt: string): string => {
  if (!prompt || prompt.trim().length === 0) {
    return "AI思考中...";
  }

  // 清理prompt，移除多余的空格和换行
  const cleanPrompt = prompt.trim().replace(/\s+/g, ' ');

  // 根据prompt内容生成智能标题
  const keywords = [
    { patterns: ['学习', '教程', '课程', '知识'], prefix: '学习' },
    { patterns: ['计划', '安排', '规划', '目标'], prefix: '计划' },
    { patterns: ['想法', '创意', '点子', '灵感'], prefix: '想法' },
    { patterns: ['工作', '任务', '项目', '开发'], prefix: '工作' },
    { patterns: ['问题', '疑问', '困惑', '求助'], prefix: '问题' },
    { patterns: ['总结', '回顾', '梳理', '整理'], prefix: '总结' },
  ];

  // 查找匹配的关键词
  for (const keyword of keywords) {
    if (keyword.patterns.some(pattern => cleanPrompt.includes(pattern))) {
      const preview = cleanPrompt.length > 15
        ? cleanPrompt.substring(0, 15) + '...'
        : cleanPrompt;
      return `${keyword.prefix}：${preview}`;
    }
  }

  // 如果没有匹配的关键词，使用通用格式
  const preview = cleanPrompt.length > 20
    ? cleanPrompt.substring(0, 20) + '...'
    : cleanPrompt;

  return preview;
};

// 组件接口
interface InfiniteCanvasRef {
  createNote: () => void;
  focusConsole: () => void;
  saveAllNotes: () => void;
  undo: () => void;
  redo: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  openSearch: () => void;
}

const InfiniteCanvas = forwardRef<InfiniteCanvasRef>((_, ref) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<any>(null);
  const requestRef = useRef<number | null>(null);

  // 全局状态管理 - 便签状态
  const {
    notes: stickyNotes,
    loading: notesLoading,
    error: notesError,
    streamingNotes,
    addNote,
    updateNote,
    deleteNote,
    bringNoteToFront,
    clearAllNotes,
    startStreamingNote,
    updateStreamingContent,
    finishStreamingNote,
    cancelStreamingNote,
    initialize: initializeStickyNotes,
  } = useStickyNotesStore();

  // 全局状态管理 - 画布状态
  const {
    scale,
    offsetX,
    offsetY,
    dragState,
    zoomAnimating,
    zoomIn,
    zoomOut,
    setScale,
    setOffset,
    startDrag,
    updateDrag,
    endDrag,
    resetView,
    screenToCanvas,
    canvasToScreen,
    setZoomAnimating,
    getCanvasCenter,
  } = useCanvasStore();

  // 全局状态管理 - AI状态
  const {
    config: aiConfig,
    hasValidConfig,
    loading: aiLoading,
    isGenerating: isAIGenerating,
    startGeneration,
    finishGeneration,
    getFullConfig,
    initialize: initializeAI,
  } = useAIStore();

  // 全局状态管理 - UI状态
  const {
    modals: { searchModalOpen, settingsModalOpen, settingsDefaultTab },
    openSearchModal,
    closeSearchModal,
    openSettingsModal,
    closeSettingsModal,
    initialize: initializeUI,
  } = useUIStore();

  // 获取完整AI配置
  const fullAIConfig = useMemo(() => {
    return getFullConfig();
  }, [getFullConfig]);

  // AI服务实例
  const aiService = useMemo(() => {
    console.log("🔧 更新AI服务配置:", {
      ...fullAIConfig,
      apiKey: fullAIConfig.apiKey ? "已设置" : "未设置",
      systemPrompt: fullAIConfig.systemPrompt ? "已设置" : "未设置"
    });
    return getAIService(fullAIConfig);
  }, [fullAIConfig]);

  // 便签操作函数
  const updateStickyNote = useCallback(
    async (id: string, updates: Partial<StickyNoteType>) => {
      await updateNote(id, updates);
    },
    [updateNote]
  );

  const deleteStickyNote = useCallback(
    async (id: string) => {
      await deleteNote(id);
    },
    [deleteNote]
  );

  // 创建新便签
  const createStickyNote = useCallback(
    async (x: number, y: number) => {
      try {
        const colors: Array<StickyNoteType["color"]> = [
          "yellow", "blue", "green", "pink", "purple",
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        // 添加随机偏移，防止便签完全堆叠
        const offsetRange = 50;
        const randomOffsetX = Math.random() * offsetRange * 2 - offsetRange;
        const randomOffsetY = Math.random() * offsetRange * 2 - offsetRange;

        const positionX = x + randomOffsetX;
        const positionY = y + randomOffsetY;

        const maxZ = stickyNotes.length > 0
          ? Math.max(...stickyNotes.map((note) => note.zIndex))
          : 0;

        const newNote: StickyNoteType = {
          id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          x: positionX,
          y: positionY,
          width: 250,
          height: 200,
          content: "",
          title: "新便签",
          color: randomColor,
          isNew: true,
          zIndex: maxZ + 1,
          isEditing: true,
          isTitleEditing: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        console.log('📝 创建新便签:', newNote.id);

        // 添加到数据库，addNote会返回实际添加的便签
        const addedNote = await addNote(newNote);

        console.log('✅ 便签添加完成:', addedNote.id);

        // 500ms 后移除新建标记
        setTimeout(async () => {
          try {
            console.log('🔄 移除新建标记:', addedNote.id);
            await updateStickyNote(addedNote.id, { isNew: false });
            console.log('✅ 新建标记移除完成:', addedNote.id);
          } catch (error) {
            console.error('❌ 移除新建标记失败:', error);
          }
        }, 500);
      } catch (error) {
        console.error('❌ 创建便签失败:', error);
        message.error('创建便签失败');
      }
    },
    [stickyNotes, addNote, updateStickyNote]
  );

  // 在画布中心创建便签
  const createStickyNoteAtCenter = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // 增加中心区域随机分布
      const centerRandomRange = 100;
      const distributedScreenX = centerX + (Math.random() * centerRandomRange - centerRandomRange / 2);
      const distributedScreenY = centerY + (Math.random() * centerRandomRange - centerRandomRange / 2);

      // 将屏幕坐标转换为画布逻辑坐标
      const logicalX = (distributedScreenX - offsetX) / scale;
      const logicalY = (distributedScreenY - offsetY) / scale;

      createStickyNote(logicalX, logicalY);
    }
  }, [createStickyNote, offsetX, offsetY, scale]);

  // 鼠标事件处理
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // 只处理左键点击
      if (e.button !== 0) return;

      // 如果点击的是便签或其他交互元素，不处理画布拖拽
      const target = e.target as HTMLElement;
      if (target.closest('.sticky-note') || target.closest('.canvas-console') || target.closest('.canvas-toolbar')) {
        return;
      }

      e.preventDefault();
      console.log('🖱️ 开始拖拽画布', { x: e.clientX, y: e.clientY });
      startDrag(e.clientX, e.clientY);
    },
    [startDrag]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragState.isDragging) {
        e.preventDefault();
        updateDrag(e.clientX, e.clientY);
      }
    },
    [dragState.isDragging, updateDrag]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (dragState.isDragging) {
        e.preventDefault();
        endDrag();
      }
    },
    [dragState.isDragging, endDrag]
  );

  // 双击创建便签
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      // 如果双击的是便签或其他交互元素，不创建新便签
      const target = e.target as HTMLElement;
      if (target.closest('.sticky-note') || target.closest('.canvas-console') || target.closest('.canvas-toolbar')) {
        return;
      }

      e.preventDefault();

      // 使用容器的边界来计算坐标
      const containerElement = e.currentTarget as HTMLElement;
      const rect = containerElement.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left - offsetX) / scale;
      const canvasY = (e.clientY - rect.top - offsetY) / scale;

      console.log('🖱️ 双击创建便签', {
        clientX: e.clientX,
        clientY: e.clientY,
        canvasX: canvasX.toFixed(1),
        canvasY: canvasY.toFixed(1)
      });

      createStickyNote(canvasX, canvasY);
    },
    [offsetX, offsetY, scale, createStickyNote]
  );

  // 滚轮缩放处理
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      // 使用容器的边界来计算缩放中心点
      const containerElement = document.querySelector('.infinite-canvas-container') as HTMLElement;
      if (!containerElement) return;

      const rect = containerElement.getBoundingClientRect();
      const centerX = e.clientX - rect.left;
      const centerY = e.clientY - rect.top;

      if (e.deltaY < 0) {
        // 向上滚动，放大
        zoomIn(centerX, centerY);
      } else {
        // 向下滚动，缩小
        zoomOut(centerX, centerY);
      }
    },
    [zoomIn, zoomOut]
  );

  // 同步画布状态到CSS变量，用于网格显示
  useEffect(() => {
    const container = document.querySelector('.infinite-canvas-container') as HTMLElement;
    if (!container) return;

    // 更新CSS变量，让网格跟随画布变换
    container.style.setProperty('--canvas-scale', scale.toString());
    container.style.setProperty('--canvas-offset-x', `${offsetX}px`);
    container.style.setProperty('--canvas-offset-y', `${offsetY}px`);

    console.log(`🎨 画布状态更新: scale=${scale.toFixed(2)}, offset=(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);
  }, [scale, offsetX, offsetY]);

  // 组件初始化（Store已在App中初始化，这里只做组件级别的初始化）
  useEffect(() => {
    console.log("🎨 InfiniteCanvas 组件初始化完成");
  }, []);

  // 设置全局鼠标事件监听器
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const handleGlobalMouseUp = (e: MouseEvent) => handleMouseUp(e);

    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  // 设置滚轮事件监听器 - 监听整个画布容器
  useEffect(() => {
    const containerElement = document.querySelector('.infinite-canvas-container') as HTMLElement;
    if (!containerElement) return;

    const handleWheelEvent = (e: WheelEvent) => {
      // 检查事件是否来自便签或其他交互元素
      const target = e.target as HTMLElement;
      if (target.closest('.sticky-note') || target.closest('.canvas-console') || target.closest('.canvas-toolbar')) {
        return; // 不处理这些元素上的滚轮事件
      }

      handleWheel(e);
    };

    containerElement.addEventListener('wheel', handleWheelEvent, { passive: false });

    return () => {
      containerElement.removeEventListener('wheel', handleWheelEvent);
    };
  }, [handleWheel]);

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    createNote: createStickyNoteAtCenter,
    focusConsole: () => consoleRef.current?.focus(),
    saveAllNotes: () => {
      // TODO: 实现保存所有便签
      message.success("便签已保存");
    },
    undo: () => {
      // TODO: 实现撤销功能
      message.info("撤销功能待实现");
    },
    redo: () => {
      // TODO: 实现重做功能
      message.info("重做功能待实现");
    },
    zoomIn: () => zoomIn(),
    zoomOut: () => zoomOut(),
    resetZoom: () => resetView(),
    openSearch: () => openSearchModal(),
  }));

  return (
    <div
      className={`infinite-canvas-container ${dragState.isDragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* 工具栏 */}
      <CanvasToolbar
        scale={scale}
        zoomAnimating={zoomAnimating}
        onZoomIn={() => {
          // 以画布中心为缩放中心
          const center = getCanvasCenter();
          zoomIn(center.x, center.y);
        }}
        onZoomOut={() => {
          // 以画布中心为缩放中心
          const center = getCanvasCenter();
          zoomOut(center.x, center.y);
        }}
        onReset={resetView}
        onCreateNote={createStickyNoteAtCenter}
        onClearDatabase={clearAllNotes}
        onSearch={openSearchModal}
        minScale={CANVAS_CONSTANTS.MIN_SCALE}
        maxScale={CANVAS_CONSTANTS.MAX_SCALE}
      />

      {/* 画布背景区域 - 包含网格但不变换 */}
      <div className="canvas-background">
        {/* 网格 - 独立于画布变换 */}
        <CanvasGrid showAxis={false} />
      </div>

      {/* 画布内容区域 - 应用变换 */}
      <div
        ref={canvasRef}
        className="infinite-canvas"
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        {/* 便签 */}
        {stickyNotes.map((note) => {
          const streamingData = streamingNotes.get(note.id);
          return (
            <StickyNote
              key={note.id}
              note={note}
              onUpdate={updateStickyNote}
              onDelete={deleteStickyNote}
              onBringToFront={bringNoteToFront}
              canvasScale={scale}
              canvasOffset={{ x: offsetX, y: offsetY }}
              isStreaming={streamingData?.isStreaming}
              streamingContent={streamingData?.streamingContent}
            />
          );
        })}
      </div>

      {/* 控制台 */}
      <CanvasConsole
        ref={consoleRef}
        onCreateNote={createStickyNoteAtCenter}
        onGenerateWithAI={(prompt) => {
          // TODO: 实现AI生成功能
          message.info(`AI生成功能待实现: ${prompt}`);
        }}
        isAIGenerating={isAIGenerating}
        onOpenAISettings={() => openSettingsModal("ai")}
      />

      {/* 搜索模态框 */}
      <SearchModal
        open={searchModalOpen}
        onClose={closeSearchModal}
        notes={stickyNotes}
        onNoteSelect={(note) => {
          // TODO: 实现便签定位功能
          message.info(`定位到便签: ${note.title}`);
          closeSearchModal();
        }}
      />

      {/* 设置模态框 */}
      <SettingsModal
        open={settingsModalOpen}
        onClose={closeSettingsModal}
        defaultActiveTab={settingsDefaultTab}
      />
    </div>
  );
});

InfiniteCanvas.displayName = "InfiniteCanvas";

export default InfiniteCanvas;
