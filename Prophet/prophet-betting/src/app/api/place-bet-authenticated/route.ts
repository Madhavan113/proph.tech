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

    // Check if market exists and is active
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('id, title, status, resolved, deadline, total_pool_for, total_pool_against, total_pool')
      .eq('id', market_id)
      .single()

    if (marketError || !market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    }

    if (market.status !== 'active' || market.resolved) {
      return NextResponse.json({ error: 'Market is not accepting bets' }, { status: 400 })
    }

    if (new Date(market.deadline) <= new Date()) {
      return NextResponse.json({ error: 'Market deadline has passed' }, { status: 400 })
    }
    
    console.log('💾 Making AUTHENTICATED insert with RLS context...')
    
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
    
    // Update user balance
    const newBalance = userData.balance - bet_amount
    const { error: balanceError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', user.id)

    if (balanceError) {
      console.error('❌ Balance update error:', balanceError)
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 })
    }

    // Update market totals
    console.log('📊 Updating market totals...')
    const currentTotalFor = Number(market.total_pool_for || 0)
    const currentTotalAgainst = Number(market.total_pool_against || 0)
    const currentTotal = Number(market.total_pool || 0)

    const newTotalFor = position === 'yes' ? currentTotalFor + bet_amount : currentTotalFor
    const newTotalAgainst = position === 'no' ? currentTotalAgainst + bet_amount : currentTotalAgainst
    const newTotal = currentTotal + bet_amount

    const { data: updatedMarket, error: marketUpdateError } = await supabase
      .from('markets')
      .update({
        total_pool_for: newTotalFor,
        total_pool_against: newTotalAgainst,
        total_pool: newTotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', market_id)
      .select('total_pool_for, total_pool_against, total_pool')
      .single()

    if (marketUpdateError) {
      console.error('❌ Market update error:', marketUpdateError)
      // Continue anyway - bet was placed successfully
    } else {
      console.log('✅ Market totals updated:', updatedMarket)
    }

    // Record credit transaction for history
    const { error: creditError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        amount: -bet_amount,
        transaction_type: 'bet',
        description: `Bet placed: ${position.toUpperCase()} on "${market.title}"`,
        bet_id: bet.id
      })

    if (creditError) {
      console.error('Credit transaction error:', creditError)
      // Continue anyway - balance was updated successfully
    }
      
    return NextResponse.json({
      success: true,
      message: 'Bet placed successfully!',
      bet: {
        id: bet.id,
        position: position,
        amount: bet_amount,
        market_id: market_id
      },
      new_balance: newBalance,
      market_totals: updatedMarket || {
        total_pool_for: newTotalFor,
        total_pool_against: newTotalAgainst,
        total_pool: newTotal
      }
    })
    
  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 