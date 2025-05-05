
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

interface RegisterFormProps {
  onToggleMode: () => void;
}

const RegisterForm = ({ onToggleMode }: RegisterFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "שגיאת הרשמה",
        description: "הסיסמאות אינן תואמות",
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      await register(username, password);
      toast({
        title: "הרשמה הצליחה",
        description: `ברוך הבא, ${username}!`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "שגיאת הרשמה",
        description: error instanceof Error ? error.message : "אירעה שגיאה בתהליך ההרשמה",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="register-username">שם משתמש</Label>
        <Input
          id="register-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="register-password">סיסמה</Label>
        <Input
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          required
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-semantle-primary hover:bg-semantle-secondary"
        disabled={isSubmitting}
      >
        {isSubmitting ? "נרשם..." : "הרשמה"}
      </Button>
      
      <div className="text-center mt-4">
        <p className="text-muted-foreground">
          כבר יש לך חשבון?{" "}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-semantle-accent hover:underline"
          >
            התחבר כאן
          </button>
        </p>
      </div>
    </form>
  );
};

export default RegisterForm;
