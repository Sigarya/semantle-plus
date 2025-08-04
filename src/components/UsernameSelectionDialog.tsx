import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface UsernameSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUsernameSet: (username: string) => void;
}

export const UsernameSelectionDialog = ({ isOpen, onClose, onUsernameSet }: UsernameSelectionDialogProps) => {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { session } = useAuth();

  const validateUsername = (username: string): string | null => {
    if (username.length < 2) {
      return "שם המשתמש חייב להיות באורך של לפחות 2 תווים";
    }
    
    if (username.length > 50) {
      return "שם המשתמש לא יכול להיות ארוך מ-50 תווים";
    }
    
    // Check for valid characters (Hebrew letters, English letters, numbers, underscore, hyphen, dot)
    if (!/^[א-תa-zA-Z0-9_\-\.]+$/.test(username)) {
      return "שם המשתמש יכול להכיל רק אותיות עבריות/אנגליות, מספרים, קו תחתון (_), מקף (-) ונקודה (.)";
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      setError("לא נמצא משתמש מחובר");
      return;
    }

    const trimmedUsername = username.trim();
    const validationError = validateUsername(trimmedUsername);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Check if username is already taken
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', trimmedUsername)
        .maybeSingle();

      if (existingProfile) {
        setError("שם המשתמש כבר תפוס. אנא בחר שם אחר");
        setIsLoading(false);
        return;
      }

      // Create the profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: session.user.id,
          username: trimmedUsername,
          is_admin: false
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating profile:", createError);
        
        let errorMessage = "שגיאה ביצירת הפרופיל. אנא נסה שוב";
        
        if (createError.message?.includes('duplicate key value')) {
          errorMessage = "שם המשתמש כבר תפוס. אנא בחר שם אחר";
        }
        
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      if (newProfile) {
        console.log("Profile created successfully:", newProfile.username);
        
        toast({
          title: "הפרופיל נוצר בהצלחה!",
          description: `ברוך הבא, ${newProfile.username}!`
        });
        
        onUsernameSet(newProfile.username);
        onClose();
      }
    } catch (error) {
      console.error("Unexpected error creating profile:", error);
      setError("שגיאה בלתי צפויה. אנא נסה שוב");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (error) {
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-right">בחר שם משתמש</DialogTitle>
          <DialogDescription className="text-right">
            בחר שם משתמש שישמש אותך במשחק. ניתן להשתמש באותיות עבריות ואנגליות, מספרים, קו תחתון, מקף ונקודה.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-right block">שם משתמש</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={handleInputChange}
              placeholder="הכנס שם משתמש..."
              className="text-right"
              dir="rtl"
              disabled={isLoading}
              required
              minLength={2}
              maxLength={50}
            />
            {error && (
              <p className="text-sm text-red-600 text-right">{error}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button
              type="submit"
              disabled={isLoading || !username.trim()}
              className="min-w-[100px]"
            >
              {isLoading ? "יוצר..." : "צור פרופיל"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};