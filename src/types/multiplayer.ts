export interface GameRoom {
  id: string;
  room_code: string;
  word_date: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
  max_players: number;
}

export interface RoomPlayer {
  id: string;
  room_id: string;
  user_id: string;
  nickname: string;
  joined_at: string;
  is_active: boolean;
}

export interface RoomGuess {
  id: string;
  room_id: string;
  player_id: string;
  guess_word: string;
  similarity: number;
  rank?: number;
  is_correct: boolean;
  guess_order: number;
  created_at: string;
  player_nickname?: string; // Added for display purposes
}

export interface MultiplayerGameState {
  room: GameRoom | null;
  players: RoomPlayer[];
  guesses: RoomGuess[];
  currentPlayer: RoomPlayer | null;
  isComplete: boolean;
  currentWord: string | null;
}