// 供应商状态指示器组件
import { Tooltip } from "antd";
import React from "react";
import "./ProviderStatusIndicator.css";

interface ProviderStatusIndicatorProps {
  isConfigured: boolean;
  isCurrent: boolean;
  providerName: string;
}

/**
 * 供应商状态指示器组件
 * 显示配置状态和当前使用状态
 */
export const ProviderStatusIndicator: React.FC<
  ProviderStatusIndicatorProps
> = ({ isConfigured, isCurrent, providerName }) => {
  return (
    <>
      {/* 配置状态指示器 */}
      {isConfigured && (
        <Tooltip title={`${providerName}已配置API密钥和模型`}>
          <div
            className="provider-config-indicator"
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              width: "10px",
              height: "10px",
              backgroundColor: "#52c41a",
              borderRadius: "50%",
              border: "2px solid white",
              boxShadow: "0 0 6px rgba(82, 196, 26, 0.6)",
              zIndex: 10,
            }}
          />
        </Tooltip>
      )}

      {/* 当前使用标识 */}
      {isCurrent && (
        <Tooltip title={`当前正在使用${providerName}`}>
          <div
            className="provider-current-indicator"
            style={{
              position: "absolute",
              top: "4px",
              left: "4px",
              background: "linear-gradient(45deg, #1890ff, #52c41a)",
              color: "white",
              fontSize: "9px",
              padding: "1px 4px",
              borderRadius: "6px",
              fontWeight: "bold",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              zIndex: 10,
            }}
          >
            使用中
          </div>
        </Tooltip>
      )}
    </>
  );
};

export default ProviderStatusIndicator;
