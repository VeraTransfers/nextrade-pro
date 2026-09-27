-- NexTrade Pro - Initial Backend Schema
-- Compatible with Supabase & PostgreSQL

-- Types
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'BLOCKED');
CREATE TYPE transaction_type AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'BUY', 'SELL', 'PROFIT', 'LOSS', 'ADJUSTMENT');
CREATE TYPE withdrawal_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- ==========================================
-- 1. PROFILES
-- ==========================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'USER',
    status user_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 2. ACCOUNTS
-- ==========================================
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    balance NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    capital NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (capital >= 0),
    invested NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (invested >= 0),
    profit NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (profit >= 0),
    loss NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (loss >= 0),
    block_withdrawals BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 3. PORTFOLIO POSITIONS
-- ==========================================
CREATE TABLE portfolio_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    quantity NUMERIC(18, 8) NOT NULL CHECK (quantity >= 0),
    average_price NUMERIC(18, 4) NOT NULL CHECK (average_price >= 0),
    invested_amount NUMERIC(18, 4) NOT NULL CHECK (invested_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(account_id, symbol)
);

-- ==========================================
-- 4. TRANSACTIONS (LEDGER)
-- ==========================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    symbol TEXT,
    quantity NUMERIC(18, 8),
    price NUMERIC(18, 4),
    amount NUMERIC(18, 4) NOT NULL CHECK (amount > 0),
    balance_before NUMERIC(18, 4) NOT NULL,
    balance_after NUMERIC(18, 4) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 5. WITHDRAWALS
-- ==========================================
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC(18, 4) NOT NULL CHECK (amount > 0),
    status withdrawal_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES profiles(id),
    rejection_reason TEXT
);

-- ==========================================
-- 6. AUDIT LOGS
-- ==========================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- INDICES
-- ==========================================
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_portfolio_account_id ON portfolio_positions(account_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Helper function to verify admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own. Admins can read all.
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON profiles FOR ALL USING (is_admin());

-- Accounts: Users can read their own. Admins can read all.
CREATE POLICY "Users view own account" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all accounts" ON accounts FOR ALL USING (is_admin());

-- Portfolio: Users can read their own. Admins can read all.
CREATE POLICY "Users view own portfolio" ON portfolio_positions FOR SELECT USING (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));
CREATE POLICY "Admins view all portfolios" ON portfolio_positions FOR ALL USING (is_admin());

-- Transactions: Users can read their own. Admins can read all.
CREATE POLICY "Users view own transactions" ON transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins view all transactions" ON transactions FOR ALL USING (is_admin());

-- Withdrawals: Users can read their own. Admins can read all.
CREATE POLICY "Users view own withdrawals" ON withdrawals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins view all withdrawals" ON withdrawals FOR ALL USING (is_admin());

-- Audit logs: Admins only.
CREATE POLICY "Admins view audit logs" ON audit_logs FOR ALL USING (is_admin());


-- ==========================================
-- DATABASE FUNCTIONS (MOTORES FINANCIEROS)
-- ==========================================

