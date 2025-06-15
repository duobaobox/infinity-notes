import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Layout,
  Typography,
  List,
  Avatar,
  Input,
  Button,
  Space,
  Splitter,
  message,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  FolderOutlined,
  StarFilled,
  ClockCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { Canvas } from "../../database";

// 导入全局状态管理
import { useStickyNotesStore, useUIStore } from "../../stores";

const { Sider } = Layout;
const { Title, Text } = Typography;

const Sidebar: React.FC = () => {
  const siderRef = useRef<HTMLDivElement>(null);
  const [selectedCanvas, setSelectedCanvas] = useState<string>("");
  const [noteSearchValue, setNoteSearchValue] = useState<string>("");
  const [collapsed, setCollapsed] = useState(true);

  // 使用全局状态管理获取便签数据和画布数据
  const {
    notes: stickyNotes,
    loading: notesLoading,
    error: notesError,
    canvases: canvasList,
    canvasLoading,
    currentCanvasId,
    switchCanvas,
    createCanvas,
  } = useStickyNotesStore();

  // 使用UI状态管理
  const { openSettingsModal } = useUIStore();

  // 创建新画布
  const handleCreateCanvas = useCallback(async () => {
    try {
      const canvasId = await createCanvas(`画布 ${canvasList.length + 1}`);
      setSelectedCanvas(canvasId);
      message.success("画布创建成功，点击画布名称切换到新画布");
    } catch (error) {
      console.error("❌ Sidebar: 创建画布失败:", error);
      message.error("创建画布失败");
    }
  }, [canvasList.length, createCanvas]);

  // 处理画布选择
  const handleCanvasSelect = useCallback(
    async (canvasId: string) => {
      if (canvasId !== selectedCanvas) {
        try {
          console.log("📋 Sidebar: 切换到画布:", canvasId);
          setSelectedCanvas(canvasId);
          await switchCanvas(canvasId);
          console.log("✅ Sidebar: 画布切换成功");
        } catch (error) {
          console.error("❌ Sidebar: 画布切换失败:", error);
          message.error("画布切换失败，请稍后重试");
          // 如果切换失败，恢复之前的选择
          setSelectedCanvas(selectedCanvas);
        }
      }
    },
    [selectedCanvas, switchCanvas]
  );

  // 组件初始化 - 设置当前选中的画布
  useEffect(() => {
    if (currentCanvasId && !selectedCanvas) {
      setSelectedCanvas(currentCanvasId);
      console.log("📋 Sidebar: 设置当前画布:", currentCanvasId);
    }
  }, [currentCanvasId, selectedCanvas]);

  // 注意：移除数据库事件监听，使用全局状态管理
  // 便签数量变化会通过全局状态自动更新，不需要重新加载画布列表
  // useEffect(() => {
  //   const handleDataChange = () => {
  //     loadCanvases();
  //   };
  //   databaseEvents.on("notesChanged", handleDataChange);
  //   return () => {
  //     databaseEvents.off("notesChanged", handleDataChange);
  //   };
  // }, [loadCanvases]);

  // 过滤便签数据（根据搜索关键词）
  const filteredNotes = stickyNotes.filter(
    (note: { title: string; content: string }) =>
      note.title.toLowerCase().includes(noteSearchValue.toLowerCase()) ||
      note.content.toLowerCase().includes(noteSearchValue.toLowerCase())
  );

  // 颜色映射函数
  const getColorHex = (color: string): string => {
    const colorMap: Record<string, string> = {
      yellow: "#fef3c7",
      blue: "#dbeafe",
      green: "#d1fae5",
      pink: "#fce7f3",
      purple: "#e9d5ff",
    };
    return colorMap[color] || "#fef3c7";
  };

  // 日期格式化函数
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "昨天";
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString("zh-CN");
    }
  };

  // 计算每个画布的便签数量
  const getCanvasNotesCount = (canvasId: string): number => {
    return canvasId === selectedCanvas ? stickyNotes.length : 0;
  };

  // 将便签转换为显示格式
  const displayNotes = filteredNotes.map((note: { id: string; title: string; color: string; updatedAt: Date }) => ({
    id: note.id,
    title: note.title || "无标题便签",
    color: getColorHex(note.color),
    lastEdited: formatDate(note.updatedAt.toISOString()),
  }));

  const currentCanvas = canvasList.find((c: Canvas) => c.id === selectedCanvas);

  return (
    <Sider
      width={220}
      theme="light"
      style={{
        height: "100vh",
        borderRight: "1px solid #f0f0f0",
        background:
          "linear-gradient(180deg,rgb(255, 255, 255) 0%,rgb(255, 255, 255) 100%)", // Gradient background
        boxShadow: "2px 0px 5px rgba(0, 0, 0, 0.05)", // Softer shadow
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
                background: "transparent", // Make panel background transparent to show Sider gradient
              }}
            >
              {/* 用户信息区域 */}
              <div
                style={{
                  padding: "16px 16px 12px",
                  borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
                }}
              >
                {/* 用户头像和信息 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <Avatar
                    size={40}
                    style={{
                      marginRight: "12px",
                      backgroundColor: "#1890ff",
                      boxShadow: "0 2px 4px rgba(24, 144, 255, 0.2)",
                    }}
                  >
                    U
                  </Avatar>
                  <div>
                    <Text
                      style={{
                        display: "block",
                        fontWeight: 500,
                        color: "#1f1f1f",
                        fontSize: "14px",
                      }}
                    >
                      用户名称
                    </Text>
                    <Text
                      type="secondary"
                      style={{ fontSize: "12px", lineHeight: "1.2" }}
                    >
                      user@example.com
                    </Text>
                  </div>
                </div>

                {/* 设置按钮单独一行 */}
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    height: "32px",
                    borderRadius: "6px",
                    color: "#595959",
                    backgroundColor: "rgba(0, 0, 0, 0.02)",
                  }}
                  onClick={() => {
                    openSettingsModal('general');
                  }}
                >
                  <span style={{ marginLeft: "8px" }}>设置</span>
                </Button>
              </div>

              {/* 画布操作区域 */}
              <div
                style={{
                  padding: "16px 16px 16px", // 调整了上边距
                  borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
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
                      color: "#1f1f1f",
                    }}
                  >
                    我的画布
                  </Title>
                </div>

                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={handleCreateCanvas}
                    style={{
                      width: "100%",
                      borderRadius: "6px",
                      height: "36px",
                      borderColor: "#adc6ff",
                      color: "#3b82f6",
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
                  dataSource={canvasList}
                  loading={canvasLoading}
                  locale={{
                    emptyText: "暂无画布，点击新建画布开始使用",
                  }}
                  renderItem={(canvas: Canvas) => {
                    const isSelected = selectedCanvas === canvas.id;
                    const notesCount = getCanvasNotesCount(canvas.id);

                    return (
                      <List.Item
                        style={{
                          padding: "10px 12px",
                          cursor: "pointer",
                          backgroundColor: isSelected
                            ? "rgba(22, 119, 255, 0.1)" // Lighter blue selection
                            : "transparent",
                          borderRadius: "8px", // Slightly more rounded
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
                                : "rgba(0,0,0,0.04)", // Lighter grey
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
                              {canvas.is_default && (
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
                                color: isSelected ? "#1677ff" : "#8c8c8c", // Consistent color logic
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: isSelected ? 500 : 400,
                                  marginRight: "12px",
                                }}
                              >
                                {notesCount} 便签
                              </span>
                              <ClockCircleOutlined
                                style={{ fontSize: "11px", marginRight: "4px" }}
                              />
                              {canvas.updated_at &&
                                formatDate(canvas.updated_at)}
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
                background: "transparent", // Make panel background transparent
              }}
            >
              <div
                style={{
                  padding: "16px 16px 12px",
                  borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
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
                      color: "#1f1f1f",
                    }}
                  >
                    {currentCanvas?.name || ""}中的便签
                  </Title>
                </div>
                <Input
                  placeholder="搜索便签..."
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                  value={noteSearchValue}
                  onChange={(e) => setNoteSearchValue(e.target.value)}
                  style={{
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.8)", // Slightly transparent input
                    borderColor: "rgba(0,0,0,0.1)",
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
                  dataSource={displayNotes}
                  loading={notesLoading}
                  locale={{
                    emptyText: notesError
                      ? `加载失败: ${notesError}`
                      : noteSearchValue
                      ? "未找到匹配的便签"
                      : "暂无便签，双击画布或点击工具栏创建",
                  }}
                  renderItem={(note: { color: string; title: string; lastEdited: string }) => (
                    <List.Item
                      style={{
                        padding: "6px 12px",
                        cursor: "pointer",
                        backgroundColor: "rgba(255, 255, 255, 0.9)", // Slightly transparent items
                        marginBottom: "8px",
                        borderRadius: "8px",
                        border: "1px solid rgba(0, 0, 0, 0.08)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)", // Subtle shadow for notes
                        transition: "all 0.2s ease",
                      }}
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
                            borderRadius: "2px 0 0 2px", // Rounded only on one side
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

      {/* 设置弹窗现在由全局状态管理，在InfiniteCanvas中渲染 */}
    </Sider>
  );
};

export default Sidebar;
