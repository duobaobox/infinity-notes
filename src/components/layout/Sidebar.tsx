import {
  CloseOutlined,
  FolderOutlined,
  MenuOutlined,
  PlusOutlined,
  SearchOutlined,
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
  Splitter,
  Typography,
} from "antd";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Canvas } from "../../database";
import { connectionLineManager } from "../../utils/connectionLineManager";
import "./Sidebar.css"; // 导入半透明磨砂效果样式

// 导入全局状态管理
import {
  useCanvasStore,
  useStickyNotesStore,
  useUIStore,
  useUserStore,
} from "../../stores";

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
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [selectedCanvas, setSelectedCanvas] = useState<string>("");
  const [editingCanvasId, setEditingCanvasId] = useState<string>("");
  const [editingCanvasName, setEditingCanvasName] = useState<string>("");
  const editInputRef = useRef<any>(null);
  const [canvasNotesCounts, setCanvasNotesCounts] = useState<
    Record<string, number>
  >({});

  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchInputRef = useRef<any>(null);

  // 防抖更新便签数量的引用
  const updateNotesCountTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    selectNote, // 添加选中便签的方法
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
  const { currentUser, loadCurrentUser } = useUserStore();

  // 使用画布状态管理
  const { centerOnNote } = useCanvasStore();

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

  // 生成唯一的画布名称
  const generateUniqueCanvasName = useCallback(() => {
    const existingNames = canvasList.map((canvas) => canvas.name);
    let counter = 1;
    let newName = `画布 ${counter}`;

    // 找到第一个不重复的名称
    while (existingNames.includes(newName)) {
      counter++;
      newName = `画布 ${counter}`;
    }

    return newName;
  }, [canvasList]);

  // 创建新画布
  const handleCreateCanvas = useCallback(async () => {
    try {
      const uniqueName = generateUniqueCanvasName();
      const canvasId = await createCanvas(uniqueName);

      // createCanvas 方法已经会自动切换到新画布，这里只需要更新本地状态
      setSelectedCanvas(canvasId);

      message.success("画布创建成功并已切换");
    } catch (error) {
      console.error("❌ Sidebar: 创建画布失败:", error);
      message.error("创建画布失败");
    }
  }, [generateUniqueCanvasName, createCanvas]);

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

  // 处理画布选择
  const handleCanvasSelect = useCallback(
    async (canvasId: string) => {
      if (canvasId !== selectedCanvas) {
        try {
          console.log("📋 Sidebar: 切换到画布:", canvasId);

          // 立即更新本地选中状态，提供即时反馈
          setSelectedCanvas(canvasId);

          // 预先获取目标画布的便签数量，避免显示闪动
          if (!canvasNotesCounts[canvasId]) {
            try {
              const count = await getCanvasNotesCount(canvasId);
              setCanvasNotesCounts((prev) => ({
                ...prev,
                [canvasId]: count,
              }));
            } catch (error) {
              console.warn("获取画布便签数量失败:", error);
            }
          }

          // 异步执行画布切换，不阻塞UI
          switchCanvas(canvasId)
            .then(() => {
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
    [selectedCanvas, switchCanvas, canvasNotesCounts, getCanvasNotesCount]
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

  // 监听当前画布便签数量变化，使用防抖机制避免闪动
  useEffect(() => {
    if (currentCanvasId) {
      // 清除之前的定时器
      if (updateNotesCountTimeoutRef.current) {
        clearTimeout(updateNotesCountTimeoutRef.current);
      }

      // 设置新的防抖定时器
      updateNotesCountTimeoutRef.current = setTimeout(() => {
        setCanvasNotesCounts((prev) => {
          // 只有当数量真正发生变化时才更新
          if (prev[currentCanvasId] !== stickyNotes.length) {
            return {
              ...prev,
              [currentCanvasId]: stickyNotes.length,
            };
          }
          return prev;
        });
      }, 150); // 150ms 防抖延迟

      return () => {
        if (updateNotesCountTimeoutRef.current) {
          clearTimeout(updateNotesCountTimeoutRef.current);
        }
      };
    }
  }, [stickyNotes.length, currentCanvasId]);

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

  // 键盘快捷键监听器 - Ctrl/Cmd + F 聚焦搜索框
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 检查是否按下了 Ctrl+F (Windows) 或 Cmd+F (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === "f") {
        // 只有在侧边栏展开时才响应快捷键
        if (!collapsed && searchInputRef.current) {
          event.preventDefault(); // 阻止浏览器默认的查找功能
          searchInputRef.current.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [collapsed]);

  // 处理搜索查询变化，添加到搜索历史
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);

    // 如果搜索查询不为空且长度大于1，添加到搜索历史
    if (value.trim() && value.trim().length > 1) {
      setSearchHistory((prev) => {
        const newHistory = [
          value.trim(),
          ...prev.filter((item) => item !== value.trim()),
        ];
        // 只保留最近的5个搜索记录
        return newHistory.slice(0, 5);
      });
    }
  }, []);

  // 从本地存储加载搜索历史
  useEffect(() => {
    const savedHistory = localStorage.getItem("notes-search-history");
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.warn("Failed to load search history:", error);
      }
    }
  }, []);

  // 保存搜索历史到本地存储
  useEffect(() => {
    if (searchHistory.length > 0) {
      localStorage.setItem(
        "notes-search-history",
        JSON.stringify(searchHistory)
      );
    }
  }, [searchHistory]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (updateNotesCountTimeoutRef.current) {
        clearTimeout(updateNotesCountTimeoutRef.current);
      }
    };
  }, []);

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

  // 根据搜索查询过滤便签数据
  const filteredNotes = stickyNotes.filter((note) => {
    if (!searchQuery.trim()) {
      return true; // 如果没有搜索查询，显示所有便签
    }

    const query = searchQuery.toLowerCase();

    // 搜索便签标题（不区分大小写）
    const titleMatch = note.title?.toLowerCase().includes(query);

    // 搜索便签内容（不区分大小写）
    const contentMatch = note.content?.toLowerCase().includes(query);

    return titleMatch || contentMatch;
  });

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
    (note: {
      id: string;
      title: string;
      color: string;
      updatedAt: Date;
      x: number;
      y: number;
      width: number;
      height: number;
    }) => ({
      id: note.id,
      title: note.title || "无标题便签",
      color: getColorHex(note.color),
      lastEdited: formatDate(note.updatedAt.toISOString()),
      x: note.x,
      y: note.y,
      width: note.width,
      height: note.height,
    })
  );

  // 高亮搜索文本的工具函数
  const highlightSearchText = useCallback(
    (text: string, searchQuery: string) => {
      if (!searchQuery.trim()) {
        return text;
      }

      const regex = new RegExp(
        `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi"
      );
      const parts = text.split(regex);

      return parts.map((part, index) => {
        if (part.toLowerCase() === searchQuery.toLowerCase()) {
          return (
            <span key={index} className="search-highlight">
              {part}
            </span>
          );
        }
        return part;
      });
    },
    []
  );

  // 处理便签点击事件 - 定位到画布中的便签并添加选中效果
  const handleNoteClick = useCallback(
    (note: {
      id: string;
      title: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }) => {
      // 先选中便签，让用户立即看到选中效果
      selectNote(note.id);

      // 然后定位到便签（这会同时置顶便签）
      centerOnNote(note.x, note.y, note.width, note.height, note.id);
    },
    [centerOnNote, selectNote]
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
          left: collapsed ? "0" : "200px", // 更新为新的侧边栏宽度
          boxShadow: collapsed
            ? "2px 0 8px rgba(0, 0, 0, 0.08)"
            : "2px 0 4px rgba(0, 0, 0, 0.04)", // 保留动态阴影效果
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
      {/* 悬浮侧边栏 - 半透明磨砂效果 */}
      <div
        className="sidebar"
        data-sidebar="true"
        style={{
          left: collapsed ? "-200px" : "0", // 更新为新的侧边栏宽度
        }}
        ref={sidebarRef as React.RefObject<HTMLDivElement>}
      >
        {/* 侧边栏主要内容区域 */}
        <div
          style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          <Splitter layout="vertical" style={{ flex: 1 }}>
            <Splitter.Panel>
              {/* 上部区域：画布列表 */}
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  background: "transparent", // Make panel background transparent to show Sidebar gradient
                }}
              >
                {/* 用户信息区域 - 卡片风格设计 */}
                <div
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
                  }}
                >
                  {/* 用户卡片 */}
                  <div
                    className="user-card"
                    style={{
                      background:
                        "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                      border: "1px solid rgba(0, 0, 0, 0.04)",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* 装饰性背景元素 */}
                    <div
                      style={{
                        position: "absolute",
                        top: "-10px",
                        right: "-10px",
                        width: "40px",
                        height: "40px",
                        background:
                          "linear-gradient(135deg, rgba(22, 119, 255, 0.1) 0%, rgba(22, 119, 255, 0.05) 100%)",
                        borderRadius: "50%",
                        opacity: 0.6,
                      }}
                    />

                    {/* 用户头像和信息 */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                        }}
                      >
                        <Avatar
                          size={38}
                          style={{
                            backgroundColor: "#1677ff",
                            flexShrink: 0,
                            fontWeight: 600,
                            fontSize: "16px",
                            boxShadow: "0 2px 8px rgba(22, 119, 255, 0.2)",
                          }}
                        >
                          {currentUser?.username?.[0]?.toUpperCase() || "U"}
                        </Avatar>
                        {/* 小装饰点 */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "1px",
                            right: "1px",
                            width: "10px",
                            height: "10px",
                            backgroundColor: "#52c41a",
                            border: "2px solid #fff",
                            borderRadius: "50%",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                          }}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{
                            display: "block",
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "#1a1a1a",
                            lineHeight: "20px",
                            marginBottom: "2px",
                          }}
                          ellipsis={{ tooltip: true }}
                        >
                          {currentUser?.username || "用户名称"}
                        </Text>
                        <Text
                          style={{
                            fontSize: "12px",
                            color: "#64748b",
                            fontWeight: 500,
                            lineHeight: "16px",
                          }}
                        >
                          个人工作区
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 画布操作区域 */}
                <div
                  style={{
                    padding: "20px 16px 20px", // 增加上下内边距，营造更好的视觉平衡
                    borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
                  }}
                >
                  {/* 低调的新建画布按钮 - 适合低频操作 */}
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={handleCreateCanvas}
                    style={{
                      width: "100%",
                      borderRadius: "6px",
                      height: "32px", // 降低高度
                      color: "#8c8c8c", // 使用较淡的颜色
                      fontSize: "13px",
                      fontWeight: 400, // 降低字重
                      border: "1px dashed rgba(140, 140, 140, 0.3)", // 淡虚线边框
                      background: "transparent",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      // 悬停时稍微突出一点
                      e.currentTarget.style.color = "#595959";
                      e.currentTarget.style.borderColor =
                        "rgba(140, 140, 140, 0.5)";
                      e.currentTarget.style.background = "rgba(0, 0, 0, 0.02)";
                    }}
                    onMouseLeave={(e) => {
                      // 恢复低调状态
                      e.currentTarget.style.color = "#8c8c8c";
                      e.currentTarget.style.borderColor =
                        "rgba(140, 140, 140, 0.3)";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    新建画布
                  </Button>
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
                                      // 为非默认画布的删除按钮留出空间，避免编辑框与删除按钮重叠
                                      marginRight:
                                        !canvas.is_default &&
                                        canvasList.length > 1
                                          ? "32px"
                                          : "0",
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

                              {/* 便签数量信息 - 去掉时间显示 */}
                              <Text
                                type="secondary"
                                style={{
                                  fontSize: "12px",
                                  marginTop: "2px",
                                  color: isSelected ? "#1677ff" : "#8c8c8c", // Consistent color logic
                                  fontWeight: isSelected ? 500 : 400,
                                }}
                              >
                                {notesCount} 便签
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
                {/* 便签区域头部 - 重新设计 */}
                <div
                  style={{
                    padding: "20px 16px 16px",
                    borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
                    background: "rgba(255, 255, 255, 0.02)",
                  }}
                >
                  {/* 标题区域 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Title
                        level={5}
                        style={{
                          margin: 0,
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#1a1a1a",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        便签
                      </Title>
                      {/* 便签数量徽章 */}
                      <div
                        style={{
                          background: searchQuery.trim()
                            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                            : "rgba(0, 0, 0, 0.06)",
                          color: searchQuery.trim() ? "#fff" : "#666",
                          fontSize: "11px",
                          fontWeight: 500,
                          padding: "2px 8px",
                          borderRadius: "12px",
                          minWidth: "20px",
                          textAlign: "center",
                          lineHeight: "16px",
                          transition: "all 0.2s ease", // 添加平滑过渡
                        }}
                      >
                        {searchQuery.trim()
                          ? filteredNotes.length
                          : currentCanvasId &&
                            canvasNotesCounts[currentCanvasId] !== undefined
                          ? canvasNotesCounts[currentCanvasId]
                          : stickyNotes.length}
                      </div>
                    </div>

                    {/* 画布名称标签 */}
                    {currentCanvas?.name && (
                      <Text
                        style={{
                          fontSize: "11px",
                          color: "#8c8c8c",
                          background: "rgba(0, 0, 0, 0.04)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontWeight: 500,
                        }}
                      >
                        {currentCanvas.name}
                      </Text>
                    )}
                  </div>

                  {/* 搜索输入框 - 重新设计 */}
                  <Input
                    ref={searchInputRef}
                    className="notes-search-input"
                    placeholder="搜索便签标题或内容..."
                    prefix={
                      <SearchOutlined
                        style={{
                          color: "#a0a0a0",
                          fontSize: "14px",
                        }}
                      />
                    }
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setSearchQuery("");
                        searchInputRef.current?.blur();
                      }
                    }}
                    allowClear
                    style={{
                      borderRadius: "8px",
                      fontSize: "13px",
                      height: "36px",
                    }}
                    suffix={
                      <Text
                        style={{
                          fontSize: "10px",
                          color: "#bbb",
                          fontWeight: 500,
                        }}
                      >
                        ⌘F
                      </Text>
                    }
                  />

                  {/* 搜索结果提示 */}
                  {searchQuery.trim() && (
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "12px",
                        color: "#666",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span>找到 {filteredNotes.length} 个匹配的便签</span>
                      {filteredNotes.length > 0 && (
                        <span style={{ color: "#52c41a" }}>✓</span>
                      )}
                    </div>
                  )}
                </div>
                {/* 便签列表容器 - 重新设计 */}
                <div
                  style={{
                    flex: 1,
                    overflow: "auto",
                    padding: "8px 12px 16px",
                  }}
                >
                  <List
                    itemLayout="horizontal"
                    dataSource={displayNotes}
                    loading={notesLoading}
                    locale={{
                      emptyText: (
                        <div
                          style={{
                            padding: "32px 16px",
                            textAlign: "center",
                            color: "#8c8c8c",
                          }}
                        >
                          {notesError ? (
                            <div>
                              <div
                                style={{
                                  fontSize: "24px",
                                  marginBottom: "8px",
                                }}
                              >
                                ⚠️
                              </div>
                              <div
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 500,
                                  marginBottom: "4px",
                                }}
                              >
                                加载失败
                              </div>
                              <div style={{ fontSize: "12px" }}>
                                {notesError}
                              </div>
                            </div>
                          ) : searchQuery.trim() ? (
                            <div>
                              <div
                                style={{
                                  fontSize: "24px",
                                  marginBottom: "8px",
                                }}
                              >
                                🔍
                              </div>
                              <div
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 500,
                                  marginBottom: "4px",
                                }}
                              >
                                未找到匹配的便签
                              </div>
                              <div style={{ fontSize: "12px" }}>
                                尝试使用不同的关键词搜索
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div
                                style={{
                                  fontSize: "24px",
                                  marginBottom: "8px",
                                }}
                              >
                                📝
                              </div>
                              <div
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 500,
                                  marginBottom: "4px",
                                }}
                              >
                                还没有便签
                              </div>
                              <div style={{ fontSize: "12px" }}>
                                双击画布或点击工具栏的 + 创建第一个便签
                              </div>
                            </div>
                          )}
                        </div>
                      ),
                    }}
                    renderItem={(note: {
                      id: string;
                      color: string;
                      title: string;
                      x: number;
                      y: number;
                      width: number;
                      height: number;
                    }) => (
                      <List.Item
                        className="note-list-item"
                        onClick={() => handleNoteClick(note)}
                        style={{
                          padding: "4px 8px",
                          cursor: "pointer",
                          marginBottom: "6px",
                          borderRadius: "6px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                        }}
                      >
                        {/* 保持原有的设计结构 */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            width: "100%",
                          }}
                        >
                          {/* 原有的颜色条设计 */}
                          <div
                            style={{
                              width: "3px",
                              alignSelf: "stretch",
                              backgroundColor: note.color,
                              borderRadius: "2px 0 0 2px",
                              marginRight: "8px",
                            }}
                          />
                          {/* 便签标题容器 */}
                          <Text
                            style={{
                              fontSize: "14px",
                              fontWeight: 500,
                              color: "#262626",
                              flex: 1,
                            }}
                            ellipsis={{
                              tooltip: searchQuery.trim()
                                ? `${note.title} - 点击定位到便签`
                                : note.title,
                            }}
                          >
                            {searchQuery.trim()
                              ? highlightSearchText(note.title, searchQuery)
                              : note.title}
                          </Text>
                        </div>
                      </List.Item>
                    )}
                  />
                </div>
              </div>
            </Splitter.Panel>
          </Splitter>

          {/* 设置按钮区域 - 与 Splitter 同级 */}
          <div
            style={{
              padding: "8px 16px 12px",
              borderTop: "1px solid rgba(0, 0, 0, 0.06)",
              display: "flex",
              justifyContent: "flex-end", // 右对齐
              background: "transparent",
            }}
          >
            <Button
              type="text"
              icon={<SettingOutlined />}
              size="small"
              style={{
                width: "26px", // 缩小尺寸
                height: "26px",
                borderRadius: "6px", // 适中的边角
                color: "#555", // 更深的灰色图标
                fontSize: "12px", // 较小的图标
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                border: "none", // 去掉边框，更简洁
                background: "rgba(0, 0, 0, 0.06)", // 与便签数量徽章相同的背景色
              }}
              onMouseEnter={(e) => {
                // 悬停时的灰色调效果
                e.currentTarget.style.color = "#333"; // 更深的灰色
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.12)"; // 稍深的背景色
                e.currentTarget.style.transform = "scale(1.05)"; // 轻微放大
              }}
              onMouseLeave={(e) => {
                // 恢复默认状态
                e.currentTarget.style.color = "#555";
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.06)";
                e.currentTarget.style.transform = "scale(1)";
              }}
              onClick={() => {
                openSettingsModal("general");
              }}
              title="设置" // 添加提示文字
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
