/**
 * 表格工具栏组件
 * 为编辑器提供表格操作界面
 */

import React, { useMemo } from "react";
import type { Editor } from "@tiptap/react";
import type { ToolbarButtonConfig } from "./extensions/types";
import "./TableToolbar.css";

interface TableToolbarProps {
  /** 编辑器实例 */
  editor: Editor | null;
  /** 工具栏按钮配置 */
  buttons?: ToolbarButtonConfig[];
  /** 是否显示工具栏 */
  visible?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 是否紧凑模式 */
  compact?: boolean;
}

/**
 * 默认表格工具栏按钮配置
 */
const DEFAULT_TABLE_BUTTONS: ToolbarButtonConfig[] = [
  {
    id: "insertTable",
    title: "插入表格 (Mod+Alt+T)",
    icon: "📋",
    group: "table",
    position: 1,
    shortcut: "Mod+Alt+T",
    onClick: (editor: Editor) => {
      editor
        .chain()
        .focus()
        .insertTable({
          rows: 3,
          cols: 3,
          withHeaderRow: true,
        })
        .run();
    },
    isDisabled: (editor: Editor) => !editor.can().insertTable(),
  },
  {
    id: "deleteTable",
    title: "删除表格",
    icon: "🗑️",
    group: "table",
    position: 2,
    onClick: (editor: Editor) => {
      editor.chain().focus().deleteTable().run();
    },
    isActive: (editor: Editor) => editor.isActive("table"),
    isDisabled: (editor: Editor) => !editor.can().deleteTable(),
  },
  {
    id: "divider1",
    title: "",
    icon: "|",
    group: "table",
    position: 3,
    onClick: () => {},
  },
  {
    id: "addColumnBefore",
    title: "在前面插入列",
    icon: "⬅️➕",
    group: "table",
    position: 4,
    onClick: (editor: Editor) => {
      editor.chain().focus().addColumnBefore().run();
    },
    isDisabled: (editor: Editor) => !editor.can().addColumnBefore(),
  },
  {
    id: "addColumnAfter",
    title: "在后面插入列",
    icon: "➕➡️",
    group: "table",
    position: 5,
    onClick: (editor: Editor) => {
      editor.chain().focus().addColumnAfter().run();
    },
    isDisabled: (editor: Editor) => !editor.can().addColumnAfter(),
  },
  {
    id: "deleteColumn",
    title: "删除列",
    icon: "❌📋",
    group: "table",
    position: 6,
    onClick: (editor: Editor) => {
      editor.chain().focus().deleteColumn().run();
    },
    isDisabled: (editor: Editor) => !editor.can().deleteColumn(),
  },
  {
    id: "divider2",
    title: "",
    icon: "|",
    group: "table",
    position: 7,
    onClick: () => {},
  },
  {
    id: "addRowBefore",
    title: "在上面插入行",
    icon: "⬆️➕",
    group: "table",
    position: 8,
    onClick: (editor: Editor) => {
      editor.chain().focus().addRowBefore().run();
    },
    isDisabled: (editor: Editor) => !editor.can().addRowBefore(),
  },
  {
    id: "addRowAfter",
    title: "在下面插入行",
    icon: "➕⬇️",
    group: "table",
    position: 9,
    onClick: (editor: Editor) => {
      editor.chain().focus().addRowAfter().run();
    },
    isDisabled: (editor: Editor) => !editor.can().addRowAfter(),
  },
  {
    id: "deleteRow",
    title: "删除行",
    icon: "❌📋",
    group: "table",
    position: 10,
    onClick: (editor: Editor) => {
      editor.chain().focus().deleteRow().run();
    },
    isDisabled: (editor: Editor) => !editor.can().deleteRow(),
  },
  {
    id: "divider3",
    title: "",
    icon: "|",
    group: "table",
    position: 11,
    onClick: () => {},
  },
  {
    id: "mergeCells",
    title: "合并单元格",
    icon: "🔗",
    group: "table",
    position: 12,
    onClick: (editor: Editor) => {
      editor.chain().focus().mergeCells().run();
    },
    isDisabled: (editor: Editor) => !editor.can().mergeCells(),
  },
  {
    id: "splitCell",
    title: "拆分单元格",
    icon: "✂️",
    group: "table",
    position: 13,
    onClick: (editor: Editor) => {
      editor.chain().focus().splitCell().run();
    },
    isDisabled: (editor: Editor) => !editor.can().splitCell(),
  },
  {
    id: "toggleHeaderRow",
    title: "切换标题行",
    icon: "📋",
    group: "table",
    position: 14,
    onClick: (editor: Editor) => {
      editor.chain().focus().toggleHeaderRow().run();
    },
    isActive: (editor: Editor) => {
      // 检查当前是否在表格的第一行
      const { selection } = editor.state;
      const { $from } = selection;
      const tableNode = $from.node($from.depth - 1);
      return (
        tableNode &&
        tableNode.type.name === "table" &&
        $from.start($from.depth - 1) === $from.start()
      );
    },
  },
];

