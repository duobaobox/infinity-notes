import React from "react";
import { Modal, Card, Typography, Tag, Space, Divider } from "antd";
import { ClockCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import type { SourceNoteContent } from "../types";
import "./SourceNotesModal.css";

const { Title, Text, Paragraph } = Typography;

interface SourceNotesModalProps {
  open: boolean; // 弹窗是否打开
  onClose: () => void; // 关闭弹窗回调
  sourceNotes: SourceNoteContent[]; // 源便签内容列表
  currentNoteTitle?: string; // 当前便签标题，用于显示上下文
}

/**
 * 源便签查看弹窗组件
 * 用于展示替换模式下被删除的原始便签内容
 */
const SourceNotesModal: React.FC<SourceNotesModalProps> = ({
  open,
  onClose,
  sourceNotes,
  currentNoteTitle = "当前便签",
}) => {
  // 获取颜色对应的中文名称
  const getColorName = (color: string): string => {
    const colorMap: Record<string, string> = {
      yellow: "黄色",
      blue: "蓝色",
      green: "绿色",
      pink: "粉色",
      purple: "紫色",
    };
    return colorMap[color] || color;
  };

  // 获取颜色对应的标签颜色
  const getTagColor = (color: string): string => {
    const tagColorMap: Record<string, string> = {
      yellow: "gold",
      blue: "blue",
      green: "green",
      pink: "magenta",
      purple: "purple",
    };
    return tagColorMap[color] || "default";
  };

  // 格式化时间显示
  const formatTime = (date: Date | string): string => {
    try {
      // 确保输入是有效的Date对象
      const dateObj = date instanceof Date ? date : new Date(date);

      // 检查日期是否有效
      if (isNaN(dateObj.getTime())) {
        return "无效时间";
      }

      return new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(dateObj);
    } catch (error) {
      console.error("时间格式化错误:", error);
      return "时间格式错误";
    }
  };

  return (
    <Modal
      title={
        <Space>
          <DeleteOutlined style={{ color: "#ff4d4f" }} />
          <span>源便签内容查看</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      className="source-notes-modal"
      destroyOnHidden
    >
      <div className="source-notes-content">
        {/* 说明文本 */}
        <div className="modal-description">
          <Text type="secondary">
            以下是生成「{currentNoteTitle}」时被替换删除的原始便签内容：
          </Text>
        </div>

        <Divider />

        {/* 源便签列表 */}
        <div className="source-notes-list">
          {sourceNotes.length === 0 ? (
            <div className="empty-state">
              <Text type="secondary">暂无源便签内容</Text>
            </div>
          ) : (
            sourceNotes.map((sourceNote, index) => (
              <Card
                key={sourceNote.id}
                className="source-note-card"
                size="small"
                title={
                  <Space>
                    <span className="note-index">#{index + 1}</span>
                    <span className="note-title">{sourceNote.title}</span>
                    <Tag color={getTagColor(sourceNote.color)}>
                      {getColorName(sourceNote.color)}
                    </Tag>
                  </Space>
                }
                extra={
                  <Space direction="vertical" size={0} className="note-times">
                    <Text type="secondary" className="time-text">
                      <ClockCircleOutlined /> 创建：
                      {formatTime(sourceNote.createdAt)}
                    </Text>
                    <Text type="secondary" className="time-text">
                      <DeleteOutlined /> 删除：
                      {formatTime(sourceNote.deletedAt)}
                    </Text>
                  </Space>
                }
              >
                <div className="note-content">
                  <Paragraph
                    className="content-text"
                    style={{
                      whiteSpace: "pre-wrap",
                      marginBottom: 0,
                      maxHeight: "200px",
                      overflow: "auto",
                    }}
                  >
                    {sourceNote.content || "（无内容）"}
                  </Paragraph>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* 底部统计信息 */}
        {sourceNotes.length > 0 && (
          <>
            <Divider />
            <div className="modal-footer-info">
              <Text type="secondary">
                共 {sourceNotes.length} 个原始便签被替换删除
              </Text>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default SourceNotesModal;
