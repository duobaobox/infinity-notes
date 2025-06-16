import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { Input, Button, Tooltip, message } from "antd";
import {
  PlusOutlined,
  RobotOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useAISettings } from "../../hooks/ai/useAISettings";
import { getAIService } from "../../services/ai/aiService";
import "./CanvasConsole.css";

interface CanvasConsoleProps {
  onSendMessage?: (message: string) => void;
  onCreateNote?: () => void;
  onGenerateWithAI?: (prompt: string) => Promise<void>;
  onOpenAISettings?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isAIGenerating?: boolean;
}

interface CanvasConsoleRef {
  focus: () => void;
}

const CanvasConsole = forwardRef<CanvasConsoleRef, CanvasConsoleProps>(
  (
    {
      onSendMessage,
      onCreateNote,
      onGenerateWithAI,
      onOpenAISettings,
      placeholder = "输入文本AI生成便签，留空创建空白便签...",
      disabled = false,
      isAIGenerating = false,
    },
    ref
  ) => {
    const [inputValue, setInputValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [localHasValidConfig, setLocalHasValidConfig] = useState(false);
    const inputRef = useRef<any>(null);
    const preconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { config: aiConfig, hasValidConfig } = useAISettings();

    // 同步 hasValidConfig 到本地状态
    useEffect(() => {
      console.log("🔄 AI配置状态更新:", { hasValidConfig, aiConfig });
      setLocalHasValidConfig(hasValidConfig);
    }, [hasValidConfig, aiConfig]);

    // 合并内部和外部的生成状态
    const isCurrentlyGenerating = isGenerating || isAIGenerating;

    // 预连接逻辑：用户输入时触发预连接
    const triggerPreconnect = () => {
      if (!localHasValidConfig) return;

      // 清除之前的定时器
      if (preconnectTimeoutRef.current) {
        clearTimeout(preconnectTimeoutRef.current);
      }

      // 延迟500ms触发预连接，避免频繁触发
      preconnectTimeoutRef.current = setTimeout(() => {
        try {
          const aiService = getAIService(aiConfig);
          aiService.preconnectToAI().catch((error) => {
            console.warn("🔗 预连接失败:", error);
          });
        } catch (error) {
          console.warn("🔗 预连接初始化失败:", error);
        }
      }, 500);
    };

    // 清理定时器
    useEffect(() => {
      return () => {
        if (preconnectTimeoutRef.current) {
          clearTimeout(preconnectTimeoutRef.current);
        }
      };
    }, []);

    // 暴露focus方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          inputRef.current?.focus?.();
        },
      }),
      []
    );

    // 智能模式：有文本输入 → AI生成便签；无文本输入 → 手动创建空白便签
    const handleSend = async () => {
      // 防止重复调用
      if (isCurrentlyGenerating) return;

      // 如果没有文本输入，创建空白便签
      if (!inputValue.trim()) {
        console.log("📝 控制台创建空白便签");
        if (onCreateNote) {
          onCreateNote();
        } else {
          console.warn("⚠️ onCreateNote 回调未定义");
        }
        return;
      }

      // 有文本输入，使用AI生成便签（包括演示模式）
      if (onGenerateWithAI) {
        try {
          setIsGenerating(true);
          console.log("🎮 调用onGenerateWithAI函数");
          await onGenerateWithAI(inputValue);
          setInputValue("");
        } catch (error) {
          message.error("AI生成失败，请检查配置或稍后重试");
        } finally {
          setIsGenerating(false);
        }
      } else if (onSendMessage) {
        // 备用：普通消息发送
        onSendMessage(inputValue);
        setInputValue("");
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    return (
      <div className="canvas-console">
        <div
          className={`console-container ${isFocused ? "focused" : ""} ${
            isCurrentlyGenerating ? "ai-generating" : ""
          }`}
        >
          <div className="console-input-container">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                // 用户输入时触发预连接
                if (e.target.value.trim()) {
                  triggerPreconnect();
                }
              }}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled}
              size="large"
              className="console-input"
            />
          </div>

          {/* 外部按钮区域 */}
          <div className="console-external-buttons">
            {inputValue.trim() ? (
              localHasValidConfig ? (
                <Tooltip title="AI生成便签 (Enter)" placement="top">
                  <Button
                    icon={
                      isCurrentlyGenerating ? (
                        <LoadingOutlined />
                      ) : (
                        <RobotOutlined />
                      )
                    }
                    type="primary"
                    shape="circle"
                    size="middle"
                    onClick={handleSend}
                    disabled={disabled || isCurrentlyGenerating}
                    className="external-button ai-external-button"
                  />
                </Tooltip>
              ) : (
                <Tooltip title="点击进行AI设置" placement="top">
                  <Button
                    icon={<RobotOutlined />}
                    type="primary"
                    shape="circle"
                    size="middle"
                    onClick={
                      onOpenAISettings || (() => message.info("请先配置AI设置"))
                    }
                    disabled={disabled || !onOpenAISettings}
                    className="external-button ai-external-button"
                  />
                </Tooltip>
              )
            ) : (
              <Tooltip title="创建空白便签 (Enter)" placement="top">
                <Button
                  icon={<PlusOutlined />}
                  type="primary"
                  shape="circle"
                  size="middle"
                  onClick={handleSend}
                  className="external-button add-external-button"
                />
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    );
  }
);

CanvasConsole.displayName = "CanvasConsole";

export default CanvasConsole;
