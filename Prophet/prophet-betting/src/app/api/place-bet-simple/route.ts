import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  console.log('🔥 Simple place bet API called')
  
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('👤 User authenticated:', user.id)

    const body = await request.json()
    console.log('📦 Request body:', body)
    
    const { market_id, position, bet_amount } = body

    // Basic validation
    if (!market_id || !position || !bet_amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['yes', 'no'].includes(position)) {
      return NextResponse.json({ error: 'Position must be yes or no' }, { status: 400 })
    }

    if (bet_amount < 1 || bet_amount > 1000000) {
      return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 })
    }

    console.log('✅ Basic validation passed')

    // Check if user exists in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('❌ User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('💰 User balance:', userData.balance)

    if (userData.balance < bet_amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Insert bet into bets_nah table
    console.log('💾 Inserting bet into bets_nah table...')
    const { data: bet, error: betError } = await supabase
      .from('bets_nah')
      .insert({
        user_id: user.id,
        creator_id: user.id,  // Set creator_id to the authenticated user
        market_id: market_id,
        position: position,
        amount: bet_amount,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (betError) {
      console.error('❌ Bet insertion error:', betError)
      return NextResponse.json({ error: 'Failed to place bet' }, { status: 500 })
    }

    console.log('✅ Bet inserted:', bet)

    // Update user balance
    const newBalance = userData.balance - bet_amount
    const { error: balanceError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', user.id)

    if (balanceError) {
      console.error('❌ Balance update error:', balanceError)
      // Note: In production, this should rollback the bet
    }

    console.log('✅ Balance updated:', newBalance)

    return NextResponse.json({
      success: true,
      bet_id: bet.id,
      market_id: market_id,
      position: position,
      amount: bet_amount,
      new_balance: newBalance,
      message: 'Bet placed successfully'
    })

  } catch (error) {
    console.error('❌ CRITICAL ERROR in place bet API:', error)
    console.error('❌ Error type:', typeof error)
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 