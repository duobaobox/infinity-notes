import React from 'react';
import { Typography } from 'antd';
import type { ReactNode } from 'react';

const { Title } = Typography;

/**
 * 卡片标题组件属性接口
 */
interface CardSectionTitleProps {
  /** 标题文本 */
  children: ReactNode;
  /** 标题图标 */
  icon?: ReactNode;
  /** 图标颜色类型 */
  iconType?: 'default' | 'success' | 'warning' | 'danger' | 'purple';
  /** 是否为紧凑模式 */
  compact?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 统一的卡片标题组件
 * 
 * 用于在所有设置页面和卡片中提供一致的标题样式
 * 支持图标、不同颜色主题和响应式设计
 * 
 * @example
 * ```tsx
 * // 基本使用
 * <CardSectionTitle icon={<SettingOutlined />}>
 *   基本设置
 * </CardSectionTitle>
 * 
 * // 带颜色的图标
 * <CardSectionTitle icon={<RobotOutlined />} iconType="success">
 *   AI设置
 * </CardSectionTitle>
 * 
 * // 紧凑模式
 * <CardSectionTitle icon={<UserOutlined />} compact>
 *   用户信息
 * </CardSectionTitle>
 * ```
 */
const CardSectionTitle: React.FC<CardSectionTitleProps> = ({
  children,
  icon,
  iconType = 'default',
  compact = false,
  className = '',
  style = {},
}) => {
  // 构建CSS类名
  const titleClassName = [
    'card-section-title',
    compact ? 'compact' : '',
    className
  ].filter(Boolean).join(' ');

  // 构建图标的CSS类名
  const iconClassName = iconType !== 'default' ? `icon-${iconType}` : '';

  return (
    <Title 
      level={5} 
      className={titleClassName}
      style={style}
    >
      {icon && (
        <span className={`anticon ${iconClassName}`}>
          {icon}
        </span>
      )}
      {children}
    </Title>
  );
};

export default CardSectionTitle;

/**
 * 导出类型定义供其他组件使用
 */
export type { CardSectionTitleProps };
