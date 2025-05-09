
export interface Guess {
  word: string;
  similarity: number;
  rank?: number;
  isCorrect: boolean;
}

export interface DailyWord {
  id?: string;
  word: string;
  date: string; // ISO format
  hints?: string[];
  is_active?: boolean;
}

export interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  stats?: UserStats;
}

export interface UserStats {
  gamesWon: number;
  totalGames: number;
  bestGuessCount: number | null;
  averageGuessCount: number;
  winStreak: number;
  bestStreak: number;
}

export interface GameState {
  guesses: Guess[];
  isComplete: boolean;
  wordDate: string; // ISO format of the current word's date
}

export interface LeaderboardEntry {
  username: string;
  userId: string;
  guessesCount: number;
  completionTime: string;
  rank?: number;
}

export interface Theme {
  name: 'light' | 'dark';
  label: string;
}
