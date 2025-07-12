-- Create bet_comments table for social features
CREATE TABLE IF NOT EXISTS public.bet_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bet_id UUID REFERENCES public.bets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.bet_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ,
  
  -- Prevent self-referencing comments
  CONSTRAINT no_self_reference CHECK (id != parent_id)
);

-- Add indexes for performance
CREATE INDEX idx_bet_comments_bet_id ON public.bet_comments(bet_id);
CREATE INDEX idx_bet_comments_user_id ON public.bet_comments(user_id);
CREATE INDEX idx_bet_comments_parent_id ON public.bet_comments(parent_id);
CREATE INDEX idx_bet_comments_created_at ON public.bet_comments(created_at DESC);
CREATE INDEX idx_bet_comments_deleted_at ON public.bet_comments(deleted_at) WHERE deleted_at IS NULL;

-- Add RLS policies
ALTER TABLE public.bet_comments ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view non-deleted comments
CREATE POLICY "Authenticated users can view comments" ON public.bet_comments
  FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

-- Users can create comments
CREATE POLICY "Users can create comments" ON public.bet_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = bet_comments.bet_id
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON public.bet_comments
  FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Users can soft delete their own comments
CREATE POLICY "Users can delete own comments" ON public.bet_comments
  FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Admins can moderate comments
CREATE POLICY "Admins can moderate comments" ON public.bet_comments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.bet_comments TO authenticated;

-- Ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_bet_comments_updated_at 
  BEFORE UPDATE ON public.bet_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get comment count for a bet
CREATE OR REPLACE FUNCTION get_bet_comment_count(p_bet_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM bet_comments
    WHERE bet_id = p_bet_id
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_bet_comment_count(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.bet_comments IS 'Stores comments and discussions on bets';
COMMENT ON COLUMN public.bet_comments.parent_id IS 'References parent comment for nested replies';
COMMENT ON COLUMN public.bet_comments.deleted_at IS 'Soft delete timestamp - content is replaced with [deleted]';
COMMENT ON FUNCTION get_bet_comment_count(UUID) IS 'Returns the count of non-deleted comments for a bet';
