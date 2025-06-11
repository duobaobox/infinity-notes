import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { Input, Button, Tooltip, message } from "antd";
import {
  SendOutlined,
  PlusOutlined,
  RobotOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useAISettings } from "../hooks/useAISettings";
import { getAIService } from "../services/aiService";
import "./CanvasConsole.css";

interface CanvasConsoleProps {
  onSendMessage?: (message: string) => void;
  onCreateNote?: () => void;
  onGenerateWithAI?: (prompt: string) => Promise<void>;
  onOpenAISettings?: () => void; // 新增：打开 AI 设置页面的回调
  placeholder?: string;
  disabled?: boolean;
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
    },
    ref
  ) => {
    const [inputValue, setInputValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const inputRef = useRef<any>(null);
    const preconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { config: aiConfig, hasValidConfig } = useAISettings();

    // 添加调试信息
    useEffect(() => {
      console.log("🎮 CanvasConsole AI配置状态:", {
        hasValidConfig,
        config: {
          apiKey: aiConfig.apiKey ? "已设置" : "未设置",
          apiUrl: aiConfig.apiUrl || "未设置",
          aiModel: aiConfig.aiModel || "未设置"
        }
      });
    }, [aiConfig, hasValidConfig]);

    // 预连接逻辑：用户输入时触发预连接
    const triggerPreconnect = () => {
      if (!hasValidConfig) return;

      // 清除之前的定时器
      if (preconnectTimeoutRef.current) {
        clearTimeout(preconnectTimeoutRef.current);
      }

      // 延迟500ms触发预连接，避免频繁触发
      preconnectTimeoutRef.current = setTimeout(() => {
        try {
          const aiService = getAIService(aiConfig);
          aiService.preconnectToAI().catch(error => {
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
      if (isGenerating) return;

      // 如果没有文本输入，创建空白便签
      if (!inputValue.trim()) {
        if (onCreateNote) {
          onCreateNote();
        }
        return;
      }

      // 有文本输入，使用AI生成便签（包括演示模式）
      console.log("🎮 触发AI生成，输入:", inputValue, "hasValidConfig:", hasValidConfig);
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

    const handleAIGenerate = async () => {
      if (!inputValue.trim()) {
        message.warning("请输入提示内容");
        return;
      }

      // 防止重复调用
      if (isGenerating) return;

      // 直接调用AI生成（包括演示模式）
      if (onGenerateWithAI) {
        try {
          setIsGenerating(true);
          await onGenerateWithAI(inputValue);
          setInputValue("");
        } catch (error) {
          message.error("AI生成失败，请检查配置或稍后重试");
        } finally {
          setIsGenerating(false);
        }
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    return (
      <div className="canvas-console">
        <div className={`console-container ${isFocused ? "focused" : ""}`}>
          {/* 左侧AI按钮 */}
          <Tooltip
            title={hasValidConfig ? "AI智能生成便签" : "AI演示模式（点击体验流式效果）"}
            placement="top"
          >
            <Button
              icon={isGenerating ? <LoadingOutlined /> : <RobotOutlined />}
              type="primary"
              size="large"
              shape="circle"
              onClick={handleAIGenerate}
              disabled={!inputValue.trim() || isGenerating || disabled}
              className="console-button ai-button ai-enabled"
            />
          </Tooltip>

          {/* 中央输入框 */}
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
              onKeyPress={handleKeyPress}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled}
              size="large"
              className="console-input"
              suffix={
                inputValue.trim() ? (
                  hasValidConfig ? (
                    <Tooltip title="AI生成便签 (Enter)" placement="top">
                      <Button
                        icon={
                          isGenerating ? <LoadingOutlined /> : <RobotOutlined />
                        }
                        type="primary"
                        size="small"
                        onClick={handleSend}
                        disabled={disabled || isGenerating}
                        className="ai-send-button"
                      />
                    </Tooltip>
                  ) : (
                    <Tooltip title="配置AI后可智能生成 (Enter)" placement="top">
                      <Button
                        icon={<RobotOutlined />}
                        type="text"
                        size="small"
                        onClick={handleSend}
                        disabled={disabled}
                        className="send-button"
                      />
                    </Tooltip>
                  )
                ) : (
                  <Tooltip title="创建空白便签 (Enter)" placement="top">
                    <Button
                      icon={<PlusOutlined />}
                      type="text"
                      size="small"
                      onClick={handleSend}
                      className="add-button-inline"
                    />
                  </Tooltip>
                )
              }
            />
          </div>
        </div>
      </div>
    );
  }
);

CanvasConsole.displayName = "CanvasConsole";

export default CanvasConsole;
