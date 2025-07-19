import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  console.log('🧪 Testing auth context...')
  
  try {
    const supabase = await createClient()
    
    // Test 1: Check auth.getUser()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('👤 User from auth.getUser():', user?.id)
    console.log('❌ Auth error:', authError)
    
    // Test 2: Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('🔑 Session exists:', !!session)
    console.log('🔑 Access token exists:', !!session?.access_token)
    console.log('❌ Session error:', sessionError)
    
    // Test 3: Try inserting into a simple table that should work
    const { data: usersTest, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user?.id)
      .single()
      
    console.log('👥 Users table query result:', usersTest)
    console.log('❌ Users table error:', usersError)
    
    // Test 4: Try the most basic operation with RLS
    const { data: basicTest, error: basicError } = await supabase
      .from('bets_nah')
      .select('id')
      .limit(1)
      
    console.log('📊 Basic bets_nah SELECT:', basicTest)
    console.log('❌ Basic SELECT error:', basicError)
    
    return NextResponse.json({
      auth_user_id: user?.id,
      has_session: !!session,
      has_access_token: !!session?.access_token,
      users_query_works: !usersError,
      basic_select_works: !basicError,
      errors: {
        auth: authError?.message,
        session: sessionError?.message,
        users: usersError?.message,
        basic: basicError?.message
      }
    })
    
  } catch (error) {
    console.error('❌ Context test error:', error)
    return NextResponse.json({ 
      error: 'Context test failed',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 })
  }
} 