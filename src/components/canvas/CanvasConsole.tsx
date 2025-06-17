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
  BranchesOutlined,
} from "@ant-design/icons";
import { useAISettings } from "../../hooks/ai/useAISettings";
import { getAIService } from "../../services/ai/aiService";
import { useConnectionStore } from "../../stores";
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
      placeholder,
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

    // 获取连接状态
    const { connectedNotes } = useConnectionStore();
    const hasConnections = connectedNotes.length > 0;

    // 动态placeholder文本
    const dynamicPlaceholder = placeholder || (
      hasConnections
        ? ` 请输入指令处理便签（如：总结、分析、整理等）`
        : " 输入文本AI生成便签，留空创建空白便签..."
    );

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

    // 智能模式处理函数
    const handleSend = async () => {
      // 防止重复调用
      if (isCurrentlyGenerating) return;

      // 如果有连接便签，必须输入处理命令
      if (hasConnections) {
        if (!inputValue.trim()) {
          message.warning("请输入处理指令（如：总结、分析、整理等）");
          return;
        }
        // 有连接便签且有输入，执行AI智能处理
        if (onGenerateWithAI) {
          try {
            setIsGenerating(true);
            console.log("🎮 AI智能处理连接便签");
            await onGenerateWithAI(inputValue);
            setInputValue("");
          } catch (error) {
            message.error("AI智能处理失败，请检查配置或稍后重试");
          } finally {
            setIsGenerating(false);
          }
        }
        return;
      }

      // 无连接便签的原有逻辑
      if (!inputValue.trim()) {
        // 无输入，创建空白便签
        console.log("📝 控制台创建空白便签");
        if (onCreateNote) {
          onCreateNote();
        } else {
          console.warn("⚠️ onCreateNote 回调未定义");
        }
        return;
      }

      // 有输入，使用AI生成便签
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

    return (      <div className={`canvas-console`}>
        <div
          className={`console-container ${isFocused ? "focused" : ""} ${
            isCurrentlyGenerating ? "ai-generating" : ""
          } ${hasConnections ? "has-connections" : ""}`}
        >
          <div className="console-input-container">
            {/* 连接状态指示器 - 始终存在，通过CSS控制显示 */}
            <div className={`connection-indicator ${hasConnections ? 'visible' : 'hidden'}`}>
              <span className="connection-icon">🔗</span>
              <span className="connection-text">{connectedNotes.length}</span>
            </div>
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
              placeholder={dynamicPlaceholder}
              disabled={disabled}
              size="large"
              className="console-input"
            />
          </div>

          {/* 外部按钮区域 */}
          <div className="console-external-buttons">
            {hasConnections ? (
              // 有连接便签时：始终显示绿色的AI智能处理按钮
              localHasValidConfig ? (
                inputValue.trim() ? (
                  // 有输入时不显示Tooltip
                  <Button
                    icon={
                      isCurrentlyGenerating ? (
                        <LoadingOutlined />
                      ) : (
                        <BranchesOutlined />
                      )
                    }
                    type="primary"
                    shape="circle"
                    size="middle"
                    onClick={handleSend}
                    disabled={disabled || isCurrentlyGenerating}
                    className="external-button ai-smart-process-button"
                  />
                ) : (
                  // 无输入时显示提示
                  <Tooltip
                    title={`必须输入指令才能处理这 ${connectedNotes.length} 个便签`}
                    placement="top"
                  >
                    <Button
                      icon={
                        isCurrentlyGenerating ? (
                          <LoadingOutlined />
                        ) : (
                          <BranchesOutlined />
                        )
                      }
                      type="primary"
                      shape="circle"
                      size="middle"
                      onClick={handleSend}
                      disabled={disabled || isCurrentlyGenerating}
                      className="external-button ai-smart-process-button requires-input"
                    />
                  </Tooltip>
                )
              ) : (
                <Tooltip title="点击进行AI设置" placement="top">
                  <Button
                    icon={<BranchesOutlined />}
                    type="primary"
                    shape="circle"
                    size="middle"
                    onClick={onOpenAISettings || (() => message.info("请先配置AI设置"))}
                    disabled={disabled || !onOpenAISettings}
                    className="external-button ai-smart-process-button requires-input"
                  />
                </Tooltip>
              )
            ) : (
              // 无连接便签时：根据输入状态显示不同按钮
              inputValue.trim() ? (
                localHasValidConfig ? (
                  // 有输入且有AI配置：显示蓝色AI生成按钮
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
                  // 有输入但无AI配置：显示AI设置按钮
                  <Tooltip title="点击进行AI设置" placement="top">
                    <Button
                      icon={<RobotOutlined />}
                      type="primary"
                      shape="circle"
                      size="middle"
                      onClick={onOpenAISettings || (() => message.info("请先配置AI设置"))}
                      disabled={disabled || !onOpenAISettings}
                      className="external-button ai-external-button"
                    />
                  </Tooltip>
                )
              ) : (
                // 无输入：显示蓝色手动添加按钮
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
              )
            )}
          </div>
        </div>
      </div>
    );
  }
);

CanvasConsole.displayName = "CanvasConsole";

export default CanvasConsole;
