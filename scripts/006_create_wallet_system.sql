-- Creando sistema de fondos y balance de usuarios
create table if not exists public.user_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  balance decimal(10,2) default 0.00 not null,
  total_deposited decimal(10,2) default 0.00 not null,
  total_withdrawn decimal(10,2) default 0.00 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de transacciones
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('deposit', 'withdrawal', 'game_win', 'game_loss', 'bet')),
  amount decimal(10,2) not null,
  description text,
  game_session_id uuid references public.game_sessions(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.user_wallets enable row level security;
alter table public.wallet_transactions enable row level security;

-- Políticas RLS para user_wallets
create policy "user_wallets_select_own"
  on public.user_wallets for select
  using (auth.uid() = user_id);

create policy "user_wallets_insert_own"
  on public.user_wallets for insert
  with check (auth.uid() = user_id);

create policy "user_wallets_update_own"
  on public.user_wallets for update
  using (auth.uid() = user_id);

-- Políticas RLS para wallet_transactions
create policy "wallet_transactions_select_own"
  on public.wallet_transactions for select
  using (auth.uid() = user_id);

create policy "wallet_transactions_insert_own"
  on public.wallet_transactions for insert
  with check (auth.uid() = user_id);

-- Función para crear wallet automáticamente
create or replace function public.handle_new_user_wallet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_wallets (user_id, balance)
  values (new.id, 0.00)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Trigger para crear wallet automáticamente
drop trigger if exists on_auth_user_created_wallet on auth.users;
create trigger on_auth_user_created_wallet
  after insert on auth.users
  for each row
  execute function public.handle_new_user_wallet();
