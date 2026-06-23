import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 rounded-full border border-border bg-surface text-text-primary cursor-pointer flex items-center justify-center transition-all duration-200 flex-none active:scale-95 outline-none"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Light mode' : 'Dark mode'}
    >
      {isDarkMode ? (
        <FiSun className="w-5 h-5 text-warning" />
      ) : (
        <FiMoon className="w-5 h-5 text-info" />
      )}
    </button>
  );
}
