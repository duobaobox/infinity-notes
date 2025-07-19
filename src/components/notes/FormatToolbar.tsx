import React, { useEffect, useState } from "react";
import { Button, Tooltip, Space, Divider } from "antd";
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  CodeOutlined,
  LinkOutlined,
  PictureOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  CheckSquareOutlined,
  BlockOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import type { Editor } from "@tiptap/react";
import "./FormatToolbar.css";

/**
 * 格式化工具栏组件属性接口
 */
interface FormatToolbarProps {
  /** TipTap编辑器实例 */
  editor: Editor | null;
  /** 是否显示工具栏 */
  visible: boolean;
  /** 工具栏位置 */
  position?: { x: number; y: number };
  /** 工具栏类名 */
  className?: string;
  /** 是否为紧凑模式 */
  compact?: boolean;
}

/**
 * 格式化工具栏组件
 * 提供常用的文本格式化功能按钮
 */
const FormatToolbar: React.FC<FormatToolbarProps> = ({
  editor,
  visible,
  position,
  className = "",
  compact = false,
}) => {
  const [, forceUpdate] = useState({});

  // 监听编辑器状态变化，强制重新渲染工具栏
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      forceUpdate({});
    };

    editor.on("selectionUpdate", handleUpdate);
    editor.on("transaction", handleUpdate);

    return () => {
      editor.off("selectionUpdate", handleUpdate);
      editor.off("transaction", handleUpdate);
    };
  }, [editor]);

  if (!editor || !visible) {
    return null;
  }

  // 插入链接
  const insertLink = () => {
    const url = window.prompt("请输入链接地址:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  // 插入图片
  const insertImage = () => {
    const url = window.prompt("请输入图片地址:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  // 基础格式化按钮配置
  const formatButtons = [
    {
      key: "bold",
      icon: <BoldOutlined />,
      tooltip: "粗体 (Ctrl+B)",
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive("bold"),
    },
    {
      key: "italic",
      icon: <ItalicOutlined />,
      tooltip: "斜体 (Ctrl+I)",
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive("italic"),
    },
    {
      key: "strike",
      icon: <StrikethroughOutlined />,
      tooltip: "删除线",
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive("strike"),
    },
    {
      key: "code",
      icon: <CodeOutlined />,
      tooltip: "行内代码",
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: () => editor.isActive("code"),
    },
  ];

  // 标题按钮配置
  const headingButtons = [
    {
      key: "h1",
      text: "H1",
      tooltip: "一级标题",
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor.isActive("heading", { level: 1 }),
    },
    {
      key: "h2",
      text: "H2",
      tooltip: "二级标题",
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive("heading", { level: 2 }),
    },
    {
      key: "h3",
      text: "H3",
      tooltip: "三级标题",
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor.isActive("heading", { level: 3 }),
    },
  ];

  // 列表和其他功能按钮配置
  const listButtons = [
    {
      key: "bulletList",
      icon: <UnorderedListOutlined />,
      tooltip: "无序列表",
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive("bulletList"),
    },
    {
      key: "orderedList",
      icon: <OrderedListOutlined />,
      tooltip: "有序列表",
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive("orderedList"),
    },
    {
      key: "taskList",
      icon: <CheckSquareOutlined />,
      tooltip: "任务列表",
      action: () => editor.chain().focus().toggleTaskList().run(),
      isActive: () => editor.isActive("taskList"),
    },
  ];

  // 插入功能按钮配置
  const insertButtons = [
    {
      key: "link",
      icon: <LinkOutlined />,
      tooltip: "插入链接",
      action: insertLink,
      isActive: () => editor.isActive("link"),
    },
    {
      key: "image",
      icon: <PictureOutlined />,
      tooltip: "插入图片",
      action: insertImage,
      isActive: () => false,
    },
    {
      key: "blockquote",
      icon: <BlockOutlined />,
      tooltip: "引用",
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive("blockquote"),
    },
    {
      key: "horizontalRule",
      icon: <MinusOutlined />,
      tooltip: "分割线",
      action: () => editor.chain().focus().setHorizontalRule().run(),
      isActive: () => false,
    },
  ];

  // 渲染按钮组
  const renderButtonGroup = (buttons: any[], showDivider = false) => (
    <>
      <Space size={2}>
        {buttons.map((button) => (
          <Tooltip key={button.key} title={button.tooltip} placement="top">
            <Button
              size="small"
              type={button.isActive() ? "primary" : "default"}
              icon={button.icon}
              onClick={button.action}
              className={`format-button ${button.isActive() ? "active" : ""}`}
            >
              {button.text}
            </Button>
          </Tooltip>
        ))}
      </Space>
      {showDivider && <Divider type="vertical" className="toolbar-divider" />}
    </>
  );

  const toolbarStyle: React.CSSProperties = {
    position: position ? "absolute" : "relative",
    left: position?.x,
    top: position?.y,
    opacity: visible ? 1 : 0,
    pointerEvents: visible ? "auto" : "none",
    zIndex: 1000,
  };

  return (
    <div
      className={`format-toolbar ${className} ${compact ? "compact" : ""}`}
      style={toolbarStyle}
    >
      <div className="toolbar-content">
        {/* 基础格式化按钮 */}
        {renderButtonGroup(formatButtons, true)}

        {/* 标题按钮 */}
        {!compact && renderButtonGroup(headingButtons, true)}

        {/* 列表按钮 */}
        {renderButtonGroup(listButtons, true)}

        {/* 插入功能按钮 */}
        {!compact && renderButtonGroup(insertButtons)}
      </div>
    </div>
  );
};

export default FormatToolbar;
