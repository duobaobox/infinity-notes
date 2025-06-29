import {
  ClockCircleOutlined,
  CloseOutlined,
  FolderOutlined,
  MenuOutlined,
  PlusOutlined,
  SettingOutlined,
  StarFilled,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Input,
  List,
  message,
  Popconfirm,
  Space,
  Splitter,
  Typography,
} from "antd";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Canvas } from "../../database";
import { connectionLineManager } from "../../utils/connectionLineManager";

// 导入全局状态管理
import { useStickyNotesStore, useUIStore, useUserStore } from "../../stores";

const { Title, Text } = Typography;

// 添加样式到head
const addCanvasListStyles = () => {
  const styleId = "canvas-list-styles";
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .canvas-list-item {
      transition: background-color 0.2s ease !important;
    }

    .canvas-list-item:hover {
      background-color: rgba(0, 0, 0, 0.02) !important;
    }

    .canvas-list-item.selected:hover {
      background-color: rgba(22, 119, 255, 0.12) !important;
    }

    .canvas-list-item:hover .canvas-delete-btn {
      opacity: 1 !important;
    }

    .canvas-delete-btn:hover {
      color: #ff4d4f !important;
      background-color: rgba(255, 77, 79, 0.1) !important;
    }
  `;
  document.head.appendChild(style);
};

const Sidebar: React.FC = () => {
  const siderRef = useRef<HTMLDivElement>(null);
  const [selectedCanvas, setSelectedCanvas] = useState<string>("");
  const [editingCanvasId, setEditingCanvasId] = useState<string>("");
  const [editingCanvasName, setEditingCanvasName] = useState<string>("");
  const editInputRef = useRef<any>(null);
  const [canvasNotesCounts, setCanvasNotesCounts] = useState<
    Record<string, number>
  >({});

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
    updateCanvas,
    deleteCanvas,
    getCanvasNotesCount,
  } = useStickyNotesStore();

  // 确保本地选中状态与全局状态同步
  useEffect(() => {
    if (currentCanvasId && currentCanvasId !== selectedCanvas) {
      setSelectedCanvas(currentCanvasId);
      console.log("📋 Sidebar: 同步选中画布状态:", currentCanvasId);
    }
  }, [currentCanvasId, selectedCanvas]);

  // 使用UI状态管理
  const {
    openSettingsModal,
    setSidebarCollapsed,
    sidebarCollapsed: collapsed,
  } = useUIStore();

  // 使用用户状态管理
  const { currentUser, loading: userLoading, loadCurrentUser } = useUserStore();

  // 组件挂载时加载用户数据
  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  // 处理侧边栏折叠状态变化
  const handleCollapseChange = useCallback(
    (value: boolean) => {
      // 直接更新 UI Store 状态（会自动保存到持久化存储）
      setSidebarCollapsed(value);
      // 延迟更新连接线位置，等待侧边栏动画完成
      setTimeout(() => {
        connectionLineManager.updateConnectionPositionsImmediate();
      }, 300);
    },
    [setSidebarCollapsed]
  );

  // 切换侧边栏显示状态
  const toggleSidebar = useCallback(() => {
    handleCollapseChange(!collapsed);
  }, [collapsed, handleCollapseChange]);

  // 创建新画布
  const handleCreateCanvas = useCallback(async () => {
    try {
      const canvasId = await createCanvas(`画布 ${canvasList.length + 1}`);

      // createCanvas 方法已经会自动切换到新画布，这里只需要更新本地状态
      setSelectedCanvas(canvasId);

      message.success("画布创建成功并已切换");
    } catch (error) {
      console.error("❌ Sidebar: 创建画布失败:", error);
      message.error("创建画布失败");
    }
  }, [canvasList.length, createCanvas]);

  // 删除画布
  const handleDeleteCanvas = useCallback(
    async (canvasId: string, canvasName: string) => {
      try {
        await deleteCanvas(canvasId);
        message.success(`画布"${canvasName}"删除成功`);
      } catch (error) {
        console.error("❌ Sidebar: 删除画布失败:", error);
        const errorMessage =
          error instanceof Error ? error.message : "删除画布失败";
        message.error(errorMessage);
      }
    },
    [deleteCanvas]
  );

  // 更新特定画布的便签数量
  const updateCanvasNotesCount = useCallback(
    async (canvasId: string) => {
      try {
        const count = await getCanvasNotesCount(canvasId);
        setCanvasNotesCounts((prev) => ({
          ...prev,
          [canvasId]: count,
        }));
      } catch (error) {
        console.error(`❌ 更新画布 ${canvasId} 便签数量失败:`, error);
      }
    },
    [getCanvasNotesCount]
  );

  // 处理画布选择
  const handleCanvasSelect = useCallback(
    async (canvasId: string) => {
      if (canvasId !== selectedCanvas) {
        try {
          console.log("📋 Sidebar: 切换到画布:", canvasId);

          // 立即更新本地选中状态，提供即时反馈
          setSelectedCanvas(canvasId);

          // 异步执行画布切换，不阻塞UI
          switchCanvas(canvasId)
            .then(() => {
              // 切换成功后异步更新便签数量
              updateCanvasNotesCount(canvasId).catch((error) => {
                console.error("❌ 更新便签数量失败:", error);
              });
              console.log("✅ Sidebar: 画布切换成功");
            })
            .catch((error) => {
              console.error("❌ Sidebar: 画布切换失败:", error);
              message.error("画布切换失败，请稍后重试");
              // 如果切换失败，恢复之前的选择
              setSelectedCanvas(selectedCanvas);
            });
        } catch (error) {
          console.error("❌ Sidebar: 画布选择失败:", error);
          message.error("画布选择失败");
          setSelectedCanvas(selectedCanvas);
        }
      }
    },
    [selectedCanvas, switchCanvas, updateCanvasNotesCount]
  );

  // 开始编辑画布名称
  const startEditingCanvasName = useCallback((canvas: Canvas) => {
    setEditingCanvasId(canvas.id);
    setEditingCanvasName(canvas.name);
    // 延迟聚焦，确保输入框已渲染
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 0);
  }, []);

  // 完成编辑画布名称
  const finishEditingCanvasName = useCallback(async () => {
    if (editingCanvasId && editingCanvasName.trim()) {
      try {
        await updateCanvas(editingCanvasId, { name: editingCanvasName.trim() });
        message.success("画布名称修改成功");
      } catch (error) {
        console.error("❌ Sidebar: 修改画布名称失败:", error);
        message.error("修改画布名称失败");
      }
    }
    setEditingCanvasId("");
    setEditingCanvasName("");
  }, [editingCanvasId, editingCanvasName, updateCanvas]);

  // 取消编辑画布名称
  const cancelEditingCanvasName = useCallback(() => {
    setEditingCanvasId("");
    setEditingCanvasName("");
  }, []);

  // 处理编辑输入框的键盘事件
  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finishEditingCanvasName();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEditingCanvasName();
      }
    },
    [finishEditingCanvasName, cancelEditingCanvasName]
  );

  // 加载所有画布的便签数量
  useEffect(() => {
    const loadCanvasNotesCounts = async () => {
      if (canvasList.length > 0) {
        const counts: Record<string, number> = {};
        for (const canvas of canvasList) {
          try {
            const count = await getCanvasNotesCount(canvas.id);
            counts[canvas.id] = count;
          } catch (error) {
            console.error(`❌ 获取画布 ${canvas.id} 便签数量失败:`, error);
            counts[canvas.id] = 0;
          }
        }
        setCanvasNotesCounts(counts);
      }
    };

    loadCanvasNotesCounts();
  }, [canvasList, getCanvasNotesCount]);

  // 监听当前画布便签数量变化
  useEffect(() => {
    if (currentCanvasId) {
      updateCanvasNotesCount(currentCanvasId);
    }
  }, [stickyNotes.length, currentCanvasId, updateCanvasNotesCount]);

  // 组件初始化 - 添加样式和设置当前选中的画布
  useEffect(() => {
    addCanvasListStyles();
  }, []);

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

  // 直接使用便签数据，不再过滤
  const filteredNotes = stickyNotes;

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

  // 将便签转换为显示格式
  const displayNotes = filteredNotes.map(
    (note: { id: string; title: string; color: string; updatedAt: Date }) => ({
      id: note.id,
      title: note.title || "无标题便签",
      color: getColorHex(note.color),
      lastEdited: formatDate(note.updatedAt.toISOString()),
    })
  );

  const currentCanvas = canvasList.find((c: Canvas) => c.id === selectedCanvas);
  return (
    <>
      {" "}
      {/* 侧边栏触发按钮 - 与侧边栏紧贴，风格统一 */}
      <div
        className="sidebar-toggle"
        data-sidebar="true"
        onClick={toggleSidebar}
        aria-label={collapsed ? "打开侧边栏" : "关闭侧边栏"}
        style={{
          position: "fixed",
          top: "16px",
          left: collapsed ? "0" : "220px", // 紧贴侧边栏边缘
          zIndex: 1001,
          width: "32px",
          height: "32px",
          background: "#ffffff",
          borderRadius: collapsed ? "0 8px 8px 0" : "0 8px 8px 0", // 左侧始终无圆角，与侧边栏或屏幕边缘贴合
          border: collapsed ? "1px solid #e0e0e0" : "1px solid #e0e0e0",
          borderLeft: "none", // 始终无左边框，与侧边栏或屏幕边缘完美融合
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.3s ease",
          boxShadow: collapsed
            ? "2px 0 8px rgba(0, 0, 0, 0.08)"
            : "2px 0 4px rgba(0, 0, 0, 0.04)", // 展开时保持轻微阴影增加层次感
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#f8f9fa";
          e.currentTarget.style.borderColor = "#1677ff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#ffffff";
          e.currentTarget.style.borderColor = "#e0e0e0";
        }}
      >
        <MenuOutlined
          style={{
            fontSize: "14px",
            color: "#666",
            transition: "color 0.2s ease",
          }}
        />
      </div>
      {/* 悬浮侧边栏 */}
      <div
        className="sidebar"
        data-sidebar="true"
        style={{
          position: "fixed",
          top: 0,
          left: collapsed ? "-220px" : "0",
          width: "220px",
          height: "100vh",
          background: "#ffffff",
          borderRight: "1px solid #e0e0e0",
          zIndex: 1000,
          transition: "left 0.3s ease",
          overflow: "hidden",
        }}
        ref={siderRef as React.RefObject<HTMLDivElement>}
      >
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
                    {/* 显示用户名的首字母，如果没有用户数据则显示默认 U */}
                    {currentUser?.username?.[0]?.toUpperCase() || "U"}
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
                      {/* 显示用户名，如果没有则显示默认值 */}
                      {currentUser?.username || "用户名称"}
                    </Text>
                    <Text
                      type="secondary"
                      style={{ fontSize: "12px", lineHeight: "1.2" }}
                    >
                      {/* 显示用户邮箱，如果没有则显示默认值 */}
                      {currentUser?.email || "user@example.com"}
                    </Text>
                  </div>
                </div>

                {/* 设置按钮单独一行 */}
                <Button
                  type="default"
                  icon={<SettingOutlined />}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    height: "32px",
                    borderRadius: "6px",
                  }}
                  onClick={() => {
                    openSettingsModal("general");
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
                    const notesCount = canvasNotesCounts[canvas.id] || 0;

                    return (
                      <List.Item
                        className={`canvas-list-item ${
                          isSelected ? "selected" : ""
                        }`}
                        style={{
                          padding: "10px 12px",
                          cursor: "pointer",
                          backgroundColor: isSelected
                            ? "rgba(22, 119, 255, 0.1)" // Lighter blue selection
                            : "transparent",
                          borderRadius: "8px", // Slightly more rounded
                          marginBottom: "4px",
                          border: "none",
                          position: "relative",
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
                              style={{
                                display: "flex",
                                alignItems: "center",
                                width: "100%",
                              }}
                            >
                              {editingCanvasId === canvas.id ? (
                                <Input
                                  ref={editInputRef}
                                  value={editingCanvasName}
                                  onChange={(e) =>
                                    setEditingCanvasName(e.target.value)
                                  }
                                  onKeyDown={handleEditKeyDown}
                                  onBlur={finishEditingCanvasName}
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: isSelected ? 600 : 500,
                                    height: "22px",
                                    padding: "0 4px",
                                    border: "1px solid #1677ff",
                                    borderRadius: "4px",
                                    flex: 1,
                                  }}
                                  size="small"
                                />
                              ) : (
                                <Text
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: isSelected ? 600 : 500,
                                    color: "#262626",
                                    cursor: "pointer",
                                    flex: 1,
                                  }}
                                  ellipsis={{
                                    tooltip: `${canvas.name} - 双击编辑名称`,
                                  }}
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    startEditingCanvasName(canvas);
                                  }}
                                >
                                  {canvas.name}
                                </Text>
                              )}
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

                            {/* 悬浮删除按钮 - 绝对定位，只在悬浮时显示 */}
                            {!canvas.is_default && canvasList.length > 1 && (
                              <Popconfirm
                                title="删除画布"
                                description={`确定要删除画布"${canvas.name}"吗？删除后画布中的所有便签也将被删除，此操作不可恢复。`}
                                onConfirm={(e) => {
                                  e?.stopPropagation();
                                  handleDeleteCanvas(canvas.id, canvas.name);
                                }}
                                onCancel={(e) => e?.stopPropagation()}
                                okText="确定删除"
                                cancelText="取消"
                                okType="danger"
                                placement="topRight"
                              >
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<CloseOutlined />}
                                  className="canvas-delete-btn"
                                  style={{
                                    position: "absolute",
                                    top: "8px",
                                    right: "8px",
                                    width: "20px",
                                    height: "20px",
                                    padding: "0",
                                    minWidth: "20px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#8c8c8c",
                                    fontSize: "12px",
                                    opacity: "0",
                                    transition: "all 0.2s ease",
                                    borderRadius: "4px",
                                    zIndex: 10,
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </Popconfirm>
                            )}

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
                      : "暂无便签，三击画布或点击工具栏的 + 创建",
                  }}
                  renderItem={(note: {
                    color: string;
                    title: string;
                    lastEdited: string;
                  }) => (
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
              </div>{" "}
            </div>
          </Splitter.Panel>
        </Splitter>

        {/* 侧边栏触发按钮 */}
        <div
          onClick={toggleSidebar}
          style={{
            position: "absolute",
            top: "50%",
            left: collapsed ? "0" : "-40px",
            width: "40px",
            height: "40px",
            backgroundColor: "#1677ff",
            color: "#fff",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
            transition: "left 0.3s ease",
            zIndex: 1100,
          }}
          aria-label="Toggle sidebar"
        >
          <MenuOutlined style={{ fontSize: "18px" }} />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
