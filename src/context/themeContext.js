import React, { createContext, useState, useEffect, useContext } from 'react';

export const ThemeContext = createContext();

// Ant Design theme configurations
const antdThemes = {
  light: {
    token: {
      colorPrimary: '#1890ff',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorBgLayout: '#f0f2f5',
      colorText: '#000000',
      colorTextSecondary: '#666666',
      colorBorder: '#d9d9d9',
      borderRadius: 8,
      fontFamily: 'Kanit, sans-serif',
      // Search specific tokens
      colorBgBase: '#ffffff',
      colorTextPlaceholder: '#999999',
      controlOutline: 'rgba(24, 144, 255, 0.2)',
    },
    components: {
      Input: {
        colorBgContainer: '#ffffff',
        colorText: '#000000',
        colorTextPlaceholder: '#999999',
        colorBorder: '#e5e7eb',
        borderRadius: 8,
        paddingInline: 12,
        paddingBlock: 8,
        fontSize: 14,
        activeBorderColor: '#1890ff',
        hoverBorderColor: '#40a9ff',
        activeShadow: '0 0 0 2px rgba(24, 144, 255, 0.1)',
      }
    },
    algorithm: undefined, // Default algorithm
  },
  dark: {
    token: {
      colorPrimary: '#1890ff',
      colorBgContainer: '#3f3f46', // zinc-700 - brighter container background
      colorBgElevated: '#52525b', // zinc-600 - elevated elements
      colorBgLayout: '#27272a', // zinc-800 - main layout background
      colorText: '#f4f4f5', // zinc-100 - bright text
      colorTextSecondary: '#a1a1aa', // zinc-400 - secondary text
      colorBorder: '#52525b', // zinc-600 - borders
      borderRadius: 8,
      fontFamily: 'Kanit, sans-serif',
      // Search specific tokens
      colorBgBase: '#3f3f46', // zinc-700 - search background
      colorTextPlaceholder: '#71717a', // zinc-500 - placeholder text
      controlOutline: 'rgba(24, 144, 255, 0.3)',
    },
    components: {
      Input: {
        colorBgContainer: '#3f3f46', // zinc-700
        colorText: '#f4f4f5', // zinc-100
        colorTextPlaceholder: '#71717a', // zinc-500
        colorBorder: '#52525b', // zinc-600
        borderRadius: 8,
        paddingInline: 12,
        paddingBlock: 8,
        fontSize: 14,
        activeBorderColor: '#1890ff',
        hoverBorderColor: '#40a9ff',
        activeShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)',
      }
    },
    algorithm: undefined, // You can add dark algorithm here if needed
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check for system preference if no saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    // Apply the theme class to the <html> element for Tailwind
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Store theme preference
    localStorage.setItem('theme', theme);
    
        // Set CSS custom properties for additional styling
    if (theme === 'dark') {
      root.style.setProperty('--primary-color', '#1890ff');
      root.style.setProperty('--bg-color', '#09090b'); // zinc-950
      root.style.setProperty('--bg-container', '#18181b'); // zinc-900
      root.style.setProperty('--text-color', '#ffffff');
      root.style.setProperty('--text-secondary', '#d4d4d8'); // zinc-300
      root.style.setProperty('--border-color', '#52525b'); // zinc-600
      // Search specific variables
      root.style.setProperty('--search-bg', '#3f3f46'); // zinc-700
      root.style.setProperty('--search-text', '#f4f4f5'); // zinc-100
      root.style.setProperty('--search-placeholder', '#71717a'); // zinc-500
      root.style.setProperty('--search-border', '#52525b'); // zinc-600
      root.style.setProperty('--search-border-hover', '#1890ff'); // blue
      root.style.setProperty('--search-shadow', 'rgba(24, 144, 255, 0.2)');
    } else {
      root.style.setProperty('--primary-color', '#722ed1');
      root.style.setProperty('--bg-color', '#f0f2f5');
      root.style.setProperty('--bg-container', '#ffffff');
      root.style.setProperty('--text-color', '#000000');
      root.style.setProperty('--text-secondary', '#666666');
      root.style.setProperty('--border-color', '#d9d9d9');
      // Search specific variables
      root.style.setProperty('--search-bg', '#ffffff');
      root.style.setProperty('--search-text', '#000000');
      root.style.setProperty('--search-placeholder', '#999999');
      root.style.setProperty('--search-border', '#e5e7eb');
      root.style.setProperty('--search-border-hover', '#1890ff');
      root.style.setProperty('--search-shadow', 'rgba(24, 144, 255, 0.1)');
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set a theme
      if (!localStorage.getItem('theme-manual')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    // Mark as manually set
    localStorage.setItem('theme-manual', 'true');
  };

  const setThemeMode = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme-manual', 'true');
  };

  const getAntdTheme = () => antdThemes[theme];

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      setThemeMode, 
      getAntdTheme,
      isDark: theme === 'dark',
      isLight: theme === 'light'
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
