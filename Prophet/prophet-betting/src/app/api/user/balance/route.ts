import { NextRequest } from 'next/server'
import { 
  requireAuth,
  createSuccessResponse,
  withErrorHandling,
  APIError
} from '@/lib/api-utils'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user, supabase } = await requireAuth()

  // Get user balance directly from users table
  const { data: userData, error } = await supabase
    .from('users')
    .select('balance')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Balance query error:', error)
    throw new APIError('Failed to fetch balance', 500)
  }

  return createSuccessResponse({ 
    balance: Number(userData?.balance || 0),
    user_id: user.id
  })
})
