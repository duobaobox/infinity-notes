// 便签状态管理Store
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { StickyNote } from '../components/types';
import type { Canvas } from '../database';
import {
  useDatabase as useIndexedDB,
  getDatabaseAdapter,
  databaseEvents,
  initializeDatabase
} from '../database';

// 便签状态接口
export interface StickyNotesState {
  // 便签数据
  notes: StickyNote[];
  loading: boolean; // 初始化加载状态
  operationLoading: boolean; // 操作加载状态（添加、删除等）
  error: string | null;

  // 流式便签状态
  streamingNotes: Map<string, {
    note: StickyNote;
    streamingContent: string;
    isStreaming: boolean;
  }>;

  // 画布管理
  currentCanvasId: string | null;
  canvases: Canvas[];
  canvasLoading: boolean;
}

// 便签操作接口
export interface StickyNotesActions {
  // 基础CRUD操作
  addNote: (note: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<StickyNote>;
  updateNote: (id: string, updates: Partial<StickyNote>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  bringNoteToFront: (id: string) => Promise<void>;
  
  // 批量操作
  clearAllNotes: () => Promise<void>;
  loadNotes: () => Promise<void>;
  
  // 流式便签操作
  startStreamingNote: (noteId: string, note: StickyNote) => void;
  updateStreamingContent: (noteId: string, content: string) => void;
  finishStreamingNote: (noteId: string, finalContent: string) => Promise<void>;
  cancelStreamingNote: (noteId: string) => void;
  
  // 画布操作
  loadCanvases: () => Promise<void>;
  switchCanvas: (canvasId: string) => Promise<void>;
  createCanvas: (name: string, description?: string) => Promise<string>;
  
  // 状态管理
  setLoading: (loading: boolean) => void;
  setOperationLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 初始化
  initialize: () => Promise<void>;
}

// 创建便签Store
export const useStickyNotesStore = create<StickyNotesState & StickyNotesActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // 初始状态
      notes: [],
      loading: false, // 初始化加载状态
      operationLoading: false, // 操作加载状态
      error: null,
      streamingNotes: new Map(),
      currentCanvasId: null,
      canvases: [],
      canvasLoading: false,

      // 基础CRUD操作
      addNote: async (noteData) => {
        try {
          set({ operationLoading: true, error: null });

          // 使用传入的便签数据，不重新生成ID
          const newNote: StickyNote = {
            ...noteData,
            // 如果没有ID，则生成一个新的
            id: noteData.id || `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: noteData.createdAt || new Date(),
            updatedAt: new Date(),
          };

          // 保存到数据库
          const adapter = getDatabaseAdapter();
          await adapter.addNote(newNote);

          // 更新状态
          set(state => ({
            notes: [...state.notes, newNote],
            operationLoading: false
          }));

          console.log('✅ 便签添加成功:', newNote.id);
          return newNote;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '添加便签失败';
          console.error('❌ 添加便签失败:', error);
          set({ error: errorMsg, operationLoading: false });
          throw error;
        }
      },

      updateNote: async (id, updates) => {
        try {
          set({ error: null });
          
          const currentNotes = get().notes;
          const noteIndex = currentNotes.findIndex(note => note.id === id);
          
          if (noteIndex === -1) {
            throw new Error('便签不存在');
          }
          
          const updatedNote = {
            ...currentNotes[noteIndex],
            ...updates,
            updatedAt: new Date(),
          };
          
          // 保存到数据库
          const adapter = getDatabaseAdapter();
          await adapter.updateNote(updatedNote);
          
          // 更新状态
          set(state => ({
            notes: state.notes.map(note => 
              note.id === id ? updatedNote : note
            )
          }));
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '更新便签失败';
          set({ error: errorMsg });
          throw error;
        }
      },

      deleteNote: async (id) => {
        try {
          set({ operationLoading: true, error: null });

          // 从数据库删除
          const adapter = getDatabaseAdapter();
          await adapter.deleteNote(id);

          // 更新状态
          set(state => ({
            notes: state.notes.filter(note => note.id !== id),
            operationLoading: false
          }));

          // 如果是流式便签，也要清理流式状态
          const streamingNotes = get().streamingNotes;
          if (streamingNotes.has(id)) {
            streamingNotes.delete(id);
            set({ streamingNotes: new Map(streamingNotes) });
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '删除便签失败';
          set({ error: errorMsg, operationLoading: false });
          throw error;
        }
      },

      bringNoteToFront: async (id) => {
        try {
          const currentNotes = get().notes;
          const note = currentNotes.find(n => n.id === id);
          
          if (note) {
            const maxZIndex = Math.max(...currentNotes.map(n => n.zIndex), 0);
            await get().updateNote(id, { zIndex: maxZIndex + 1 });
          }
        } catch (error) {
          console.error('置顶便签失败:', error);
        }
      },

      clearAllNotes: async () => {
        try {
          set({ loading: true, error: null });
          
          const adapter = getDatabaseAdapter();
          await adapter.clearAllNotes();
          
          set({ 
            notes: [], 
            streamingNotes: new Map(),
            loading: false 
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '清空便签失败';
          set({ error: errorMsg, loading: false });
          throw error;
        }
      },

      loadNotes: async () => {
        try {
          set({ loading: true, error: null });
          
          const adapter = getDatabaseAdapter();
          const loadedNotes = await adapter.getAllNotes();
          
          set({ 
            notes: loadedNotes, 
            currentCanvasId: adapter.getCurrentCanvasId(),
            loading: false 
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '加载便签失败';
          set({ error: errorMsg, loading: false });
          throw error;
        }
      },

      // 流式便签操作
      startStreamingNote: (noteId, note) => {
        const streamingNotes = get().streamingNotes;
        streamingNotes.set(noteId, {
          note,
          streamingContent: '',
          isStreaming: true,
        });
        set({ streamingNotes: new Map(streamingNotes) });
      },

      updateStreamingContent: (noteId, content) => {
        const streamingNotes = get().streamingNotes;
        const streamingNote = streamingNotes.get(noteId);
        
        if (streamingNote) {
          streamingNotes.set(noteId, {
            ...streamingNote,
            streamingContent: content,
          });
          set({ streamingNotes: new Map(streamingNotes) });
        }
      },

      finishStreamingNote: async (noteId, finalContent) => {
        try {
          const streamingNotes = get().streamingNotes;
          const streamingNote = streamingNotes.get(noteId);
          
          if (streamingNote) {
            // 更新便签内容
            await get().updateNote(noteId, { content: finalContent });
            
            // 清理流式状态
            streamingNotes.delete(noteId);
            set({ streamingNotes: new Map(streamingNotes) });
          }
        } catch (error) {
          console.error('完成流式便签失败:', error);
          get().cancelStreamingNote(noteId);
        }
      },

      cancelStreamingNote: (noteId) => {
        const streamingNotes = get().streamingNotes;
        streamingNotes.delete(noteId);
        set({ streamingNotes: new Map(streamingNotes) });
      },

      // 画布管理操作
      loadCanvases: async () => {
        try {
          set({ canvasLoading: true, error: null });

          const adapter = getDatabaseAdapter();
          const canvases = await adapter.getUserCanvases();

          set({
            canvases,
            canvasLoading: false
          });

          console.log('✅ 画布列表加载成功:', canvases.length);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '加载画布列表失败';
          console.error('❌ 加载画布列表失败:', error);
          set({ error: errorMsg, canvasLoading: false });
          throw error;
        }
      },

      switchCanvas: async (canvasId) => {
        try {
          set({ loading: true, error: null });

          const adapter = getDatabaseAdapter();
          adapter.setCurrentCanvas(canvasId);

          // 重新加载便签
          await get().loadNotes();

          set({ currentCanvasId: canvasId });
          console.log('✅ 画布切换成功:', canvasId);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '切换画布失败';
          console.error('❌ 切换画布失败:', error);
          set({ error: errorMsg, loading: false });
          throw error;
        }
      },

      createCanvas: async (name, description) => {
        try {
          set({ canvasLoading: true, error: null });

          const adapter = getDatabaseAdapter();
          const canvasId = await adapter.createCanvas(name, description);

          // 重新加载画布列表
          await get().loadCanvases();

          console.log('✅ 画布创建成功:', canvasId);
          return canvasId;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '创建画布失败';
          console.error('❌ 创建画布失败:', error);
          set({ error: errorMsg, canvasLoading: false });
          throw error;
        }
      },

      // 状态管理
      setLoading: (loading) => set({ loading }),
      setOperationLoading: (operationLoading) => set({ operationLoading }),
      setError: (error) => set({ error }),

      // 初始化
      initialize: async () => {
        try {
          console.log('📝 便签Store: 开始初始化...');

          // 首先确保数据库已初始化
          console.log('📝 便签Store: 初始化数据库...');
          await initializeDatabase();
          console.log('📝 便签Store: 数据库初始化完成');

          // 加载画布列表
          console.log('📝 便签Store: 加载画布列表...');
          await get().loadCanvases();
          console.log('📝 便签Store: 画布列表加载完成');

          // 然后加载便签数据
          console.log('📝 便签Store: 加载便签数据...');
          await get().loadNotes();
          console.log('📝 便签Store: 便签数据加载完成');

          // 注意：不再监听 notesChanged 事件，因为我们现在直接管理状态
          // 避免重复的数据加载导致页面"刷新"感觉
          console.log('📝 便签Store: 跳过事件监听，使用直接状态管理');

          console.log('✅ 便签Store: 初始化完成');
        } catch (error) {
          console.error('❌ 便签Store: 初始化失败:', error);
          set({ error: '初始化失败' });
          throw error; // 重新抛出错误，让调用者知道初始化失败
        }
      },
    })),
    {
      name: 'sticky-notes-store', // DevTools中的名称
    }
  )
);
