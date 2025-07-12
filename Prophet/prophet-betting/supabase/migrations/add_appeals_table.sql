-- Add appeals table for bet dispute resolution
CREATE TABLE IF NOT EXISTS public.appeals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bet_id UUID REFERENCES public.bets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(reason) >= 10),
  status TEXT CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')) DEFAULT 'pending' NOT NULL,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id),
  
  -- Ensure a user can only have one appeal per bet
  CONSTRAINT unique_user_bet_appeal UNIQUE (user_id, bet_id)
);

-- Add indexes for performance
CREATE INDEX idx_appeals_bet_id ON public.appeals(bet_id);
CREATE INDEX idx_appeals_user_id ON public.appeals(user_id);
CREATE INDEX idx_appeals_status ON public.appeals(status);
CREATE INDEX idx_appeals_created_at ON public.appeals(created_at DESC);

-- Add RLS policies
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;

-- Users can view their own appeals
CREATE POLICY "Users can view own appeals" ON public.appeals
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create appeals for bets they participated in
CREATE POLICY "Users can create appeals" ON public.appeals
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.bet_participants
      WHERE bet_participants.user_id = auth.uid()
      AND bet_participants.bet_id = appeals.bet_id
    )
    AND EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = appeals.bet_id
      AND bets.resolved = true
    )
  );

-- Admins can view all appeals
CREATE POLICY "Admins can view all appeals" ON public.appeals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can update appeals
CREATE POLICY "Admins can update appeals" ON public.appeals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT, INSERT ON public.appeals TO authenticated;
GRANT UPDATE ON public.appeals TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.appeals IS 'Stores user appeals for disputed bet resolutions';
COMMENT ON COLUMN public.appeals.status IS 'Appeal status: pending (initial), reviewing (admin looking at it), approved (appeal successful), rejected (appeal denied)';
COMMENT ON COLUMN public.appeals.admin_notes IS 'Notes from admin explaining the resolution decision';
