-- Tabla de mesas de juego activas
CREATE TABLE IF NOT EXISTS game_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stake_amount NUMERIC NOT NULL CHECK (stake_amount > 0),
  max_players INTEGER DEFAULT 50,
  current_players INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de jugadores activos en partida
CREATE TABLE IF NOT EXISTS active_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES game_tables(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  color TEXT NOT NULL,
  x REAL DEFAULT 2000,
  y REAL DEFAULT 2000,
  segments JSONB DEFAULT '[]',
  score INTEGER DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  is_alive BOOLEAN DEFAULT true,
  is_boosting BOOLEAN DEFAULT false,
  angle REAL DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, table_id)
);

-- Tabla de comida en el juego
CREATE TABLE IF NOT EXISTS game_food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES game_tables(id) ON DELETE CASCADE,
  x REAL NOT NULL,
  y REAL NOT NULL,
  value NUMERIC DEFAULT 0.01,
  color TEXT NOT NULL,
  size REAL DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de kills/muertes
CREATE TABLE IF NOT EXISTS game_kills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES game_tables(id),
  killer_id UUID REFERENCES auth.users(id),
  victim_id UUID NOT NULL REFERENCES auth.users(id),
  victim_value NUMERIC NOT NULL,
  killer_reward NUMERIC NOT NULL,
  fee_amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mensajes del chat del juego
CREATE TABLE IF NOT EXISTS game_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES game_tables(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar mesas predeterminadas
INSERT INTO game_tables (stake_amount, max_players) VALUES 
  (1, 50),
  (5, 30),
  (20, 20)
ON CONFLICT DO NOTHING;

-- Habilitar RLS
ALTER TABLE game_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_kills ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_chat ENABLE ROW LEVEL SECURITY;

-- Políticas para game_tables
CREATE POLICY "Anyone can view tables" ON game_tables FOR SELECT USING (true);

-- Políticas para active_players
CREATE POLICY "Anyone can view active players" ON active_players FOR SELECT USING (true);
CREATE POLICY "Users can insert own player" ON active_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own player" ON active_players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own player" ON active_players FOR DELETE USING (auth.uid() = user_id);

-- Políticas para game_food_items
CREATE POLICY "Anyone can view food" ON game_food_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can delete food" ON game_food_items FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para game_kills
CREATE POLICY "Anyone can view kills" ON game_kills FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert kills" ON game_kills FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Políticas para game_chat
CREATE POLICY "Anyone can view chat" ON game_chat FOR SELECT USING (true);
CREATE POLICY "Authenticated can send messages" ON game_chat FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Habilitar Realtime para las tablas del juego
ALTER PUBLICATION supabase_realtime ADD TABLE active_players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_food_items;
ALTER PUBLICATION supabase_realtime ADD TABLE game_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE game_kills;