-- MOTOR COMPRA (EXECUTE BUY)
CREATE OR REPLACE FUNCTION execute_buy(
    p_symbol TEXT,
    p_asset_type TEXT,
    p_quantity NUMERIC,
    p_price NUMERIC
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_account RECORD;
    v_cost NUMERIC;
    v_position RECORD;
    v_new_quantity NUMERIC;
    v_new_invested NUMERIC;
    v_new_avg_price NUMERIC;
BEGIN
    -- 1. Validaciones iniciales
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'No autorizado'; END IF;
    IF p_quantity <= 0 THEN RAISE EXCEPTION 'Cantidad inválida'; END IF;
    IF p_price <= 0 THEN RAISE EXCEPTION 'Precio inválido'; END IF;

    v_cost := p_quantity * p_price;

    -- 2. Bloquear cuenta y verificar saldo
    SELECT * INTO v_account FROM accounts WHERE user_id = v_user_id FOR UPDATE;
    
    IF NOT FOUND THEN RAISE EXCEPTION 'Cuenta no encontrada'; END IF;
    IF (SELECT status FROM profiles WHERE id = v_user_id) != 'ACTIVE' THEN RAISE EXCEPTION 'Usuario bloqueado'; END IF;
    IF v_account.balance < v_cost THEN RAISE EXCEPTION 'Saldo insuficiente'; END IF;

    -- 3. Actualizar cuenta (descontar saldo)
    UPDATE accounts SET 
        balance = balance - v_cost,
        invested = invested + v_cost,
        updated_at = NOW()
    WHERE id = v_account.id;

    -- 4. Actualizar o Crear Posición
    SELECT * INTO v_position FROM portfolio_positions WHERE account_id = v_account.id AND symbol = p_symbol FOR UPDATE;

    IF FOUND THEN
        v_new_quantity := v_position.quantity + p_quantity;
        v_new_invested := v_position.invested_amount + v_cost;
        v_new_avg_price := v_new_invested / v_new_quantity;

        UPDATE portfolio_positions SET
            quantity = v_new_quantity,
            invested_amount = v_new_invested,
            average_price = v_new_avg_price,
            updated_at = NOW()
        WHERE id = v_position.id;
    ELSE
        INSERT INTO portfolio_positions (account_id, symbol, asset_type, quantity, average_price, invested_amount)
        VALUES (v_account.id, p_symbol, p_asset_type, p_quantity, p_price, v_cost);
    END IF;

    -- 5. Registrar Transacción
    INSERT INTO transactions (account_id, user_id, type, symbol, quantity, price, amount, balance_before, balance_after)
    VALUES (v_account.id, v_user_id, 'BUY', p_symbol, p_quantity, p_price, v_cost, v_account.balance, v_account.balance - v_cost);

    RETURN '{"status": "success"}'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- MOTOR VENTA (EXECUTE SELL)
CREATE OR REPLACE FUNCTION execute_sell(
    p_symbol TEXT,
    p_quantity NUMERIC,
    p_price NUMERIC
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_account RECORD;
    v_position RECORD;
    v_revenue NUMERIC;
    v_ratio NUMERIC;
    v_cost_basis NUMERIC;
    v_profit_loss NUMERIC;
    v_is_profit BOOLEAN;
BEGIN
    -- 1. Validaciones
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'No autorizado'; END IF;
    IF p_quantity <= 0 THEN RAISE EXCEPTION 'Cantidad inválida'; END IF;
    IF p_price <= 0 THEN RAISE EXCEPTION 'Precio inválido'; END IF;

    v_revenue := p_quantity * p_price;

    -- 2. Bloquear cuenta y posición
    SELECT * INTO v_account FROM accounts WHERE user_id = v_user_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Cuenta no encontrada'; END IF;
    IF (SELECT status FROM profiles WHERE id = v_user_id) != 'ACTIVE' THEN RAISE EXCEPTION 'Usuario bloqueado'; END IF;

    SELECT * INTO v_position FROM portfolio_positions WHERE account_id = v_account.id AND symbol = p_symbol FOR UPDATE;
    IF NOT FOUND OR v_position.quantity < p_quantity THEN RAISE EXCEPTION 'Posición insuficiente'; END IF;

    -- 3. Calcular P/L
    v_ratio := p_quantity / v_position.quantity;
    v_cost_basis := v_position.invested_amount * v_ratio;
    v_profit_loss := v_revenue - v_cost_basis;
    v_is_profit := v_profit_loss > 0;

    -- 4. Actualizar Posición
    IF v_position.quantity - p_quantity <= 0.000001 THEN
        -- Venta Total
        DELETE FROM portfolio_positions WHERE id = v_position.id;
    ELSE
        -- Venta Parcial
        UPDATE portfolio_positions SET
            quantity = quantity - p_quantity,
            invested_amount = invested_amount - v_cost_basis,
            updated_at = NOW()
        WHERE id = v_position.id;
    END IF;

    -- 5. Actualizar Cuenta
    UPDATE accounts SET
        balance = balance + v_revenue,
        invested = invested - v_cost_basis,
        profit = profit + CASE WHEN v_is_profit THEN v_profit_loss ELSE 0 END,
        loss = loss + CASE WHEN NOT v_is_profit THEN ABS(v_profit_loss) ELSE 0 END,
        updated_at = NOW()
    WHERE id = v_account.id;

    -- 6. Registrar Transacción
    INSERT INTO transactions (account_id, user_id, type, symbol, quantity, price, amount, balance_before, balance_after)
    VALUES (v_account.id, v_user_id, 'SELL', p_symbol, p_quantity, p_price, v_revenue, v_account.balance, v_account.balance + v_revenue);

    RETURN '{"status": "success"}'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================
-- REQUEST WITHDRAWAL
-- ==========================================
CREATE OR REPLACE FUNCTION request_withdrawal(
    p_amount NUMERIC
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_account RECORD;
BEGIN
    IF p_amount <= 0 THEN RAISE EXCEPTION 'Monto inválido'; END IF;

    SELECT * INTO v_account FROM accounts WHERE user_id = v_user_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Cuenta no encontrada'; END IF;
    IF v_account.block_withdrawals THEN RAISE EXCEPTION 'Retiros bloqueados'; END IF;
    IF v_account.balance < p_amount THEN RAISE EXCEPTION 'Saldo insuficiente'; END IF;

    -- Descontar saldo
    UPDATE accounts SET balance = balance - p_amount, updated_at = NOW() WHERE id = v_account.id;

    -- Registrar withdrawal
    INSERT INTO withdrawals (account_id, user_id, amount, status)
    VALUES (v_account.id, v_user_id, p_amount, 'PENDING');

    -- Registrar transaccion
    INSERT INTO transactions (account_id, user_id, type, amount, balance_before, balance_after)
    VALUES (v_account.id, v_user_id, 'WITHDRAWAL', p_amount, v_account.balance, v_account.balance - p_amount);

    RETURN '{"status": "success"}'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ==========================================
-- ADMIN: APPROVE WITHDRAWAL
-- ==========================================
CREATE OR REPLACE FUNCTION approve_withdrawal(
    p_withdrawal_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_withdrawal RECORD;
BEGIN
    IF NOT is_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;

    SELECT * INTO v_withdrawal FROM withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
    IF NOT FOUND OR v_withdrawal.status != 'PENDING' THEN RAISE EXCEPTION 'Retiro no válido o ya procesado'; END IF;

    UPDATE withdrawals SET status = 'APPROVED', processed_at = NOW(), processed_by = auth.uid() WHERE id = p_withdrawal_id;

    INSERT INTO audit_logs (actor_user_id, target_user_id, action, metadata)
    VALUES (auth.uid(), v_withdrawal.user_id, 'APPROVE_WITHDRAWAL', jsonb_build_object('amount', v_withdrawal.amount));

    RETURN '{"status": "success"}'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================
-- ADMIN: REJECT WITHDRAWAL
-- ==========================================
CREATE OR REPLACE FUNCTION reject_withdrawal(
    p_withdrawal_id UUID,
    p_reason TEXT
) RETURNS JSONB AS $$
DECLARE
    v_withdrawal RECORD;
    v_account RECORD;
BEGIN
    IF NOT is_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;

    SELECT * INTO v_withdrawal FROM withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
    IF NOT FOUND OR v_withdrawal.status != 'PENDING' THEN RAISE EXCEPTION 'Retiro no válido o ya procesado'; END IF;

    SELECT * INTO v_account FROM accounts WHERE id = v_withdrawal.account_id FOR UPDATE;

    -- Reembolsar
    UPDATE accounts SET balance = balance + v_withdrawal.amount, updated_at = NOW() WHERE id = v_account.id;

    -- Marcar como rechazado
    UPDATE withdrawals SET status = 'REJECTED', processed_at = NOW(), processed_by = auth.uid(), rejection_reason = p_reason WHERE id = p_withdrawal_id;

    -- Registrar transaccion compensatoria
    INSERT INTO transactions (account_id, user_id, type, amount, balance_before, balance_after, metadata)
    VALUES (v_account.id, v_withdrawal.user_id, 'ADJUSTMENT', v_withdrawal.amount, v_account.balance, v_account.balance + v_withdrawal.amount, jsonb_build_object('reason', 'Refund from rejected withdrawal'));

    INSERT INTO audit_logs (actor_user_id, target_user_id, action, metadata)
    VALUES (auth.uid(), v_withdrawal.user_id, 'REJECT_WITHDRAWAL', jsonb_build_object('amount', v_withdrawal.amount));

    RETURN '{"status": "success"}'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================
-- ADMIN: CREDIT FUNDS
-- ==========================================
CREATE OR REPLACE FUNCTION admin_credit_funds(
    p_target_user_id UUID,
    p_amount NUMERIC
) RETURNS JSONB AS $$
DECLARE
    v_account RECORD;
BEGIN
    IF NOT is_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
    IF p_amount <= 0 THEN RAISE EXCEPTION 'Monto inválido'; END IF;

    SELECT * INTO v_account FROM accounts WHERE user_id = p_target_user_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Cuenta no encontrada'; END IF;

    UPDATE accounts SET 
        balance = balance + p_amount, 
        capital = capital + p_amount, 
        updated_at = NOW() 
    WHERE id = v_account.id;

    INSERT INTO transactions (account_id, user_id, type, amount, balance_before, balance_after)
    VALUES (v_account.id, p_target_user_id, 'DEPOSIT', p_amount, v_account.balance, v_account.balance + p_amount);

    INSERT INTO audit_logs (actor_user_id, target_user_id, action, metadata)
    VALUES (auth.uid(), p_target_user_id, 'CREDIT_FUNDS', jsonb_build_object('amount', p_amount));

    RETURN '{"status": "success"}'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
