import { NextRequest } from 'next/server'
import { 
  requireAuth, 
  createSuccessResponse, 
  withErrorHandling,
  checkBetExists,
  APIError
} from '@/lib/api-utils'

// POST /api/bets/[id]/cancel - Cancel a bet (creator only, before deadline)
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { user, supabase } = await requireAuth()
  const betId = params.id

  if (!betId) {
    throw new APIError('Bet ID is required', 400, 'MISSING_ID')
  }

  // Check if bet exists
  const bet = await checkBetExists(supabase, betId)

  // Check if user is the creator
  if (bet.creator_id !== user.id) {
    throw new APIError('Only the bet creator can cancel this bet', 403, 'NOT_CREATOR')
  }

  // Check if bet is already resolved
  if (bet.resolved) {
    throw new APIError('Cannot cancel a resolved bet', 400, 'BET_RESOLVED')
  }

  // Check if deadline has passed
  if (new Date(bet.deadline) <= new Date()) {
    throw new APIError('Cannot cancel bet after deadline', 400, 'DEADLINE_PASSED')
  }

  // Get all participants to refund
  const { data: participants, error: participantsError } = await supabase
    .from('bet_participants')
    .select('id, user_id, stake_amount')
    .eq('bet_id', betId)

  if (participantsError) {
    console.error('Get participants error:', participantsError)
    throw new APIError('Failed to fetch bet participants', 500)
  }

  // Start a transaction to cancel bet and refund all participants
  const { error: cancelError } = await supabase.rpc('cancel_bet', {
    p_bet_id: betId,
    p_cancelled_by: user.id
  })

  if (cancelError) {
    // If RPC function doesn't exist, do it manually
    if (cancelError.message.includes('function cancel_bet')) {
      // Manual cancellation process
      try {
        // Mark bet as cancelled
        const { error: updateError } = await supabase
          .from('bets')
          .update({ 
            resolved: true,
            resolved_at: new Date().toISOString(),
            cancelled: true
          })
          .eq('id', betId)

        if (updateError) throw updateError

        // Refund all participants
        for (const participant of participants || []) {
          const { error: refundError } = await supabase
            .from('credit_transactions')
            .insert({
              user_id: participant.user_id,
              amount: participant.stake_amount,
              transaction_type: 'refund',
              description: 'Bet cancelled by creator',
              bet_id: betId
            })

          if (refundError) {
            console.error('Refund error for user', participant.user_id, refundError)
            // Continue with other refunds even if one fails
          }
        }
      } catch (error) {
        console.error('Manual cancellation error:', error)
        throw new APIError('Failed to cancel bet', 500)
      }
    } else {
      console.error('Cancel bet error:', cancelError)
      throw new APIError('Failed to cancel bet', 500)
    }
  }

  return createSuccessResponse({ 
    message: 'Bet cancelled successfully',
    refunded_count: participants?.length || 0,
    total_refunded: participants?.reduce((sum, p) => sum + Number(p.stake_amount), 0) || 0
  })
})
