import React, { useState, useEffect } from 'react';
import { Avatar } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { EMPLOYEE_IMAGE_URL } from '../../constants/endpoints';
import Logo_White from '../../../assets/images/logo_icon_white.png';
import { useUserContext } from './context/userContext.tsx';
import { useTheme } from '../../context/themeContext.js';
import type { CurrentUser } from './Interfaces/interface.ts';
import { PERMISSIONS, getUserDisplayRole } from '../../utils/permissions.ts';

// Use Ant Design icons instead of MUI icons
import {
  HomeFilled as HomeIcon,
  MessageFilled as MessageIcon,
  BookFilled as MenuBookIcon,
  AppstoreFilled as DashboardIcon,
  BarChartOutlined as AssessmentIcon,
  ProfileFilled as AssignmentIcon,
  SettingFilled as SettingsIcon,
  BankFilled as SchoolIcon,
} from '@ant-design/icons';

// Types
interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  permissions?: string[]; // Required permissions to show this item
  roles?: string[]; // Required roles to show this item
}

interface SidebarProps {
  className?: string;
}

// Constants
const MOBILE_BREAKPOINT = 768; // Match header breakpoint
const TABLET_BREAKPOINT = 1024; // Standard tablet breakpoint

// Menu items configuration
const menuItems: MenuItem[] = [
  { 
    key: '/', 
    icon: <HomeIcon />, 
    label: 'หน้าหลัก',
    permissions: [] // No permissions required - visible to all
  },
  { 
    key: '/news', 
    icon: <MessageIcon />, 
    label: 'ข่าวสาร',
    permissions: [] 
  },
  { 
    key: '/course', 
    icon: <MenuBookIcon />, 
    label: 'หลักสูตร',
    permissions: [] 
  },
  { 
    key: '/course/dashboard', 
    icon: <DashboardIcon />, 
    label: 'คอร์สของฉัน',
    permissions: [] 
  },
  {
    key: '/course/manage',
    icon: <SchoolIcon />,
    label: 'จัดการหลักสูตร',
  },
  { 
    key: '/course/report', 
    icon: <AssessmentIcon />, 
    label: 'รายงาน',
    permissions: [],
    roles: [] //'admin', 'instructor'
  },
  { 
    key: '/forms', 
    icon: <AssignmentIcon />, 
    label: 'แบบฟอร์ม',
    permissions: []
  },
  {
    key: '/settings',
    icon: <SettingsIcon />,
    label: 'ตั้งค่า',
    permissions: [],
    roles: []
  }
];

// Custom hooks
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= MOBILE_BREAKPOINT);
  const [isTablet, setIsTablet] = useState<boolean>(
    window.innerWidth > MOBILE_BREAKPOINT && window.innerWidth <= TABLET_BREAKPOINT
  );

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= MOBILE_BREAKPOINT);
      setIsTablet(width > MOBILE_BREAKPOINT && width <= TABLET_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile, isTablet };
};

const usePermissions = (userData: CurrentUser | null) => {
  const checkPermission = (permissions?: string[], roles?: string[]): boolean => {
    if (!userData) return false;
    
    // If no permissions or roles required, show to all authenticated users
    if ((!permissions || permissions.length === 0) && (!roles || roles.length === 0)) {
      return true;
    }
    
    // Check permissions
    if (permissions && permissions.length > 0) {
      const hasPermission = permissions.some(permission => 
        userData.permissions.includes(permission)
      );
      if (!hasPermission) return false;
    }
    
    // Check roles (you might need to add role field to CurrentUser interface)
    if (roles && roles.length > 0) {
      // For now, assume admin role based on permissions or other criteria
      // You can modify this logic based on your actual role implementation
      const userRoles = getUserRoles(userData);
      const hasRole = roles.some(role => userRoles.includes(role));
      if (!hasRole) return false;
    }
    
    return true;
  };

  const getUserRoles = (userData: CurrentUser): string[] => {
    // Mock role assignment based on permissions or other criteria
    // Modify this logic based on your actual role system
    const roles: string[] = ['student']; // Default role
    
    if (userData.permissions.includes('course.manage') || 
        userData.permissions.includes('admin.access')) {
      roles.push('admin');
    }
    
    if (userData.permissions.includes('course.teach') || 
        userData.permissions.includes('course.manage')) {
      roles.push('instructor');
    }
    
    return roles;
  };

  const getVisibleMenuItems = (): MenuItem[] => {
    return menuItems.filter(item => checkPermission(item.permissions, item.roles));
  };

  return { checkPermission, getVisibleMenuItems, getUserRoles };
};

