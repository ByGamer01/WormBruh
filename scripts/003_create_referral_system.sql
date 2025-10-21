-- Tabla de códigos de referido
create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  code text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de referidos
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references auth.users(id) on delete cascade not null,
  referred_id uuid references auth.users(id) on delete cascade not null,
  referral_code text not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'rewarded')),
  reward_points integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now') not null,
  confirmed_at timestamp with time zone,
  unique(referred_id)
);

-- Tabla de recompensas por referidos
create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  referral_id uuid references public.referrals(id) on delete cascade not null,
  reward_type text not null check (reward_type in ('points', 'bonus_lives', 'premium_access')),
  reward_value integer not null,
  claimed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  claimed_at timestamp with time zone
);

-- Habilitar RLS
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_rewards enable row level security;

-- Políticas RLS para referral_codes
create policy "referral_codes_select_own"
  on public.referral_codes for select
  using (auth.uid() = user_id);

create policy "referral_codes_insert_own"
  on public.referral_codes for insert
  with check (auth.uid() = user_id);

-- Políticas RLS para referrals
create policy "referrals_select_own"
  on public.referrals for select
  using (auth.uid() = referrer_id or auth.uid() = referred_id);

create policy "referrals_insert_own"
  on public.referrals for insert
  with check (auth.uid() = referred_id);

create policy "referrals_update_own"
  on public.referrals for update
  using (auth.uid() = referrer_id or auth.uid() = referred_id);

-- Políticas RLS para referral_rewards
create policy "referral_rewards_select_own"
  on public.referral_rewards for select
  using (auth.uid() = user_id);

create policy "referral_rewards_update_own"
  on public.referral_rewards for update
  using (auth.uid() = user_id);

-- Función para generar código de referido único
create or replace function generate_referral_code()
returns text
language plpgsql
as $$
declare
  code text;
  exists boolean;
begin
  loop
    code := upper(substr(md5(random()::text), 1, 8));
    select count(*) > 0 into exists from public.referral_codes where referral_codes.code = code;
    if not exists then
      return code;
    end if;
  end loop;
end;
$$;

-- Función para crear código de referido automáticamente
create or replace function public.create_referral_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.referral_codes (user_id, code)
  values (new.id, generate_referral_code())
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Trigger para crear código de referido automáticamente
drop trigger if exists on_profile_created on public.profiles;

create trigger on_profile_created
  after insert on public.profiles
  for each row
  execute function public.create_referral_code();
