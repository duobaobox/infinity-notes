import React, { memo, useState } from "react";
import { Button, Space, Tooltip, Modal, Typography } from "antd";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  RedoOutlined,
  FileAddOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";

interface CanvasToolbarProps {
  scale: number;
  zoomAnimating: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onCreateNote: () => void; // 创建便签功能
  onClearDatabase?: () => Promise<void>; // 清空数据库功能（可选）
  onSearch?: () => void; // 搜索功能
  minScale: number;
  maxScale: number;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = memo(
  ({
    scale,
    zoomAnimating,
    onZoomIn,
    onZoomOut,
    onReset,
    onCreateNote,
    onClearDatabase,
    onSearch,
    minScale,
    maxScale,
  }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { Text } = Typography;

    const showConfirmModal = () => {
      setIsModalOpen(true);
    };

    const handleOk = async () => {
      setIsModalOpen(false);
      if (onClearDatabase) {
        try {
          await onClearDatabase();
        } catch (error) {
          console.error("清空数据库失败", error);
        }
      }
    };

    const handleCancel = () => {
      setIsModalOpen(false);
    };

    return (
      <div className="canvas-toolbar">
        <Space>
          <Tooltip title="创建新便签" placement="bottom">
            <Button
              icon={<FileAddOutlined />}
              onClick={onCreateNote}
              type="primary"
              shape="circle"
            />
          </Tooltip>

          <Tooltip title="搜索便签 (Ctrl/⌘ + F)" placement="bottom">
            <Button
              icon={<SearchOutlined />}
              onClick={onSearch}
              type="text"
              shape="circle"
            />
          </Tooltip>

          <Tooltip title="放大画布 (Ctrl/⌘ +)" placement="bottom">
            <Button
              icon={<ZoomInOutlined />}
              onClick={onZoomIn}
              disabled={scale >= maxScale}
              type="text"
              shape="circle"
            />
          </Tooltip>
          <Tooltip title="缩小画布 (Ctrl/⌘ -)" placement="bottom">
            <Button
              icon={<ZoomOutOutlined />}
              onClick={onZoomOut}
              disabled={scale <= minScale}
              type="text"
              shape="circle"
            />
          </Tooltip>
          <Tooltip title="重置画布位置和缩放 (Ctrl/⌘ 0)" placement="bottom">
            <Button
              icon={<RedoOutlined />}
              onClick={onReset}
              type="text"
              shape="circle"
            />
          </Tooltip>
          <span
            className={`zoom-indicator ${zoomAnimating ? "zoom-change" : ""}`}
          >
            {Math.round(scale * 100)}%
          </span>

          {onClearDatabase && (
            <Tooltip title="清空数据库" placement="bottom">
              <Button
                icon={<DeleteOutlined />}
                onClick={showConfirmModal}
                type="text"
                shape="circle"
                style={{ color: "#ff4d4f" }}
              />
            </Tooltip>
          )}
        </Space>

        <Modal
          title="确认清空数据库"
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          okText="确认清空"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Text>
            您确定要清空数据库吗？此操作将删除所有便签数据，且
            <Text strong>不可恢复</Text>！
          </Text>
        </Modal>
      </div>
    );
  }
);

CanvasToolbar.displayName = "CanvasToolbar";

export default CanvasToolbar;
