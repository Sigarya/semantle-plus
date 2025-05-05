
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

interface RegisterFormProps {
  onToggleMode: () => void;
}

const RegisterForm = ({ onToggleMode }: RegisterFormProps) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(username, email, password);
    } catch (error: any) {
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
        {isLoading ? "נרשם..." : "הרשם"}
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
