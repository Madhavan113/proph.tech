import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  console.log('🧪 Testing minimal INSERT...')
  
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    console.log('👤 Authenticated user:', user.id)
    
    // Test 1: Try inserting with ONLY required fields
    console.log('🧪 Test 1: Minimal required fields...')
    const { data: test1, error: error1 } = await supabase
      .from('bets_nah')
      .insert({
        creator_id: user.id,
        title: 'Test',
        arbitrator_type: 'ai'
      })
      .select()
      
    console.log('🧪 Test 1 result:', { data: test1, error: error1 })
    
    if (error1) {
      // Test 2: Try with even simpler data
      console.log('🧪 Test 2: Super minimal...')
      const { data: test2, error: error2 } = await supabase
        .from('bets_nah')
        .insert({
          title: 'Test2',
          creator_id: user.id,
          arbitrator_type: 'ai'
        })
        .select()
        
      console.log('🧪 Test 2 result:', { data: test2, error: error2 })
      
      // Test 3: Check what policies exist
      console.log('🧪 Test 3: Check current policies...')
      const { data: policies, error: policyError } = await supabase
        .from('pg_policies')
        .select('policyname, tablename, roles, cmd, qual, with_check')
        .eq('tablename', 'bets_nah')
        
      console.log('🧪 Current policies:', policies)
      
      return NextResponse.json({
        success: false,
        user_id: user.id,
        test1_error: error1,
        test2_error: error2,
        policies: policies,
        message: 'INSERT failed - check server logs for details'
      })
    }
    
    console.log('✅ INSERT SUCCESS!')
    return NextResponse.json({
      success: true,
      message: 'INSERT worked!',
      inserted_id: test1?.[0]?.id,
      user_id: user.id
    })
    
  } catch (error) {
    console.error('❌ Test error:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 })
  }
} 