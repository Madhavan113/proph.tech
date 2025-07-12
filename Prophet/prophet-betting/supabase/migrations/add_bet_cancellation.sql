-- Add cancelled field to bets table
ALTER TABLE public.bets 
ADD COLUMN IF NOT EXISTS cancelled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES public.users(id);

-- Create RPC function for atomic bet cancellation
CREATE OR REPLACE FUNCTION cancel_bet(
  p_bet_id UUID,
  p_cancelled_by UUID
) RETURNS JSON AS $$
DECLARE
  v_bet RECORD;
  v_participant RECORD;
  v_refund_count INTEGER := 0;
  v_total_refunded DECIMAL := 0;
  v_result JSON;
BEGIN
  -- Get bet details with lock
  SELECT * INTO v_bet
  FROM bets
  WHERE id = p_bet_id
  FOR UPDATE;
  
  -- Validate bet exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bet not found';
  END IF;
  
  -- Check if bet is already resolved or cancelled
  IF v_bet.resolved OR v_bet.cancelled THEN
    RAISE EXCEPTION 'Bet is already resolved or cancelled';
  END IF;
  
  -- Check if user is the creator
  IF v_bet.creator_id != p_cancelled_by THEN
    RAISE EXCEPTION 'Only the bet creator can cancel this bet';
  END IF;
  
  -- Check if deadline has passed
  IF v_bet.deadline <= NOW() THEN
    RAISE EXCEPTION 'Cannot cancel bet after deadline';
  END IF;
  
  -- Mark bet as cancelled
  UPDATE bets
  SET 
    cancelled = TRUE,
    cancelled_at = NOW(),
    cancelled_by = p_cancelled_by,
    resolved = TRUE,
    resolved_at = NOW()
  WHERE id = p_bet_id;
  
  -- Refund all participants
  FOR v_participant IN 
    SELECT user_id, stake_amount 
    FROM bet_participants 
    WHERE bet_id = p_bet_id
  LOOP
    -- Create refund transaction
    INSERT INTO credit_transactions (
      user_id, 
      amount, 
      transaction_type, 
      description, 
      bet_id
    )
    VALUES (
      v_participant.user_id, 
      v_participant.stake_amount, 
      'refund', 
      'Bet cancelled by creator', 
      p_bet_id
    );
    
    v_refund_count := v_refund_count + 1;
    v_total_refunded := v_total_refunded + v_participant.stake_amount;
  END LOOP;
  
  -- Return result
  SELECT json_build_object(
    'refunded_count', v_refund_count,
    'total_refunded', v_total_refunded
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cancel_bet(UUID, UUID) TO authenticated;

-- Add index for cancelled bets
CREATE INDEX IF NOT EXISTS idx_bets_cancelled ON public.bets(cancelled) WHERE cancelled = TRUE;

-- Update RLS policies to prevent betting on cancelled bets
DROP POLICY IF EXISTS "Users cannot bet on cancelled bets" ON public.bet_participants;
CREATE POLICY "Users cannot bet on cancelled bets" ON public.bet_participants
  FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = bet_participants.bet_id
      AND bets.cancelled = TRUE
    )
  );

-- Add comments for documentation
COMMENT ON COLUMN public.bets.cancelled IS 'Whether the bet was cancelled by the creator';
COMMENT ON COLUMN public.bets.cancelled_at IS 'Timestamp when the bet was cancelled';
COMMENT ON COLUMN public.bets.cancelled_by IS 'User who cancelled the bet';
COMMENT ON FUNCTION cancel_bet(UUID, UUID) IS 'Atomically cancels a bet and refunds all participants';
