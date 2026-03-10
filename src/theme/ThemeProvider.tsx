import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { saveToStorage, getFromStorage, STORAGE_KEYS } from '../utils/storageService';

export type ThemeName = 'light' | 'dark' | 'vintage' | 'indie' | 'disco' | 'hiphop';

export const THEME_ORDER: ThemeName[] = ['dark', 'hiphop', 'indie', 'disco', 'vintage', 'light'];

export const THEME_LABELS: Record<ThemeName, string> = {
  light: 'Light',
  dark: 'Dark',
  vintage: 'Vintage',
  indie: 'Indie',
  disco: 'Disco',
  hiphop: 'Hip Hop',
};

interface ThemeContextType {
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
  cycleTheme: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeName: 'dark',
  setThemeName: () => {},
  cycleTheme: () => {},
  isDarkMode: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

const sharedTokens = {
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

const defaultFontFamily = "'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif";

export const lightTheme = {
  fontFamily: defaultFontFamily,
  colors: {
    background: '#e8e4df',
    card: '#f5f2ed',
    primary: '#6c63ff',
    secondary: '#7c69ef',
    text: '#3b3533',
    textSecondary: '#7a7170',
    border: '#cdc7c0',
    accent: '#4dd4cc',
    accentGradient: 'linear-gradient(135deg, #6c63ff 0%, #4dd4cc 100%)',
    timerBackground: '#f5f2ed',
    timerBorder: '#6c63ff',
    buttonPrimary: '#6c63ff',
    buttonSecondary: '#4dd4cc',
    buttonText: '#ffffff',
    lockIconActive: '#6c63ff',
    lockIconInactive: '#a89e96',
    inputBackground: '#f5f2ed',
    success: '#4BB543',
    warning: '#ffab00',
    error: '#ff5252',
  },
  shadows: {
    small: '0 2px 5px rgba(0, 0, 0, 0.12)',
    medium: '0 4px 12px rgba(0, 0, 0, 0.14)',
    large: '0 8px 20px rgba(0, 0, 0, 0.16)',
  },
  ...sharedTokens,
};

export const darkTheme = {
  fontFamily: defaultFontFamily,
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
  ...sharedTokens,
};

// ──────────────────────────────────────────────────────────────
// VINTAGE — Fender Tweed amp: dark grille base, warm copper &
//           sandy tweed accents
// ──────────────────────────────────────────────────────────────
// Dark-family theme. Background is the dark speaker grille;
// cards are slightly lifted. Warm tweed/copper tones for text
// and accents — like looking at the amp face-on.
//
// Key contrast pairs:
//   text #d4b888 on card #382e22          — warm sand on grille ✓
//   text #d4b888 on background #2a2218    — warm sand on dark ✓
//   textSecondary #a08860 on card #382e22 — muted tan, legible ✓
//   buttonText #1e1008 on primary #c47840 — dark on copper ✓
//   primary #c47840 on card #382e22       — copper pops on dark ✓
export const vintageTheme = {
  fontFamily: "'Righteous', 'Trebuchet MS', sans-serif",
  colors: {
    background: '#2a2218',       // dark speaker grille
    card: '#382e22',             // slightly lifted grille panel
    primary: '#c47840',          // warm copper-orange — tweed accent
    secondary: '#b89850',        // golden tweed
    text: '#d4b888',             // sandy tweed — warm readable text
    textSecondary: '#a08860',    // muted warm tan
    border: '#504030',           // dark brown edge
    accent: '#b89850',           // golden tweed
    accentGradient: 'linear-gradient(135deg, #c47840 0%, #b89850 100%)',
    timerBackground: '#382e22',  // match card
    timerBorder: '#c47840',
    buttonPrimary: '#c47840',
    buttonSecondary: '#b89850',
    buttonText: '#1e1008',       // dark brown on copper/gold buttons
    lockIconActive: '#c47840',
    lockIconInactive: '#6b5838',
    inputBackground: '#302820',  // between bg and card
    success: '#7ab840',
    warning: '#c89018',
    error: '#c04830',
  },
  shadows: {
    small: '0 2px 5px rgba(0, 0, 0, 0.25)',
    medium: '0 4px 12px rgba(0, 0, 0, 0.35)',
    large: '0 8px 20px rgba(0, 0, 0, 0.45)',
  },
  backgroundPattern: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cline x1='0' y1='0' x2='60' y2='60' stroke='%23b89850' stroke-width='0.6' opacity='0.08'/%3E%3Cline x1='60' y1='0' x2='0' y2='60' stroke='%23c47840' stroke-width='0.6' opacity='0.08'/%3E%3Cline x1='30' y1='0' x2='90' y2='60' stroke='%23b89850' stroke-width='0.6' opacity='0.08'/%3E%3Cline x1='-30' y1='0' x2='30' y2='60' stroke='%23b89850' stroke-width='0.6' opacity='0.08'/%3E%3Cline x1='90' y1='0' x2='30' y2='60' stroke='%23c47840' stroke-width='0.6' opacity='0.08'/%3E%3Cline x1='-30' y1='60' x2='30' y2='0' stroke='%23c47840' stroke-width='0.6' opacity='0.08'/%3E%3C/svg%3E")`,
  ...sharedTokens,
};

// ──────────────────────────────────────────────────────────────
// INDIE — TASCAM 424 MkII steel-blue, gold knobs, teal meters
// ──────────────────────────────────────────────────────────────
// Dark-family theme. Background is deep navy-steel; cards are
// a brighter steel-blue so they feel like raised equipment panels.
//
// Key contrast pairs:
//   text #e8ecf0 on card #3d6380          — light on dark blue ✓
//   text #e8ecf0 on background #2e4558    — light on deep navy ✓
//   textSecondary #98b0c4 on card #3d6380 — soft steel, legible ✓
//   buttonText #1a2830 on primary #e8a832 — dark navy on gold ✓
//   primary #e8a832 on card #3d6380       — gold pops on blue ✓
export const indieTheme = {
  fontFamily: "'Silkscreen', 'Press Start 2P', monospace",
  colors: {
    background: '#2e4558',       // deep navy-steel
    card: '#3d6380',             // brighter steel blue — clear lift from bg
    primary: '#e8a832',          // warm gold (TASCAM knob accent)
    secondary: '#4db8a0',        // teal (VU meter green)
    text: '#e8ecf0',             // near-white cool grey
    textSecondary: '#98b0c4',    // light steel grey — legible on both surfaces
    border: '#4a6878',           // mid steel — visible divider
    accent: '#4db8a0',           // teal
    accentGradient: 'linear-gradient(135deg, #e8a832 0%, #4db8a0 100%)',
    timerBackground: '#3d6380',  // match card
    timerBorder: '#e8a832',
    buttonPrimary: '#e8a832',
    buttonSecondary: '#4db8a0',
    buttonText: '#1a2830',       // dark navy — readable on gold & teal
    lockIconActive: '#e8a832',
    lockIconInactive: '#6a8498',
    inputBackground: '#344f65',  // between bg and card — distinct
    success: '#50c850',
    warning: '#e8a832',
    error: '#e85050',
  },
  shadows: {
    small: '0 2px 5px rgba(20, 35, 50, 0.25)',
    medium: '0 4px 12px rgba(20, 35, 50, 0.35)',
    large: '0 8px 20px rgba(20, 35, 50, 0.45)',
  },
  backgroundPattern: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='120'%3E%3Cg opacity='0.15'%3E%3Crect x='20' y='15' width='60' height='38' rx='4' fill='none' stroke='%23e8a832' stroke-width='1.2'/%3E%3Crect x='25' y='20' width='22' height='14' rx='2' fill='none' stroke='%23e8a832' stroke-width='0.8'/%3E%3Crect x='52' y='20' width='22' height='14' rx='2' fill='none' stroke='%23e8a832' stroke-width='0.8'/%3E%3Ccircle cx='36' cy='44' r='4' fill='none' stroke='%23e8a832' stroke-width='0.8'/%3E%3Ccircle cx='63' cy='44' r='4' fill='none' stroke='%23e8a832' stroke-width='0.8'/%3E%3C/g%3E%3Cg opacity='0.15' transform='translate(100,65) rotate(-8)'%3E%3Crect x='0' y='0' width='60' height='38' rx='4' fill='none' stroke='%23e8a832' stroke-width='1.2'/%3E%3Crect x='5' y='5' width='22' height='14' rx='2' fill='none' stroke='%23e8a832' stroke-width='0.8'/%3E%3Crect x='32' y='5' width='22' height='14' rx='2' fill='none' stroke='%23e8a832' stroke-width='0.8'/%3E%3Ccircle cx='16' cy='29' r='4' fill='none' stroke='%23e8a832' stroke-width='0.8'/%3E%3Ccircle cx='43' cy='29' r='4' fill='none' stroke='%23e8a832' stroke-width='0.8'/%3E%3C/g%3E%3C/svg%3E")`,
  ...sharedTokens,
  // Silkscreen is a pixel font that renders large — scale down
  fontSizes: {
    xs: '0.6rem',
    sm: '0.7rem',
    md: '0.8rem',
    lg: '0.9rem',
    xl: '1rem',
    xxl: '1.2rem',
    xxxl: '1.6rem',
    timer: '2rem',
  },
};

// ──────────────────────────────────────────────────────────────
// DISCO — Neon nightclub: dark purple void, hot pink & cyan glow, Fredoka bubbly font
// ──────────────────────────────────────────────────────────────
// Dark-family theme. Near-black purple background with rich
// purple card surfaces. Neon pink & cyan accents create the
// classic disco/nightclub atmosphere with high-energy contrast.
//
// Key contrast pairs:
//   text #ffffff on card #2a1238          — max contrast ✓
//   text #ffffff on background #150818    — max contrast ✓
//   textSecondary #c090d8 on card #2a1238 — lavender on purple ✓
//   buttonText #fff on primary #ff2d9b   — white on neon pink ✓
//   primary #ff2d9b on card #2a1238      — neon on dark ✓
export const discoTheme = {
  fontFamily: "'Fredoka', 'Baloo 2', 'Trebuchet MS', sans-serif",
  colors: {
    background: '#150818',       // near-black purple void
    card: '#2a1238',             // dark purple — clear lift from bg
    primary: '#ff2d9b',          // hot neon pink
    secondary: '#00e8c6',        // electric neon teal
    text: '#ffffff',             // pure white
    textSecondary: '#c090d8',    // light lavender — legible on dark purple
    border: '#4a2060',           // medium purple — visible without harshness
    accent: '#00e8c6',           // neon teal
    accentGradient: 'linear-gradient(135deg, #ff2d9b 0%, #00e8c6 100%)',
    timerBackground: '#2a1238',  // match card
    timerBorder: '#ff2d9b',
    buttonPrimary: '#ff2d9b',
    buttonSecondary: '#00e8c6',
    buttonText: '#ffffff',       // white on neon pink/teal
    lockIconActive: '#ff2d9b',
    lockIconInactive: '#6a3880',
    inputBackground: '#1e0c28',  // between bg and card — distinct
    success: '#30ff60',          // neon green
    warning: '#ffe030',          // neon yellow
    error: '#ff2040',            // hot red
  },
  shadows: {
    small: '0 2px 8px rgba(255, 45, 155, 0.2)',
    medium: '0 4px 16px rgba(255, 45, 155, 0.3)',
    large: '0 8px 24px rgba(255, 45, 155, 0.4)',
  },
  ...sharedTokens,
};

// Hip Hop — TR-808 drum machine, dark charcoal, warm amber/orange
export const hiphopTheme = {
  fontFamily: "'Chakra Petch', 'Rajdhani', 'Arial Narrow', sans-serif",
  colors: {
    background: '#1f1f1f',       // hsl(0,0%,12%) dark charcoal
    card: '#292929',             // hsl(0,0%,16%) panel base
    primary: '#e68a33',          // hsl(20,100%,55%) TR-808 orange
    secondary: '#8060b3',        // hsl(260,45%,55%) muted purple
    text: '#f5dda6',             // hsl(45,100%,85%) creamy vintage label
    textSecondary: '#b3a07a',    // muted amber
    border: '#333333',           // hsl(0,0%,20%)
    accent: '#e6b833',           // hsl(45,95%,55%) yellow pad
    accentGradient: 'linear-gradient(135deg, #e68a33 0%, #e6b833 100%)',
    timerBackground: '#292929',
    timerBorder: '#e68a33',
    buttonPrimary: '#e68a33',
    buttonSecondary: '#e6b833',
    buttonText: '#1a1a1a',
    lockIconActive: '#e68a33',
    lockIconInactive: '#666666',
    inputBackground: '#242424',
    success: '#e6b833',          // hsl(45,95%,55%)
    warning: '#cc8a2e',          // hsl(35,90%,50%)
    error: '#d94040',            // hsl(10,85%,60%)
  },
  shadows: {
    small: '0 2px 5px rgba(0, 0, 0, 0.3)',
    medium: '0 4px 12px rgba(0, 0, 0, 0.4)',
    large: '0 8px 20px rgba(0, 0, 0, 0.5)',
  },
  ...sharedTokens,
};

const themes: Record<ThemeName, typeof lightTheme> = {
  light: lightTheme,
  dark: darkTheme,
  vintage: vintageTheme,
  indie: indieTheme,
  disco: discoTheme,
  hiphop: hiphopTheme,
};

function isValidThemeName(value: string): value is ThemeName {
  return THEME_ORDER.includes(value as ThemeName);
}

// Lazy-load Google Fonts only when a theme that needs them is active.
// Light/Dark use Inter/Roboto which are loaded in index.html.
const THEME_FONT_URLS: Partial<Record<ThemeName, string>> = {
  vintage: 'https://fonts.googleapis.com/css2?family=Righteous&display=swap',
  indie: 'https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=swap',
  disco: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap',
  hiphop: 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&display=swap',
};

export function loadThemeFont(theme: ThemeName) {
  const url = THEME_FONT_URLS[theme];
  if (!url) return;
  const id = `theme-font-${theme}`;
  if (document.getElementById(id)) return; // already loaded
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeName, setThemeNameState] = useState<ThemeName>(() => {
    const stored = getFromStorage(STORAGE_KEYS.THEME, 'dark');
    if (isValidThemeName(stored)) return stored;
    return 'dark';
  });

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.THEME, themeName);
    loadThemeFont(themeName);
  }, [themeName]);

  const setThemeName = (name: ThemeName) => {
    setThemeNameState(name);
  };

  const cycleTheme = () => {
    const currentIndex = THEME_ORDER.indexOf(themeName);
    const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
    setThemeNameState(THEME_ORDER[nextIndex]);
  };

  // Backward compat for components that use isDarkMode
  const isDarkMode = themeName === 'dark';
  const toggleTheme = cycleTheme;

  return (
    <ThemeContext.Provider value={{ themeName, setThemeName, cycleTheme, isDarkMode, toggleTheme }}>
      <StyledThemeProvider theme={themes[themeName]}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
