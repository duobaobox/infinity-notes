import React, {
  useRef,
  useState,
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
import SettingsModal from "./SettingsModal"; // 导入 SettingsModal 组件
import { CANVAS_CONSTANTS, GRID_CONSTANTS } from "./CanvasConstants";
import type { StickyNote as StickyNoteType } from "./types";
import { useDatabase } from "../database";
import { useAISettings } from "../hooks/useAISettings";
import { useAIPromptSettings } from "../hooks/useAIPromptSettings";
import { AIService } from "../services/aiService";
import "./InfiniteCanvas.css";

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
    { patterns: ['提醒', '备忘', '记住', '别忘'], prefix: '提醒' },
    { patterns: ['购物', '买', '清单', '商品'], prefix: '购物' },
    { patterns: ['旅行', '旅游', '出行', '行程'], prefix: '旅行' },
    { patterns: ['健康', '运动', '锻炼', '健身'], prefix: '健康' },
    { patterns: ['美食', '菜谱', '做饭', '料理'], prefix: '美食' },
    { patterns: ['读书', '阅读', '书籍', '文章'], prefix: '阅读' },
  ];

  // 查找匹配的关键词
  for (const keyword of keywords) {
    if (keyword.patterns.some(pattern => cleanPrompt.includes(pattern))) {
      // 提取prompt的前15个字符作为预览
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

interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startOffsetX: number;
  startOffsetY: number;
}

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
  const [canvasState, setCanvasState] = useState<CanvasState>({
    scale: CANVAS_CONSTANTS.DEFAULT_SCALE,
    offsetX: 0,
    offsetY: 0,
  });
  const [zoomAnimating, setZoomAnimating] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false); // 添加 AI 设置模态框状态
  const [settingsDefaultTab, setSettingsDefaultTab] = useState("general"); // 设置模态框默认标签页
  const [isAIGenerating, setIsAIGenerating] = useState(false); // 添加AI生成状态控制

  // 流式便签状态管理
  const [streamingNotes, setStreamingNotes] = useState<Map<string, {
    note: StickyNoteType;
    streamingContent: string;
    isStreaming: boolean;
  }>>(new Map());

  // AI设置Hook
  const { config: aiConfig, hasValidConfig, loading: aiLoading } = useAISettings();

  // AI提示词设置Hook
  const { promptConfig } = useAIPromptSettings(hasValidConfig);

  // 添加AI配置变化的调试日志
  useEffect(() => {
    console.log("🔄 AI配置更新:", {
      hasValidConfig,
      aiLoading,
      config: {
        apiKey: aiConfig.apiKey ? "已设置" : "未设置",
        apiUrl: aiConfig.apiUrl || "未设置",
        aiModel: aiConfig.aiModel || "未设置"
      }
    });
  }, [aiConfig, hasValidConfig, aiLoading]);

  // 合并AI基础配置和提示词配置
  const fullAIConfig = useMemo(() => {
    return {
      ...aiConfig,
      systemPrompt: promptConfig.systemPrompt,
      enableSystemPrompt: promptConfig.enableSystemPrompt,
    };
  }, [aiConfig, promptConfig]);

  // AI服务实例
  const aiService = useMemo(() => {
    return new AIService(fullAIConfig);
  }, [fullAIConfig]);

  // 使用数据库Hook管理便签
  const {
    notes: stickyNotes,
    loading: notesLoading,
    error: notesError,
    addNote,
    updateNote,
    deleteNote,
    clearDatabase,
  } = useDatabase();

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });

  // 便签置顶功能
  const bringNoteToFront = useCallback(
    async (id: string) => {
      const note = stickyNotes.find((note) => note.id === id);
      if (note) {
        const maxZ = Math.max(...stickyNotes.map((note) => note.zIndex));
        const updatedNote = { ...note, zIndex: maxZ + 1 };
        await updateNote(updatedNote);
      }
    },
    [stickyNotes, updateNote]
  );

  // 更新便签
  const updateStickyNote = useCallback(
    async (id: string, updates: Partial<StickyNoteType>) => {
      const note = stickyNotes.find((note) => note.id === id);
      if (note) {
        const updatedNote = { ...note, ...updates };
        await updateNote(updatedNote);
      }
    },
    [stickyNotes, updateNote]
  );

  // 删除便签
  const deleteStickyNote = useCallback(
    async (id: string) => {
      await deleteNote(id);
    },
    [deleteNote]
  );

  // 创建新便签 - 原有的双击功能
  const createStickyNote = useCallback(
    async (x: number, y: number) => {
      const colors: Array<StickyNoteType["color"]> = [
        "yellow",
        "blue",
        "green",
        "pink",
        "purple",
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      // 添加随机偏移，防止便签完全堆叠
      const offsetRange = 50; // 随机偏移范围（像素）
      const randomOffsetX = Math.random() * offsetRange * 2 - offsetRange; // -50 到 50 之间的随机值
      const randomOffsetY = Math.random() * offsetRange * 2 - offsetRange; // -50 到 50 之间的随机值

      // 应用随机偏移到位置坐标
      const positionX = x + randomOffsetX;
      const positionY = y + randomOffsetY;

      const maxZ =
        stickyNotes.length > 0
          ? Math.max(...stickyNotes.map((note) => note.zIndex))
          : 0;
      const newNote: StickyNoteType = {
        id: `note-${Date.now()}-${Math.random()}`,
        // 使用添加了随机偏移的坐标
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

      // 添加到数据库
      await addNote(newNote);

      // 500ms 后移除新建标记
      setTimeout(() => {
        updateStickyNote(newNote.id, { isNew: false });
      }, 500);
    },
    [stickyNotes, addNote, updateStickyNote]
  );

  // 创建新便签 - 在画布中心位置
  const createStickyNoteAtCenter = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      // 在画布中心创建便签
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // 增加中心区域随机分布
      const centerRandomRange = 100; // 中心区域分布范围
      const distributedScreenX =
        centerX + (Math.random() * centerRandomRange - centerRandomRange / 2);
      const distributedScreenY =
        centerY + (Math.random() * centerRandomRange - centerRandomRange / 2);

      // 重要：将屏幕坐标转换为画布逻辑坐标，考虑当前画布偏移和缩放
      // 这样即使画布被移动，便签也会出现在当前可见区域的中心位置
      const logicalX =
        (distributedScreenX - canvasState.offsetX) / canvasState.scale;
      const logicalY =
        (distributedScreenY - canvasState.offsetY) / canvasState.scale;

      // 使用转换后的逻辑坐标创建便签，createStickyNote函数会再添加小的随机偏移
      createStickyNote(logicalX, logicalY);
    }
  }, [
    createStickyNote,
    canvasState.offsetX,
    canvasState.offsetY,
    canvasState.scale,
  ]);



  // AI生成便签（流式）
  const generateStickyNotesWithAI = useCallback(
    async (prompt: string) => {
      // 防止并发请求
      if (isAIGenerating) {
        console.warn("AI正在生成中，忽略重复请求");
        return;
      }

      try {
        setIsAIGenerating(true);

        // 获取画布中心位置用于放置便签
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const logicalCenterX = (centerX - canvasState.offsetX) / canvasState.scale;
        const logicalCenterY = (centerY - canvasState.offsetY) / canvasState.scale;

        const maxZ = stickyNotes.length > 0
          ? Math.max(...stickyNotes.map((note) => note.zIndex))
          : 0;

        // 存储便签ID映射
        const noteIdMap = new Map<number, string>();
        const timestamp = Date.now();

        // 检查AI配置是否有效，如果没有配置则使用演示模式
        console.log("🤖 AI配置检查:", {
          apiKey: aiConfig.apiKey ? "已设置" : "未设置",
          apiUrl: aiConfig.apiUrl || "未设置",
          aiModel: aiConfig.aiModel || "未设置",
          enableAI: aiConfig.enableAI
        });

        const isDemoMode = !aiConfig.apiKey || !aiConfig.apiUrl || !aiConfig.aiModel;
        console.log("🤖 是否演示模式:", isDemoMode);

        if (isDemoMode) {
          // 演示模式：使用预设的便签内容
          message.info("演示模式：使用预设内容展示流式效果");

          // 立即创建第一个便签（演示模式）
          const noteId = `ai-streaming-note-${timestamp}-0`;
          noteIdMap.set(0, noteId);

          // 生成智能的初始标题
          const smartTitle = generateSmartTitle(prompt);

          const newNote: StickyNoteType = {
            id: noteId,
            x: logicalCenterX + (Math.random() - 0.5) * 60,
            y: logicalCenterY + (Math.random() - 0.5) * 60,
            width: 250,
            height: 200,
            content: "", // 初始内容为空
            title: smartTitle,
            color: "yellow",
            isNew: true,
            zIndex: maxZ + 1,
            isEditing: false,
            isTitleEditing: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // 立即添加到数据库和状态
          await addNote(newNote);
          setStreamingNotes(prev => {
            const newMap = new Map(prev);
            newMap.set(newNote.id, {
              note: newNote,
              streamingContent: "",
              isStreaming: true,
            });
            return newMap;
          });

          await runDemoStreamingMode(prompt, logicalCenterX, logicalCenterY, maxZ, noteIdMap, timestamp);
          return;
        }

        console.log("🔧 更新AI服务配置:", {
          ...fullAIConfig,
          apiKey: fullAIConfig.apiKey ? "已设置" : "未设置",
          enableSystemPrompt: fullAIConfig.enableSystemPrompt,
          systemPrompt: fullAIConfig.systemPrompt ? "已设置" : "未设置"
        });
        aiService.updateConfig(fullAIConfig);

        // 立即创建第一个便签
        const noteId = `ai-streaming-note-${timestamp}-0`;
        noteIdMap.set(0, noteId);

        // 生成智能的初始标题
        const smartTitle = generateSmartTitle(prompt);

        const newNote: StickyNoteType = {
          id: noteId,
          x: logicalCenterX + (Math.random() - 0.5) * 60,
          y: logicalCenterY + (Math.random() - 0.5) * 60,
          width: 250,
          height: 200,
          content: "", // 初始内容为空
          title: smartTitle,
          color: "yellow",
          isNew: true,
          zIndex: maxZ + 1,
          isEditing: false,
          isTitleEditing: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // 立即添加到数据库和状态
        await addNote(newNote);
        setStreamingNotes(prev => {
          const newMap = new Map(prev);
          newMap.set(newNote.id, {
            note: newNote,
            streamingContent: "",
            isStreaming: true,
          });
          return newMap;
        });

        // 流式生成回调
        const callbacks = {
          onNoteStart: async (noteIndex: number, title: string) => {
            // 检查是否已经存在这个便签
            const existingNoteId = noteIdMap.get(noteIndex);
            if (existingNoteId) {
              // 如果便签已存在，只更新标题
              console.log("🔄 更新便签标题:", noteIndex, title);
              await updateStickyNote(existingNoteId, {
                title: title,
                updatedAt: new Date()
              });

              // 更新流式状态中的标题
              setStreamingNotes(prev => {
                const newMap = new Map(prev);
                const existing = newMap.get(existingNoteId);
                if (existing) {
                  newMap.set(existingNoteId, {
                    ...existing,
                    note: {
                      ...existing.note,
                      title: title
                    }
                  });
                }
                return newMap;
              });
              return;
            }

            // 如果是额外的便签（索引大于0），创建新便签
            if (noteIndex > 0) {
              console.log("📝 创建额外便签:", noteIndex, title);

              // 计算便签位置（支持多个便签的网格布局）
              const spacing = 280;
              const notesPerRow = Math.ceil(Math.sqrt(4)); // 假设最多4个便签，可以根据实际情况调整
              const row = Math.floor(noteIndex / notesPerRow);
              const col = noteIndex % notesPerRow;

              // 计算基础位置
              const baseX = logicalCenterX + (col - (notesPerRow - 1) / 2) * spacing;
              const baseY = logicalCenterY + (row - 0.5) * spacing;

              // 添加小范围随机偏移
              const offsetX = (Math.random() - 0.5) * 60;
              const offsetY = (Math.random() - 0.5) * 60;

              const noteId = `ai-streaming-note-${timestamp}-${noteIndex}`;
              noteIdMap.set(noteIndex, noteId);

              // 映射颜色
              const colors: StickyNoteType["color"][] = ["yellow", "blue", "green", "pink", "purple"];
              const noteColor = colors[noteIndex % colors.length];

              const newNote: StickyNoteType = {
                id: noteId,
                x: baseX + offsetX,
                y: baseY + offsetY,
                width: 250,
                height: 200,
                content: "", // 初始内容为空
                title: title,
                color: noteColor,
                isNew: true,
                zIndex: maxZ + noteIndex + 1,
                isEditing: false,
                isTitleEditing: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              // 添加到数据库
              await addNote(newNote);

              // 添加到流式状态管理
              setStreamingNotes(prev => {
                const newMap = new Map(prev);
                newMap.set(newNote.id, {
                  note: newNote,
                  streamingContent: "",
                  isStreaming: true,
                });
                return newMap;
              });
            }
          },

          onContentChunk: (noteIndex: number, chunk: string, fullContent: string) => {
            // 更新流式内容
            const noteId = noteIdMap.get(noteIndex);
            if (!noteId) return;

            setStreamingNotes(prev => {
              const newMap = new Map(prev);
              const existing = newMap.get(noteId);
              if (existing) {
                newMap.set(noteId, {
                  ...existing,
                  streamingContent: fullContent,
                });
              }
              return newMap;
            });
          },

          onNoteComplete: async (noteIndex: number, noteData: any) => {
            const noteId = noteIdMap.get(noteIndex);
            if (!noteId) return;

            // 更新便签内容到数据库
            await updateStickyNote(noteId, {
              content: noteData.content,
              updatedAt: new Date()
            });

            // 移除流式状态
            setStreamingNotes(prev => {
              const newMap = new Map(prev);
              const existing = newMap.get(noteId);
              if (existing) {
                newMap.set(noteId, {
                  ...existing,
                  isStreaming: false,
                });
              }
              return newMap;
            });

            // 延迟移除新建标记
            setTimeout(() => {
              updateStickyNote(noteId, { isNew: false });
            }, 500);
          },

          onAllComplete: async (notes: any[]) => {
            console.log("🎉 onAllComplete 收到便签:", notes);

            // 检查是否有便签没有通过流式过程创建（兜底逻辑）
            for (let i = 0; i < notes.length; i++) {
              const noteId = noteIdMap.get(i);
              if (!noteId) {
                console.log("⚠️ 发现遗漏的便签，补充创建:", i, notes[i].title);
                // 如果有遗漏的便签，触发创建
                await callbacks.onNoteStart?.(i, notes[i].title);
                await new Promise(resolve => setTimeout(resolve, 100));

                // 快速显示内容（因为是兜底，不需要打字效果）
                callbacks.onContentChunk?.(i, notes[i].content, notes[i].content);
                callbacks.onNoteComplete?.(i, notes[i]);
              }
            }

            message.success(`AI成功生成了 ${notes.length} 个便签`);
            // 清理所有流式状态
            setTimeout(() => {
              setStreamingNotes(new Map());
            }, 1000);
          },

          onError: (error: string) => {
            message.error(error);
            setStreamingNotes(new Map());
          }
        };

        // 调用简化的真实流式生成方法
        await aiService.generateStickyNotesStreaming(prompt, callbacks);

      } catch (error) {
        console.error("AI流式生成便签失败:", error);
        message.error("AI生成便签失败，请检查网络连接和配置");
        setStreamingNotes(new Map());
      } finally {
        setIsAIGenerating(false);
      }
    },
    [
      aiService,
      fullAIConfig,
      canvasState,
      stickyNotes,
      addNote,
      updateStickyNote,
      isAIGenerating,
    ]
  );

  // 演示模式的流式生成
  const runDemoStreamingMode = async (
    prompt: string,
    logicalCenterX: number,
    logicalCenterY: number,
    maxZ: number,
    noteIdMap: Map<number, string>,
    timestamp: number
  ) => {
    // 预设的演示便签内容
    const demoNotes = [
      {
        title: "📝 学习计划",
        content: "今天要学习React的流式渲染技术，包括：\n\n1. 理解流式数据处理\n2. 实现打字机效果\n3. 优化用户体验\n\n预计用时：2小时",
        color: "#dbeafe"
      },
      {
        title: "💡 项目想法",
        content: "开发一个智能便签应用：\n\n✨ 特色功能：\n- AI生成内容\n- 流式显示效果\n- 实时协作\n- 智能分类\n\n这将是一个很棒的项目！",
        color: "#e9d5ff"
      },
      {
        title: "🎯 今日目标",
        content: "完成便签应用的核心功能：\n\n✅ 实现流式便签生成\n⏳ 优化打字效果\n⏳ 添加动画效果\n⏳ 测试用户体验\n\n进度：25%",
        color: "#d1fae5"
      }
    ];

    // 创建演示模式的回调对象
    const callbacks = {
      onNoteStart: async (noteIndex: number, title: string) => {
        // 检查是否已经存在这个便签（第一个便签已经在外部创建）
        const existingNoteId = noteIdMap.get(noteIndex);
        if (existingNoteId) {
          // 如果便签已存在，只更新标题
          console.log("🔄 演示模式更新便签标题:", noteIndex, title);
          await updateStickyNote(existingNoteId, {
            title: title,
            updatedAt: new Date()
          });

          // 更新流式状态中的标题
          setStreamingNotes(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(existingNoteId);
            if (existing) {
              newMap.set(existingNoteId, {
                ...existing,
                note: {
                  ...existing.note,
                  title: title
                }
              });
            }
            return newMap;
          });
          return;
        }

        // 如果是额外的便签（索引大于0），创建新便签
        if (noteIndex > 0) {
          console.log("📝 演示模式创建额外便签:", noteIndex, title);

          // 计算便签位置（支持多个便签的网格布局）
          const spacing = 280;
          const notesPerRow = Math.ceil(Math.sqrt(4)); // 假设最多4个便签，可以根据实际情况调整
          const row = Math.floor(noteIndex / notesPerRow);
          const col = noteIndex % notesPerRow;

          // 计算基础位置
          const baseX = logicalCenterX + (col - (notesPerRow - 1) / 2) * spacing;
          const baseY = logicalCenterY + (row - 0.5) * spacing;

          // 添加小范围随机偏移
          const offsetX = (Math.random() - 0.5) * 60;
          const offsetY = (Math.random() - 0.5) * 60;

          const noteId = `ai-streaming-note-${timestamp}-${noteIndex}`;
          noteIdMap.set(noteIndex, noteId);

          // 映射颜色
          const colors: StickyNoteType["color"][] = ["yellow", "blue", "green", "pink", "purple"];
          const noteColor = colors[noteIndex % colors.length];

          const newNote: StickyNoteType = {
            id: noteId,
            x: baseX + offsetX,
            y: baseY + offsetY,
            width: 250,
            height: 200,
            content: "", // 初始内容为空
            title: title,
            color: noteColor,
            isNew: true,
            zIndex: maxZ + noteIndex + 1,
            isEditing: false,
            isTitleEditing: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // 添加到数据库
          await addNote(newNote);

          // 添加到流式状态管理
          setStreamingNotes(prev => {
            const newMap = new Map(prev);
            newMap.set(newNote.id, {
              note: newNote,
              streamingContent: "",
              isStreaming: true,
            });
            return newMap;
          });
        }
      },

      onContentChunk: (noteIndex: number, chunk: string, fullContent: string) => {
        // 更新流式内容
        const noteId = noteIdMap.get(noteIndex);
        if (!noteId) return;

        setStreamingNotes(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(noteId);
          if (existing) {
            newMap.set(noteId, {
              ...existing,
              streamingContent: fullContent,
            });
          }
          return newMap;
        });
      },

      onNoteComplete: async (noteIndex: number, noteData: any) => {
        const noteId = noteIdMap.get(noteIndex);
        if (!noteId) return;

        // 更新便签内容到数据库
        await updateStickyNote(noteId, {
          content: noteData.content,
          updatedAt: new Date()
        });

        // 移除流式状态
        setStreamingNotes(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(noteId);
          if (existing) {
            newMap.set(noteId, {
              ...existing,
              isStreaming: false,
            });
          }
          return newMap;
        });

        // 延迟移除新建标记
        setTimeout(() => {
          updateStickyNote(noteId, { isNew: false });
        }, 500);
      },

      onAllComplete: (notes: any[]) => {
        message.success(`AI成功生成了 ${notes.length} 个便签`);
        // 清理所有流式状态
        setTimeout(() => {
          setStreamingNotes(new Map());
        }, 1000);
      },

      onError: (error: string) => {
        message.error(error);
        setStreamingNotes(new Map());
      }
    };

    try {
      // 模拟AI处理时间
      await new Promise(resolve => setTimeout(resolve, 500));

      for (let i = 0; i < demoNotes.length; i++) {
        const noteData = demoNotes[i];

        // 触发便签开始回调
        await callbacks.onNoteStart?.(i, noteData.title);

        // 模拟逐字显示
        let currentContent = "";
        for (let j = 0; j < noteData.content.length; j++) {
          currentContent += noteData.content[j];
          callbacks.onContentChunk?.(i, noteData.content[j], currentContent);

          // 控制打字速度
          const char = noteData.content[j];
          const delay = /[\u4e00-\u9fa5]/.test(char) ? 50 : 30;
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // 触发便签完成回调
        await callbacks.onNoteComplete?.(i, noteData);

        // 便签之间的间隔
        if (i < demoNotes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // 触发全部完成回调
      callbacks.onAllComplete?.(demoNotes);

    } catch (error) {
      callbacks.onError?.("演示模式出错");
    }
  };

  // 触发缩放动画
  const triggerZoomAnimation = useCallback(() => {
    setZoomAnimating(true);
    setTimeout(
      () => setZoomAnimating(false),
      CANVAS_CONSTANTS.ZOOM_ANIMATION_DURATION
    );
  }, []);

  // 缩放功能
  const handleZoomIn = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      scale: Math.min(
        prev.scale * CANVAS_CONSTANTS.ZOOM_FACTOR,
        CANVAS_CONSTANTS.MAX_SCALE
      ),
    }));
    triggerZoomAnimation();
  }, [triggerZoomAnimation]);

  const handleZoomOut = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      scale: Math.max(
        prev.scale / CANVAS_CONSTANTS.ZOOM_FACTOR,
        CANVAS_CONSTANTS.MIN_SCALE
      ),
    }));
    triggerZoomAnimation();
  }, [triggerZoomAnimation]);

  // 重置画布
  const handleReset = useCallback(() => {
    setCanvasState({
      scale: CANVAS_CONSTANTS.DEFAULT_SCALE,
      offsetX: 0,
      offsetY: 0,
    });
    triggerZoomAnimation();
  }, [triggerZoomAnimation]);

  // 使用节流优化的滚轮缩放处理函数
  const handleWheelThrottled = useMemo(
    () =>
      throttle(
        (e: WheelEvent) => {
          e.preventDefault();

          // 优化：使用变量缓存频繁访问的值
          const currentScale = canvasState.scale;
          const delta = e.deltaY > 0 ? 0.9 : 1.1;
          const newScale = Math.min(
            Math.max(currentScale * delta, CANVAS_CONSTANTS.MIN_SCALE),
            CANVAS_CONSTANTS.MAX_SCALE
          );

          // 如果缩放比例没有变化，直接返回
          if (newScale === currentScale) return;

          if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // 计算缩放中心点
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // 调整偏移以保持鼠标位置不变
            const scaleRatio = newScale / canvasState.scale;
            const newOffsetX =
              canvasState.offsetX + (mouseX - centerX) * (1 - scaleRatio);
            const newOffsetY =
              canvasState.offsetY + (mouseY - centerY) * (1 - scaleRatio);

            setCanvasState({
              scale: newScale,
              offsetX: newOffsetX,
              offsetY: newOffsetY,
            });

            if (Math.abs(newScale - canvasState.scale) > 0.05) {
              triggerZoomAnimation();
            }
          }
        },
        CANVAS_CONSTANTS.WHEEL_THROTTLE_MS,
        { leading: true, trailing: true }
      ),
    [canvasState, triggerZoomAnimation]
  );

  // 使用 useEffect 清理节流函数
  useEffect(() => {
    return () => {
      handleWheelThrottled.cancel();
    };
  }, [handleWheelThrottled]);

  // 鼠标按下开始拖拽 - 使用React合成事件
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // 检查是否点击在便签上，如果是则不处理画布拖拽
      const target = e.target as HTMLElement;
      if (target.closest(".sticky-note")) {
        return;
      }

      setDragState({
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX: canvasState.offsetX,
        startOffsetY: canvasState.offsetY,
      });
    },
    [canvasState.offsetX, canvasState.offsetY]
  );

  // 处理双击创建便签
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      // 检查是否双击在便签上，如果是则不创建新便签
      const target = e.target as HTMLElement;
      if (target.closest(".sticky-note")) {
        return;
      }

      // 阻止默认的画布重置行为
      e.preventDefault();
      e.stopPropagation();

      // 计算在画布逻辑坐标系中的位置
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        // 转换屏幕坐标为画布逻辑坐标
        const x =
          (e.clientX - rect.left - canvasState.offsetX) / canvasState.scale;
        const y =
          (e.clientY - rect.top - canvasState.offsetY) / canvasState.scale;
        createStickyNote(x, y);
      }
    },
    [
      canvasState.offsetX,
      canvasState.offsetY,
      canvasState.scale,
      createStickyNote,
    ]
  );

  // 使用 requestAnimationFrame 优化拖拽
  const updateDragPosition = useCallback(
    (clientX: number, clientY: number) => {
      if (dragState.isDragging) {
        const deltaX = clientX - dragState.startX;
        const deltaY = clientY - dragState.startY;

        setCanvasState((prev) => ({
          ...prev,
          offsetX: dragState.startOffsetX + deltaX,
          offsetY: dragState.startOffsetY + deltaY,
        }));

        requestRef.current = requestAnimationFrame(() =>
          updateDragPosition(clientX, clientY)
        );
      }
    },
    // 仅当拖拽状态相关值变化时才更新函数
    [
      dragState.isDragging,
      dragState.startX,
      dragState.startY,
      dragState.startOffsetX,
      dragState.startOffsetY,
    ]
  );

  // 优化后的鼠标移动处理函数
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragState.isDragging) {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
        requestRef.current = requestAnimationFrame(() =>
          updateDragPosition(e.clientX, e.clientY)
        );
      }
    },
    [dragState.isDragging, updateDragPosition]
  );

  // 鼠标松开结束拖拽
  const handleMouseUp = useCallback(() => {
    setDragState((prev) => ({ ...prev, isDragging: false }));
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  // 添加事件监听器
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // 使用React合成事件系统处理滚轮事件
      canvas.addEventListener("wheel", handleWheelThrottled, {
        passive: false,
      });
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      // 添加键盘快捷键支持
      const handleKeyDown = (e: KeyboardEvent) => {
        // 仅当没有输入框获得焦点时才处理快捷键
        if (
          !(
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement
          )
        ) {
          switch (e.key) {
            case "+":
            case "=": // 通常 = 和 + 在同一个键位
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                handleZoomIn();
              }
              break;
            case "-":
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                handleZoomOut();
              }
              break;
            case "0":
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                handleReset();
              }
              break;
            case "Delete":
            case "Backspace":
              // 删除选中的便签（这里需要实现选中状态）
              // TODO: 实现便签选中状态
              break;
            // 可以添加更多快捷键
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        canvas.removeEventListener("wheel", handleWheelThrottled);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("keydown", handleKeyDown);

        // 清理动画帧
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
          requestRef.current = null;
        }
      };
    }
  }, [
    handleWheelThrottled,
    handleMouseMove,
    handleMouseUp,
    handleZoomIn,
    handleZoomOut,
    handleReset,
  ]);

  // 搜索相关方法
  const openSearchModal = useCallback(() => {
    setSearchModalOpen(true);
  }, []);

  const closeSearchModal = useCallback(() => {
    setSearchModalOpen(false);
  }, []);

  // 设置模态框相关方法
  const openSettingsModal = useCallback((defaultTab: string = "general") => {
    setSettingsDefaultTab(defaultTab);
    setSettingsModalOpen(true);
  }, []);

  const closeSettingsModal = useCallback(() => {
    setSettingsModalOpen(false);
  }, []);

  // 选择便签并导航到它
  const selectNote = useCallback(
    (note: StickyNoteType) => {
      // 关闭搜索窗口
      setSearchModalOpen(false);

      // 计算需要移动的距离，让便签居中显示
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        const centerX = canvasRect.width / 2;
        const centerY = canvasRect.height / 2;

        // 计算便签在当前缩放下的位置
        const noteScreenX = note.x * canvasState.scale;
        const noteScreenY = note.y * canvasState.scale;

        // 计算需要的偏移来让便签居中
        const newOffsetX =
          centerX - noteScreenX - (note.width * canvasState.scale) / 2;
        const newOffsetY =
          centerY - noteScreenY - (note.height * canvasState.scale) / 2;

        setCanvasState((prev) => ({
          ...prev,
          offsetX: newOffsetX,
          offsetY: newOffsetY,
        }));

        // 将便签置于最前
        bringNoteToFront(note.id);

        // 显示成功消息
        message.success(`已导航到便签: ${note.title || "无标题"}`);
      }
    },
    [canvasState.scale, bringNoteToFront]
  );

  // 暴露方法给父组件
  useImperativeHandle(
    ref,
    () => ({
      createNote: createStickyNoteAtCenter,
      focusConsole: () => {
        consoleRef.current?.focus?.();
      },
      saveAllNotes: () => {
        // 显示保存成功消息，因为便签是自动保存的
        message.success(`已保存 ${stickyNotes.length} 个便签`);
      },
      undo: () => {
        // TODO: 实现撤销
        console.log("撤销");
      },
      redo: () => {
        // TODO: 实现重做
        console.log("重做");
      },
      zoomIn: handleZoomIn,
      zoomOut: handleZoomOut,
      resetZoom: handleReset,
      openSearch: openSearchModal,
    }),
    [
      createStickyNoteAtCenter,
      handleZoomIn,
      handleZoomOut,
      handleReset,
      openSearchModal,
    ]
  );

  // 计算一些性能关键参数，虽然我们已经移至CSS变量，但保留此逻辑以备未来使用
  // 并且可以用于某些需要JavaScript直接访问这些值的场景
  const _computedStyles = useMemo(() => {
    return {
      // 转换为像素值，便于JavaScript使用
      smallGridSizePx: GRID_CONSTANTS.SMALL_GRID_SIZE * canvasState.scale,
      largeGridSizePx: GRID_CONSTANTS.LARGE_GRID_SIZE * canvasState.scale,
      // 当前缩放比例的视口像素比
      devicePixelRatio: window.devicePixelRatio || 1,
      // 屏幕上可见的网格数量（近似值）
      visibleGridCellsX: canvasRef.current
        ? Math.ceil(
            canvasRef.current.clientWidth /
              (GRID_CONSTANTS.SMALL_GRID_SIZE * canvasState.scale)
          ) + 1
        : 0,
      visibleGridCellsY: canvasRef.current
        ? Math.ceil(
            canvasRef.current.clientHeight /
              (GRID_CONSTANTS.SMALL_GRID_SIZE * canvasState.scale)
          ) + 1
        : 0,
    };
  }, [canvasState.scale]); // 更新CSS变量 - 此处将JS状态同步到CSS变量
  useEffect(() => {
    if (canvasRef.current) {
      const container = canvasRef.current.parentElement;
      if (container) {
        // 优化：批量更新样式属性，减少重排
        const style = container.style;
        const { scale, offsetX, offsetY } = canvasState;

        // 更新主要变换变量
        style.setProperty("--canvas-scale", `${scale}`);

        // 计算网格位置偏移，使其能够正确对齐
        const smallGridSize = GRID_CONSTANTS.SMALL_GRID_SIZE * scale;
        const smallGridOffsetX = (offsetX % smallGridSize) + "px";
        const smallGridOffsetY = (offsetY % smallGridSize) + "px";

        // 设置基础偏移变量 - 对于简化版本，我们使用相同的偏移值
        style.setProperty("--canvas-offset-x", smallGridOffsetX);
        style.setProperty("--canvas-offset-y", smallGridOffsetY);

        // 设置内容偏移变量 (这是新增的，用于内容元素的变换)
        style.setProperty("--content-offset-x", `${offsetX}px`);
        style.setProperty("--content-offset-y", `${offsetY}px`);

        // 使用计算好的网格大小(仅做示例，实际上我们使用常量)
        console.log(
          "当前视口中预计可见网格单元数:",
          _computedStyles.visibleGridCellsX,
          _computedStyles.visibleGridCellsY
        );

        // 更新网格常量 - 理论上这些只需设置一次，但放在这里确保一致性
        container.style.setProperty(
          "--small-grid-size",
          `${GRID_CONSTANTS.SMALL_GRID_SIZE}px`
        );
        container.style.setProperty(
          "--large-grid-size",
          `${GRID_CONSTANTS.LARGE_GRID_SIZE}px`
        );
        container.style.setProperty(
          "--small-grid-color",
          GRID_CONSTANTS.SMALL_GRID_COLOR
        );
        container.style.setProperty(
          "--large-grid-color",
          GRID_CONSTANTS.LARGE_GRID_COLOR
        );
      }
    }
  }, [canvasState.scale, canvasState.offsetX, canvasState.offsetY]);

  return (
    <div className="infinite-canvas-container">
      {/* 使用拆分出的工具栏组件 */}
      <CanvasToolbar
        scale={canvasState.scale}
        zoomAnimating={zoomAnimating}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onCreateNote={createStickyNoteAtCenter}
        onClearDatabase={clearDatabase}
        onSearch={openSearchModal}
        minScale={CANVAS_CONSTANTS.MIN_SCALE}
        maxScale={CANVAS_CONSTANTS.MAX_SCALE}
      />

      {/* 画布区域 */}
      <div
        ref={canvasRef}
        className="infinite-canvas"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {/* 使用拆分出的网格组件 - 不再传递样式参数，而是使用CSS变量 */}
        <CanvasGrid showAxis={false} />

        {/* 
          内容区域 - 使用CSS变量控制变换，不再需要内联样式 
          注意：当有特殊需求时可以使用内联样式覆盖CSS变量
        */}
        <div className="canvas-content">
          {/* 便签组件 - 将便签放在独立的容器中，不受canvas-content变换影响 */}
        </div>
      </div>

      {/* 便签容器 - 独立于画布变换 */}
      <div className="sticky-notes-container">
        {/* 加载状态 */}
        {notesLoading && (
          <div
            className="loading-indicator"
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: "rgba(0, 0, 0, 0.7)",
              color: "white",
              padding: "8px 12px",
              borderRadius: "4px",
              fontSize: "14px",
              zIndex: 10000,
            }}
          >
            加载便签中...
          </div>
        )}

        {/* 错误状态 */}
        {notesError && (
          <div
            className="error-indicator"
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: "rgba(220, 53, 69, 0.9)",
              color: "white",
              padding: "8px 12px",
              borderRadius: "4px",
              fontSize: "14px",
              zIndex: 10000,
            }}
          >
            加载便签失败: {notesError}
          </div>
        )}

        {/* 便签列表 */}
        {!notesLoading &&
          !notesError &&
          stickyNotes
            .sort((a, b) => a.zIndex - b.zIndex) // 按 Z 索引排序
            .map((note) => {
              const screenNote = {
                ...note,
                x: note.x * canvasState.scale,
                y: note.y * canvasState.scale,
                width: note.width * canvasState.scale,
                height: note.height * canvasState.scale,
              };

              // 检查是否是流式便签
              const streamingData = streamingNotes.get(note.id);

              return (
                <StickyNote
                  key={note.id}
                  note={screenNote}
                  onUpdate={updateStickyNote}
                  onDelete={deleteStickyNote}
                  onBringToFront={bringNoteToFront}
                  canvasScale={canvasState.scale}
                  canvasOffset={{
                    x: canvasState.offsetX,
                    y: canvasState.offsetY,
                  }}
                  // 流式相关属性
                  isStreaming={streamingData?.isStreaming || false}
                  streamingContent={streamingData?.streamingContent || ''}
                  onStreamingComplete={() => {
                    // 流式完成后的清理工作
                    setStreamingNotes(prev => {
                      const newMap = new Map(prev);
                      newMap.delete(note.id);
                      return newMap;
                    });
                  }}
                />
              );
            })}
      </div>

      {/* 控制台组件 */}
      <CanvasConsole
        ref={consoleRef}
        onSendMessage={(message) => {
          // TODO: 实现AI消息处理逻辑
          console.log("💬 收到AI消息:", message);
          // 这里可以集成AI API调用
        }}
        onCreateNote={createStickyNoteAtCenter}
        onGenerateWithAI={generateStickyNotesWithAI}
        onOpenAISettings={() => openSettingsModal("ai")}
      />

      {/* 搜索模态框 */}
      <SearchModal
        open={searchModalOpen}
        onClose={closeSearchModal}
        notes={stickyNotes}
        onSelectNote={selectNote}
      />

      {/* 设置模态框 */}
      <SettingsModal
        open={settingsModalOpen}
        onCancel={closeSettingsModal}
        defaultActiveTab={settingsDefaultTab}
      />
    </div>
  );
});

InfiniteCanvas.displayName = "InfiniteCanvas";

export default InfiniteCanvas;
