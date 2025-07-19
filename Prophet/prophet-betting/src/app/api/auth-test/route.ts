import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  console.log('🧪 Auth test API called')
  
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🔍 Auth check results:')
    console.log('- User:', user?.id, user?.email)
    console.log('- Auth error:', authError)
    
    return NextResponse.json({
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      } : null,
      error: authError?.message,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Auth test error:', error)
    return NextResponse.json({
      error: 'Failed to check auth',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 