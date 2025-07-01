import { Alert, Typography } from "antd";
import React from "react";

const { Text } = Typography;

export const VirtualizationTestGuide: React.FC = () => {
  return (
    <div style={{ padding: "16px", maxWidth: "600px" }}>
      <Alert
        message="虚拟化渲染测试指南"
        description={
          <div>
            <Text>
              现在便签内容区域已启用虚拟化渲染功能。要测试虚拟化效果：
            </Text>
            <ol style={{ marginTop: "8px", paddingLeft: "20px" }}>
              <li>创建一个新便签</li>
              <li>粘贴长文本内容（超过1000字符）</li>
              <li>打开浏览器开发者工具的控制台</li>
              <li>滚动便签内容，观察控制台输出的虚拟化日志</li>
              <li>检查DOM元素数量的变化</li>
            </ol>
            <Text type="secondary">
              虚拟化将只渲染可视区域的内容，大幅提升长文本的性能表现。
            </Text>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: "16px" }}
      />
    </div>
  );
};

export default VirtualizationTestGuide;
