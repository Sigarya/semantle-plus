
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const UserProfileForm = () => {
  const { currentUser, refreshUser } = useAuth();
  const { toast } = useToast();
  
  const [username, setUsername] = useState(currentUser?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || username === currentUser?.username) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אנא הזן שם משתמש חדש",
      });
      return;
    }
    
    setIsUpdatingUsername(true);
    
    try {
      // Update the profile in the database
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', currentUser?.id);
      
      if (error) throw error;
      
      // Refresh the user data
      await refreshUser();
      
      toast({
        title: "שם המשתמש עודכן",
        description: "שם המשתמש החדש נשמר בהצלחה",
      });
    } catch (error) {
      console.error("Error updating username:", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error instanceof Error ? error.message : "אירעה שגיאה בעדכון שם המשתמש",
      });
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אנא מלא את כל השדות",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "הסיסמאות החדשות אינן תואמות",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "הסיסמה חייבת להכיל לפחות 6 תווים",
      });
      return;
    }
    
    setIsUpdatingPassword(true);
    
    try {
      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast({
        title: "הסיסמה עודכנה",
        description: "הסיסמה החדשה נשמרה בהצלחה",
      });
      
      // Clear fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error instanceof Error ? error.message : "אירעה שגיאה בעדכון הסיסמה",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl">עדכון שם משתמש</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUsernameUpdate} className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="username" className="text-sm font-medium">
                שם משתמש חדש
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="הזן שם משתמש חדש"
                dir="rtl"
              />
            </div>
            <Button 
              type="submit" 
              className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600"
              disabled={isUpdatingUsername || !username.trim() || username === currentUser?.username}
            >
              {isUpdatingUsername ? "מעדכן..." : "עדכן שם משתמש"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl">עדכון סיסמה</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="new-password" className="text-sm font-medium">
                סיסמה חדשה
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="הזן סיסמה חדשה"
                dir="rtl"
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                אימות סיסמה חדשה
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="הזן שוב את הסיסמה החדשה"
                dir="rtl"
              />
            </div>
            
            <Button 
              type="submit" 
              className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600"
              disabled={
                isUpdatingPassword || 
                !newPassword || 
                !confirmPassword || 
                newPassword !== confirmPassword
              }
            >
              {isUpdatingPassword ? "מעדכן..." : "עדכן סיסמה"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfileForm;
