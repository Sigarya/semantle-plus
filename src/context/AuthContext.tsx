
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
  const [initialized, setInitialized] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log("AuthContext: Starting initialization");
        
        // Get initial session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 10000)
        );
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (error) {
          console.error("AuthContext: Error getting session:", error);
        } else {
          console.log("AuthContext: Initial session:", session ? 'found' : 'none');
          if (mounted) {
            setSession(session);
            if (session?.user) {
              await fetchUserProfile(session.user);
            }
          }
        }
      } catch (error) {
        console.error("AuthContext: Error in initializeAuth:", error);
      } finally {
        if (mounted) {
          console.log("AuthContext: Initialization complete");
          setIsLoading(false);
          setInitialized(true);
        }
      }
    };

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AuthContext: Auth state changed:", event, session ? 'session exists' : 'no session');
      
      if (!mounted) return;
      
      setSession(session);
      
      if (session?.user) {
        // Don't set loading here for auth state changes after initialization
        if (initialized) {
          await fetchUserProfile(session.user);
        }
      } else {
        setCurrentUser(null);
        if (initialized) {
          setIsLoading(false);
        }
      }
    });

    // Initialize auth
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialized]);

  const fetchUserProfile = async (user: User) => {
    try {
      console.log("AuthContext: Fetching profile for user:", user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("AuthContext: Error fetching profile:", error);
        setIsLoading(false);
        return;
      }

      if (data) {
        console.log("AuthContext: Profile found:", data.username);
        setCurrentUser({
          id: data.id,
          username: data.username,
          isAdmin: data.is_admin || false
        });
      } else {
        console.log("AuthContext: No profile found, creating new profile");
        const username = user.user_metadata?.username || 
                        user.user_metadata?.full_name || 
                        user.email?.split('@')[0] || 
                        'User';
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: username
          })
          .select()
          .single();

        if (createError) {
          console.error("AuthContext: Error creating profile:", createError);
          toast({
            variant: "destructive",
            title: "שגיאה",
            description: "אירעה שגיאה ביצירת הפרופיל"
          });
        } else if (newProfile) {
          console.log("AuthContext: Profile created successfully:", newProfile.username);
          setCurrentUser({
            id: newProfile.id,
            username: newProfile.username,
            isAdmin: newProfile.is_admin || false
          });
        }
      }
    } catch (error) {
      console.error("AuthContext: Error in fetchUserProfile:", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בטעינת הפרופיל"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    if (session?.user) {
      await fetchUserProfile(session.user);
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
