import { NextRequest } from 'next/server'
import { 
  requireAuth, 
  validateFields, 
  validators, 
  createSuccessResponse, 
  createValidationErrorResponse,
  withErrorHandling,
  APIError
} from '@/lib/api-utils'

// GET /api/user/profile - Get user profile
export const GET = withErrorHandling(async () => {
  const { user, supabase } = await requireAuth()

  // Get user profile data
  const { data: profile, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      username,
      full_name,
      avatar_url,
      notification_preferences,
      role,
      created_at,
      updated_at
    `)
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    console.error('Get profile error:', error)
    throw new APIError('Failed to fetch user profile', 500)
  }

  // Get user statistics
  const { data: stats } = await supabase
    .rpc('get_user_stats', { p_user_id: user.id })

  return createSuccessResponse({ 
    profile,
    stats: stats || {
      total_bets: 0,
      bets_won: 0,
      bets_lost: 0,
      total_wagered: 0,
      total_won: 0,
      win_rate: 0
    }
  })
})

// PUT /api/user/profile - Update user profile
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { user, supabase } = await requireAuth()

  const body = await request.json()
  const { username, full_name, avatar_url, notification_preferences } = body

  // Validate input
  const validation = validateFields(body, {
    username: [
      (value, fieldName) => value !== undefined ? validators.minLength(value, 3, fieldName) : null,
      (value, fieldName) => value !== undefined ? validators.maxLength(value, 30, fieldName) : null
    ],
    full_name: [
      (value, fieldName) => value !== undefined ? validators.maxLength(value, 100, fieldName) : null
    ],
    avatar_url: [
      (value, fieldName) => {
        if (value && !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(value)) {
          return { field: fieldName, message: 'Avatar URL must be a valid image URL' }
        }
        return null
      }
    ]
  })

  if (!validation.isValid) {
    return createValidationErrorResponse(validation.errors)
  }

  // Check if username is already taken (if username is being changed)
  if (username !== undefined) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .single()

    if (existingUser) {
      throw new APIError('Username is already taken', 400, 'USERNAME_TAKEN')
    }
  }

  // Build update object with only provided fields
  interface UpdateData {
    username?: string
    full_name?: string
    avatar_url?: string
    notification_preferences?: Record<string, boolean>
    updated_at: string
  }
  
  const updateData: UpdateData = {
    updated_at: new Date().toISOString()
  }
  
  if (username !== undefined) updateData.username = username
  if (full_name !== undefined) updateData.full_name = full_name
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url
  if (notification_preferences !== undefined) {
    updateData.notification_preferences = notification_preferences
  }

  // Update user profile
  const { data: updatedProfile, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', user.id)
    .select(`
      id,
      email,
      username,
      full_name,
      avatar_url,
      notification_preferences,
      role,
      created_at,
      updated_at
    `)
    .single()

  if (error) {
    console.error('Update profile error:', error)
    throw new APIError('Failed to update profile', 500)
  }

  return createSuccessResponse({ 
    profile: updatedProfile,
    message: 'Profile updated successfully'
  })
})
