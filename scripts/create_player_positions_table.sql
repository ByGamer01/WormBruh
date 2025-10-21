-- Create table for real-time player positions
CREATE TABLE IF NOT EXISTS player_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL,
  is_alive BOOLEAN NOT NULL DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_player_positions_user_id ON player_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_player_positions_is_alive ON player_positions(is_alive);
CREATE INDEX IF NOT EXISTS idx_player_positions_last_updated ON player_positions(last_updated);

-- Enable Row Level Security
ALTER TABLE player_positions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read all player positions
CREATE POLICY "Anyone can read player positions"
  ON player_positions FOR SELECT
  USING (true);

-- Policy: Users can insert their own position
CREATE POLICY "Users can insert own position"
  ON player_positions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own position
CREATE POLICY "Users can update own position"
  ON player_positions FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own position
CREATE POLICY "Users can delete own position"
  ON player_positions FOR DELETE
  USING (auth.uid() = user_id);

-- Create table for food/points
CREATE TABLE IF NOT EXISTS game_food (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  x REAL NOT NULL,
  y REAL NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0.01, -- Value in dollars
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for food
ALTER TABLE game_food ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read food
CREATE POLICY "Anyone can read food"
  ON game_food FOR SELECT
  USING (true);

-- Policy: System can manage food (we'll use service role for this)
CREATE POLICY "Service role can manage food"
  ON game_food FOR ALL
  USING (true);