// Sub-components
const SidebarLogo: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const { isDark } = useTheme();
  
  return (
    <div className={`flex items-center p-3 ${collapsed ? 'justify-center' : 'space-x-3'}`}>
      <Avatar 
        size={collapsed ? 32 : 40} 
        src={Logo_White} 
        className="flex-shrink-0 shadow-lg ring-2 ring-white/30" 
      />
      {!collapsed && (
        <div className="flex-1 min-w-0 ml-3">
          <span className="text-white font-bold text-base font-kanit whitespace-nowrap block">
            Elearning
          </span>
          <span className="text-white/80 text-xs font-kanit block">
            
          </span>
        </div>
      )}
    </div>
  );
};

const SidebarToggle: React.FC<{ 
  collapsed: boolean; 
  onToggle: () => void; 
}> = ({ collapsed, onToggle }) => {

  return (
    <div className="flex justify-center px-2 pb-2 space-x-1">
      {/* Sidebar Toggle */}
      <button
        onClick={onToggle}
        className={`
          p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 group
          text-white hover:bg-white/20
          dark:text-white dark:hover:bg-white/10
        `}
        aria-label="Toggle sidebar"
      >
        <span className="text-base transition-transform duration-200 group-hover:rotate-12">
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </span>
      </button>
    </div>
  );
};

