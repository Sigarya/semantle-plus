
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "../types/game";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  setUserAsAdmin: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        if (newSession) {
          await fetchUserProfile(newSession.user.id);
        } else {
          setCurrentUser(null);
        }
        setIsLoading(false);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (initialSession) {
        setSession(initialSession);
        await fetchUserProfile(initialSession.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Get stats data
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('id', userId)
        .single();

      if (statsError && statsError.code !== 'PGRST116') throw statsError;

      const userWithStats: User = {
        id: profile.id,
        username: profile.username,
        isAdmin: profile.is_admin,
        stats: stats ? {
          gamesWon: stats.games_won,
          totalGames: stats.games_played,
          bestGuessCount: stats.best_guess_count,
          averageGuessCount: stats.total_guesses > 0 ? stats.total_guesses / stats.games_played : 0,
          winStreak: stats.win_streak,
          bestStreak: stats.best_streak
        } : undefined
      };

      setCurrentUser(userWithStats);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setCurrentUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "התחברות הצליחה", description: "ברוך הבא!" });
    } catch (error: any) {
      console.error("Login error:", error);
      toast({ 
        variant: "destructive", 
        title: "שגיאת התחברות", 
        description: error.message 
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Google login error:", error);
      toast({ 
        variant: "destructive", 
        title: "שגיאת התחברות", 
        description: error.message 
      });
      throw error;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({ title: "התנתקות הצליחה" });
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({ 
        variant: "destructive", 
        title: "שגיאת התנתקות", 
        description: error.message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            preferred_username: username
          }
        }
      });
      
      if (error) throw error;
      toast({ title: "הרשמה הצליחה", description: "ברוך הבא!" });
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({ 
        variant: "destructive", 
        title: "שגיאת הרשמה", 
        description: error.message 
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const setUserAsAdmin = async (userId: string) => {
    if (!currentUser?.isAdmin) {
      toast({ 
        variant: "destructive", 
        title: "פעולה נדחתה", 
        description: "אין לך הרשאה לבצע פעולה זו" 
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast({ title: "הצלחה", description: "משתמש עודכן כמנהל" });
    } catch (error: any) {
      console.error("Set admin error:", error);
      toast({ 
        variant: "destructive", 
        title: "שגיאה", 
        description: error.message 
      });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      session,
      isLoading, 
      login, 
      loginWithGoogle,
      logout, 
      register,
      setUserAsAdmin
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
