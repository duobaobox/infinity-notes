import React, { useState, useRef } from "react";
import {
  Layout,
  Typography,
  List,
  Avatar,
  Input,
  Button,
  Tooltip,
  Space,
  Splitter, // 导入 Splitter
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  FolderOutlined,
  FileTextOutlined,
  StarFilled,
  EllipsisOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;
const { Title, Text } = Typography;

// 模拟数据 - 画布列表
const mockCanvasList = [
  {
    id: "1",
    name: "工作计划",
    notesCount: 5,
    isStarred: true,
    lastEdited: "2025-06-05",
  },
  {
    id: "2",
    name: "项目管理",
    notesCount: 8,
    isStarred: false,
    lastEdited: "2025-06-06",
  },
  {
    id: "3",
    name: "学习笔记",
    notesCount: 12,
    isStarred: true,
    lastEdited: "2025-06-07",
  },
  {
    id: "4",
    name: "会议纪要",
    notesCount: 3,
    isStarred: false,
    lastEdited: "2025-06-04",
  },
  {
    id: "5",
    name: "创意收集",
    notesCount: 7,
    isStarred: false,
    lastEdited: "2025-06-02",
  },
];

// 模拟数据 - 便签列表
const mockNotesList = [
  {
    id: "101",
    title: "周一工作安排",
    color: "#ffccc7",
    lastEdited: "2025-06-07 10:30",
  },
  {
    id: "102",
    title: "项目进度跟踪",
    color: "#d9f7be",
    lastEdited: "2025-06-07 09:15",
  },
  {
    id: "103",
    title: "团队会议要点",
    color: "#91caff",
    lastEdited: "2025-06-06 16:45",
  },
  {
    id: "104",
    title: "客户反馈汇总",
    color: "#d3adf7",
    lastEdited: "2025-06-06 14:20",
  },
  {
    id: "105",
    title: "下周工作计划",
    color: "#ffe58f",
    lastEdited: "2025-06-05 17:30",
  },
];

interface SidebarProps {
  canvasName?: string; // 设为可选
}

const Sidebar: React.FC<SidebarProps> = () => {
  const siderRef = useRef<HTMLDivElement>(null);
  const [selectedCanvas, setSelectedCanvas] = useState<string>("1");
  const [canvasSearchValue, setCanvasSearchValue] = useState<string>("");
  const [noteSearchValue, setNoteSearchValue] = useState<string>("");

  // 处理画布选择
  const handleCanvasSelect = (canvasId: string) => {
    setSelectedCanvas(canvasId);
  };

  return (
    <Sider
      width={250}
      theme="light"
      style={{
        height: "100vh",
        borderRight: "1px solid #f0f0f0",
        // position: "relative", // Splitter 会处理布局
      }}
      ref={siderRef as React.RefObject<HTMLDivElement>}
    >
      <Splitter
        layout="vertical"
        style={{ height: "100%", boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)" }}
      >
        <Splitter.Panel>
          {/* 上部区域：画布列表 */}
          <div
            style={{
              // height: `${splitPosition}%`, // 由 Splitter 控制
              height: "100%", // Splitter.Panel 需要明确高度
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 16px 8px 16px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <Title level={5} style={{ margin: "0 0 12px 0" }}>
                我的画布
              </Title>
              <Input
                placeholder="搜索画布..."
                prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                value={canvasSearchValue}
                onChange={(e) => setCanvasSearchValue(e.target.value)}
                style={{ marginBottom: "8px" }}
              />
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                style={{ width: "100%", marginTop: "8px" }}
              >
                新建画布
              </Button>
            </div>

            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: "0 0 8px 0",
                scrollbarWidth: "thin",
                scrollbarColor: "#a0a0a0 transparent", // 滚动条滑块颜色为 #a0a0a0，轨道透明
              }}
            >
              <List
                itemLayout="horizontal"
                dataSource={mockCanvasList}
                renderItem={(canvas) => (
                  <List.Item
                    style={{
                      padding: "8px 16px",
                      cursor: "pointer",
                      backgroundColor:
                        selectedCanvas === canvas.id
                          ? "#e6f7ff"
                          : "transparent",
                      borderLeft:
                        selectedCanvas === canvas.id
                          ? "3px solid #1890ff"
                          : "3px solid transparent",
                    }}
                    onClick={() => handleCanvasSelect(canvas.id)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<FolderOutlined />}
                          style={{
                            backgroundColor:
                              selectedCanvas === canvas.id
                                ? "#1890ff"
                                : "#d9d9d9",
                          }}
                        />
                      }
                      title={
                        <Space>
                          <Text ellipsis style={{ maxWidth: 150 }}>
                            {canvas.name}
                          </Text>
                          {canvas.isStarred && (
                            <StarFilled style={{ color: "#faad14" }} />
                          )}
                        </Space>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          {canvas.notesCount} 便签 · {canvas.lastEdited}
                        </Text>
                      }
                    />
                    <Tooltip title="更多操作">
                      <Button
                        type="text"
                        icon={<EllipsisOutlined />}
                        size="small"
                      />
                    </Tooltip>
                  </List.Item>
                )}
              />
            </div>
          </div>
        </Splitter.Panel>
        {/* 可拖动的分隔线 - 由 Splitter 组件提供，无需手动实现 */}
        {/* <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: `${splitPosition}%`,
          height: "10px", // 增加高度使其更容易点击
          backgroundColor: isDragging ? "#1890ff" : "#f0f0f0", // 拖动时变色提供视觉反馈
          borderTop: "1px solid #e8e8e8",
          borderBottom: "1px solid #e8e8e8",
          cursor: "ns-resize",
          zIndex: 100, // 增加z-index确保在最上层
          transform: "translateY(-50%)",
          userSelect: "none", // 防止文本选择
        }}
        onMouseDown={handleMouseDown}
      /> */}
        <Splitter.Panel>
          {/* 下部区域：便签列表 */}
          <div
            style={{
              // height: `${100 - splitPosition}%`, // 由 Splitter 控制
              height: "100%", // Splitter.Panel 需要明确高度
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 16px 8px 16px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <Title level={5} style={{ margin: "0 0 12px 0" }}>
                {mockCanvasList.find((c) => c.id === selectedCanvas)?.name ||
                  ""}
                中的便签
              </Title>
              <Input
                placeholder="搜索便签..."
                prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                value={noteSearchValue}
                onChange={(e) => setNoteSearchValue(e.target.value)}
              />
            </div>

            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: "0 0 8px 0",
                scrollbarWidth: "thin",
                scrollbarColor: "#a0a0a0 transparent", // 滚动条滑块颜色为 #a0a0a0，轨道透明
              }}
            >
              <List
                itemLayout="horizontal"
                dataSource={mockNotesList}
                renderItem={(note) => (
                  <List.Item style={{ padding: "8px 16px" }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<FileTextOutlined />}
                          style={{ backgroundColor: note.color }}
                        />
                      }
                      title={
                        <Text ellipsis style={{ maxWidth: 180 }}>
                          {note.title}
                        </Text>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          {note.lastEdited}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          </div>
        </Splitter.Panel>
      </Splitter>
    </Sider>
  );
};

export default Sidebar;
