import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, Input, Button, Badge, Dropdown } from 'antd';
import { 
  MenuOutlined, 
  SearchOutlined, 
  UserOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { EMPLOYEE_IMAGE_URL } from '../../constants/endpoints';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Logo_White from '../../../assets/images/logo_icon.png';
import { useUserContext } from './context/userContext.tsx';
import type { CurrentUser } from './Interfaces/interface.ts';
import ThemeToggle from '../Component/ThemeToggle.tsx';
import { useTheme } from '../../context/themeContext.js';

const { Search } = Input;

// Constants
const MOBILE_BREAKPOINT = 768;
const NOTIFICATION_COUNT = 5;

// Custom hooks
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

// Component parts
const MobileMenuButton: React.FC<{ onClick: () => void; isDark: boolean }> = ({ onClick, isDark }) => (
  <Button
    type="text"
    icon={<MenuOutlined className="text-xl" />}
    onClick={onClick}
    className={`mobile-menu-btn flex items-center justify-center w-12 h-12 rounded-lg transition-colors ${
      isDark 
        ? 'hover:bg-zinc-700 text-zinc-100' 
        : 'hover:bg-gray-100 text-gray-700'
    }`}
    aria-label="Toggle mobile menu"
  />
);

const Logo: React.FC = () => (
  <div className="flex items-center space-x-3">
    <Avatar
      size={48}
      src={Logo_White}
      className="border-2 border-blue-100"
      shape="circle"
      alt="Company Logo"
    />
  </div>
);

const SearchBar: React.FC<{ 
  onSearch: (value: string) => void;
  className?: string;
  isDark?: boolean;
}> = ({ onSearch, className = "", isDark = false }) => (
  <Search
    placeholder="ค้นหาหลักสูตร"
    allowClear
    onSearch={onSearch}
    className={`theme-search-input ${className}`}
    size="large"
    prefix={<SearchOutlined className={`transition-colors ${
      isDark ? 'text-zinc-500' : 'text-gray-400'
    }`} />}
    aria-label="Search courses"
    style={{
      backgroundColor: 'var(--search-bg)',
      borderColor: 'var(--search-border)',
      borderRadius: '12px 0 0 12px', // Only round left side
    }}
  />
);

const IconWrapper: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className={`icon-wrapper flex items-center gap-3 rounded-3xl px-3 py-1.5 mr-4 shadow-sm hover:shadow-lg transition-all duration-200 border ${
    isDark 
      ? 'bg-zinc-700 border-zinc-600 hover:bg-zinc-600' 
      : 'bg-slate-50 border-slate-200/50 hover:bg-blue-50'
  }`}>
    <AssignmentIcon 
      className={`cursor-pointer transition-all duration-200 hover:scale-110 hover:-rotate-2 ${
        isDark 
          ? 'text-zinc-300 hover:text-zinc-100' 
          : 'text-gray-700 hover:text-gray-800'
      }`}
      sx={{ fontSize: '1.7rem' }}
    />
    <Badge count={NOTIFICATION_COUNT} size="small">
      <NotificationsIcon 
        className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
          isDark 
            ? 'text-zinc-400 hover:text-zinc-200' 
            : 'text-gray-600 hover:text-gray-700'
        }`}
        sx={{ fontSize: '1.7rem' }}
      />
    </Badge>
  </div>
);

const UserProfile: React.FC<{
  userData: CurrentUser;
  isMobile: boolean;
  isDark: boolean;
  onMenuClick: MenuProps['onClick'];
}> = ({ userData, isMobile, isDark, onMenuClick }) => {
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  return (
    <Dropdown
      menu={{
        items: userMenuItems,
        onClick: onMenuClick,
      }}
      trigger={['click']}
      placement="bottomRight"
    >
      <div className={`user-profile-hover flex items-center gap-3 space-x-2 cursor-pointer px-2 py-1 rounded-lg transition-colors ${
        isDark ? 'hover:bg-zinc-700' : 'hover:bg-gray-50'
      }`}>
        
        {/* User Info - Hidden on mobile */}
        {!isMobile && (
          <div className="text-right">
            <div className={`user-name text-sm font-medium font-kanit ${
              isDark ? 'text-zinc-100' : 'text-gray-900'
            }`}>
              {userData.EmployeeData?.TH_Name || userData.name}
            </div>
            <div className={`user-role text-xs ${
              isDark ? 'text-zinc-400' : 'text-gray-500'
            }`}>
              Admin
            </div>
          </div>
        )}

        {/* User Avatar */}
        <Avatar
          size={42}
          src={userData.EmployeeCode ? `${EMPLOYEE_IMAGE_URL}?empcode=${userData.EmployeeCode}` : undefined}
          icon={<UserOutlined />}
          className={`border-2 transition-colors ${
            isDark 
              ? 'border-zinc-600 hover:border-zinc-500' 
              : 'border-blue-100 hover:border-blue-200'
          }`}
          shape="circle"
          alt={`${userData.EmployeeData?.TH_Name || userData.name}'s profile`}
        />
      </div>
    </Dropdown>
  );
};

