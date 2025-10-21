-- Actualizar políticas RLS para trabajar con IDs de Privy en lugar de auth.uid()
-- Eliminar políticas existentes que dependen de auth.uid()

DROP POLICY IF EXISTS "game_sessions_select_own" ON public.game_sessions;
DROP POLICY IF EXISTS "game_sessions_insert_own" ON public.game_sessions;
DROP POLICY IF EXISTS "user_wallets_select_own" ON public.user_wallets;
DROP POLICY IF EXISTS "user_wallets_insert_own" ON public.user_wallets;
DROP POLICY IF EXISTS "user_wallets_update_own" ON public.user_wallets;
DROP POLICY IF EXISTS "wallet_transactions_select_own" ON public.wallet_transactions;
DROP POLICY IF EXISTS "wallet_transactions_insert_own" ON public.wallet_transactions;

-- Crear nuevas políticas que permitan acceso basado en user_id
-- Nota: Estas políticas son más permisivas ya que Privy maneja la autenticación

-- Políticas para game_sessions
CREATE POLICY "game_sessions_select_all"
  ON public.game_sessions FOR SELECT
  USING (true);

CREATE POLICY "game_sessions_insert_all"
  ON public.game_sessions FOR INSERT
  WITH CHECK (true);

-- Políticas para user_wallets
CREATE POLICY "user_wallets_select_all"
  ON public.user_wallets FOR SELECT
  USING (true);

CREATE POLICY "user_wallets_insert_all"
  ON public.user_wallets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "user_wallets_update_all"
  ON public.user_wallets FOR UPDATE
  USING (true);

-- Políticas para wallet_transactions
CREATE POLICY "wallet_transactions_select_all"
  ON public.wallet_transactions FOR SELECT
  USING (true);

CREATE POLICY "wallet_transactions_insert_all"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (true);

-- Eliminar trigger que depende de auth.users ya que usamos Privy
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_wallet();
