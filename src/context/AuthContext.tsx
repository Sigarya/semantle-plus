
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "../types/game";

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: Record<string, { password: string, user: User }> = {
  "admin": {
    password: "admin123",
    user: {
      id: "1",
      username: "admin",
      isAdmin: true,
      stats: {
        gamesWon: 45,
        totalGames: 50,
        bestGuessCount: 3,
        averageGuessCount: 7.5,
        winStreak: 12
      }
    }
  },
  "user": {
    password: "user123",
    user: {
      id: "2",
      username: "user",
      isAdmin: false,
      stats: {
        gamesWon: 10,
        totalGames: 20,
        bestGuessCount: 5,
        averageGuessCount: 12.3,
        winStreak: 3
      }
    }
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for saved user in localStorage on initial load
    const savedUser = localStorage.getItem("semantle_user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    // Mock login implementation
    setIsLoading(true);
    
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const userRecord = mockUsers[username];
        if (userRecord && userRecord.password === password) {
          setCurrentUser(userRecord.user);
          localStorage.setItem("semantle_user", JSON.stringify(userRecord.user));
          setIsLoading(false);
          resolve();
        } else {
          setIsLoading(false);
          reject(new Error("שם משתמש או סיסמה שגויים"));
        }
      }, 1000);
    });
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("semantle_user");
  };

  const register = async (username: string, password: string) => {
    // Mock registration
    setIsLoading(true);
    
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (mockUsers[username]) {
          setIsLoading(false);
          reject(new Error("שם המשתמש כבר קיים"));
        } else {
          const newUser: User = {
            id: Date.now().toString(),
            username,
            isAdmin: false,
            stats: {
              gamesWon: 0,
              totalGames: 0,
              bestGuessCount: 0,
              averageGuessCount: 0,
              winStreak: 0
            }
          };
          
          mockUsers[username] = {
            password,
            user: newUser
          };
          
          setCurrentUser(newUser);
          localStorage.setItem("semantle_user", JSON.stringify(newUser));
          setIsLoading(false);
          resolve();
        }
      }, 1000);
    });
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout, register }}>
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
