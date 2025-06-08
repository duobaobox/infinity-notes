import { useEffect, useCallback } from "react";

interface KeyboardShortcuts {
  onCreateNote?: () => void;
  onOpenSettings?: () => void;
  onFocusConsole?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSelectAll?: () => void;
  onSearch?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, shiftKey } = event;
      const isModifierPressed = ctrlKey || metaKey;

      // 防止在输入框中触发快捷键
      const target = event.target as HTMLElement;
      const isInputElement =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true";

      // 某些快捷键即使在输入框中也要响应
      const globalShortcuts = ["F11", "Escape"];
      if (isInputElement && !globalShortcuts.includes(key)) {
        // 只允许部分快捷键在输入框中工作
        if (
          !(isModifierPressed && ["s", "z", "y"].includes(key.toLowerCase()))
        ) {
          return;
        }
      }

      // 快捷键映射
      const shortcutMap: Record<string, () => void> = {
        // 创建便签 - Ctrl/Cmd + N
        [`${isModifierPressed && key.toLowerCase() === "n"}`]: () => {
          event.preventDefault();
          shortcuts.onCreateNote?.();
        },

        // 打开设置 - Ctrl/Cmd + ,
        [`${isModifierPressed && key === ","}`]: () => {
          event.preventDefault();
          shortcuts.onOpenSettings?.();
        },

        // 聚焦控制台 - Ctrl/Cmd + K 或 /
        [`${isModifierPressed && key.toLowerCase() === "k"}`]: () => {
          event.preventDefault();
          shortcuts.onFocusConsole?.();
        },
        [`${key === "/" && !isModifierPressed}`]: () => {
          if (!isInputElement) {
            event.preventDefault();
            shortcuts.onFocusConsole?.();
          }
        },

        // 保存 - Ctrl/Cmd + S
        [`${isModifierPressed && key.toLowerCase() === "s"}`]: () => {
          event.preventDefault();
          shortcuts.onSave?.();
        },

        // 撤销 - Ctrl/Cmd + Z
        [`${isModifierPressed && !shiftKey && key.toLowerCase() === "z"}`]:
          () => {
            event.preventDefault();
            shortcuts.onUndo?.();
          },

        // 重做 - Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y
        [`${
          isModifierPressed &&
          ((shiftKey && key.toLowerCase() === "z") || key.toLowerCase() === "y")
        }`]: () => {
          event.preventDefault();
          shortcuts.onRedo?.();
        },

        // 全选 - Ctrl/Cmd + A
        [`${isModifierPressed && key.toLowerCase() === "a"}`]: () => {
          if (!isInputElement) {
            event.preventDefault();
            shortcuts.onSelectAll?.();
          }
        },

        // 搜索 - Ctrl/Cmd + F
        [`${isModifierPressed && key.toLowerCase() === "f"}`]: () => {
          event.preventDefault();
          shortcuts.onSearch?.();
        },

        // 缩放
        [`${isModifierPressed && key === "="}`]: () => {
          event.preventDefault();
          shortcuts.onZoomIn?.();
        },
        [`${isModifierPressed && key === "-"}`]: () => {
          event.preventDefault();
          shortcuts.onZoomOut?.();
        },
        [`${isModifierPressed && key === "0"}`]: () => {
          event.preventDefault();
          shortcuts.onResetZoom?.();
        },
      };

      // 执行匹配的快捷键
      Object.entries(shortcutMap).forEach(([condition, handler]) => {
        if (condition === "true") {
          handler();
        }
      });
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // 返回快捷键提示信息
  const getShortcutHints = () => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const modifier = isMac ? "⌘" : "Ctrl";

    return {
      createNote: `${modifier} + N`,
      openSettings: `${modifier} + ,`,
      focusConsole: `${modifier} + K 或 /`,
      save: `${modifier} + S`,
      undo: `${modifier} + Z`,
      redo: `${modifier} + Shift + Z`,
      selectAll: `${modifier} + A`,
      search: `${modifier} + F`,
      zoomIn: `${modifier} + =`,
      zoomOut: `${modifier} + -`,
      resetZoom: `${modifier} + 0`,
    };
  };

  return { getShortcutHints };
};
