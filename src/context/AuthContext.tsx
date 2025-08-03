
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
  needsUsernameSelection: boolean;
  showUsernameDialog: boolean;
  suggestedUsername: string;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUsernameSelected: (username: string) => void;
  hideUsernameDialog: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [needsUsernameSelection, setNeedsUsernameSelection] = useState(false);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [suggestedUsername, setSuggestedUsername] = useState("");
  const { toast } = useToast();

  // Generate a suggested username from user metadata
  const generateSuggestedUsername = async (user: User): Promise<string> => {
    try {
      // Extract user information from Google metadata
      const metadata = user.user_metadata || {};
      const fullName = metadata.full_name || metadata.name || "";
      const firstName = metadata.given_name || "";
      const lastName = metadata.family_name || "";
      const email = user.email || "";
      
      console.log("AuthContext: Generating username from metadata:", {
        fullName, firstName, lastName, email
      });
      
      // Helper function to sanitize text for username
      const sanitizeForUsername = (text: string): string => {
        return text
          .replace(/[^א-תa-zA-Z0-9]/g, '') // Remove invalid characters
          .trim();
      };
      
      // Try different approaches to generate a base username
      let baseUsername = "";
      
      if (firstName && lastName) {
        // Prefer FirstLast format
        baseUsername = sanitizeForUsername(firstName + lastName);
      } else if (fullName) {
        // Use full name, remove spaces
        baseUsername = sanitizeForUsername(fullName);
      } else if (email) {
        // Fallback to email prefix
        baseUsername = sanitizeForUsername(email.split('@')[0]);
      }
      
      // Ensure minimum length
      if (baseUsername.length < 2) {
        baseUsername = "User";
      }
      
      // Ensure maximum length (leave room for numbers)
      if (baseUsername.length > 45) {
        baseUsername = baseUsername.substring(0, 45);
      }
      
      console.log("AuthContext: Base username:", baseUsername);
      
      // Check if base username is available
      const { data: existing } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', baseUsername)
        .maybeSingle();
      
      if (!existing) {
        console.log("AuthContext: Base username available:", baseUsername);
        return baseUsername;
      }
      
      // Username exists, try with random numbers
      for (let attempt = 1; attempt <= 10; attempt++) {
        const randomNum = Math.floor(Math.random() * 9999) + 1;
        const suggestedUsername = baseUsername + randomNum;
        
        const { data: existingWithNum } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', suggestedUsername)
          .maybeSingle();
        
        if (!existingWithNum) {
          console.log("AuthContext: Found available username:", suggestedUsername);
          return suggestedUsername;
        }
      }
      
      // If all attempts failed, use timestamp
      const timestamp = Date.now().toString().slice(-4);
      const finalUsername = baseUsername + timestamp;
      console.log("AuthContext: Using timestamp-based username:", finalUsername);
      
      return finalUsername;
      
    } catch (error) {
      console.error("AuthContext: Error generating username:", error);
      // Fallback to simple random username
      const fallback = "User" + Math.floor(Math.random() * 9999);
      console.log("AuthContext: Using fallback username:", fallback);
      return fallback;
    }
  };

  const fetchUserProfile = async (user: User) => {
    try {
      console.log("AuthContext: Fetching profile for user:", user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error("AuthContext: Error fetching profile:", error);
        toast({
          variant: "destructive",
          title: "שגיאה",
          description: "אירעה שגיאה בטעינת הפרופיל"
        });
        return;
      }

      if (data) {
        console.log("AuthContext: Profile found:", data.username);
        setCurrentUser({
          id: data.id,
          username: data.username,
          isAdmin: data.is_admin || false
        });
        setIsLoading(false);
      } else {
        console.log("AuthContext: No profile found, user needs to select username");
        console.log("AuthContext: Generating suggested username...");
        
        // Generate a suggested username
        const suggested = await generateSuggestedUsername(user);
        setSuggestedUsername(suggested);
        console.log("AuthContext: Suggested username:", suggested);
        
        // User needs to select a username - set flags to show the dialog
        setNeedsUsernameSelection(true);
        setShowUsernameDialog(true);
        setCurrentUser(null);
        
        // IMPORTANT: Stop loading immediately so the dialog can show
        setIsLoading(false);
        console.log("AuthContext: Loading set to false, dialog should now be visible");
      }
    } catch (error) {
      console.error("AuthContext: Error in fetchUserProfile:", error);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בטעינת המערכת"
      });
    }
  };

  useEffect(() => {
    console.log("AuthContext: Initializing auth");
    
    let mounted = true;

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("AuthContext: Auth state changed:", event, session ? 'session exists' : 'no session');
      
      if (!mounted) return;
      
      setSession(session);
      
      if (session?.user) {
        // Fetch user profile
        fetchUserProfile(session.user);
      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("AuthContext: Error getting initial session:", error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }
        
        console.log("AuthContext: Initial session check:", session ? 'found' : 'none');
        
        // If no session found, stop loading immediately
        if (!session && mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("AuthContext: Error in getInitialSession:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
      
      // Configure email redirect URL for security
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
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

  const setUsernameSelected = (username: string) => {
    if (session?.user) {
      console.log("AuthContext: Username selected:", username);
      setCurrentUser({
        id: session.user.id,
        username: username,
        isAdmin: false
      });
      setNeedsUsernameSelection(false);
      setShowUsernameDialog(false);
      // Loading is already false, no need to change it
    }
  };

  const hideUsernameDialog = () => {
    setShowUsernameDialog(false);
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      currentUser, 
      isLoading,
      needsUsernameSelection,
      showUsernameDialog,
      suggestedUsername,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      refreshUser,
      setUsernameSelected,
      hideUsernameDialog
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
