-- Enable RLS and create policies for all tables

-- Profiles table policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Game sessions policies
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_sessions_select_own"
  ON game_sessions FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "game_sessions_insert_own"
  ON game_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- High scores policies (public read, own write)
ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "high_scores_select_all"
  ON high_scores FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "high_scores_insert_own"
  ON high_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- User achievements policies
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_achievements_select_own"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_achievements_insert_own"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Achievements table (public read)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements_select_all"
  ON achievements FOR SELECT
  TO authenticated, anon
  USING (true);
