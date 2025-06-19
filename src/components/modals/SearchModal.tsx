import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Input, Modal, List, Typography, Tag, Button, Empty } from "antd";
import {
  SearchOutlined,
  CloseOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import type { StickyNote } from "../types";
import "./SearchModal.css";

const { Text } = Typography;

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  notes: StickyNote[];
  onSelectNote: (note: StickyNote) => void;
}

interface SearchFilters {
  dateRange: "all" | "today" | "week" | "month";
  hasContent: boolean;
  colors: string[];
}

const SearchModal: React.FC<SearchModalProps> = ({
  open,
  onClose,
  notes,
  onSelectNote,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    dateRange: "all",
    hasContent: false,
    colors: [],
  });

  // 搜索和过滤逻辑
  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // 文本搜索
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(term) ||
          note.content.toLowerCase().includes(term)
      );
    }

    // 日期过滤
    if (filters.dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (filters.dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(
        (note) => new Date(note.updatedAt) >= filterDate
      );
    }

    // 内容过滤
    if (filters.hasContent) {
      filtered = filtered.filter((note) => note.content.trim().length > 0);
    }

    // 颜色过滤
    if (filters.colors.length > 0) {
      filtered = filtered.filter((note) => filters.colors.includes(note.color));
    }

    // 按更新时间排序
    return filtered.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [notes, searchTerm, filters]);

  // 高亮搜索词
  const highlightText = useCallback((text: string, term: string) => {
    if (!term.trim()) return text;

    const regex = new RegExp(
      `(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="search-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, []);

  // 处理便签选择
  const handleSelectNote = useCallback(
    (note: StickyNote) => {
      onSelectNote(note);
      onClose();
    },
    [onSelectNote, onClose]
  );

  // 重置搜索
  const handleReset = useCallback(() => {
    setSearchTerm("");
    setFilters({
      dateRange: "all",
      hasContent: false,
      colors: [],
    });
  }, []);

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  // 格式化日期
  const formatDate = useCallback((date: Date) => {
    const now = new Date();
    const noteDate = new Date(date);
    const diffMs = now.getTime() - noteDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return (
        "今天 " +
        noteDate.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } else if (diffDays === 1) {
      return (
        "昨天 " +
        noteDate.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return noteDate.toLocaleDateString("zh-CN");
    }
  }, []);

  return (
    <Modal
      title={
        <div className="search-modal-header">
          <SearchOutlined style={{ marginRight: 8 }} />
          搜索便签
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 14 }}>
            {filteredNotes.length} / {notes.length} 个便签
          </Text>
        </div>
      }      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      className="search-modal"
      destroyOnHidden
      zIndex={1010} // 确保搜索弹窗在侧边栏按钮之上
    >
      <div className="search-modal-content">
        {/* 搜索输入框 */}
        <div className="search-input-container">
          <Input
            placeholder="搜索便签标题和内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<SearchOutlined />}
            suffix={
              searchTerm && (
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => setSearchTerm("")}
                />
              )
            }
            size="large"
            autoFocus
          />
        </div>

        {/* 快速过滤器 */}
        <div className="search-filters">
          <div className="filter-group">
            <Text strong>时间范围：</Text>
            <Button.Group>
              {[
                { key: "all", label: "全部" },
                { key: "today", label: "今天" },
                { key: "week", label: "一周内" },
                { key: "month", label: "一月内" },
              ].map((item) => (
                <Button
                  key={item.key}
                  size="small"
                  type={filters.dateRange === item.key ? "primary" : "default"}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      dateRange: item.key as any,
                    }))
                  }
                >
                  {item.label}
                </Button>
              ))}
            </Button.Group>
          </div>

          {filters.dateRange !== "all" || filters.hasContent || searchTerm ? (
            <Button
              type="link"
              size="small"
              onClick={handleReset}
              icon={<FilterOutlined />}
            >
              清除筛选
            </Button>
          ) : null}
        </div>

        {/* 搜索结果 */}
        <div className="search-results">
          {filteredNotes.length === 0 ? (
            <Empty
              description={
                searchTerm || filters.dateRange !== "all" || filters.hasContent
                  ? "没有找到匹配的便签"
                  : "暂无便签"
              }
              style={{ margin: "40px 0" }}
            />
          ) : (
            <List
              dataSource={filteredNotes}
              renderItem={(note) => (
                <List.Item
                  className="search-result-item"
                  onClick={() => handleSelectNote(note)}
                  actions={[
                    <Tag color={note.color} key="color">
                      {formatDate(note.updatedAt)}
                    </Tag>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div className="note-title">
                        {highlightText(note.title, searchTerm)}
                      </div>
                    }
                    description={
                      <div className="note-content">
                        {note.content ? (
                          <Text type="secondary">
                            {highlightText(
                              note.content.length > 100
                                ? note.content.substring(0, 100) + "..."
                                : note.content,
                              searchTerm
                            )}
                          </Text>
                        ) : (
                          <Text
                            type="secondary"
                            style={{ fontStyle: "italic" }}
                          >
                            空便签
                          </Text>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SearchModal;
