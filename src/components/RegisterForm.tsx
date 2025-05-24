
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

interface RegisterFormProps {
  onToggleMode: () => void;
}

const RegisterForm = ({ onToggleMode }: RegisterFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  
  const { signUp } = useAuth();

  // Auto-fill confirm password when password is auto-filled by browser
  useEffect(() => {
    const passwordInput = passwordRef.current;
    const confirmPasswordInput = confirmPasswordRef.current;
    
    if (passwordInput && confirmPasswordInput) {
      const handlePasswordChange = () => {
        // Small delay to ensure auto-fill is complete
        setTimeout(() => {
          if (passwordInput.value && !confirmPasswordInput.value) {
            setConfirmPassword(passwordInput.value);
          }
        }, 100);
      };
      
      passwordInput.addEventListener('input', handlePasswordChange);
      
      return () => {
        passwordInput.removeEventListener('input', handlePasswordChange);
      };
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("כתובת האימייל אינה תקינה");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      return;
    }
    
    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    
    if (!username.trim()) {
      setError("שם המשתמש חובה");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Attempting signup with:", { email, username });
      await signUp(email, password, username.trim());
      console.log("Signup successful");
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error.message || "שגיאה בהרשמה. אנא נסה שוב.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="username">שם משתמש</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="שם משתמש"
          required
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="register-email">אימייל</Label>
        <Input
          id="register-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="register-password">סיסמה</Label>
        <Input
          ref={passwordRef}
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="********"
          required
          minLength={6}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="confirm-password">אימות סיסמה</Label>
        <Input
          ref={confirmPasswordRef}
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="********"
          required
        />
      </div>

      {error && (
        <div className="text-destructive text-sm">{error}</div>
      )}

      <Button 
        type="submit" 
        className="w-full bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600" 
        disabled={isLoading}
      >
        {isLoading ? "נרשם..." : "הירשם"}
      </Button>
      
      <div className="text-center text-sm">
        כבר יש לך חשבון?{" "}
        <button
          type="button"
          onClick={onToggleMode}
          className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
        >
          התחבר
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;
