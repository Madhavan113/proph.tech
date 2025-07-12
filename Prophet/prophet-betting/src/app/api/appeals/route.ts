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

// POST /api/appeals - Create a new appeal
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { user, supabase } = await requireAuth()

  const body = await request.json()
  const { bet_id, reason } = body

  // Validate input
  const validation = validateFields(body, {
    bet_id: [validators.required],
    reason: [validators.required, (value, fieldName) => validators.minLength(value, 10, fieldName)]
  })

  if (!validation.isValid) {
    return createValidationErrorResponse(validation.errors)
  }

  // Check if bet exists
  const bet = await checkBetExists(supabase, bet_id)

  // Check if bet is resolved
  if (!bet.resolved) {
    throw new APIError('Cannot appeal a bet that has not been resolved yet', 400, 'BET_NOT_RESOLVED')
  }

  // Check if user participated in this bet
  const { data: participation } = await supabase
    .from('bet_participants')
    .select('id')
    .eq('bet_id', bet_id)
    .eq('user_id', user.id)
    .single()

  if (!participation) {
    throw new APIError('You can only appeal bets you participated in', 403, 'NOT_PARTICIPANT')
  }

  // Check if user already has an appeal for this bet
  const { data: existingAppeal } = await supabase
    .from('appeals')
    .select('id')
    .eq('bet_id', bet_id)
    .eq('user_id', user.id)
    .single()

  if (existingAppeal) {
    throw new APIError('You have already submitted an appeal for this bet', 400, 'APPEAL_EXISTS')
  }

  // Create the appeal
  const { data: appeal, error } = await supabase
    .from('appeals')
    .insert({
      bet_id,
      user_id: user.id,
      reason,
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('Create appeal error:', error)
    throw new APIError('Failed to create appeal', 500)
  }

  return createSuccessResponse({ 
    appeal_id: appeal.id,
    status: appeal.status,
    created_at: appeal.created_at
  })
})

// GET /api/appeals - Get user's appeals
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user, supabase } = await requireAuth()

  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const limit = parseInt(url.searchParams.get('limit') || '10')
  const offset = parseInt(url.searchParams.get('offset') || '0')

  let query = supabase
    .from('appeals')
    .select(`
      id,
      reason,
      status,
      admin_notes,
      created_at,
      resolved_at,
      bet:bets!inner(
        id,
        title,
        description,
        resolved_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data: appeals, error, count } = await query

  if (error) {
    console.error('Get appeals error:', error)
    throw new APIError('Failed to fetch appeals', 500)
  }

  return createSuccessResponse({ 
    appeals: appeals || [],
    total: count || 0,
    limit,
    offset
  })
})
