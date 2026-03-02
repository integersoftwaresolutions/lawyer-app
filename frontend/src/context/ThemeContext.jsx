import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: {
      background: isDarkMode ? '#000000' : '#FFFFFF',
      surface: isDarkMode ? '#1A1A1A' : '#F8F9FA',
      card: isDarkMode ? '#2A2A2A' : '#FFFFFF',
      border: isDarkMode ? '#333333' : '#E5E7EB',
      text: {
        primary: isDarkMode ? '#FFFFFF' : '#000000',
        secondary: isDarkMode ? '#9CA3AF' : '#6B7280',
        muted: isDarkMode ? '#6B7280' : '#9CA3AF'
      },
      accent: isDarkMode ? '#FFFFFF' : '#000000',
      input: {
        background: isDarkMode ? '#1A1A1A' : '#FFFFFF',
        border: isDarkMode ? '#333333' : '#D1D5DB',
        text: isDarkMode ? '#FFFFFF' : '#000000',
        placeholder: isDarkMode ? '#6B7280' : '#9CA3AF'
      },
      button: {
        primary: isDarkMode ? '#FFFFFF' : '#000000',
        primaryText: isDarkMode ? '#000000' : '#FFFFFF',
        secondary: isDarkMode ? 'transparent' : 'transparent',
        secondaryText: isDarkMode ? '#FFFFFF' : '#000000'
      }
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      <div style={{ 
        backgroundColor: theme.colors.background,
        color: theme.colors.text.primary,
        minHeight: '100vh',
        transition: 'all 0.3s ease'
      }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
