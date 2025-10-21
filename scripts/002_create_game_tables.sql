-- Tabla de partidas del juego
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  score integer default 0,
  level integer default 1,
  duration_seconds integer default 0,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de puntuaciones máximas
create table if not exists public.high_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  score integer not null,
  level integer not null,
  achieved_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, score)
);

-- Tabla de logros
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  icon text,
  points integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de logros de usuario
create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  achievement_id uuid references public.achievements(id) on delete cascade not null,
  earned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, achievement_id)
);

-- Habilitar RLS en todas las tablas
alter table public.game_sessions enable row level security;
alter table public.high_scores enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

-- Políticas RLS para game_sessions
create policy "game_sessions_select_own"
  on public.game_sessions for select
  using (auth.uid() = user_id);

create policy "game_sessions_insert_own"
  on public.game_sessions for insert
  with check (auth.uid() = user_id);

-- Políticas RLS para high_scores
create policy "high_scores_select_all"
  on public.high_scores for select
  using (true);

create policy "high_scores_insert_own"
  on public.high_scores for insert
  with check (auth.uid() = user_id);

-- Políticas RLS para achievements (solo lectura para todos)
create policy "achievements_select_all"
  on public.achievements for select
  using (true);

-- Políticas RLS para user_achievements
create policy "user_achievements_select_own"
  on public.user_achievements for select
  using (auth.uid() = user_id);

create policy "user_achievements_insert_own"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);
