import React from "react";
import { Card, Typography, Space, Alert } from "antd";

const { Title, Text, Paragraph } = Typography;

/**
 * 右键拖动画布功能测试组件
 * 用于测试和展示右键拖动画布的功能
 */
const RightClickDragTest: React.FC = () => {
  return (
    <div style={{ padding: "24px", height: "100vh", background: "#f5f5f5" }}>
      <Title level={2}>右键拖动画布功能测试</Title>

      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* 功能说明 */}
        <Card title="功能说明">
          <Paragraph>
            现在您可以使用鼠标右键来拖动画布，无需担心浏览器的右键菜单干扰。
            这个功能让您可以更方便地浏览大型画布内容。
          </Paragraph>
        </Card>

        {/* 使用方法 */}
        <Card title="使用方法">
          <Space direction="vertical" size="middle">
            <div>
              <Text strong>1. 右键拖动画布</Text>
              <br />
              <Text type="secondary">
                按住鼠标右键并拖动，可以平移整个画布视图
              </Text>
            </div>

            <div>
              <Text strong>2. 无视便签拖动</Text>
              <br />
              <Text type="secondary">
                右键拖动时会忽略便签，直接拖动画布背景
              </Text>
            </div>

            <div>
              <Text strong>3. 屏蔽右键菜单</Text>
              <br />
              <Text type="secondary">
                系统的右键菜单已被完全屏蔽，不会干扰拖动操作
              </Text>
            </div>
          </Space>
        </Card>

        {/* 技术实现 */}
        <Card title="技术实现">
          <Space direction="vertical" size="middle">
            <div>
              <Text strong>鼠标事件处理</Text>
              <br />
              <Text type="secondary">
                监听 mousedown 事件的 button === 2（右键）
              </Text>
            </div>

            <div>
              <Text strong>右键菜单屏蔽</Text>
              <br />
              <Text type="secondary">
                通过 preventDefault() 完全阻止 contextmenu 事件
              </Text>
            </div>

            <div>
              <Text strong>拖动状态管理</Text>
              <br />
              <Text type="secondary">
                在 Canvas Store 中添加 isRightButtonDrag 标识
              </Text>
            </div>

            <div>
              <Text strong>视觉反馈</Text>
              <br />
              <Text type="secondary">
                右键拖动时显示 move 光标，提供清晰的视觉反馈
              </Text>
            </div>
          </Space>
        </Card>

        {/* 支持的拖动方式 */}
        <Card title="支持的拖动方式">
          <Space direction="vertical" size="middle">
            <Alert
              message="左键拖动"
              description="在空白区域左键拖动画布（避开便签）"
              type="info"
              showIcon
            />

            <Alert
              message="中键拖动"
              description="鼠标中键（滚轮按下）拖动画布"
              type="info"
              showIcon
            />

            <Alert
              message="右键拖动 (新功能)"
              description="鼠标右键拖动画布，无视便签，屏蔽右键菜单"
              type="success"
              showIcon
            />

            <Alert
              message="移动模式"
              description="开启移动模式后，左键也可以直接拖动画布"
              type="info"
              showIcon
            />
          </Space>
        </Card>

        {/* 测试说明 */}
        <Card title="测试说明">
          <Paragraph>要测试右键拖动功能，请：</Paragraph>
          <ol>
            <li>返回主画布界面</li>
            <li>在画布上创建一些便签</li>
            <li>尝试在便签上右键拖动 - 应该拖动画布而不是便签</li>
            <li>尝试在空白区域右键拖动 - 应该正常拖动画布</li>
            <li>确认右键菜单不会出现</li>
          </ol>
        </Card>
      </Space>
    </div>
  );
};

export default RightClickDragTest;
