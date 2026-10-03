import { useTheme } from '../context/useTheme';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const nextMode = isDark ? 'light' : 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={`Switch to ${nextMode} mode`}
      aria-pressed={isDark}
      title={`Switch to ${nextMode} mode`}
    >
      <span className="theme-toggle-icon" aria-hidden="true">{isDark ? '☾' : '☀'}</span>
      <span>{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
};

export default ThemeToggle;
