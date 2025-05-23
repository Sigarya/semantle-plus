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
    const isGitHubPages = window.location.hostname.includes('github.io');
    const isDevelopment = import.meta.env.MODE === 'development';
    
    if (isDevelopment) {
      return window.location.origin;
    } else if (isGitHubPages) {
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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, authSession) => {
        setSession(authSession);
        
        // If session changes, reset currentUser to null
        if (!authSession) {
          setCurrentUser(null);
        }
        
        // Defer loading user profile if there's a session
        if (authSession?.user) {
          setTimeout(() => {
            fetchUserProfile(authSession.user.id)
              .then(userProfile => {
                setCurrentUser(userProfile);
              })
              .catch(error => {
                console.error("Error in onAuthStateChange:", error);
              })
              .finally(() => {
                setIsLoading(false);
              });
          }, 0);
        } else {
          setIsLoading(false);
        }
      }
    );

    // THEN get existing session
    supabase.auth.getSession().then(({ data: { session: authSession } }) => {
      setSession(authSession);
      
      // Load user profile if session exists
      if (authSession?.user) {
        fetchUserProfile(authSession.user.id)
          .then(userProfile => {
            setCurrentUser(userProfile);
          })
          .catch(error => {
            console.error("Error loading initial user profile:", error);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
    } catch (error: any) {
      console.error("Sign in error:", error);
      
      toast({
        variant: "destructive",
        title: "שגיאה בכניסה",
        description: error.message
      });
      
      throw error;
    }
  };
  
  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl()
        }
      });
      
      if (error) throw error;
      
    } catch (error: any) {
      console.error("Google sign in error:", error);
      
      toast({
        variant: "destructive",
        title: "שגיאה בהתחברות עם Google",
        description: error.message
      });
      
      throw error;
    }
  };
  
  // Sign up with email and password
  const signUp = async (email: string, password: string, username: string) => {
    try {
      // Create user in auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });
      
      if (signUpError) throw signUpError;
      
      // User profiles are created via trigger but we still need to set the username
      if (signUpData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ username })
          .eq('id', signUpData.user.id);
          
        if (profileError) throw profileError;
      }
      
    } catch (error: any) {
      console.error("Sign up error:", error);
      
      toast({
        variant: "destructive",
        title: "שגיאה בהרשמה",
        description: error.message
      });
      
      throw error;
    }
  };
  
  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
    } catch (error: any) {
      console.error("Sign out error:", error);
      
      toast({
        variant: "destructive",
        title: "שגיאה בהתנתקות",
        description: error.message
      });
      
      throw error;
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
