// src/components/CustomKeyboard/types.ts

export type KeyType =
  | 'character'
  | 'backspace'
  | 'shift'
  | 'caps'
  | 'symbol'
  | 'space'
  | 'enter'
  | 'number'
  | 'punctuation';

export interface KeyData {
  primary: string;          // Main character (e.g., 'a', '1')
  secondary?: string;       // Shift/symbol variant (e.g., 'A', '!')
  type: KeyType;
  width?: number;          // Relative width (1 = normal, 1.5 = wider, etc.)
  label?: string;          // Display label (for special keys like "space")
  icon?: string;           // Icon name for special keys
}

export interface KeyboardState {
  isShiftActive: boolean;
  isCapsLock: boolean;
  isSymbolMode: boolean;
}

export interface KeyboardRow extends Array<KeyData> {}
export interface KeyboardLayout extends Array<KeyboardRow> {}

export type ReturnKeyType = 'done' | 'send' | 'search' | 'next' | 'go';
export type AutoCapitalizeType = 'none' | 'sentences' | 'words' | 'characters';
export type KeyboardTheme = 'dark' | 'light';