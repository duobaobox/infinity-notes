import React, { useState } from "react";
import { Button, Card, Space, Switch, message } from "antd";

/**
 * 生产环境预览组件
 * 用于模拟生产环境下的界面效果
 */
const ProductionPreview: React.FC = () => {
  const [isProductionMode, setIsProductionMode] = useState(false);

  const handleToggleMode = (checked: boolean) => {
    setIsProductionMode(checked);
    
    if (checked) {
      // 模拟生产环境
      message.success("已切换到生产环境预览模式");
      // 隐藏所有开发工具
      const devTools = document.querySelectorAll('[data-dev-tool]');
      devTools.forEach(tool => {
        (tool as HTMLElement).style.display = 'none';
      });
    } else {
      // 恢复开发环境
      message.info("已恢复开发环境模式");
      // 显示所有开发工具
      const devTools = document.querySelectorAll('[data-dev-tool]');
      devTools.forEach(tool => {
        (tool as HTMLElement).style.display = '';
      });
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "20px",
        background: "white",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        zIndex: 1001,
        minWidth: "200px",
      }}
      data-dev-tool="true"
    >
      <Card size="small" title="🚀 生产环境预览">
        <Space direction="vertical" style={{ width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px" }}>
              {isProductionMode ? "生产模式" : "开发模式"}
            </span>
            <Switch
              checked={isProductionMode}
              onChange={handleToggleMode}
              size="small"
            />
          </div>
          
          <div style={{ fontSize: "11px", color: "#666", lineHeight: "1.4" }}>
            {isProductionMode ? (
              <div>
                <div>✅ 测试工具已隐藏</div>
                <div>✅ 调试信息已关闭</div>
                <div>✅ 界面完全干净</div>
                <div>✅ 虚拟化静默工作</div>
              </div>
            ) : (
              <div>
                <div>🔧 显示所有开发工具</div>
                <div>📊 显示调试信息</div>
                <div>🎯 显示虚拟化状态</div>
                <div>⚙️ 开发模式激活</div>
              </div>
            )}
          </div>

          <Button
            size="small"
            type={isProductionMode ? "primary" : "default"}
            onClick={() => handleToggleMode(!isProductionMode)}
            style={{ width: "100%" }}
          >
            {isProductionMode ? "退出预览" : "预览生产环境"}
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default ProductionPreview;
