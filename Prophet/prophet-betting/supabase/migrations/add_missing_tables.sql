-- Migration: Add missing tables for Prophet betting platform
-- This migration adds appeals, comments, notifications, and other missing tables

-- 1. Add appeals table for AI arbitration appeals
CREATE TABLE IF NOT EXISTS public.appeals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bet_id UUID REFERENCES public.bets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(reason) >= 20),
  status TEXT CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')) DEFAULT 'pending' NOT NULL,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  UNIQUE(bet_id, user_id) -- One appeal per user per bet
);

-- 2. Add bet_comments table for social features
CREATE TABLE IF NOT EXISTS public.bet_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bet_id UUID REFERENCES public.bets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.bet_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  deleted_at TIMESTAMPTZ,
  edited BOOLEAN DEFAULT FALSE
);

-- 3. Add notifications table   
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bet_resolved', 'bet_joined', 'comment_reply', 'appeal_update', 'credit_received', 'admin_message')),
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- 4. Add user_preferences table for notification settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  notification_types JSONB DEFAULT '{"bet_resolved": true, "bet_joined": true, "comment_reply": true, "appeal_update": true, "credit_received": true, "admin_message": true}',
  theme TEXT CHECK (theme IN ('light', 'dark', 'system')) DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- 5. Add payment_transactions table for Stripe integration
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'USD' NOT NULL,
  credits_purchased INTEGER NOT NULL CHECK (credits_purchased > 0),
  status TEXT CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled')) DEFAULT 'pending' NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  completed_at TIMESTAMPTZ
);

-- 6. Add withdrawal_requests table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 10), -- Minimum $10 withdrawal
  credits_deducted INTEGER NOT NULL CHECK (credits_deducted > 0),
  status TEXT CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled')) DEFAULT 'pending' NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'paypal', 'stripe')) NOT NULL,
  payment_details JSONB NOT NULL, -- Encrypted payment details
  admin_notes TEXT,
  processed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 7. Add bet_cancellations table for audit trail
CREATE TABLE IF NOT EXISTS public.bet_cancellations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bet_id UUID REFERENCES public.bets(id) ON DELETE CASCADE NOT NULL UNIQUE,
  cancelled_by UUID REFERENCES public.users(id) ON DELETE SET NULL NOT NULL,
  reason TEXT NOT NULL,
  refund_total DECIMAL(14,4) DEFAULT 0,
  participants_refunded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appeals_bet ON public.appeals(bet_id);
CREATE INDEX IF NOT EXISTS idx_appeals_user ON public.appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON public.appeals(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_comments_bet ON public.bet_comments(bet_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.bet_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.bet_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawal_requests(status);

-- 9. Add triggers for updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER touch_comments_updated_at
BEFORE UPDATE ON public.bet_comments
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER touch_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 10. Enable Row Level Security
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_cancellations ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies

-- Appeals policies
DROP POLICY IF EXISTS "Users can view their own appeals" ON public.appeals;
CREATE POLICY "Users can view their own appeals" ON public.appeals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create appeals" ON public.appeals;
CREATE POLICY "Users can create appeals" ON public.appeals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all appeals" ON public.appeals;
CREATE POLICY "Admins can view all appeals" ON public.appeals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Comments policies
DROP POLICY IF EXISTS "Anyone can view non-deleted comments" ON public.bet_comments;
CREATE POLICY "Anyone can view non-deleted comments" ON public.bet_comments
  FOR SELECT USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.bet_comments;
CREATE POLICY "Authenticated users can create comments" ON public.bet_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.bet_comments;
CREATE POLICY "Users can update their own comments" ON public.bet_comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can soft delete their own comments" ON public.bet_comments;
CREATE POLICY "Users can soft delete their own comments" ON public.bet_comments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (deleted_at IS NOT NULL);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- User preferences policies
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Payment transactions policies
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payment_transactions;
CREATE POLICY "Users can view their own payments" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create payment records" ON public.payment_transactions;
CREATE POLICY "System can create payment records" ON public.payment_transactions
  FOR INSERT WITH CHECK (true); -- Will be restricted by API

-- Withdrawal requests policies
DROP POLICY IF EXISTS "Users can view their own withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Users can view their own withdrawals" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Users can create withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Admins can manage withdrawals" ON public.withdrawal_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Bet cancellations policies
DROP POLICY IF EXISTS "Anyone can view bet cancellations" ON public.bet_cancellations;
CREATE POLICY "Anyone can view bet cancellations" ON public.bet_cancellations
  FOR SELECT USING (true);

-- 12. Create function to handle bet cancellation
CREATE OR REPLACE FUNCTION public.cancel_bet(
  p_bet_id UUID,
  p_user_id UUID,
  p_reason TEXT
) RETURNS JSON AS $$
DECLARE
  v_bet RECORD;
  v_refund_total DECIMAL(14,4) := 0;
  v_participants_refunded INTEGER := 0;
  v_participant RECORD;
BEGIN
  -- Get bet details
  SELECT * INTO v_bet FROM public.bets WHERE id = p_bet_id;
  
  -- Verify bet exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bet not found';
  END IF;
  
  -- Verify user is creator
  IF v_bet.creator_id != p_user_id THEN
    RAISE EXCEPTION 'Only the creator can cancel a bet';
  END IF;
  
  -- Verify bet is not resolved
  IF v_bet.resolved THEN
    RAISE EXCEPTION 'Cannot cancel a resolved bet';
  END IF;
  
  -- Verify deadline has not passed
  IF v_bet.deadline <= NOW() THEN
    RAISE EXCEPTION 'Cannot cancel a bet after the deadline';
  END IF;
  
  -- Start transaction
  -- Refund all participants
  FOR v_participant IN 
    SELECT user_id, stake_amount 
    FROM public.bet_participants 
    WHERE bet_id = p_bet_id
  LOOP
    -- Create refund transaction
    INSERT INTO public.credit_transactions (
      user_id, 
      amount, 
      transaction_type, 
      description, 
      bet_id
    ) VALUES (
      v_participant.user_id,
      v_participant.stake_amount,
      'refund',
      'Bet cancelled by creator',
      p_bet_id
    );
    
    v_refund_total := v_refund_total + v_participant.stake_amount;
    v_participants_refunded := v_participants_refunded + 1;
  END LOOP;
  
  -- Update bet status
  UPDATE public.bets 
  SET status = 'cancelled', 
      resolved = true,
      resolved_at = NOW()
  WHERE id = p_bet_id;
  
  -- Record cancellation
  INSERT INTO public.bet_cancellations (
    bet_id,
    cancelled_by,
    reason,
    refund_total,
    participants_refunded
  ) VALUES (
    p_bet_id,
    p_user_id,
    p_reason,
    v_refund_total,
    v_participants_refunded
  );
  
  -- Return result
  RETURN json_build_object(
    'success', true,
    'refund_total', v_refund_total,
    'participants_refunded', v_participants_refunded
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Add missing fields to bets table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bets' 
                 AND column_name = 'resolved_at') THEN
    ALTER TABLE public.bets ADD COLUMN resolved_at TIMESTAMPTZ;
  END IF;
END $$;

-- 14. Create initial user preferences for existing users
INSERT INTO public.user_preferences (user_id)
SELECT id FROM public.users
ON CONFLICT (user_id) DO NOTHING;

-- 15. Create trigger to auto-create user preferences
CREATE OR REPLACE FUNCTION public.create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_preferences_trigger
AFTER INSERT ON public.users
FOR EACH ROW EXECUTE FUNCTION public.create_user_preferences();