const SidebarMenuItem: React.FC<{
  item: MenuItem;
  isActive: boolean;
  collapsed?: boolean;
  onClick?: () => void;
  onNavigate?: () => void;
}> = ({ item, isActive, collapsed = false, onClick, onNavigate }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { isDark } = useTheme();

  const handleClick = () => {
    if (onClick) onClick();
    if (onNavigate) onNavigate();
  };

  return (
    <div className="relative">
      <Link
        to={item.key}
        onClick={handleClick}
        onMouseEnter={() => collapsed && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          flex items-center space-x-2 px-3 py-2.5 mx-2 my-1 rounded-xl transition-all duration-200 group
          ${isActive 
            ? `bg-white/30 text-white shadow-lg ring-1 ring-white/40 backdrop-blur-sm font-semibold
               dark:bg-blue-500/30 dark:ring-blue-400/40` 
            : `text-white/90 hover:bg-white/20 hover:text-white hover:shadow-md hover:ring-1 hover:ring-white/30
               dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white dark:hover:ring-white/20`
          }
          ${collapsed ? 'justify-center px-2 mx-1' : ''}
        `}
        title={collapsed ? item.label : undefined}
      >
        <span className={`text-lg flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
          {item.icon}
        </span>
        {!collapsed && (
          <span className="ml-2 text-white/90 font-medium font-kanit text-sm whitespace-nowrap transition-all duration-200 dark:text-white/80">
            {item.label}
          </span>
        )}
      </Link>

      {/* Tooltip for collapsed state */}
      {collapsed && showTooltip && (
        <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 z-50 pointer-events-none">
          <div className={`
            px-3 py-2 rounded-lg shadow-lg text-sm font-kanit whitespace-nowrap border backdrop-blur-sm
            bg-gray-900 text-white border-gray-700
            dark:bg-gray-800 dark:text-white dark:border-gray-600
          `}>
            {item.label}
          </div>
        </div>
      )}
    </div>
  );
};

const SidebarUserInfo: React.FC<{
  userData: CurrentUser;
  collapsed?: boolean;
}> = ({ userData, collapsed = false }) => {
  const { isDark } = useTheme();
  
  return (
    <div className={`p-3 mt-auto ${collapsed ? 'text-center' : ''}`}>
      <div className={`
        flex gap-5 items-center rounded-xl p-2 transition-colors duration-200
        ${collapsed ? 'justify-center' : 'space-x-2 bg-white/10 backdrop-blur-sm dark:bg-white/5'}
      `}>
        {!collapsed && (
          <>
            <Avatar
              size={collapsed ? 32 : 36}
              src={userData.EmployeeCode ? `${EMPLOYEE_IMAGE_URL}?empcode=${userData.EmployeeCode}` : undefined}
              icon={<UserOutlined />}
              className="flex-shrink-0 ring-2 ring-white/30 shadow-lg dark:ring-white/20"
            />
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-xs font-kanit truncate dark:text-white/90">
                {userData.EmployeeData?.TH_Name || userData.name}
              </div>
              <div className="text-white/80 text-xs truncate flex items-center space-x-1 dark:text-white/70">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse dark:bg-green-300"></span>
                <span className="text-xs">{getUserDisplayRole(userData.permissions)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const MobileDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  userData: CurrentUser;
  visibleItems: MenuItem[];
  currentPath: string;
}> = ({ isOpen, onClose, userData, visibleItems, currentPath }) => {
  const { isDark } = useTheme();
  
  if (!isOpen) return null;

  // Dynamic styles based on theme
  const getDrawerStyles = () => {
    if (isDark) {
      return {
        background: 'linear-gradient(135deg, rgba(63, 63, 70, 0.9) 0%, rgba(82, 82, 91, 0.75) 50%, rgba(113, 113, 122, 0.6) 100%)', // Brighter zinc glass gradient
        backdropFilter: 'blur(32px) saturate(200%)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 10px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
        border: '1px solid rgba(161, 161, 170, 0.4)', // zinc-400 border for glass effect
      };
    }
    return {
      background: 'linear-gradient(135deg, rgba(2,60,167,0.9) 0%, rgba(30,77,183,0.8) 50%, rgba(59,130,246,0.7) 100%)',
      backdropFilter: 'blur(32px) saturate(200%)',
      WebkitBackdropFilter: 'blur(32px) saturate(200%)',
      boxShadow: '0 25px 80px rgba(2,60,167,0.5), 0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
      border: '1px solid rgba(255,255,255,0.25)',
    };
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 dark:bg-black/70" 
        onClick={onClose}
      />
      
      {/* Drawer - full width on mobile */}
      <aside 
        className="fixed left-0 top-0 h-full w-full shadow-2xl transform transition-transform duration-300 ease-out backdrop-blur-xl"
        style={getDrawerStyles()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`
            flex items-center justify-between p-4 border-b backdrop-blur-sm
            border-white/15 bg-white/10
            dark:border-white/10 dark:bg-white/5
          `}>
            <SidebarLogo />
            <button
              onClick={onClose}
              className={`
                p-2 rounded-xl transition-all duration-200 hover:rotate-90 active:scale-90
                text-white hover:bg-white/10
                dark:text-white dark:hover:bg-white/5
              `}
              aria-label="Close sidebar"
            >
              <span className="text-lg">✕</span>
            </button>
          </div>

          {/* Menu */}
          <nav className="flex-1 py-4">
            {visibleItems.map((item) => (
              <SidebarMenuItem
                key={item.key}
                item={item}
                isActive={currentPath === item.key}
                onClick={onClose}
              />
            ))}
          </nav>

          {/* User Info */}
          <SidebarUserInfo userData={userData} />
        </div>
      </aside>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const userData = useUserContext();
  const location = useLocation();
  const { isMobile, isTablet } = useResponsive();
  const { getVisibleMenuItems } = usePermissions(userData);
  const { isDark } = useTheme();

  // State management
  const [collapsed, setCollapsed] = useState<boolean>(true); // Collapsed by default on tablet
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  // Get visible menu items based on permissions
  const visibleMenuItems = getVisibleMenuItems();

  // Dynamic styles based on theme
  const getSidebarStyles = () => {
    if (isDark) {
      return {
        background: 'linear-gradient(135deg, rgba(63, 63, 70, 0.85) 0%, rgba(82, 82, 91, 0.7) 50%, rgba(113, 113, 122, 0.55) 100%)', // Brighter zinc glass gradient
        backdropFilter: 'blur(32px) saturate(200%)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 8px 25px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
        border: '1px solid rgba(161, 161, 170, 0.4)', // zinc-400 border for glass effect
      };
    }
    return {
      background: 'linear-gradient(180deg, rgba(2,60,167,0.95) 0%, rgba(30,77,183,0.95) 100%)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      boxShadow: '0 12px 40px rgba(2,60,167,0.25), 0 6px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25)',
      border: '1px solid rgba(255,255,255,0.15)',
    };
  };

  // Update CSS custom property for sidebar width
  useEffect(() => {
    const updateSidebarWidth = () => {
      let sidebarWidth: string;
      
      if (isMobile) {
        sidebarWidth = '0px';
      } else {
        // Account for floating sidebar with margins (left margin + width + gap)
        sidebarWidth = collapsed ? '80px' : '240px'; // 16px margin + 64px/224px width + 16px gap
      }
      
      document.documentElement.style.setProperty('--sidebar-width', sidebarWidth);
    };

    updateSidebarWidth();
  }, [collapsed, isMobile]);

  // Handlers
  const handleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileDrawer = () => setMobileDrawerOpen(!mobileDrawerOpen);
  
  // Auto-collapse after menu selection (desktop/tablet only)
  const handleMenuItemClick = () => {
    if (!isMobile && !collapsed) {
      // Add a small delay for better UX
      setTimeout(() => setCollapsed(true), 100);
    }
  };

  // Expose mobile drawer toggle function globally for header
  useEffect(() => {
    (window as any).toggleMobileDrawer = toggleMobileDrawer;
    return () => {
      delete (window as any).toggleMobileDrawer;
    };
  }, []);

  // Early return if no user data
  if (!userData) {
    return null;
  }

  // Mobile view - render drawer
  if (isMobile) {
    return (
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={toggleMobileDrawer}
        userData={userData}
        visibleItems={visibleMenuItems}
        currentPath={location.pathname}
      />
    );
  }

  // Desktop/Tablet view - render sidebar
  return (
    <aside 
      className={`fixed left-4 bottom-4 backdrop-blur-xl shadow-2xl z-40 rounded-2xl transition-all ease-in-out ${collapsed ? 'w-16' : 'w-56'} ${isDark ? 'border border-gray-700/50 dark:border-gray-600/30' : 'border border-blue-300/30'} ${className}`}
      style={{ 
        top: '96px',
       transitionDuration: '1500ms',
       width: collapsed ? '4rem' : '14rem',
        ...getSidebarStyles()
      }}
    >
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <div className="mt-4 px-2 flex items-right justify-end">
            <SidebarToggle collapsed={collapsed} onToggle={handleCollapse} />
        </div>
        {/* Menu */}
        <nav className="flex-1">
          {visibleMenuItems.map((item) => (
            <SidebarMenuItem
              key={item.key}
              item={item}
              isActive={location.pathname === item.key}
              collapsed={collapsed}
              onNavigate={handleMenuItemClick}
            />
          ))}
        </nav>
        {/* User Info */}
        <SidebarUserInfo userData={userData} collapsed={collapsed} />
      </div>
    </aside>
  );
};

export default React.memo(Sidebar);
