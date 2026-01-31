import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { Appearance } from "react-native";
import { themes } from "./theme";

// --- Types ---
type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  theme: typeof themes.light;
  toggle: () => void;
}

// default
const defaultMode: ThemeMode = "light";
const ThemeContext = createContext<ThemeContextValue>({
  mode: defaultMode,
  theme: themes[defaultMode],
  toggle: () => {},
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const system = Appearance.getColorScheme() as ThemeMode | null;
  const [mode, setMode] = useState<ThemeMode>(system || defaultMode);

  // optional: respond to system changes
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme) setMode(colorScheme as ThemeMode);
    });
    return () => sub.remove();
  }, []);

  const toggle = () => setMode((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ mode, theme: themes[mode], toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};