/**
 * 表格工具栏组件
 */
const TableToolbar: React.FC<TableToolbarProps> = ({
  editor,
  buttons = DEFAULT_TABLE_BUTTONS,
  visible = true,
  className = "",
  compact = false,
}) => {
  // 过滤和排序按钮
  const sortedButtons = useMemo(() => {
    return buttons
      .filter((button) => button.group === "table")
      .sort((a, b) => (a.position || 100) - (b.position || 100));
  }, [buttons]);

  // 检查是否在表格中
  const isInTable = useMemo(() => {
    if (!editor) return false;
    return editor.isActive("table");
  }, [editor]);

  if (!visible || !editor) {
    return null;
  }

  const handleButtonClick = (
    button: ToolbarButtonConfig,
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (button.onClick && editor) {
      button.onClick(editor);
    }
  };

  const isButtonActive = (button: ToolbarButtonConfig): boolean => {
    if (!button.isActive || !editor) return false;
    return button.isActive(editor);
  };

  const isButtonDisabled = (button: ToolbarButtonConfig): boolean => {
    if (!editor) return true;
    if (button.isDisabled) {
      return button.isDisabled(editor);
    }
    return false;
  };

  return (
    <div className={`table-toolbar ${compact ? "compact" : ""} ${className}`}>
      {/* 插入表格按钮始终显示 */}
      <div className="table-toolbar-section">
        {sortedButtons
          .filter((button) => button.id === "insertTable")
          .map((button) => (
            <button
              key={button.id}
              className={`toolbar-button ${
                isButtonActive(button) ? "active" : ""
              }`}
              onClick={(e) => handleButtonClick(button, e)}
              disabled={isButtonDisabled(button)}
              title={button.title}
              type="button"
            >
              {typeof button.icon === "string" ? (
                <span className="button-icon">{button.icon}</span>
              ) : React.isValidElement(button.icon) ? (
                button.icon
              ) : (
                <button.icon />
              )}
              {!compact && <span className="button-text">插入表格</span>}
            </button>
          ))}
      </div>

      {/* 表格操作按钮 - 只在表格中显示 */}
      {isInTable && (
        <>
          <div className="toolbar-divider" />
          <div className="table-toolbar-section">
            {sortedButtons
              .filter((button) => button.id !== "insertTable")
              .map((button) => {
                // 分割线特殊处理
                if (button.icon === "|") {
                  return <div key={button.id} className="toolbar-divider" />;
                }

                return (
                  <button
                    key={button.id}
                    className={`toolbar-button ${
                      isButtonActive(button) ? "active" : ""
                    }`}
                    onClick={(e) => handleButtonClick(button, e)}
                    disabled={isButtonDisabled(button)}
                    title={button.title}
                    type="button"
                  >
                    {typeof button.icon === "string" ? (
                      <span className="button-icon">{button.icon}</span>
                    ) : React.isValidElement(button.icon) ? (
                      button.icon
                    ) : (
                      <button.icon />
                    )}
                  </button>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
};

export default TableToolbar;
