
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

  // Simple profile fetcher that doesn't cause deadlocks
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log("Fetching profile for user:", userId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, is_admin')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      
      if (!profile) {
        console.log("No profile found, will be created by trigger");
        return null;
      }
      
      // Get stats
      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      const userProfile: UserProfile = {
        id: userId,
        username: profile.username,
        isAdmin: profile.is_admin || false
      };
      
      if (stats) {
        userProfile.stats = {
          gamesWon: stats.games_won || 0,
          totalGames: stats.games_played || 0,
          bestGuessCount: stats.best_guess_count,
          averageGuessCount: stats.games_played > 0 ? (stats.total_guesses || 0) / stats.games_played : 0,
          winStreak: stats.win_streak || 0,
          bestStreak: stats.best_streak || 0
        };
      }
      
      console.log("Profile fetched successfully:", userProfile);
      return userProfile;
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      return null;
    }
  };
  
  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    console.log("AuthContext: Setting up auth listeners");
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log("AuthContext: Initial session:", initialSession?.user?.id);
        
        if (!mounted) return;
        
        setSession(initialSession);
        
        if (initialSession?.user) {
          // Fetch profile in background without blocking
          setTimeout(async () => {
            if (mounted) {
              const profile = await fetchUserProfile(initialSession.user.id);
              if (mounted) {
                setCurrentUser(profile);
              }
            }
          }, 0);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("AuthContext: Error during initialization:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("AuthContext: Auth state changed:", event, session?.user?.id);
        
        if (!mounted) return;
        
        setSession(session);
        
        if (session?.user && event !== 'TOKEN_REFRESHED') {
          // Fetch profile without blocking the auth state update
          setTimeout(async () => {
            if (mounted) {
              const profile = await fetchUserProfile(session.user.id);
              if (mounted) {
                setCurrentUser(profile);
              }
            }
          }, 0);
        } else if (!session) {
          setCurrentUser(null);
        }
      }
    );
    
    initializeAuth();
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  const signIn = async (email: string, password: string) => {
    try {
      console.log("AuthContext: Starting sign in");
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      
      if (error) throw error;
      
      console.log("AuthContext: Sign in successful");
      
    } catch (error: any) {
      console.error("AuthContext: Sign in error:", error);
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
      console.log("AuthContext: Starting Google sign in");
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
      
    } catch (error: any) {
      console.error("AuthContext: Google sign in error:", error);
      
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
      console.log("AuthContext: Starting signup");
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
      
      console.log("AuthContext: Signup response:", data);
      
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
      console.error("AuthContext: Sign up error:", error);
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
      console.log("AuthContext: Starting sign out");
      
      await supabase.auth.signOut();
      setCurrentUser(null);
      setSession(null);
      
    } catch (error: any) {
      console.error("AuthContext: Sign out error:", error);
      setCurrentUser(null);
      setSession(null);
    }
  };
  
  const refreshUser = async () => {
    if (!session?.user) return;
    
    try {
      const profile = await fetchUserProfile(session.user.id);
      setCurrentUser(profile);
    } catch (error) {
      console.error("AuthContext: Error refreshing user:", error);
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
