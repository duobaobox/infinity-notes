import React from "react";
import { Tooltip } from "antd";
import type { StickyNote } from "../types";
import "./StickyNoteSlots.css";

// 连接模式枚举
export const ConnectionMode = {
  SUMMARY: "summary", // 汇总模式：保留原始便签，并自动将它们连接到新便签
  REPLACE: "replace", // 替换模式：删除原始便签，只保留新生成的便签
} as const;

// 插槽组件属性接口
interface StickyNoteSlotsProps {
  connectedNotes: StickyNote[]; // 已连接的便签列表
  connectionMode: typeof ConnectionMode[keyof typeof ConnectionMode]; // 连接模式
  onModeChange: (mode: typeof ConnectionMode[keyof typeof ConnectionMode]) => void; // 模式切换回调
  onRemoveConnection: (noteId: string) => void; // 移除连接回调
  onClearAllConnections: () => void; // 清空所有连接回调
  visible?: boolean; // 是否显示插槽容器
}

const StickyNoteSlots: React.FC<StickyNoteSlotsProps> = ({
  connectedNotes,
  connectionMode,
  onModeChange,
  onRemoveConnection,
  onClearAllConnections,
  visible = true,
}) => {
  // 处理模式切换

  // 获取模式显示文本

  // 获取模式提示文本
  const getModeTooltip = () => {
    return connectionMode === ConnectionMode.SUMMARY
      ? "汇总模式：保留原始便签，并自动将它们连接到新便签<br>替换模式：删除原始便签，只保留新生成的便签"
      : "替换模式：删除原始便签，只保留新生成的便签<br>汇总模式：保留原始便签，并自动将它们连接到新便签";
  };

  return (    <div className={`slots-container ${visible && connectedNotes.length > 0 ? 'visible' : ''}`} id="slots-container">
      {/* 插槽列表 */}
      <div className="slots-list" id="slots-list">
        {connectedNotes.length === 0 ? (
          <div className="empty-slots">
            <div className="empty-slot-circle">
              <span className="empty-slot-icon">○</span>
            </div>
            <div className="empty-text-container">
              <span className="empty-text">暂无连接的便签</span>
              <span className="empty-hint">悬停便签并点击左下角 <span className="connection-dot-demo">●</span> 连接点来建立连接</span>
            </div>
          </div>
        ) : (
          connectedNotes.map((note, index) => (
            <div
              key={note.id}
              className="note-slot connected"
              data-note-id={note.id}
              data-index={index + 1}
              title={`${note.title || "无标题便签"}: ${note.content.substring(0, 50)}${note.content.length > 50 ? "..." : ""}`}
            >
              {/* 圆形插槽 */}
              <div className="slot-circle">
                <span className="slot-index">{index + 1}</span>
              </div>
              {/* 删除按钮 - 位于圆形右上角 */}
              <div
                className="slot-remove"
                onClick={() => onRemoveConnection(note.id)}
                title="移除连接"
              >
                ×
              </div>
            </div>
          ))
        )}
      </div>

      {/* 连接模式切换器 */}
      <Tooltip
        title={<div dangerouslySetInnerHTML={{ __html: getModeTooltip() }} />}
        placement="top"
        arrow={false}
        mouseEnterDelay={0.5} /* 延迟0.5秒显示 */
      >
        <div className="mode-selector" id="connection-mode-selector">
          <button
            className={`mode-button ${connectionMode === ConnectionMode.SUMMARY ? 'active' : ''}`}
            onClick={() => onModeChange(ConnectionMode.SUMMARY)}
          >
            汇总
          </button>
          <button
            className={`mode-button ${connectionMode === ConnectionMode.REPLACE ? 'active' : ''}`}
            onClick={() => onModeChange(ConnectionMode.REPLACE)}
          >
            替换
          </button>
        </div>
      </Tooltip>

      {/* 清除所有连接按钮 */}
      <button
        className="clear-all-connections"
        id="clear-all-connections"
        onClick={onClearAllConnections}
        disabled={connectedNotes.length === 0}
        title={connectedNotes.length === 0 ? "暂无连接可清除" : "清空所有连接"}
      >
        清空连接
      </button>
    </div>
  );
};

export default StickyNoteSlots;
