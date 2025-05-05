
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

const Header = () => {
  const { currentUser, logout } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  return (
    <header className="bg-semantle-dark border-b border-semantle-primary p-4">
      <div className="container mx-auto flex flex-wrap items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold text-semantle-accent">
            <Link to="/">סמנטל עברית יומי</Link>
          </h1>
        </div>

        <nav className="flex items-center space-x-4 space-x-reverse">
          <Link to="/" className="text-white hover:text-semantle-accent px-3 py-2 rounded-md">
            משחק
          </Link>
          
          <Link to="/about" className="text-white hover:text-semantle-accent px-3 py-2 rounded-md">
            אודות
          </Link>
          
          <Link to="/history" className="text-white hover:text-semantle-accent px-3 py-2 rounded-md">
            היסטוריה
          </Link>
          
          {currentUser?.isAdmin && (
            <Link to="/admin" className="text-white hover:text-semantle-accent px-3 py-2 rounded-md">
              ניהול
            </Link>
          )}
          
          {currentUser ? (
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link to="/profile" className="text-semantle-secondary hover:text-semantle-accent px-3 py-2 rounded-md">
                {currentUser.username}
              </Link>
              <Button 
                variant="outline" 
                className="border-semantle-primary text-white hover:bg-semantle-primary"
                onClick={logout}
              >
                התנתק
              </Button>
            </div>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-semantle-primary hover:bg-semantle-secondary text-white">
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
        </nav>
      </div>
    </header>
  );
};

export default Header;
