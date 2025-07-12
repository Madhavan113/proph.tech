-- Add user profile fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email_bets": true, "email_wins": true, "email_appeals": true}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add constraints
ALTER TABLE public.users
ADD CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
ADD CONSTRAINT full_name_length CHECK (char_length(full_name) <= 100),
ADD CONSTRAINT avatar_url_format CHECK (avatar_url IS NULL OR avatar_url ~ '^https?://.+\.(jpg|jpeg|png|gif|webp)$');

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Update RLS policies for users table
-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT
  USING (auth.uid() = id);  

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE (
  total_bets INTEGER,
  bets_won INTEGER,
  bets_lost INTEGER,
  total_wagered DECIMAL,
  total_won DECIMAL,
  win_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH user_bets AS (
    SELECT 
      bp.id,
      bp.stake_amount,
      bp.prediction,
      b.resolved,
      ad.outcome
    FROM bet_participants bp
    JOIN bets b ON b.id = bp.bet_id
    LEFT JOIN arbitrator_decisions ad ON ad.bet_id = b.id
    WHERE bp.user_id = p_user_id
  ),
  bet_stats AS (
    SELECT
      COUNT(*)::INTEGER as total_bets,
      COUNT(CASE WHEN resolved = true AND prediction = outcome THEN 1 END)::INTEGER as bets_won,
      COUNT(CASE WHEN resolved = true AND prediction != outcome THEN 1 END)::INTEGER as bets_lost,
      COALESCE(SUM(stake_amount), 0) as total_wagered
    FROM user_bets
  ),
  winnings AS (
    SELECT COALESCE(SUM(amount), 0) as total_won
    FROM credit_transactions
    WHERE user_id = p_user_id
    AND transaction_type = 'payout'
  )
  SELECT 
    bet_stats.total_bets,
    bet_stats.bets_won,
    bet_stats.bets_lost,
    bet_stats.total_wagered,
    winnings.total_won,
    CASE 
      WHEN bet_stats.total_bets > 0 
      THEN ROUND((bet_stats.bets_won::DECIMAL / bet_stats.total_bets::DECIMAL) * 100, 2)
      ELSE 0
    END as win_rate
  FROM bet_stats, winnings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_stats(UUID) TO authenticated;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN public.users.username IS 'Unique username for the user, 3-30 characters';
COMMENT ON COLUMN public.users.full_name IS 'User''s full name for display purposes';
COMMENT ON COLUMN public.users.avatar_url IS 'URL to user''s avatar image';
COMMENT ON COLUMN public.users.notification_preferences IS 'JSON object storing user''s notification preferences';
COMMENT ON FUNCTION get_user_stats(UUID) IS 'Returns betting statistics for a given user';
