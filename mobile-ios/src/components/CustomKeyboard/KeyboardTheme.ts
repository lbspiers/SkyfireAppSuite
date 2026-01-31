// src/components/CustomKeyboard/KeyboardTheme.ts
import { KeyboardTheme } from './types';

export interface KeyboardThemeConfig {
  background: {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
  };
  keys: {
    normal: {
      colors: string[];
      textColor: string;
      borderColor: string;
    };
    pressed: {
      colors: string[];
      textColor: string;
      borderColor: string;
    };
    special: {
      colors: string[];
      textColor: string;
      borderColor: string;
    };
    active: {
      colors: string[];
      textColor: string;
      borderColor: string;
    };
  };
  suggestion: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
  };
}

// Brand colors from your app
const BRAND_ORANGE = "#FD7332";
const BRAND_BLUE = "#0C1F3F";
const BRAND_GRADIENT = ["#2E4161", "#1D3050", "#0C1F3F"];

export const keyboardThemes: Record<KeyboardTheme, KeyboardThemeConfig> = {
  dark: {
    background: {
      colors: BRAND_GRADIENT,
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    },
    keys: {
      normal: {
        colors: ["#4A5568", "#4A5568"], // Flat for more native feel
        textColor: "#FFFFFF",
        borderColor: "rgba(253, 115, 50, 0.3)",
      },
      pressed: {
        colors: [BRAND_ORANGE, "#E53E3E"],
        textColor: "#FFFFFF",
        borderColor: BRAND_ORANGE,
      },
      special: {
        colors: [BRAND_ORANGE, "#DD6B20"], // Keep gradient for action keys
        textColor: "#FFFFFF",
        borderColor: BRAND_ORANGE,
      },
      active: {
        colors: [BRAND_ORANGE, "#DD6B20"],
        textColor: "#FFFFFF",
        borderColor: BRAND_ORANGE,
      },
    },
    suggestion: {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      textColor: "#FFFFFF",
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
  },
  light: {
    background: {
      colors: ["#F7FAFC", "#EDF2F7", "#E2E8F0"],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    },
    keys: {
      normal: {
        colors: ["#FFFFFF", "#FFFFFF"], // Flat for more native feel
        textColor: "#2D3748",
        borderColor: "rgba(0, 0, 0, 0.1)",
      },
      pressed: {
        colors: [BRAND_ORANGE, "#FF8A50"],
        textColor: "#FFFFFF",
        borderColor: BRAND_ORANGE,
      },
      special: {
        colors: [BRAND_ORANGE, "#FF8A50"], // Keep gradient for action keys
        textColor: "#FFFFFF",
        borderColor: BRAND_ORANGE,
      },
      active: {
        colors: [BRAND_ORANGE, "#FF8A50"],
        textColor: "#FFFFFF",
        borderColor: BRAND_ORANGE,
      },
    },
    suggestion: {
      backgroundColor: "rgba(0, 0, 0, 0.05)",
      textColor: "#2D3748",
      borderColor: "rgba(0, 0, 0, 0.1)",
    },
  },
};

export function getKeyboardTheme(theme: KeyboardTheme): KeyboardThemeConfig {
  return keyboardThemes[theme];
}

// Helper functions for specific theme elements
export function getKeyGradient(
  theme: KeyboardTheme,
  keyState: 'normal' | 'pressed' | 'special' | 'active'
): string[] {
  return keyboardThemes[theme].keys[keyState].colors;
}

export function getKeyTextColor(
  theme: KeyboardTheme,
  keyState: 'normal' | 'pressed' | 'special' | 'active'
): string {
  return keyboardThemes[theme].keys[keyState].textColor;
}

export function getKeyBorderColor(
  theme: KeyboardTheme,
  keyState: 'normal' | 'pressed' | 'special' | 'active'
): string {
  return keyboardThemes[theme].keys[keyState].borderColor;
}

export function getBackgroundGradient(theme: KeyboardTheme): {
  colors: string[];
  start: { x: number; y: number };
  end: { x: number; y: number };
} {
  const themeConfig = keyboardThemes[theme];
  return {
    colors: themeConfig.background.colors,
    start: themeConfig.background.start || { x: 0, y: 0 },
    end: themeConfig.background.end || { x: 0, y: 1 },
  };
}