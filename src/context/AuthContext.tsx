
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User, Provider } from "@supabase/supabase-js";
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

  // Get the correct redirect URL based on environment
  const getRedirectUrl = () => {
    const hostname = window.location.hostname;
    const isDevelopment = import.meta.env.MODE === 'development';
    
    if (isDevelopment) {
      return window.location.origin;
    } else if (hostname === 'semantle.sigarya.xyz') {
      return 'https://semantle.sigarya.xyz';
    } else if (hostname.includes('github.io')) {
      return `${window.location.origin}/semantle-plus`;
    } else {
      return window.location.origin;
    }
  };

  // Fetch user profile data from the database
  const fetchUserProfile = async (userId: string) => {
    try {
      // Get the profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, is_admin')
        .eq('id', userId)
        .single();
        
      if (profileError) throw profileError;
      
      // Get user stats if they exist
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('id', userId)
        .single();
        
      // Create the user profile object
      const userProfile: UserProfile = {
        id: userId,
        username: profileData.username,
        isAdmin: profileData.is_admin
      };
      
      // Add stats if they exist
      if (statsData && !statsError) {
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
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  };
  
  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, authSession) => {
        console.log("Auth state changed:", event, authSession?.user?.id);
        
        if (!isMounted) return;
        
        // Clear user data when signing out
        if (!authSession) {
          setSession(null);
          setCurrentUser(null);
          setIsLoading(false);
          return;
        }
        
        // Set session immediately
        setSession(authSession);
        
        // Load user profile when signing in
        if (authSession?.user) {
          setTimeout(() => {
            fetchUserProfile(authSession.user.id)
              .then(userProfile => {
                if (isMounted) {
                  setCurrentUser(userProfile);
                  setIsLoading(false);
                }
              })
              .catch(error => {
                console.error("Error in onAuthStateChange:", error);
                if (isMounted) {
                  setIsLoading(false);
                }
              });
          }, 0);
        }
      }
    );

    // THEN get existing session
    supabase.auth.getSession().then(({ data: { session: authSession } }) => {
      if (!isMounted) return;
      
      console.log("Initial session check:", authSession?.user?.id);
      setSession(authSession);
      
      // Load user profile if session exists
      if (authSession?.user) {
        fetchUserProfile(authSession.user.id)
          .then(userProfile => {
            if (isMounted) {
              setCurrentUser(userProfile);
              setIsLoading(false);
            }
          })
          .catch(error => {
            console.error("Error loading initial user profile:", error);
            if (isMounted) {
              setIsLoading(false);
            }
          });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting sign in with:", { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Sign in error details:", error);
        throw error;
      }
      
      console.log("Sign in successful:", data);
      
    } catch (error: any) {
      console.error("Sign in error:", error);
      
      let errorMessage = "שגיאה בהתחברות. אנא נסה שוב.";
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "פרטי ההתחברות שגויים";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "האימייל לא אושר. אנא בדוק את תיבת הדואר שלך";
      } else if (error.message.includes("fetch")) {
        errorMessage = "בעיית חיבור לשרת. אנא בדוק את החיבור לאינטרנט";
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
      console.log("Attempting Google sign in");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl(),
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
        description: "שגיאה בהתחברות. אנא נסה שוב או בדוק את הגדרות Google Auth"
      });
      
      throw error;
    }
  };
  
  // Sign up with email and password
  const signUp = async (email: string, password: string, username: string) => {
    try {
      console.log("Attempting signup with:", { email, username });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          },
          emailRedirectTo: getRedirectUrl()
        }
      });
      
      if (error) {
        console.error("Signup error:", error);
        throw error;
      }
      
      console.log("Signup response:", data);
      
      // Check if user needs email confirmation
      if (data.user && !data.session) {
        toast({
          title: "הרשמה הושלמה",
          description: "אנא בדוק את האימייל שלך לאישור החשבון"
        });
      } else if (data.session) {
        // Auto-login successful
        toast({
          title: "הרשמה הושלמה בהצלחה",
          description: "ברוך הבא למשחק!"
        });
      }
      
    } catch (error: any) {
      console.error("Sign up error:", error);
      
      let errorMessage = "שגיאה בהרשמה. אנא נסה שוב.";
      
      if (error.message.includes("User already registered")) {
        errorMessage = "המשתמש כבר רשום במערכת";
      } else if (error.message.includes("Invalid email")) {
        errorMessage = "כתובת האימייל אינה תקינה";
      } else if (error.message.includes("Password")) {
        errorMessage = "הסיסמה חייבת להכיל לפחות 6 תווים";
      } else if (error.message.includes("Signup requires a valid password")) {
        errorMessage = "נדרשת סיסמה תקינה להרשמה";
      }
      
      toast({
        variant: "destructive",
        title: "שגיאה בהרשמה",
        description: errorMessage
      });
      
      throw error;
    }
  };
  
  // Sign out with better error handling
  const signOut = async () => {
    try {
      console.log("Starting sign out process");
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Sign out error:", error);
        // Only show user-facing errors for significant issues
        if (!error.message.includes('session') && !error.message.includes('missing')) {
          toast({
            variant: "destructive",
            title: "שגיאה בהתנתקות",
            description: error.message
          });
        }
      }
      
      // Clear local state regardless of error
      setCurrentUser(null);
      setSession(null);
      
      console.log("Sign out completed successfully");
      
    } catch (error: any) {
      console.error("Sign out error:", error);
      
      // Clear local state even if there's an error
      setCurrentUser(null);
      setSession(null);
      
      // Only show user-facing errors for significant issues
      if (!error.message.includes('session') && !error.message.includes('missing')) {
        toast({
          variant: "destructive",
          title: "שגיאה בהתנתקות",
          description: error.message
        });
      }
    }
  };
  
  // Refresh user profile data
  const refreshUser = async () => {
    if (!session?.user) {
      return;
    }
    
    try {
      const userProfile = await fetchUserProfile(session.user.id);
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
