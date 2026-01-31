// src/components/CustomKeyboard/KeyboardManager.ts
import { Platform, Dimensions } from 'react-native';
import { KeyboardState, AutoCapitalizeType } from './types';

export class KeyboardManager {
  private static instance: KeyboardManager;
  private currentText: string = '';
  private cursorPosition: number = 0;
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private maxUndoSteps: number = 50;

  // Debug logging toggle - set to false to disable logs
  private DEBUG_MANAGER = true;

  public static getInstance(): KeyboardManager {
    if (!KeyboardManager.instance) {
      KeyboardManager.instance = new KeyboardManager();
    }
    return KeyboardManager.instance;
  }

  // Text management methods
  public setText(text: string): void {
    if (this.DEBUG_MANAGER) {
      console.log('📝 [KeyboardManager] setText called:', {
        oldText: this.currentText,
        newText: text,
        oldCursor: this.cursorPosition,
        newCursor: text.length
      });
    }

    this.pushToUndoStack();
    this.currentText = text;
    this.cursorPosition = text.length;
    this.redoStack = []; // Clear redo stack on new action
  }

  public getText(): string {
    return this.currentText;
  }

  public getCursorPosition(): number {
    return this.cursorPosition;
  }

  public setCursorPosition(position: number): void {
    this.cursorPosition = Math.max(0, Math.min(position, this.currentText.length));
  }

  // Character insertion
  public insertCharacter(char: string): string {
    if (this.DEBUG_MANAGER) {
      console.log('➕ [KeyboardManager] insertCharacter called:', {
        char: char,
        beforeText: this.currentText,
        beforeCursor: this.cursorPosition
      });
    }

    this.pushToUndoStack();
    const before = this.currentText.substring(0, this.cursorPosition);
    const after = this.currentText.substring(this.cursorPosition);
    this.currentText = before + char + after;
    this.cursorPosition += char.length;
    this.redoStack = [];

    if (this.DEBUG_MANAGER) {
      console.log('✅ [KeyboardManager] insertCharacter result:', {
        char: char,
        resultText: this.currentText,
        newCursor: this.cursorPosition,
        before: before,
        after: after
      });
    }

    return this.currentText;
  }

  // Backspace functionality
  public deleteCharacter(): string {
    if (this.cursorPosition === 0) return this.currentText;

    if (this.DEBUG_MANAGER) {
      console.log('➖ [KeyboardManager] deleteCharacter called:', {
        beforeText: this.currentText,
        beforeCursor: this.cursorPosition
      });
    }

    this.pushToUndoStack();
    const before = this.currentText.substring(0, this.cursorPosition - 1);
    const after = this.currentText.substring(this.cursorPosition);
    this.currentText = before + after;
    this.cursorPosition -= 1;
    this.redoStack = [];

    if (this.DEBUG_MANAGER) {
      console.log('✅ [KeyboardManager] deleteCharacter result:', {
        resultText: this.currentText,
        newCursor: this.cursorPosition
      });
    }

    return this.currentText;
  }

  // Word deletion (for long press backspace)
  public deleteWord(): string {
    if (this.cursorPosition === 0) return this.currentText;

    this.pushToUndoStack();
    const before = this.currentText.substring(0, this.cursorPosition);
    const after = this.currentText.substring(this.cursorPosition);

    // Find the start of the current word
    let wordStart = this.cursorPosition - 1;
    while (wordStart > 0 && /\S/.test(before[wordStart - 1])) {
      wordStart--;
    }

    this.currentText = before.substring(0, wordStart) + after;
    this.cursorPosition = wordStart;
    this.redoStack = [];
    return this.currentText;
  }

  // Auto-capitalization logic
  public shouldCapitalize(autoCapitalize: AutoCapitalizeType): boolean {
    switch (autoCapitalize) {
      case 'characters':
        return true;
      case 'words':
        return this.cursorPosition === 0 || /\s$/.test(this.currentText.substring(0, this.cursorPosition));
      case 'sentences':
        return this.cursorPosition === 0 || /[.!?]\s*$/.test(this.currentText.substring(0, this.cursorPosition));
      case 'none':
      default:
        return false;
    }
  }

