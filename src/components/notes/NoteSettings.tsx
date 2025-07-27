// 便签设置组件
// 集中管理便签相关的所有设置选项
import React from "react";
import {
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Row,
  Typography,
  type FormInstance,
} from "antd";
import {
  BulbOutlined,
  FileTextOutlined,
  SettingOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import CardSectionTitle from "../common/CardSectionTitle";
import ContentExtractionSettings from "../ai/ContentExtractionSettings";

const { Text } = Typography;

/**
 * 便签设置组件的属性接口
 */
interface NoteSettingsProps {
  /** 表单实例，用于管理便签尺寸设置 */
  form: FormInstance;
  /** 便签设置变更回调函数 */
  onValuesChange: (changedValues: any, allValues: any) => void;
  /** 初始值 */
  initialValues: {
    manualNoteDefaultWidth: number;
    manualNoteDefaultHeight: number;
    aiNoteDefaultWidth: number;
    aiNoteDefaultHeight: number;
  };
  /** 设置是否已更改 */
  hasChanges: boolean;
  /** 保存设置回调函数 */
  onSave: () => void;
  /** 重置设置回调函数 */
  onReset: () => void;
}

/**
 * 便签设置组件
 * 包含便签默认尺寸设置和内容提取优化设置
 */
const NoteSettings: React.FC<NoteSettingsProps> = ({
  form,
  onValuesChange,
  initialValues,
  hasChanges,
  onSave,
  onReset,
}) => {
  return (
    <div className="settings-modal-content">
      {/* 便签尺寸设置 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <CardSectionTitle icon={<SettingOutlined />}>
          便签默认尺寸
        </CardSectionTitle>
        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
          设置新建便签时的默认尺寸，可以根据使用习惯调整
        </Text>

        <Form
          form={form}
          layout="vertical"
          onValuesChange={onValuesChange}
          initialValues={initialValues}
        >
          {/* 手动便签尺寸设置 */}
          <div style={{ marginBottom: 20 }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              手动便签默认尺寸
            </Text>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="宽度 (px)"
                  name="manualNoteDefaultWidth"
                  style={{ marginBottom: 8 }}
                  rules={[
                    { required: true, message: "请输入宽度" },
                    {
                      type: "number",
                      min: 250,
                      max: 500,
                      message: "宽度范围：250-500px",
                    },
                  ]}
                >
                  <InputNumber
                    min={250}
                    max={500}
                    step={10}
                    style={{ width: "100%" }}
                    placeholder="330"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="高度 (px)"
                  name="manualNoteDefaultHeight"
                  style={{ marginBottom: 8 }}
                  rules={[
                    { required: true, message: "请输入高度" },
                    {
                      type: "number",
                      min: 230,
                      max: 500,
                      message: "高度范围：230-500px",
                    },
                  ]}
                >
                  <InputNumber
                    min={230}
                    max={500}
                    step={10}
                    style={{ width: "100%" }}
                    placeholder="290"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* AI便签尺寸设置 */}
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              AI便签默认尺寸
            </Text>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="宽度 (px)"
                  name="aiNoteDefaultWidth"
                  style={{ marginBottom: 8 }}
                  rules={[
                    { required: true, message: "请输入宽度" },
                    {
                      type: "number",
                      min: 250,
                      max: 500,
                      message: "宽度范围：250-500px",
                    },
                  ]}
                >
                  <InputNumber
                    min={250}
                    max={500}
                    step={10}
                    style={{ width: "100%" }}
                    placeholder="380"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="高度 (px)"
                  name="aiNoteDefaultHeight"
                  style={{ marginBottom: 8 }}
                  rules={[
                    { required: true, message: "请输入高度" },
                    {
                      type: "number",
                      min: 230,
                      max: 500,
                      message: "高度范围：230-500px",
                    },
                  ]}
                >
                  <InputNumber
                    min={230}
                    max={500}
                    step={10}
                    style={{ width: "100%" }}
                    placeholder="330"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Form>

        <Text type="secondary" style={{ fontSize: "12px" }}>
          <BulbOutlined style={{ marginRight: 4 }} />
          设置新建便签时的默认尺寸，可以根据使用习惯调整
        </Text>

        {/* 设置变更状态提示 */}
        {hasChanges && (
          <div
            style={{
              marginTop: 12,
              padding: 8,
              backgroundColor: "#fff7e6",
              border: "1px solid #ffd591",
              borderRadius: 4,
            }}
          >
            <Text style={{ fontSize: "12px", color: "#d46b08" }}>
              <ExclamationCircleOutlined style={{ marginRight: 4 }} />
              设置已修改，请点击"保存设置"按钮保存更改
            </Text>
          </div>
        )}

        {/* 便签设置操作按钮 */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          <Button onClick={onReset} size="small">
            重置默认值
          </Button>
          <Button
            type="primary"
            onClick={onSave}
            disabled={!hasChanges}
            size="small"
          >
            保存设置
          </Button>
        </div>
      </Card>

      {/* 智能内容提取设置 */}
      <ContentExtractionSettings />

      {/* 便签行为设置 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <CardSectionTitle icon={<FileTextOutlined />}>
          便签行为设置
        </CardSectionTitle>
        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
          配置便签的交互行为和显示方式
        </Text>

        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: "14px" }}>
            💡 更多便签行为设置功能正在开发中，敬请期待...
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default NoteSettings;
