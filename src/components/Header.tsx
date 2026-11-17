import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { Sun, Moon } from "lucide-react";
import { usePWAInstall } from "@/context/PWAInstallContext";
import { Download } from "lucide-react";

const Header = () => {
  const { currentUser, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const { deferredPrompt } = usePWAInstall();

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
  };

  const toggleDarkMode = () => {
    setTheme(theme.name === 'light' ? { name: 'dark', label: 'כהה' } : { name: 'light', label: 'בהיר' });
  };

  return (
    <header className="site-header" onKeyDown={(event) => {
      if (event.key === "Escape" && isNavMenuOpen) {
        setIsNavMenuOpen(false);
        event.currentTarget.querySelector<HTMLButtonElement>('[aria-controls="main-navigation"]')?.focus();
      }
    }}>
      <div className="container mx-auto flex flex-wrap items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-primary font-heebo">
            <Link to="/">סמנטעל +</Link>
          </h1>
        </div>

        <div className="md:hidden">
          <Button 
            variant="ghost"
            aria-expanded={isNavMenuOpen}
            aria-controls="main-navigation"
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

        <nav id="main-navigation" aria-label="ניווט ראשי" className={`${isNavMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row w-full md:w-auto md:items-center md:justify-between mt-4 md:mt-0 space-y-2 md:space-y-0 md:space-x-4 md:space-x-reverse`}>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 md:space-x-reverse">
            <NavLink end to="/" className="text-primary hover:text-primary dark:hover:text-primary px-3 py-2 rounded-md" onClick={() => setIsNavMenuOpen(false)}>
              משחק
            </NavLink>
            
            <NavLink end to="/leaderboard" className="text-primary hover:text-primary dark:hover:text-primary px-3 py-2 rounded-md" onClick={() => setIsNavMenuOpen(false)}>
              טבלת המובילים
            </NavLink>
            
            <NavLink end to="/about" className="text-primary hover:text-primary dark:hover:text-primary px-3 py-2 rounded-md" onClick={() => setIsNavMenuOpen(false)}>
              אודות
            </NavLink>
            
            <NavLink end to="/history" className="text-primary hover:text-primary dark:hover:text-primary px-3 py-2 rounded-md" onClick={() => setIsNavMenuOpen(false)}>
              היסטוריה
            </NavLink>
            {deferredPrompt && (
              <button
                onClick={handleInstall}
                className="flex items-center text-primary hover:text-primary dark:hover:text-primary px-3 py-2 rounded-md gap-1"
                style={{ direction: 'rtl' }}
              >
                <Download className="w-4 h-4 ml-1" />
                התקן
              </button>
            )}
            {currentUser?.isAdmin && (
              <Link to="/admin" className="text-primary hover:text-primary dark:hover:text-primary px-3 py-2 rounded-md" onClick={() => setIsNavMenuOpen(false)}>
                ניהול
              </Link>
            )}
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button 
              variant="outline" 
              size="sm"
              className="theme-toggle flex items-center gap-2"
              onClick={toggleDarkMode}
            >
              {theme.name === 'light' ? (
                <>
                  <Moon className="h-4 w-4" />
                  <span>מצב כהה</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4" />
                  <span>מצב בהיר</span>
                </>
              )}
            </Button>

            {currentUser ? (
              <div className="flex items-center space-x-4 space-x-reverse">
                <Link to="/profile" className="text-primary hover:text-primary dark:hover:text-primary px-3 py-2 rounded-md" onClick={() => setIsNavMenuOpen(false)}>
                  {currentUser.username}
                </Link>
                <Button 
                  variant="outline" 
                  className="border-border text-primary hover:bg-accent dark:hover:bg-accent"
                  onClick={() => {
                    signOut();
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
                    className="bg-primary hover:bg-primary text-primary-foreground dark:hover:bg-primary"
                    onClick={() => setIsNavMenuOpen(false)}
                  >
                    התחברות
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-heebo">
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
