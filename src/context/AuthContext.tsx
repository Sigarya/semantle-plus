
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

  // Create or fetch user profile
  const ensureUserProfile = async (userId: string, userData?: any): Promise<UserProfile | null> => {
    try {
      console.log("Ensuring user profile for ID:", userId, "with data:", userData);
      
      // First try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('username, is_admin')
        .eq('id', userId)
        .maybeSingle();
        
      if (existingProfile) {
        console.log("Found existing profile:", existingProfile);
        
        // Get user stats
        const { data: statsData } = await supabase
          .from('user_stats')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
          
        const userProfile: UserProfile = {
          id: userId,
          username: existingProfile.username,
          isAdmin: existingProfile.is_admin
        };
        
        if (statsData) {
          userProfile.stats = {
            gamesWon: statsData.games_won,
            totalGames: statsData.games_played,
            bestGuessCount: statsData.best_guess_count,
            averageGuessCount: statsData.games_played > 0 
              ? statsData.total_guesses / statsData.games_played
              : 0,
            winStreak: statsData.win_streak,
            bestStreak: statsData.best_streak
          };
        }
        
        return userProfile;
      }
      
      // Profile doesn't exist, create it
      console.log("Profile not found, creating new profile");
      
      const username = userData?.username || 
                      userData?.user_metadata?.username || 
                      userData?.email?.split('@')[0] || 
                      'משתמש';
      
      // Create profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: username,
          is_admin: false
        })
        .select()
        .single();
        
      if (createError) {
        console.error("Error creating profile:", createError);
        // Still return a basic profile even if creation fails
        return {
          id: userId,
          username: username,
          isAdmin: false
        };
      }
      
      // Create initial stats
      const { error: statsError } = await supabase
        .from('user_stats')
        .insert({
          id: userId,
          games_played: 0,
          games_won: 0,
          total_guesses: 0,
          best_guess_count: null,
          win_streak: 0,
          best_streak: 0
        });
        
      if (statsError) {
        console.error("Error creating stats:", statsError);
      }
      
      console.log("Created new profile:", newProfile);
      
      return {
        id: userId,
        username: newProfile.username,
        isAdmin: newProfile.is_admin,
        stats: {
          gamesWon: 0,
          totalGames: 0,
          bestGuessCount: null,
          averageGuessCount: 0,
          winStreak: 0,
          bestStreak: 0
        }
      };
      
    } catch (error) {
      console.error("Error in ensureUserProfile:", error);
      return null;
    }
  };
  
  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    
    console.log("Setting up auth listeners");
    
    // Get existing session first
    supabase.auth.getSession().then(async ({ data: { session: authSession } }) => {
      if (!isMounted) return;
      
      console.log("Initial session check:", authSession?.user?.id);
      
      setSession(authSession);
      
      if (authSession?.user) {
        try {
          const userProfile = await ensureUserProfile(authSession.user.id, authSession.user);
          if (isMounted) {
            setCurrentUser(userProfile);
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      }
      
      if (isMounted) {
        setIsLoading(false);
      }
    });
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, authSession) => {
        console.log("Auth state changed:", event, authSession?.user?.id);
        
        if (!isMounted) return;
        
        setSession(authSession);
        
        if (authSession?.user && event !== 'TOKEN_REFRESHED') {
          try {
            const userProfile = await ensureUserProfile(authSession.user.id, authSession.user);
            if (isMounted) {
              setCurrentUser(userProfile);
            }
          } catch (error) {
            console.error("Error loading user profile:", error);
            if (isMounted) {
              setCurrentUser(null);
            }
          }
        } else if (!authSession) {
          if (isMounted) {
            setCurrentUser(null);
          }
        }
        
        if (isMounted && event !== 'TOKEN_REFRESHED') {
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      console.log("Starting sign in process with:", { email });
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }
      
      console.log("Sign in successful:", data);
      
    } catch (error: any) {
      console.error("Sign in error:", error);
      setIsLoading(false);
      
      let errorMessage = "שגיאה בהתחברות. אנא נסה שוב.";
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "פרטי ההתחברות שגויים";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "האימייל לא אושר. אנא בדוק את תיבת הדואר שלך";
      } else if (error.message.includes("Too many requests")) {
        errorMessage = "יותר מדי ניסיונות התחברות. אנא נסה שוב מאוחר יותר";
      }
      
      toast({
        variant: "destructive",
        title: "שגיאה בהתחברות",
        description: errorMessage
      });
      
      throw error;
    }
  };
  
  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      console.log("Starting Google sign in");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error("Google sign in error:", error);
        throw error;
      }
      
      console.log("Google sign in initiated:", data);
      
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
  
  // Sign up with email and password
  const signUp = async (email: string, password: string, username: string) => {
    try {
      console.log("Starting signup with:", { email, username });
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });
      
      if (error) {
        console.error("Signup error:", error);
        throw error;
      }
      
      console.log("Signup response:", data);
      
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
      
      if (error.message.includes("User already registered")) {
        errorMessage = "המשתמש כבר רשום במערכת";
      } else if (error.message.includes("Invalid email")) {
        errorMessage = "כתובת האימייל אינה תקינה";
      } else if (error.message.includes("Password")) {
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
  
  // Sign out
  const signOut = async () => {
    try {
      console.log("Starting sign out process");
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Sign out error:", error);
      }
      
      setCurrentUser(null);
      setSession(null);
      
      console.log("Sign out completed successfully");
      
    } catch (error: any) {
      console.error("Sign out error:", error);
      setCurrentUser(null);
      setSession(null);
    }
  };
  
  // Refresh user profile data
  const refreshUser = async () => {
    if (!session?.user) {
      return;
    }
    
    try {
      const userProfile = await ensureUserProfile(session.user.id, session.user);
      setCurrentUser(userProfile);
    } catch (error) {
      console.error("Error refreshing user profile:", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה ברענון נתוני המשתמש"
      });
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
