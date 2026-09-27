-- ==========================================
-- ADMIN: REGISTER RESULT (PROFIT/LOSS)
-- ==========================================
CREATE OR REPLACE FUNCTION admin_register_result(
    p_target_user_id UUID,
    p_type TEXT, -- 'PROFIT' or 'LOSS'
    p_amount NUMERIC,
    p_concept TEXT
) RETURNS JSONB AS $$
DECLARE
    v_account RECORD;
BEGIN
    IF NOT is_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
    IF p_amount <= 0 THEN RAISE EXCEPTION 'Monto inválido'; END IF;
    IF p_type NOT IN ('PROFIT', 'LOSS') THEN RAISE EXCEPTION 'Tipo inválido'; END IF;

    SELECT * INTO v_account FROM accounts WHERE user_id = p_target_user_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Cuenta no encontrada'; END IF;

    IF p_type = 'PROFIT' THEN
        UPDATE accounts SET 
            balance = balance + p_amount, 
            profit = profit + p_amount, 
            updated_at = NOW() 
        WHERE id = v_account.id;
        
        INSERT INTO transactions (account_id, user_id, type, amount, balance_before, balance_after, metadata)
        VALUES (v_account.id, p_target_user_id, 'PROFIT', p_amount, v_account.balance, v_account.balance + p_amount, jsonb_build_object('concept', p_concept));

    ELSIF p_type = 'LOSS' THEN
        IF v_account.balance < p_amount THEN RAISE EXCEPTION 'Saldo insuficiente para la pérdida'; END IF;
        
        UPDATE accounts SET 
            balance = balance - p_amount, 
            loss = loss + p_amount, 
            updated_at = NOW() 
        WHERE id = v_account.id;
        
        INSERT INTO transactions (account_id, user_id, type, amount, balance_before, balance_after, metadata)
        VALUES (v_account.id, p_target_user_id, 'LOSS', p_amount, v_account.balance, v_account.balance - p_amount, jsonb_build_object('concept', p_concept));
    END IF;

    INSERT INTO audit_logs (actor_user_id, target_user_id, action, metadata)
    VALUES (auth.uid(), p_target_user_id, 'REGISTER_RESULT', jsonb_build_object('type', p_type, 'amount', p_amount, 'concept', p_concept));

    RETURN '{"status": "success"}'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