const Header: React.FC = () => {
  const userData = useUserContext();
  const { isDark } = useTheme();
  const isMobile = useResponsive();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Handlers
  const handleSearch = useCallback((value: string) => {
    setShowMobileSearch(false); // Hide search after searching
    // TODO: Implement search functionality
  }, []);

  const handleMobileMenuToggle = useCallback(() => {
    if ((window as any).toggleMobileDrawer) {
      (window as any).toggleMobileDrawer();
    }
  }, []);

  const handleUserMenuClick: MenuProps['onClick'] = useCallback((e: { key: string }) => {
    // TODO: Implement menu actions
    switch (e.key) {
      case 'profile':
        // Navigate to profile
        break;
      case 'settings':
        // Navigate to settings
        break;
      case 'logout':
        // Handle logout
        break;
      default:
        break;
    }
  }, []);

  // Hide search bar when clicking outside (mobile only)
  useEffect(() => {
    if (!isMobile || !showMobileSearch) return;
    const handleClick = (e: MouseEvent) => {
      const searchBar = document.getElementById('mobile-search-bar');
      if (searchBar && !searchBar.contains(e.target as Node)) {
        setShowMobileSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMobile, showMobileSearch]);

  // Early return if no user data
  if (!userData) {
    return null;
  }

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isDark 
          ? 'bg-zinc-700 shadow-zinc-900/20' 
          : 'bg-white shadow-gray-200'
      } shadow-lg`}
      style={{
        backgroundColor: 'var(--bg-container)',
        boxShadow: '0 2px 8px var(--shadow-color)'
      }}
    >
      <div className="w-full px-6">
        <div className="flex items-center justify-between h-20">
          {/* Left Section */}
          <div className="flex items-center space-x-6">
            {/* Mobile Menu Button */}
            {isMobile && (
              <MobileMenuButton onClick={handleMobileMenuToggle} isDark={isDark} />
            )}

            {/* Logo */}
            <Logo />

            {/* Search Bar - Hidden on mobile */}
            {!isMobile && (
              <div className="ml-6">
                <SearchBar 
                  onSearch={handleSearch}
                  className="w-72"
                  isDark={isDark}
                />
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Search Button for Mobile */}
            {isMobile && !showMobileSearch && (
              <Button
                type="text"
                icon={<SearchOutlined className="text-xl" />}
                className={`search-mobile-btn flex items-center justify-center w-12 h-12 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-zinc-700 text-zinc-100' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                aria-label="Open search"
                onClick={() => setShowMobileSearch(true)}
              />
            )}

            {/* Icons */}
            <IconWrapper isDark={isDark} />

            {/* Darkmode toggles */}
            <ThemeToggle 
              type="icon"
              size="middle"/>

            {/* User Profile */}
            <UserProfile 
              userData={userData}
              isMobile={isMobile}
              isDark={isDark}
              onMenuClick={handleUserMenuClick}
            />
          </div>
        </div>

        {/* Mobile Search Bar (toggle) */}
        {isMobile && showMobileSearch && (
          <div className="pb-3 pt-1" id="mobile-search-bar">
            <SearchBar onSearch={handleSearch} isDark={isDark} />
            <Button
              type="text"
              className={`mt-2 w-full flex items-center justify-center rounded-lg transition-colors ${
                isDark ? 'hover:bg-zinc-700 text-zinc-100' : 'hover:bg-gray-100 text-gray-700'
              }`}
              onClick={() => setShowMobileSearch(false)}
              aria-label="Close search"
            >ปิด</Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
