import React, { useState, useRef } from "react";
import {
  Layout,
  Typography,
  List,
  Avatar,
  Input,
  Button,
  Space,
  Splitter,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  FolderOutlined,
  StarFilled,
  ClockCircleOutlined,
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
  const [collapsed, setCollapsed] = useState(false);

  // 处理画布选择
  const handleCanvasSelect = (canvasId: string) => {
    setSelectedCanvas(canvasId);
  };

  return (
    <Sider
      width={260}
      theme="light"
      style={{
        height: "100vh",
        borderRight: "1px solid #f0f0f0",
        background: "#fcfcfc",
        boxShadow: "2px 0px 5px rgba(0, 0, 0, 0.1)", // 添加阴影
      }}
      ref={siderRef as React.RefObject<HTMLDivElement>}
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      collapsedWidth={0}
    >
      {!collapsed && (
        <Splitter layout="vertical" style={{ height: "100%" }}>
          <Splitter.Panel>
            {/* 上部区域：画布列表 */}
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                background: "#fcfcfc", // 添加背景色
              }}
            >
              <div
                style={{
                  padding: "20px 16px 16px",
                  borderBottom: "1px solid #f5f5f5",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <Title
                    level={5}
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#262626",
                    }}
                  >
                    我的画布
                  </Title>
                </div>

                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Input
                    placeholder="搜索画布..."
                    prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                    value={canvasSearchValue}
                    onChange={(e) => setCanvasSearchValue(e.target.value)}
                    style={{
                      borderRadius: "6px",
                    }}
                    size="middle"
                  />
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    style={{
                      width: "100%",
                      borderRadius: "6px",
                      height: "36px",
                    }}
                  >
                    新建画布
                  </Button>
                </Space>
              </div>

              <div
                style={{
                  flex: 1,
                  overflow: "auto",
                  padding: "12px 8px",
                }}
              >
                <List
                  itemLayout="horizontal"
                  dataSource={mockCanvasList}
                  renderItem={(canvas) => {
                    const isSelected = selectedCanvas === canvas.id;

                    return (
                      <List.Item
                        style={{
                          padding: "10px 12px",
                          cursor: "pointer",
                          backgroundColor: isSelected
                            ? "#f0f7ff"
                            : "transparent",
                          borderRadius: "6px",
                          marginBottom: "4px",
                          border: "none",
                          transition: "all 0.2s ease",
                        }}
                        onClick={() => handleCanvasSelect(canvas.id)}
                      >
                        <div
                          style={{
                            display: "flex",
                            width: "100%",
                            alignItems: "center",
                          }}
                        >
                          <Avatar
                            icon={<FolderOutlined />}
                            style={{
                              backgroundColor: isSelected
                                ? "#1677ff"
                                : "#f5f5f5",
                              color: isSelected ? "#fff" : "#595959",
                              marginRight: "12px",
                            }}
                            size={28}
                          />

                          <div style={{ flex: 1, overflow: "hidden" }}>
                            {/* 画布名称和星标 */}
                            <div
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <Text
                                style={{
                                  fontSize: "14px",
                                  fontWeight: isSelected ? 600 : 500,
                                  color: "#262626",
                                }}
                                ellipsis={{ tooltip: canvas.name }}
                              >
                                {canvas.name}
                              </Text>
                              {canvas.isStarred && (
                                <StarFilled
                                  style={{
                                    color: "#FAAD14",
                                    fontSize: "12px",
                                    marginLeft: "6px",
                                  }}
                                />
                              )}
                            </div>

                            {/* 便签数量和时间信息 */}
                            <Text
                              type="secondary"
                              style={{
                                fontSize: "12px",
                                marginTop: "2px",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  color: isSelected ? "#1677ff" : "#8c8c8c",
                                  fontWeight: isSelected ? 500 : 400,
                                  marginRight: "12px",
                                }}
                              >
                                {canvas.notesCount} 便签
                              </span>
                              <ClockCircleOutlined
                                style={{ fontSize: "11px", marginRight: "4px" }}
                              />
                              {canvas.lastEdited}
                            </Text>
                          </div>
                        </div>
                      </List.Item>
                    );
                  }}
                />
              </div>
            </div>
          </Splitter.Panel>
          <Splitter.Panel>
            {/* 下部区域：便签列表 */}
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                background: "#fcfcfc", // 添加背景色
              }}
            >
              <div
                style={{
                  padding: "16px 16px 12px",
                  borderBottom: "1px solid #f5f5f5",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "14px",
                  }}
                >
                  <Title
                    level={5}
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: 500,
                      color: "#262626",
                    }}
                  >
                    {mockCanvasList.find((c) => c.id === selectedCanvas)
                      ?.name || ""}
                    中的便签
                  </Title>
                </div>
                <Input
                  placeholder="搜索便签..."
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                  value={noteSearchValue}
                  onChange={(e) => setNoteSearchValue(e.target.value)}
                  style={{
                    borderRadius: "6px",
                  }}
                  size="middle"
                />
              </div>

              <div
                style={{
                  flex: 1,
                  overflow: "auto",
                  padding: "12px 8px",
                }}
              >
                <List
                  itemLayout="horizontal"
                  dataSource={mockNotesList}
                  renderItem={(note) => (
                    <List.Item
                      style={{
                        padding: "10px 12px",
                        cursor: "pointer",
                        backgroundColor: "#fff",
                        marginBottom: "8px",
                        borderRadius: "6px",
                        border: "1px solid #f0f0f0",
                        transition: "all 0.2s ease",
                      }}
                      onClick={() => {}}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          width: "100%",
                        }}
                      >
                        <div
                          style={{
                            width: "4px",
                            alignSelf: "stretch",
                            backgroundColor: note.color,
                            borderRadius: "2px",
                            marginRight: "10px",
                          }}
                        />
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <div style={{ marginBottom: "4px" }}>
                            <Text
                              style={{
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#262626",
                              }}
                              ellipsis
                            >
                              {note.title}
                            </Text>
                          </div>

                          <Text
                            type="secondary"
                            style={{
                              fontSize: "12px",
                              color: "#8c8c8c",
                            }}
                          >
                            <ClockCircleOutlined
                              style={{ fontSize: "11px", marginRight: "4px" }}
                            />
                            {note.lastEdited}
                          </Text>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            </div>
          </Splitter.Panel>
        </Splitter>
      )}
    </Sider>
  );
};

export default Sidebar;
