
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
    // Check if theme was saved in localStorage
    const savedTheme = localStorage.getItem("semantle_theme");
    
    if (savedTheme) {
      const parsedTheme = JSON.parse(savedTheme);
      setTheme(parsedTheme);
      
      // Apply the theme
      if (parsedTheme.name === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        setTheme(themes[1]); // Dark theme
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("semantle_theme", JSON.stringify(newTheme));
    
    // Apply the theme
    if (newTheme.name === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
