import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    fontFamily: string;
    colors: {
      background: string;
      card: string;
      primary: string;
      secondary: string;
      text: string;
      textSecondary: string;
      border: string;
      accent: string;
      accentGradient: string;
      timerBackground: string;
      timerBorder: string;
      buttonPrimary: string;
      buttonSecondary: string;
      buttonText: string;
      lockIconActive: string;
      lockIconInactive: string;
      inputBackground: string;
      success: string;
      warning: string;
      error: string;
    };
    shadows: {
      small: string;
      medium: string;
      large: string;
    };
    borderRadius: {
      small: string;
      medium: string;
      large: string;
      round: string;
    };
    fontSizes: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
      xxxl: string;
      timer: string;
    };
    transitions: {
      fast: string;
      normal: string;
      slow: string;
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
  }
} 