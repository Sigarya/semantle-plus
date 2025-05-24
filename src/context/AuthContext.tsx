
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
  signIn: (emailOrUsername: string, password: string) => Promise<void>;
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
  const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
    console.log("Fetching user profile for ID:", userId);
    
    try {
      // Get the profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, is_admin')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        console.error("Profile error:", profileError);
        throw profileError;
      }
      
      console.log("Profile data:", profileData);
      
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
      
      console.log("Complete user profile:", userProfile);
      return userProfile;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  };
  
  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    
    console.log("Setting up auth listeners");
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, authSession) => {
        console.log("Auth state changed:", event, authSession?.user?.id);
        
        if (!isMounted) return;
        
        setSession(authSession);
        
        if (authSession?.user) {
          // User is signed in, fetch profile
          try {
            const userProfile = await fetchUserProfile(authSession.user.id);
            if (isMounted) {
              setCurrentUser(userProfile);
            }
          } catch (error) {
            console.error("Error loading user profile:", error);
            if (isMounted) {
              setCurrentUser(null);
            }
          }
        } else {
          // User is signed out
          if (isMounted) {
            setCurrentUser(null);
          }
        }
        
        if (isMounted) {
          setIsLoading(false);
        }
      }
    );

    // Get existing session
    supabase.auth.getSession().then(({ data: { session: authSession } }) => {
      if (!isMounted) return;
      
      console.log("Initial session check:", authSession?.user?.id);
      
      if (!authSession) {
        setSession(null);
        setCurrentUser(null);
        setIsLoading(false);
      }
      // If there is a session, the onAuthStateChange will handle it
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  // Sign in with email and password (simplified)
  const signIn = async (emailOrUsername: string, password: string) => {
    try {
      console.log("Starting sign in process with:", { emailOrUsername });
      setIsLoading(true);
      
      // Simple approach: try to sign in directly with the input
      // If it contains @, treat as email. Otherwise, show error.
      if (!emailOrUsername.includes('@')) {
        throw new Error("אנא הכנס כתובת אימייל תקינה");
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailOrUsername,
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
      } else if (error.message.includes("אנא הכנס כתובת אימייל תקינה")) {
        errorMessage = "אנא הכנס כתובת אימייל תקינה";
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
      
      // If signup successful and user is immediately logged in
      if (data.user && data.session) {
        toast({
          title: "הרשמה הושלמה בהצלחה",
          description: "ברוך הבא למשחק!"
        });
      } else if (data.user && !data.session) {
        // User created but needs email confirmation
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
      
      // Clear local state
      setCurrentUser(null);
      setSession(null);
      
      console.log("Sign out completed successfully");
      
    } catch (error: any) {
      console.error("Sign out error:", error);
      
      // Clear local state even if there's an error
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
