
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/context/ThemeContext";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { Sun, Moon } from "lucide-react";

const Header = () => {
  const { currentUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  const toggleDarkMode = () => {
    setTheme(theme.name === 'light' ? { name: 'dark', label: 'כהה' } : { name: 'light', label: 'בהיר' });
  };

  return (
    <header className="bg-primary-50 dark:bg-slate-800 border-b border-primary-200 dark:border-slate-700 p-4 shadow-sm">
      <div className="container mx-auto flex flex-wrap items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400 font-heebo">
            <Link to="/">סמנטעל +</Link>
          </h1>
        </div>

        <div className="md:hidden">
          <Button 
            variant="ghost"
            onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
          >
            <span className="sr-only">תפריט</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isNavMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </Button>
        </div>

        <nav className={`${isNavMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row w-full md:w-auto md:items-center md:justify-between mt-4 md:mt-0 space-y-2 md:space-y-0 md:space-x-4 md:space-x-reverse`}>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 md:space-x-reverse">
            <Link to="/" className="text-primary-700 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-200 px-3 py-2 rounded-md" onClick={() => setIsNavMenuOpen(false)}>
              משחק
            </Link>
            
            <Link to="/leaderboard" className="text-primary-700 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-200 px-3 py-2 rounded-md" onClick={() => setIsNavMenuOpen(false)}>
              טבלת המובילים
            </Link>
            
            <Link to="/about" className="text-primary-700 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-200 px-3 py-2 rounded-md" onClick={() => setIsNavMenuOpen(false)}>
              אודות
            </Link>
            
            <Link to="/history" className="text-primary-700 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-200 px-3 py-2 rounded-md" onClick={() => setIsNavMenuOpen(false)}>
              היסטוריה
            </Link>
            
            {currentUser?.isAdmin && (
              <Link to="/admin" className="text-primary-700 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-200 px-3 py-2 rounded-md" onClick={() => setIsNavMenuOpen(false)}>
                ניהול
              </Link>
            )}
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Sun className="h-4 w-4 text-primary-700 dark:text-primary-300" />
              <Switch 
                checked={theme.name === 'dark'}
                onCheckedChange={toggleDarkMode}
              />
              <Moon className="h-4 w-4 text-primary-700 dark:text-primary-300" />
            </div>

            {currentUser ? (
              <div className="flex items-center space-x-4 space-x-reverse">
                <Link to="/profile" className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 px-3 py-2 rounded-md" onClick={() => setIsNavMenuOpen(false)}>
                  {currentUser.username}
                </Link>
                <Button 
                  variant="outline" 
                  className="border-primary-300 text-primary-700 dark:border-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900"
                  onClick={() => {
                    logout();
                    setIsNavMenuOpen(false);
                  }}
                >
                  התנתק
                </Button>
              </div>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-primary-500 hover:bg-primary-600 text-white dark:bg-primary-700 dark:hover:bg-primary-600"
                    onClick={() => setIsNavMenuOpen(false)}
                  >
                    התחברות
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-center text-2xl">
                      {authMode === "login" ? "התחברות" : "הרשמה"}
                    </DialogTitle>
                  </DialogHeader>
                  
                  {authMode === "login" ? (
                    <LoginForm onToggleMode={() => setAuthMode("register")} />
                  ) : (
                    <RegisterForm onToggleMode={() => setAuthMode("login")} />
                  )}
                </DialogContent>
              </Dialog>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
