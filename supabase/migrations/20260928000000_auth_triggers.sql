-- Migration: Auth Triggers for NexTrade Pro

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into profiles
    INSERT INTO public.profiles (id, full_name, username, role, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario Nuevo'),
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        'USER',
        'ACTIVE'
    );

    -- Insert into accounts (Balance and capital will default to 0 due to table schema)
    INSERT INTO public.accounts (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to call the function after a user is inserted in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
