import React from 'react';
import { Button, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTheme } from '../../context/themeContext';

interface ThemeToggleProps {
  type?: 'button' | 'icon';
  size?: 'large' | 'middle' | 'small';
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  type = 'button', 
  size = 'middle', 
  className = '' 
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  if (type === 'icon') {
    return (
      <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
        <Button
          type="text"
          size={size}
          icon={isDark ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
          className={`theme-toggle-icon ${className}`}
          style={{
            color: 'var(--text-color)',
            fontSize: '18px',
          }}
        />
      </Tooltip>
    );
  }

  return (
    <Button
      onClick={toggleTheme}
      size={size}
      className={`theme-toggle-button ${className}`}
      style={{
        color: 'var(--text-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {isDark ? <SunOutlined /> : <MoonOutlined />}
      {isDark ? 'Light Mode' : 'Dark Mode'}
    </Button>
  );
};

export default ThemeToggle;
