-- Add performance indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_user_guesses_user_date ON user_guesses(user_id, word_date);
CREATE INDEX IF NOT EXISTS idx_user_guesses_word_date ON user_guesses(word_date);
CREATE INDEX IF NOT EXISTS idx_daily_words_date ON daily_words(date);
CREATE INDEX IF NOT EXISTS idx_daily_scores_user_date ON daily_scores(user_id, word_date);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_word ON game_sessions(user_id, word_id);

-- Add proper foreign key constraints for data integrity
ALTER TABLE user_guesses ADD CONSTRAINT fk_user_guesses_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE daily_scores ADD CONSTRAINT fk_daily_scores_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE game_sessions ADD CONSTRAINT fk_game_sessions_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add check constraints for data validation
ALTER TABLE user_guesses ADD CONSTRAINT chk_similarity_range CHECK (similarity >= 0 AND similarity <= 1);
ALTER TABLE user_guesses ADD CONSTRAINT chk_positive_guess_order CHECK (guess_order > 0);
ALTER TABLE daily_scores ADD CONSTRAINT chk_positive_guesses_count CHECK (guesses_count > 0);

-- Optimize user_stats table with proper constraints
ALTER TABLE user_stats ADD CONSTRAINT chk_non_negative_stats CHECK (
  games_played >= 0 AND 
  games_won >= 0 AND 
  win_streak >= 0 AND 
  best_streak >= 0 AND 
  total_guesses >= 0 AND
  games_won <= games_played
);

-- Add unique constraints where needed
ALTER TABLE daily_words ADD CONSTRAINT unique_daily_word_per_date UNIQUE (date, is_active) DEFERRABLE;
ALTER TABLE daily_scores ADD CONSTRAINT unique_user_score_per_date UNIQUE (user_id, word_date);

-- Enable row level security on audit_logs (it should already be enabled but ensure it)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;