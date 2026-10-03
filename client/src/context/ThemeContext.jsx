import { useCallback, useEffect, useState } from 'react';
import { ThemeContext } from './themeContextInstance';

const THEME_STORAGE_KEY = 'hiretrack-theme';
const getInitialTheme = () => {
  let theme = 'light';

  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') theme = savedTheme;
  } catch {
    // Keep the default theme when browser storage is unavailable.
  }

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme;
  }

  return theme;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The in-memory selection still works when browser storage is unavailable.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
