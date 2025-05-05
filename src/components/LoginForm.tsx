
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

interface LoginFormProps {
  onToggleMode: () => void;
}

const LoginForm = ({ onToggleMode }: LoginFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login(username, password);
      toast({
        title: "התחברת בהצלחה",
        description: `ברוך הבא, ${username}!`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "שגיאת התחברות",
        description: error instanceof Error ? error.message : "אירעה שגיאה בתהליך ההתחברות",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="username">שם משתמש</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="password">סיסמה</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-semantle-primary hover:bg-semantle-secondary"
        disabled={isSubmitting}
      >
        {isSubmitting ? "מתחבר..." : "התחברות"}
      </Button>
      
      <div className="text-center mt-4">
        <p className="text-muted-foreground">
          אין לך חשבון?{" "}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-semantle-accent hover:underline"
          >
            הרשם עכשיו
          </button>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;
