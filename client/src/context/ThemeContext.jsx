import { createContext, useEffect, useState } from 'react';

export const ThemeContext = createContext(null);

const STORAGE_KEY = 'devpilot-theme';

const getSystemPrefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

const resolveIsDark = (mode) => (mode === 'system' ? getSystemPrefersDark() : mode === 'dark');

const applyTheme = (mode) => {
  document.documentElement.classList.toggle('dark', resolveIsDark(mode));
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEY) || 'system');

  useEffect(() => {
    applyTheme(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  return <ThemeContext.Provider value={{ mode, setMode, isDark: resolveIsDark(mode) }}>{children}</ThemeContext.Provider>;
}
