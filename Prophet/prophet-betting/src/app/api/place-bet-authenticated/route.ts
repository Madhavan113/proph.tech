import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  console.log('🔥 AUTHENTICATED Place Bet API called')
  
  try {
    // Get authenticated Supabase client with user context
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Not authenticated:', authError)
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be logged in to place bets'
      }, { status: 401 })
    }
    
    console.log('✅ Authenticated user:', user.id)
    
    // Parse request
    const { market_id, position, bet_amount } = await request.json()
    
    // Validate inputs
    if (!market_id || !position || !bet_amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    if (!['yes', 'no'].includes(position)) {
      return NextResponse.json({ error: 'Position must be yes or no' }, { status: 400 })
    }
    
    // Check user balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', user.id)
      .single()
      
    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    if (userData.balance < bet_amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }
    
    console.log('💾 Making AUTHENTICATED insert with RLS context...')
    
    // The rpc call to 'debug_auth_context' has been removed as it does not exist in the database.
    
    // Insert bet with authenticated context - RLS will see auth.uid()
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert({
        creator_id: user.id,
        market_id: market_id,
        title: `${position.toUpperCase()} bet`,
        arbitrator_type: 'ai',
        bet_amount: bet_amount
      })
      .select()
      .single()
      
    if (betError) {
      console.error('❌ RLS/Insert error:', betError)
      return NextResponse.json({ 
        error: 'Failed to place bet',
        details: betError.message,
        code: betError.code,
        hint: 'Check RLS policies for authenticated users'
      }, { status: 500 })
    }
    
    console.log('✅ Bet inserted successfully:', bet.id)
    
    // Update balance
    const newBalance = userData.balance - bet_amount
    await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', user.id)
      
    return NextResponse.json({
      success: true,
      message: 'Bet placed successfully!',
      bet: {
        id: bet.id,
        position: position,
        amount: bet_amount,
        market_id: market_id
      },
      new_balance: newBalance
    })
    
  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 