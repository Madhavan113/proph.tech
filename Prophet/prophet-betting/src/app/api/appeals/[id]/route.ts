import { NextRequest } from 'next/server'
import { 
  requireAuth, 
  createSuccessResponse, 
  withErrorHandling,
  APIError
} from '@/lib/api-utils'

// GET /api/appeals/[id] - Get a specific appeal
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { user, supabase } = await requireAuth()
  const appealId = params.id

  if (!appealId) {
    throw new APIError('Appeal ID is required', 400, 'MISSING_ID')
  }

  // Get the appeal with bet details
  const { data: appeal, error } = await supabase
    .from('appeals')
    .select(`
      id,
      reason,
      status,
      admin_notes,
      created_at,
      resolved_at,
      user_id,
      bet:bets!inner(
        id,
        title,
        description,
        resolved_at,
        creator_id,
        arbitrator_type
      )
    `)
    .eq('id', appealId)
    .single()

  if (error || !appeal) {
    throw new APIError('Appeal not found', 404, 'APPEAL_NOT_FOUND')
  }

  // Check if user has access to this appeal
  // Users can only view their own appeals unless they're an admin
  if (appeal.user_id !== user.id) {
    // Check if user is admin (you might want to implement this check)
    // For now, only allow users to see their own appeals
    throw new APIError('You do not have permission to view this appeal', 403, 'FORBIDDEN')
  }

  return createSuccessResponse({ appeal })
})
