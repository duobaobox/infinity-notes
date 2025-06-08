import React, { useState, memo } from "react";
import { Input, Button, Tooltip } from "antd";
import { SendOutlined, PlusOutlined, RobotOutlined } from "@ant-design/icons";
import "./CanvasConsole.css";

interface CanvasConsoleProps {
  onSendMessage?: (message: string) => void;
  onCreateNote?: () => void;
  onToggleAI?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const CanvasConsole: React.FC<CanvasConsoleProps> = memo(
  ({
    onSendMessage,
    onCreateNote,
    onToggleAI,
    placeholder = "输入提示或直接添加便签...",
    disabled = false,
  }) => {
    const [inputValue, setInputValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const handleSend = () => {
      if (inputValue.trim() && onSendMessage) {
        onSendMessage(inputValue);
        setInputValue("");
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
          <Tooltip title="deepseek-ai" placement="top">
            <Button
              icon={<RobotOutlined />}
              type="text"
              size="large"
              shape="circle"
              onClick={onToggleAI}
              className="console-button ai-button"
            />
          </Tooltip>

          {/* 中央输入框 */}
          <div className="console-input-container">
            <Input
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
                  <Tooltip title="发送消息 (Enter)" placement="top">
                    <Button
                      icon={<SendOutlined />}
                      type="text"
                      size="small"
                      onClick={handleSend}
                      disabled={disabled}
                      className="send-button"
                    />
                  </Tooltip>
                ) : (
                  <Tooltip title="快速添加便签" placement="top">
                    <Button
                      icon={<PlusOutlined />}
                      type="text"
                      size="small"
                      onClick={onCreateNote}
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
