import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { saveToStorage, getFromStorage, STORAGE_KEYS } from '../utils/storageService';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const lightTheme = {
  colors: {
    background: '#eef0f4',
    card: '#f7f8fa',
    primary: '#6c63ff',
    secondary: '#7c69ef',
    text: '#212529',
    textSecondary: '#495057',
    border: '#d5d9e0',
    accent: '#4dd4cc',
    accentGradient: 'linear-gradient(135deg, #6c63ff 0%, #4dd4cc 100%)',
    timerBackground: '#f7f8fa',
    timerBorder: '#6c63ff',
    buttonPrimary: '#6c63ff',
    buttonSecondary: '#4dd4cc',
    buttonText: '#ffffff',
    lockIconActive: '#6c63ff',
    lockIconInactive: '#9ca3ab',
    inputBackground: '#f7f8fa',
    success: '#4BB543',
    warning: '#ffab00',
    error: '#ff5252',
  },
  shadows: {
    small: '0 2px 5px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 12px rgba(0, 0, 0, 0.1)',
    large: '0 8px 20px rgba(0, 0, 0, 0.12)',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '16px',
    round: '50%',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    xxl: '1.5rem',
    xxxl: '2rem',
    timer: '2.5rem',
  },
  transitions: {
    fast: '0.15s ease',
    normal: '0.25s ease',
    slow: '0.4s ease',
  },
  spacing: {
    xs: '0.2rem',
    sm: '0.45rem',
    md: '0.9rem',
    lg: '1.35rem',
    xl: '1.8rem',
    xxl: '2.7rem',
  },
};

export const darkTheme = {
  colors: {
    background: '#121212',
    card: '#1e1e1e',
    primary: '#6c63ff',
    secondary: '#7c69ef',
    text: '#f8f9fa',
    textSecondary: '#dee2e6',
    border: '#343a40',
    accent: '#5ee7df',
    accentGradient: 'linear-gradient(135deg, #6c63ff 0%, #5ee7df 100%)',
    timerBackground: '#1e1e1e',
    timerBorder: '#6c63ff',
    buttonPrimary: '#6c63ff',
    buttonSecondary: '#5ee7df',
    buttonText: '#ffffff',
    lockIconActive: '#6c63ff',
    lockIconInactive: '#6c757d',
    inputBackground: '#2a2a2a',
    success: '#4BB543',
    warning: '#ffab00',
    error: '#ff5252',
  },
  shadows: {
    small: '0 2px 5px rgba(0, 0, 0, 0.2)',
    medium: '0 4px 12px rgba(0, 0, 0, 0.25)',
    large: '0 8px 20px rgba(0, 0, 0, 0.3)',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '16px',
    round: '50%',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    xxl: '1.5rem',
    xxxl: '2rem',
    timer: '2.5rem',
  },
  transitions: {
    fast: '0.15s ease',
    normal: '0.25s ease',
    slow: '0.4s ease',
  },
  spacing: {
    xs: '0.2rem',
    sm: '0.45rem',
    md: '0.9rem',
    lg: '1.35rem',
    xl: '1.8rem',
    xxl: '2.7rem',
  },
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return getFromStorage(STORAGE_KEYS.THEME, 'dark') === 'dark' || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.THEME, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <StyledThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 