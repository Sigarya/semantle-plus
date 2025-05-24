
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";

interface UserStats {
  gamesWon: number;
  totalGames: number;
  bestGuessCount: number | null;
  averageGuessCount: number;
  winStreak: number;
  bestStreak: number;
}

interface UserProfile {
  id: string;
  username: string;
  isAdmin: boolean;
  stats?: UserStats;
}

interface AuthContextType {
  session: Session | null;
  currentUser: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      
      if (error) throw error;
      
    } catch (error: any) {
      console.error("Sign in error:", error);
      setIsLoading(false);
      
      let errorMessage = "שגיאה בהתחברות. אנא נסה שוב.";
      
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "פרטי ההתחברות שגויים";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "האימייל לא אושר. אנא בדוק את תיבת הדואר שלך";
      }
      
      toast({
        variant: "destructive",
        title: "שגיאה בהתחברות",
        description: errorMessage
      });
      
      throw error;
    }
  };
  
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
      
    } catch (error: any) {
      console.error("Google sign in error:", error);
      
      toast({
        variant: "destructive",
        title: "שגיאה בהתחברות עם Google",
        description: "שגיאה בהתחברות עם Google. אנא נסה שוב"
      });
      
      throw error;
    }
  };
  
  const signUp = async (email: string, password: string, username: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.trim()
          }
        }
      });
      
      if (error) throw error;
      
      if (data.user && data.session) {
        toast({
          title: "הרשמה הושלמה בהצלחה",
          description: "ברוך הבא למשחק!"
        });
      } else if (data.user && !data.session) {
        toast({
          title: "הרשמה הושלמה",
          description: "אנא בדוק את האימייל שלך לאישור החשבון"
        });
      }
      
    } catch (error: any) {
      console.error("Sign up error:", error);
      setIsLoading(false);
      
      let errorMessage = "שגיאה בהרשמה. אנא נסה שוב.";
      
      if (error.message?.includes("User already registered")) {
        errorMessage = "המשתמש כבר רשום במערכת";
      } else if (error.message?.includes("Invalid email")) {
        errorMessage = "כתובת האימייל אינה תקינה";
      } else if (error.message?.includes("Password")) {
        errorMessage = "הסיסמה חייבת להכיל לפחות 6 תווים";
      }
      
      toast({
        variant: "destructive",
        title: "שגיאה בהרשמה",
        description: errorMessage
      });
      
      throw error;
    }
  };
  
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setSession(null);
    } catch (error: any) {
      console.error("Sign out error:", error);
      setCurrentUser(null);
      setSession(null);
    }
  };
  
  const refreshUser = async () => {
    // Simple refresh that doesn't cause issues
    if (session?.user) {
      // Just trigger a re-render, profile data will be fetched when needed
      setCurrentUser(prev => prev);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      currentUser, 
      isLoading,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
