import { NextRequest } from 'next/server'
import { 
  requireAuth, 
  createSuccessResponse, 
  withErrorHandling,
  APIError
} from '@/lib/api-utils'

// DELETE /api/comments/[id] - Soft delete a comment
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { user, supabase } = await requireAuth()
  const commentId = params.id

  if (!commentId) {
    throw new APIError('Comment ID is required', 400, 'MISSING_ID')
  }

  // Get the comment to verify ownership
  const { data: comment, error: fetchError } = await supabase
    .from('bet_comments')
    .select('id, user_id, deleted_at')
    .eq('id', commentId)
    .single()

  if (fetchError || !comment) {
    throw new APIError('Comment not found', 404, 'COMMENT_NOT_FOUND')
  }

  if (comment.deleted_at) {
    throw new APIError('Comment is already deleted', 400, 'ALREADY_DELETED')
  }

  // Check if user owns the comment
  if (comment.user_id !== user.id) {
    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      throw new APIError('You can only delete your own comments', 403, 'NOT_OWNER')
    }
  }

  // Soft delete the comment
  const { error: deleteError } = await supabase
    .from('bet_comments')
    .update({ 
      deleted_at: new Date().toISOString(),
      content: '[deleted]' // Replace content for privacy
    })
    .eq('id', commentId)

  if (deleteError) {
    console.error('Delete comment error:', deleteError)
    throw new APIError('Failed to delete comment', 500)
  }

  return createSuccessResponse({ 
    message: 'Comment deleted successfully'
  })
})
