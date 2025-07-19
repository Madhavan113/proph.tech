import { NextRequest } from 'next/server'
import { 
  requireAuth,
  validateFields,
  validators,
  createSuccessResponse,
  createValidationErrorResponse,
  withErrorHandling,
  APIError,
  ValidationError
} from '@/lib/api-utils'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { user, supabase } = await requireAuth()

  const body = await request.json()
  const { amount, description = 'Credits added' } = body

  // Validation rules
  const validationRules: Record<string, ((value: any, fieldName: string) => ValidationError | null)[]> = {
    amount: [
      validators.required, 
      validators.positiveNumber,
      (value: number, fieldName: string) => {
        if (value > 10000) {
          return { field: fieldName, message: `${fieldName} cannot exceed 10,000` }
        }
        return null
      }
    ]
  }

  // Validate input
  const validation = validateFields(body, validationRules)
  if (!validation.isValid) {
    return createValidationErrorResponse(validation.errors)
  }

  // Get current balance
  const { data: userData, error: balanceError } = await supabase
    .from('users')
    .select('balance')
    .eq('id', user.id)
    .single()

  if (balanceError) {
    throw new APIError('Failed to get current balance', 500)
  }

  const currentBalance = Number(userData?.balance || 0)
  const newBalance = currentBalance + amount

  // Update user balance
  const { error: updateError } = await supabase
    .from('users')
    .update({ balance: newBalance })
    .eq('id', user.id)

  if (updateError) {
    console.error('Balance update error:', updateError)
    throw new APIError('Failed to add credits', 500)
  }

  // Record transaction for history
  const { error: transactionError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: user.id,
      amount: amount,
      transaction_type: 'admin_adjustment',
      description: description
    })

  if (transactionError) {
    console.error('Transaction record error:', transactionError)
    // Continue anyway - balance was updated successfully
  }

  return createSuccessResponse({ 
    previous_balance: currentBalance,
    amount_added: amount,
    new_balance: newBalance,
    message: 'Credits added successfully'
  })
}) 