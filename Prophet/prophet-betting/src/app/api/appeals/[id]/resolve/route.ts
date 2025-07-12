import { NextRequest } from 'next/server'
import { 
  requireRole, 
  validateFields, 
  validators, 
  createSuccessResponse, 
  createValidationErrorResponse,
  withErrorHandling,
  APIError
} from '@/lib/api-utils'

// PUT /api/appeals/[id]/resolve - Resolve an appeal (admin only)
export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  // Require admin role
  const { user, supabase } = await requireRole(['admin'])
  const appealId = params.id

  if (!appealId) {
    throw new APIError('Appeal ID is required', 400, 'MISSING_ID')
  }

  const body = await request.json()
  const { status, admin_notes } = body

  // Validate input
  const validation = validateFields(body, {
    status: [validators.required, (value, fieldName) => validators.oneOf(value, ['approved', 'rejected'], fieldName)],
    admin_notes: [(value, fieldName) => validators.minLength(value || '', 10, fieldName)]
  })

  if (!validation.isValid) {
    return createValidationErrorResponse(validation.errors)
  }

  // Get the appeal to ensure it exists and is pending
  const { data: appeal, error: fetchError } = await supabase
    .from('appeals')
    .select('id, status, bet_id')
    .eq('id', appealId)
    .single()

  if (fetchError || !appeal) {
    throw new APIError('Appeal not found', 404, 'APPEAL_NOT_FOUND')
  }

  if (appeal.status !== 'pending' && appeal.status !== 'reviewing') {
    throw new APIError('Appeal has already been resolved', 400, 'APPEAL_ALREADY_RESOLVED')
  }

  // Update the appeal
  const { data: updatedAppeal, error: updateError } = await supabase
    .from('appeals')
    .update({
      status,
      admin_notes,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id
    })
    .eq('id', appealId)
    .select()
    .single()

  if (updateError) {
    console.error('Update appeal error:', updateError)
    throw new APIError('Failed to update appeal', 500)
  }

  // If appeal is approved, we might want to trigger additional actions
  // For example, re-evaluate the bet outcome or issue refunds
  if (status === 'approved') {
    // TODO: Implement appeal approval logic
    // This could include:
    // - Reversing the bet outcome
    // - Issuing refunds to affected users
    // - Creating notifications
    console.log(`Appeal ${appealId} approved for bet ${appeal.bet_id}`)
  }

  return createSuccessResponse({ 
    appeal: updatedAppeal,
    message: `Appeal ${status} successfully`
  })
})