  // Undo/Redo functionality
  private pushToUndoStack(): void {
    this.undoStack.push(this.currentText);
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }
  }

  public undo(): string {
    if (this.undoStack.length === 0) return this.currentText;

    this.redoStack.push(this.currentText);
    this.currentText = this.undoStack.pop()!;
    this.cursorPosition = this.currentText.length;
    return this.currentText;
  }

  public redo(): string {
    if (this.redoStack.length === 0) return this.currentText;

    this.undoStack.push(this.currentText);
    this.currentText = this.redoStack.pop()!;
    this.cursorPosition = this.currentText.length;
    return this.currentText;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // Text selection methods
  public selectAll(): { start: number; end: number } {
    return { start: 0, end: this.currentText.length };
  }

  public selectWord(): { start: number; end: number } {
    const position = this.cursorPosition;
    let start = position;
    let end = position;

    // Find word boundaries
    while (start > 0 && /\w/.test(this.currentText[start - 1])) {
      start--;
    }
    while (end < this.currentText.length && /\w/.test(this.currentText[end])) {
      end++;
    }

    return { start, end };
  }

  // Keyboard layout utilities
  public static getOptimalKeyboardHeight(): number {
    const { height } = Dimensions.get('window');
    const baseHeight = Platform.OS === 'ios' ? 260 : 240;

    // Adjust for larger screens
    if (height > 800) {
      return baseHeight + 20;
    } else if (height < 600) {
      return baseHeight - 20;
    }

    return baseHeight;
  }

  public static getKeySize(screenWidth: number): { width: number; height: number } {
    const keyWidth = (screenWidth - 40) / 10; // 10 keys per row with margins
    const keyHeight = Platform.OS === 'ios' ? 42 : 40;

    return {
      width: keyWidth,
      height: keyHeight,
    };
  }

  // Platform-specific optimizations
  public static getPlatformSpecificProps() {
    return {
      hapticFeedback: Platform.OS === 'ios',
      vibrationFeedback: Platform.OS === 'android',
      shadowProps: Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        android: {
          elevation: 5,
        },
      }),
    };
  }

  // Clear all state
  public reset(): void {
    this.currentText = '';
    this.cursorPosition = 0;
    this.undoStack = [];
    this.redoStack = [];
  }

  // Email domain suggestions
  private emailDomains: string[] = [
    'gmail.com',
    'icloud.com',
    'outlook.com',
    'hotmail.com',
    'yahoo.com',
    'aol.com',
    'live.com',
    'msn.com',
    'protonmail.com',
    'tutanota.com'
  ];

  // Get email domain suggestions when @ is detected
  public getEmailSuggestions(): string[] {
    const atIndex = this.currentText.lastIndexOf('@');
    if (atIndex === -1) return [];

    const beforeAt = this.currentText.substring(0, atIndex);
    const afterAt = this.currentText.substring(atIndex + 1);

    // If there's already text after @, filter domains that start with it
    if (afterAt.length > 0) {
      return this.emailDomains
        .filter(domain => domain.toLowerCase().startsWith(afterAt.toLowerCase()))
        .map(domain => beforeAt + '@' + domain);
    }

    // If just @ was typed, return all domains
    return this.emailDomains.map(domain => beforeAt + '@' + domain);
  }

  // Check if we should show email suggestions
  public shouldShowEmailSuggestions(): boolean {
    const atIndex = this.currentText.lastIndexOf('@');
    if (atIndex === -1) return false;

    const afterAt = this.currentText.substring(atIndex + 1);
    // Show suggestions if there's just @ or partial domain after @
    return afterAt.length <= 20 && !afterAt.includes('.');
  }

  // Get suggestions (enhanced for email auto-complete)
  public getSuggestions(): string[] {
    if (this.shouldShowEmailSuggestions()) {
      return this.getEmailSuggestions();
    }
    return [];
  }

  // Validate input (for email, phone, etc.)
  public validateInput(inputType: 'email' | 'phone' | 'url' | 'default'): boolean {
    switch (inputType) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.currentText);
      case 'phone':
        return /^\+?[\d\s\-\(\)]+$/.test(this.currentText);
      case 'url':
        return /^https?:\/\/[^\s]+$/.test(this.currentText);
      default:
        return true;
    }
  }
}