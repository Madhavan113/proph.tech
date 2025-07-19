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
  const { 
    title, 
    description, 
    deadline, 
    arbitrator_type,
    arbitrator_email,
    minimum_stake
  } = body

  // Build validation rules matching the new schema constraints
  const validationRules: Record<string, ((value: any, fieldName: string) => ValidationError | null)[]> = {
    title: [
      validators.required,
      (value: string, fieldName: string) => validators.minLength(value, 1, fieldName),
      (value: string, fieldName: string) => validators.maxLength(value, 200, fieldName)
    ],
    deadline: [validators.required, validators.futureDate],
    arbitrator_type: [
      validators.required,
      (value: any, fieldName: string) => validators.oneOf(value, ['creator', 'friend', 'ai'], fieldName)
    ],
    minimum_stake: [
      validators.required, 
      validators.positiveNumber,
      (value: number, fieldName: string) => {
        if (value < 1 || value > 1000000) {
          return { field: fieldName, message: `${fieldName} must be between 1 and 1,000,000` }
        }
        return null
      }
    ]
  }

  // Add description validation if provided (it's optional)
  if (description !== null && description !== undefined && description !== '') {
    validationRules.description = [
      (value: string, fieldName: string) => validators.minLength(value, 1, fieldName),
      (value: string, fieldName: string) => validators.maxLength(value, 1000, fieldName)
    ]
  }

  // Add arbitrator_email validation if type is 'friend'
  if (arbitrator_type === 'friend') {
    validationRules.arbitrator_email = [validators.required, validators.email]
  }

  // Validate input
  const validation = validateFields(body, validationRules)

  if (!validation.isValid) {
    return createValidationErrorResponse(validation.errors)
  }

  // Insert directly into markets table with new schema
  const { data: marketData, error: marketError } = await supabase
    .from('markets')
    .insert({
      title: title.trim(),
      description: description ? description.trim() : null,
      deadline: deadline,
      arbitrator_type: arbitrator_type,
      arbitrator_email: arbitrator_type === 'friend' ? arbitrator_email?.trim() : null,
      minimum_stake: minimum_stake,
      creator_id: user.id,
      status: 'active',
      resolved: false,
      total_pool_for: 0,
      total_pool_against: 0,
      total_pool: 0
    })
    .select('id')
    .single()

  if (marketError) {
    console.error('Create market error:', marketError)
    throw new APIError(marketError.message || 'Failed to create market', 500)
  }

  return createSuccessResponse({ 
    market_id: marketData.id,
    message: 'Market created successfully'
  })
})
