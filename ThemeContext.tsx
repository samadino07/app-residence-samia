
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  themeClasses: {
    bgMain: string;
    bgSidebar: string;
    bgCard: string;
    bgInput: string;
    bgHover: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    borderColor: string;
    iconBg: string;
  }
}

const DARK_CLASSES = {
  bgMain: 'bg-[#070101]',
  bgSidebar: 'bg-[#0a0202]',
  bgCard: 'bg-[#120303]/60 backdrop-blur-md',
  bgInput: 'bg-white/5',
  bgHover: 'hover:bg-white/10',
  textPrimary: 'text-white',
  textSecondary: 'text-slate-300',
  textMuted: 'text-slate-500',
  borderColor: 'border-white/5',
  iconBg: 'bg-[#0a0202]'
};

const LIGHT_CLASSES = {
  bgMain: 'bg-slate-50',
  bgSidebar: 'bg-white',
  bgCard: 'bg-white shadow-sm border border-slate-100',
  bgInput: 'bg-slate-100',
  bgHover: 'hover:bg-slate-50',
  textPrimary: 'text-slate-900',
  textSecondary: 'text-slate-600',
  textMuted: 'text-slate-400',
  borderColor: 'border-slate-200',
  iconBg: 'bg-slate-100'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('samia_theme');
    return saved !== 'light'; // Default to dark
  });

  const toggleTheme = () => {
    setIsDark(prev => {
      const newVal = !prev;
      localStorage.setItem('samia_theme', newVal ? 'dark' : 'light');
      return newVal;
    });
  };

  const themeClasses = isDark ? DARK_CLASSES : LIGHT_CLASSES;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, themeClasses }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
