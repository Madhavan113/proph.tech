import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  console.log('🔍 RLS DEBUG API called')
  
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    console.log('🔍 Testing RLS policy for user:', user.id)
    
    // Test 1: Check if we can read from bets_nah (SELECT policy)
    console.log('🔍 Test 1: Testing SELECT on bets_nah...')
    const { data: selectTest, error: selectError } = await supabase
      .from('bets_nah')
      .select('*')
      .limit(1)
      
    console.log('🔍 SELECT result:', { data: selectTest, error: selectError })
    
    // Test 2: Check auth.uid() value in SQL
    console.log('🔍 Test 2: Checking auth.uid() in SQL...')
    const { data: authTest, error: authTestError } = await supabase
      .rpc('get_current_user_id')
      .single()
      
    console.log('🔍 auth.uid() result:', { data: authTest, error: authTestError })
    
    // Test 3: Try inserting with minimal data
    console.log('🔍 Test 3: Testing minimal insert...')
    const { data: insertTest, error: insertError } = await supabase
      .from('bets_nah')
      .insert({
        creator_id: user.id,
        title: 'RLS Test',
        arbitrator_type: 'ai'
      })
      .select()
      
    console.log('🔍 INSERT result:', { data: insertTest, error: insertError })
    
    // Test 4: Check if user exists in users table
    console.log('🔍 Test 4: Checking if user exists in users table...')
    const { data: userExists, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', user.id)
      .single()
      
    console.log('🔍 User in users table:', { data: userExists, error: userError })
    
    return NextResponse.json({
      debug: 'RLS Policy Debug Results',
      user_id: user.id,
      tests: {
        select_policy: { data: !!selectTest, error: selectError?.message },
        auth_uid: { data: authTest, error: authTestError?.message },
        insert_policy: { data: !!insertTest, error: insertError?.message },
        user_exists: { data: !!userExists, error: userError?.message }
      },
      next_steps: insertError ? 
        'RLS INSERT policy is blocking. Check policy expression.' :
        'INSERT worked! Original issue might be with specific data.'
    })
    
  } catch (error) {
    console.error('❌ RLS Debug error:', error)
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 