
export interface Guess {
  word: string;
  similarity: number;
  rank?: number;
  isCorrect: boolean;
}

export interface DailyWord {
  word: string;
  date: string; // ISO format
  hints?: string[];
}

export interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  stats: UserStats;
}

export interface UserStats {
  gamesWon: number;
  totalGames: number;
  bestGuessCount: number;
  averageGuessCount: number;
  winStreak: number;
}

export interface GameState {
  guesses: Guess[];
  isComplete: boolean;
  wordDate: string; // ISO format of the current word's date
}
