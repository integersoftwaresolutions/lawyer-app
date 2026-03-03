import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded-lg border border-border bg-surface text-text-primary cursor-pointer flex items-center justify-center transition-all duration-200 flex-none hover:bg-surface-hover hover:border-primary-border active:scale-95"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Light mode' : 'Dark mode'}
    >
      {isDarkMode ? (
        <FiSun className="w-4 h-4 text-warning" />
      ) : (
        <FiMoon className="w-4 h-4 text-info" />
      )}
    </button>
  );
}
