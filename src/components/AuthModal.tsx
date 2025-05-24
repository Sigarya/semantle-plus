
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isLogin ? "התחברות" : "הרשמה"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLogin ? (
            <LoginForm onToggleMode={toggleMode} />
          ) : (
            <RegisterForm onToggleMode={toggleMode} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
