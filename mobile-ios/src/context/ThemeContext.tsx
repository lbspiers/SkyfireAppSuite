// src/context/ThemeContext.tsx
import React, { createContext, useState, useContext } from "react";
import { themes } from "../theme/theme";

const ThemeContext = createContext({
  theme: themes.dark,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(themes.dark);

  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme.mode === "dark" ? themes.light : themes.dark
    );
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
