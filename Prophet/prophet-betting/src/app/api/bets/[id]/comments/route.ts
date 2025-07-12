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

// GET /api/bets/[id]/comments - Get comments for a bet
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { supabase } = await requireAuth()
  const betId = params.id

  if (!betId) {
    throw new APIError('Bet ID is required', 400, 'MISSING_ID')
  }

  // Check if bet exists
  await checkBetExists(supabase, betId)

  const url = new URL(request.url)
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const parentId = url.searchParams.get('parent_id')

  // Build query
  let query = supabase
    .from('bet_comments')
    .select(`
      id,
      content,
      parent_id,
      created_at,
      updated_at,
      deleted_at,
      user:users!inner(
        id,
        username,
        full_name,
        avatar_url
      ),
      replies:bet_comments!parent_id(count)
    `)
    .eq('bet_id', betId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // If parent_id is provided, get replies to that comment
  if (parentId) {
    query = query.eq('parent_id', parentId)
  } else {
    // Otherwise, get top-level comments only
    query = query.is('parent_id', null)
  }

  const { data: comments, error, count } = await query

  if (error) {
    console.error('Get comments error:', error)
    throw new APIError('Failed to fetch comments', 500)
  }

  return createSuccessResponse({ 
    comments: comments || [],
    total: count || 0,
    limit,
    offset
  })
})

// POST /api/bets/[id]/comments - Create a comment on a bet
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { user, supabase } = await requireAuth()
  const betId = params.id

  if (!betId) {
    throw new APIError('Bet ID is required', 400, 'MISSING_ID')
  }

  const body = await request.json()
  const { content, parent_id } = body

  // Validate input
  const validation = validateFields(body, {
    content: [validators.required, (value, fieldName) => validators.minLength(value, 1, fieldName), (value, fieldName) => validators.maxLength(value, 1000, fieldName)]
  })

  if (!validation.isValid) {
    return createValidationErrorResponse(validation.errors)
  }

  // Check if bet exists
  await checkBetExists(supabase, betId)

  // If parent_id is provided, verify it exists and belongs to the same bet
  if (parent_id) {
    const { data: parentComment, error: parentError } = await supabase
      .from('bet_comments')
      .select('id, bet_id')
      .eq('id', parent_id)
      .eq('bet_id', betId)
      .is('deleted_at', null)
      .single()

    if (parentError || !parentComment) {
      throw new APIError('Parent comment not found', 404, 'PARENT_NOT_FOUND')
    }
  }

  // Create the comment
  const { data: comment, error } = await supabase
    .from('bet_comments')
    .insert({
      bet_id: betId,
      user_id: user.id,
      content,
      parent_id: parent_id || null
    })
    .select(`
      id,
      content,
      parent_id,
      created_at,
      user:users!inner(
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .single()

  if (error) {
    console.error('Create comment error:', error)
    throw new APIError('Failed to create comment', 500)
  }

  return createSuccessResponse({ 
    comment,
    message: 'Comment posted successfully'
  })
})
