import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Input, Button, Tooltip, message, Progress } from "antd";
import {
  SendOutlined,
  PlusOutlined,
  RobotOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useAISettings } from "../hooks/useAISettings";
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

interface GenerationStatus {
  status: "idle" | "generating" | "success" | "error";
  message?: string;
  progress?: number;
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
    const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
      status: "idle",
    });
    const inputRef = useRef<any>(null);

    const { config: aiConfig, hasValidConfig } = useAISettings();

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
      if (onGenerateWithAI) {
        try {
          setIsGenerating(true);
          setGenerationStatus({
            status: "generating",
            message: "正在连接AI服务...",
            progress: 20,
          });

          // 模拟进度更新
          setTimeout(() => {
            setGenerationStatus({
              status: "generating",
              message: "正在生成便签内容...",
              progress: 60,
            });
          }, 500);

          await onGenerateWithAI(inputValue);

          setGenerationStatus({
            status: "success",
            message: "便签生成成功！",
            progress: 100,
          });

          setTimeout(() => {
            setGenerationStatus({ status: "idle" });
          }, 2000);

          setInputValue("");
        } catch (error) {
          setGenerationStatus({
            status: "error",
            message: "AI生成失败，请检查配置或稍后重试",
          });
          message.error("AI生成失败，请检查配置或稍后重试");

          setTimeout(() => {
            setGenerationStatus({ status: "idle" });
          }, 3000);
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
          setGenerationStatus({
            status: "generating",
            message: "正在连接AI服务...",
            progress: 20,
          });

          // 模拟进度更新
          setTimeout(() => {
            setGenerationStatus({
              status: "generating",
              message: "正在生成便签内容...",
              progress: 60,
            });
          }, 500);

          await onGenerateWithAI(inputValue);

          setGenerationStatus({
            status: "success",
            message: "便签生成成功！",
            progress: 100,
          });

          setTimeout(() => {
            setGenerationStatus({ status: "idle" });
          }, 2000);

          setInputValue("");
        } catch (error) {
          setGenerationStatus({
            status: "error",
            message: "AI生成失败，请检查配置或稍后重试",
          });
          message.error("AI生成失败，请检查配置或稍后重试");

          setTimeout(() => {
            setGenerationStatus({ status: "idle" });
          }, 3000);
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
        {/* 状态指示器 */}
        {generationStatus.status !== "idle" && (
          <div className="generation-status">
            <div className="status-content">
              {generationStatus.status === "generating" && (
                <>
                  <LoadingOutlined
                    style={{ marginRight: 8, color: "#1890ff" }}
                  />
                  <span>{generationStatus.message}</span>
                  {generationStatus.progress && (
                    <Progress
                      percent={generationStatus.progress}
                      size="small"
                      style={{ marginLeft: 12, width: 100 }}
                      showInfo={false}
                    />
                  )}
                </>
              )}
              {generationStatus.status === "success" && (
                <>
                  <CheckCircleOutlined
                    style={{ marginRight: 8, color: "#52c41a" }}
                  />
                  <span>{generationStatus.message}</span>
                </>
              )}
              {generationStatus.status === "error" && (
                <>
                  <ExclamationCircleOutlined
                    style={{ marginRight: 8, color: "#ff4d4f" }}
                  />
                  <span>{generationStatus.message}</span>
                </>
              )}
            </div>
          </div>
        )}

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
              onChange={(e) => setInputValue(e.target.value)}
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
