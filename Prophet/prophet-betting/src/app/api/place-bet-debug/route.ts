import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  console.log('�� DEBUG API CALLED - FULL DEBUGGING MODE!')
  
  try {
    // Step 1: Test authentication
    console.log('🔐 Step 1: Testing authentication...')
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message, step: 1 }, { status: 401 })
    }
    
    console.log('✅ Step 1 passed: User authenticated:', user.id)

    // Step 2: Parse request body
    console.log('📦 Step 2: Parsing request body...')
    const body = await request.json()
    console.log('✅ Step 2 passed: Request body:', body)
    
    const { market_id, position, bet_amount } = body

    // Step 3: Check if users table exists and user is in it
    console.log('👤 Step 3: Checking users table...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, balance')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('❌ Step 3 failed - User table error:', userError)
      return NextResponse.json({ 
        error: 'User table error', 
        details: userError.message,
        step: 3 
      }, { status: 500 })
    }

    if (!userData) {
      console.error('❌ Step 3 failed - User not found in users table')
      return NextResponse.json({ 
        error: 'User not found in users table', 
        step: 3 
      }, { status: 404 })
    }

    console.log('✅ Step 3 passed: User found:', userData)

    // Step 4: Check if markets table exists and market is valid
    console.log('🏪 Step 4: Checking markets table...')
    const { data: marketData, error: marketError } = await supabase
      .from('markets')
      .select('id, title, minimum_stake')
      .eq('id', market_id)
      .single()

    if (marketError) {
      console.error('❌ Step 4 failed - Markets table error:', marketError)
      return NextResponse.json({ 
        error: 'Markets table error', 
        details: marketError.message,
        step: 4 
      }, { status: 500 })
    }

    if (!marketData) {
      console.error('❌ Step 4 failed - Market not found')
      return NextResponse.json({ 
        error: 'Market not found', 
        step: 4 
      }, { status: 404 })
    }

    console.log('✅ Step 4 passed: Market found:', marketData)

    // Step 5: Check if bets_nah table exists and test RLS
    console.log('💾 Step 5: Testing bets_nah table and RLS policies...')
    const { data: testQuery, error: tableError } = await supabase
      .from('bets_nah')
      .select('*')
      .limit(1)

    if (tableError) {
      console.error('❌ Step 5 failed - bets_nah table/RLS error:', tableError)
      return NextResponse.json({ 
        error: 'bets_nah table or RLS policy error', 
        details: tableError.message,
        step: 5 
      }, { status: 500 })
    }

    console.log('✅ Step 5 passed: bets_nah table accessible, found rows:', testQuery?.length || 0)

    // Step 6: Validate inputs
    console.log('✔️ Step 6: Validating inputs...')
    if (!market_id || !position || !bet_amount) {
      return NextResponse.json({ error: 'Missing required fields', step: 6 }, { status: 400 })
    }

    if (!['yes', 'no'].includes(position)) {
      return NextResponse.json({ error: 'Invalid position', step: 6 }, { status: 400 })
    }

    if (bet_amount < 1 || bet_amount > 1000000) {
      return NextResponse.json({ error: 'Invalid bet amount', step: 6 }, { status: 400 })
    }

    if (userData.balance < bet_amount) {
      return NextResponse.json({ error: 'Insufficient balance', step: 6 }, { status: 400 })
    }

    console.log('✅ Step 6 passed: All validations passed')

    // Step 7: Try inserting the bet AS AN AUTHENTICATED USER
    console.log('💾 Step 7: Attempting AUTHENTICATED insert into bets_nah...')
    const insertData = {
      creator_id: user.id,  // Set creator_id to the authenticated user
      market_id: market_id,
      title: `${position.toUpperCase()} bet on market`,  // Required field
      arbitrator_type: 'ai',  // Required field - defaulting to 'ai'
      bet_amount: bet_amount,  // Fixed column name from 'amount' to 'bet_amount'
      created_at: new Date().toISOString()
    }
    console.log('💾 Insert data will be:', insertData)
    console.log('💾 Making AUTHENTICATED insert request to Supabase...')
    console.log('💾 RLS should see authenticated user:', user.id)

    // Make the authenticated insert request
    const { data: bet, error: betError } = await supabase
      .from('bets_nah')
      .insert(insertData)
      .select()
      .single()
      
    console.log('💾 Insert request completed. Checking results...')

    if (betError) {
      console.error('❌ Step 7 FAILED - Bet insertion error (likely RLS):', betError)
      console.error('❌ Full error details:', JSON.stringify(betError, null, 2))
      return NextResponse.json({ 
        error: 'RLS POLICY BLOCKING INSERT', 
        details: betError.message,
        code: betError.code,
        hint: betError.hint,
        step: 7,
        message: 'Check your RLS policies for bets_nah table INSERT operation'
      }, { status: 500 })
    }

    console.log('✅ Step 7 passed: Bet inserted successfully:', bet)

    // Step 8: Update user balance
    console.log('💰 Step 8: Updating user balance...')
    const newBalance = userData.balance - bet_amount
    const { error: balanceError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', user.id)

    if (balanceError) {
      console.error('❌ Step 8 failed - Balance update error:', balanceError)
      return NextResponse.json({ 
        error: 'Balance update failed', 
        details: balanceError.message,
        step: 8 
      }, { status: 500 })
    }

    console.log('✅ Step 8 passed: Balance updated to:', newBalance)

    return NextResponse.json({
      success: true,
      message: 'Bet placed successfully!',
      bet_id: bet.id,
      market_id: market_id,
      position: position,
      amount: bet_amount,
      new_balance: newBalance,
      debug: 'All 8 steps completed'
    })

  } catch (error) {
    console.error('❌ CRITICAL ERROR in debug place bet API:', error)
    console.error('❌ Error type:', typeof error)
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json({ 
      error: 'Critical server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: typeof error
    }, { status: 500 })
  }
} 