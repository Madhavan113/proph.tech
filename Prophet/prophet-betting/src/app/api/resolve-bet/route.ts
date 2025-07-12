import { NextRequest } from 'next/server'
import { 
  requireAuth, 
  validateFields, 
  validators, 
  createSuccessResponse, 
  createValidationErrorResponse,
  withErrorHandling,
  checkBetExists,
  APIError
} from '@/lib/api-utils'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { user, supabase } = await requireAuth()

  const body = await request.json()
  const { bet_id, outcome, reasoning } = body

  // Validate input
  const validation = validateFields(body, {
    bet_id: [validators.required],
    outcome: [validators.required, validators.boolean],
    reasoning: [] // optional
  })

  if (!validation.isValid) {
    return createValidationErrorResponse(validation.errors)
  }

  // Check if bet exists
  const bet = await checkBetExists(supabase, bet_id)

  if (bet.resolved) {
    throw new APIError('Bet is already resolved', 400, 'BET_RESOLVED')
  }

  // Check if deadline has passed (required for resolution)
  if (new Date(bet.deadline) > new Date()) {
    throw new APIError('Cannot resolve bet before deadline', 400, 'DEADLINE_NOT_PASSED')
  }

  // Check authorization based on arbitrator type
  let authorized = false
  
  if (bet.arbitrator_type === 'creator' && bet.creator_id === user.id) {
    authorized = true
  } else if (bet.arbitrator_type === 'friend') {
    // For friend arbitrators, check if user email matches arbitrator_email
    const { data: userData } = await supabase.auth.getUser()
    if (userData.user?.email === bet.arbitrator_email) {
      authorized = true
    }
  } else if (bet.arbitrator_type === 'ai') {
    // Only system/admin can manually resolve AI bets, or it should be done via AI endpoint
    throw new APIError('AI bets must be resolved through the AI arbitrator system', 403, 'AI_BET_MANUAL_RESOLVE')
  }

  if (!authorized) {
    throw new APIError('You are not authorized to resolve this bet', 403, 'UNAUTHORIZED_ARBITRATOR')
  }

  // Use RPC function to resolve bet (handles payout calculation and distribution)
  const { data, error } = await supabase.rpc('resolve_bet', {
    p_bet_id: bet_id,
    p_outcome: outcome,
    p_arbitrator_id: user.id,
    p_reasoning: reasoning || null
  })

  if (error) {
    console.error('Resolve bet error:', error)
    throw new APIError(error.message || 'Failed to resolve bet', 500)
  }

  return createSuccessResponse({ 
    decision_id: data?.decision_id,
    total_payout: data?.total_payout,
    winners_count: data?.winners_count
  })
})
