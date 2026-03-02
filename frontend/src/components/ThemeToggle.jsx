import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full border border-border bg-surface text-text-primary cursor-pointer flex items-center justify-center text-base transition-all duration-300 flex-none hover:bg-surface-hover"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Light mode' : 'Dark mode'}
    >
      {isDarkMode ? '☀️' : '🌙'}
    </button>
  );
}
