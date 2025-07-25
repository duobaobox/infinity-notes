// 便签设置功能测试组件
import React, { useEffect } from "react";
import { Button, Card, Space, Typography, message } from "antd";
import {
  FileTextOutlined,
  SettingOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import { useUIStore } from "../stores/uiStore";

const { Title, Text, Paragraph } = Typography;

/**
 * 便签设置功能测试组件
 * 用于测试新增的便签设置tab页面功能
 */
const NoteSettingsTest: React.FC = () => {
  const { openSettingsModal, appearance } = useUIStore();

  // 组件挂载时显示测试说明
  useEffect(() => {
    message.info("便签设置功能测试组件已加载", 2);
  }, []);

  // 测试打开便签设置tab
  const handleOpenNoteSettings = () => {
    openSettingsModal("notes");
    message.success("已打开便签设置页面", 1.5);
  };

  // 测试打开其他设置tab
  const handleOpenAppearanceSettings = () => {
    openSettingsModal("appearance");
    message.success("已打开外观设置页面", 1.5);
  };

  // 显示当前便签尺寸配置
  const showCurrentConfig = () => {
    const config = {
      手动便签宽度: appearance.manualNoteDefaultWidth,
      手动便签高度: appearance.manualNoteDefaultHeight,
      AI便签宽度: appearance.aiNoteDefaultWidth,
      AI便签高度: appearance.aiNoteDefaultHeight,
    };

    console.log("当前便签尺寸配置:", config);
    message.info("当前配置已输出到控制台", 2);
  };

  // 测试便签设置保存功能
  const testNoteSettingsSave = () => {
    message.info("请在便签设置页面中修改尺寸值，然后点击保存按钮测试功能", 3);
    openSettingsModal("notes");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <Card>
        <Title level={2}>
          <ExperimentOutlined style={{ marginRight: 8 }} />
          便签设置功能测试
        </Title>

        <Paragraph>
          这个测试组件用于验证新增的便签设置tab页面功能是否正常工作。
        </Paragraph>

        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* 功能测试按钮 */}
          <Card size="small" title="功能测试">
            <Space wrap>
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                onClick={handleOpenNoteSettings}
              >
                打开便签设置
              </Button>

              <Button
                icon={<SettingOutlined />}
                onClick={handleOpenAppearanceSettings}
              >
                打开外观设置
              </Button>

              <Button type="dashed" onClick={showCurrentConfig}>
                查看当前配置
              </Button>

              <Button type="default" onClick={testNoteSettingsSave}>
                测试保存功能
              </Button>
            </Space>
          </Card>

          {/* 当前配置显示 */}
          <Card size="small" title="当前便签尺寸配置">
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <Text strong>手动便签默认尺寸：</Text>
                <Text code>
                  {appearance.manualNoteDefaultWidth} ×{" "}
                  {appearance.manualNoteDefaultHeight} px
                </Text>
              </div>
              <div>
                <Text strong>AI便签默认尺寸：</Text>
                <Text code>
                  {appearance.aiNoteDefaultWidth} ×{" "}
                  {appearance.aiNoteDefaultHeight} px
                </Text>
              </div>
            </Space>
          </Card>

          {/* 测试说明 */}
          <Card size="small" title="测试步骤">
            <ol>
              <li>点击"打开便签设置"按钮</li>
              <li>验证设置模态框是否正确打开到"便签设置"tab</li>
              <li>检查便签尺寸设置表单是否正确显示</li>
              <li>检查内容提取优化设置是否正确显示</li>
              <li>检查保存和重置按钮是否正确显示</li>
              <li>尝试修改便签尺寸设置</li>
              <li>验证变更提示是否正确显示</li>
              <li>点击"保存设置"按钮保存更改</li>
              <li>验证设置是否正确保存和应用</li>
              <li>点击"重置默认值"按钮测试重置功能</li>
            </ol>
          </Card>

          {/* 预期结果 */}
          <Card size="small" title="预期结果">
            <ul>
              <li>✅ 设置模态框正确打开到便签设置tab</li>
              <li>✅ 便签尺寸设置表单正确显示</li>
              <li>✅ 内容提取优化设置正确显示</li>
              <li>✅ 保存和重置按钮正确显示</li>
              <li>✅ 表单验证正常工作</li>
              <li>✅ 变更提示正确显示</li>
              <li>✅ 保存按钮状态正确切换</li>
              <li>✅ 设置更改能够正确保存</li>
              <li>✅ 重置功能正常工作</li>
              <li>✅ 新建便签使用更新后的默认尺寸</li>
            </ul>
          </Card>
        </Space>
      </Card>
    </div>
  );
};

export default NoteSettingsTest;
