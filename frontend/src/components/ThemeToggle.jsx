import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: '1px solid',
        borderColor: isDarkMode ? '#333333' : '#E5E7EB',
        backgroundColor: isDarkMode ? '#1A1A1A' : '#F8F9FA',
        color: isDarkMode ? '#FFFFFF' : '#000000',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        transition: 'all 0.3s ease',
        flex: '0 0 auto'
      }}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Light mode' : 'Dark mode'}
    >
      {isDarkMode ? '☀️' : '🌙'}
    </button>
  );
}
