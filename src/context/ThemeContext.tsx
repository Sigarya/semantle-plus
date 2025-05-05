
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Theme } from "@/types/game";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const themes: Theme[] = [
  { name: 'light', label: 'בהיר' },
  { name: 'dark', label: 'כהה' }
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(themes[0]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("semantle_theme");
    if (savedTheme) {
      const parsedTheme = JSON.parse(savedTheme);
      setTheme(parsedTheme);
      document.documentElement.classList.toggle('dark-theme', parsedTheme.name === 'dark');
    }
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("semantle_theme", JSON.stringify(newTheme));
    document.documentElement.classList.toggle('dark-theme', newTheme.name === 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleThemeChange }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
