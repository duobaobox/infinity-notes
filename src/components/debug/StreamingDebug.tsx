import React from 'react';
import { useStickyNotesStore } from '../../stores/stickyNotesStore';

/**
 * 流式输出调试组件
 * 用于显示当前流式状态，帮助调试流式输出问题
 */
const StreamingDebug: React.FC = () => {
  const { streamingNotes } = useStickyNotesStore();

  if (streamingNotes.size === 0) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 10000,
      maxWidth: '300px',
      maxHeight: '200px',
      overflow: 'auto'
    }}>
      <h4>流式状态调试</h4>
      {Array.from(streamingNotes.entries()).map(([noteId, data]) => (
        <div key={noteId} style={{ marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
          <div><strong>便签ID:</strong> {noteId.substring(0, 8)}...</div>
          <div><strong>流式状态:</strong> {data.isStreaming ? '进行中' : '已完成'}</div>
          <div><strong>内容长度:</strong> {data.streamingContent.length}</div>
          <div><strong>内容预览:</strong> {data.streamingContent.substring(0, 50)}...</div>
        </div>
      ))}
    </div>
  );
};

export default StreamingDebug;
