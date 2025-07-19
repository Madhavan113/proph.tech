import { NextRequest } from 'next/server'
import { 
  requireAuth, 
  validateFields, 
  validators, 
  createSuccessResponse, 
  createValidationErrorResponse,
  withErrorHandling,
  APIError,
  ValidationError
} from '@/lib/api-utils'

export const POST = withErrorHandling(async (request: NextRequest) => {
  console.log('🔥 Place bet API called')
  
  const { user, supabase } = await requireAuth()
  console.log('👤 Authenticated user:', user.id)

  const body = await request.json()
  console.log('📦 Request body:', body)
  
  const { 
    market_id,
    position, // 'yes' or 'no'
    bet_amount
  } = body

  // Validation rules
  const validationRules: Record<string, ((value: any, fieldName: string) => ValidationError | null)[]> = {
    market_id: [validators.required],
    position: [
      validators.required,
      (value: any, fieldName: string) => validators.oneOf(value, ['yes', 'no'], fieldName)
    ],
    bet_amount: [
      validators.required, 
      validators.positiveNumber,
      (value: number, fieldName: string) => {
        if (value < 1 || value > 1000000) {
          return { field: fieldName, message: `${fieldName} must be between 1 and 1,000,000` }
        }
        return null
      }
    ]
  }

  // Validate input
  const validation = validateFields(body, validationRules)
  if (!validation.isValid) {
    console.log('❌ Validation failed:', validation.errors)
    return createValidationErrorResponse(validation.errors)
  }
  console.log('✅ Validation passed')

  // Check if market exists and is active
  console.log('🏪 Checking market:', market_id)
  const { data: market, error: marketError } = await supabase
    .from('markets')
    .select('id, title, minimum_stake, status, resolved, deadline')
    .eq('id', market_id)
    .single()

  if (marketError) {
    console.error('❌ Market query error:', marketError)
    throw new APIError('Market not found', 404)
  }
  
  if (!market) {
    console.error('❌ Market not found in database')
    throw new APIError('Market not found', 404)
  }
  
  console.log('✅ Market found:', market)

  if (market.status !== 'active' || market.resolved) {
    throw new APIError('Market is not accepting bets', 400)
  }

  if (new Date(market.deadline) <= new Date()) {
    throw new APIError('Market deadline has passed', 400)
  }

  if (bet_amount < market.minimum_stake) {
    throw new APIError(`Bet amount must be at least ${market.minimum_stake}`, 400)
  }

  // Check user balance from users table
  const { data: userData, error: balanceError } = await supabase
    .from('users')
    .select('balance')
    .eq('id', user.id)
    .single()

  if (balanceError) {
    throw new APIError('Failed to check balance', 500)
  }

  const balance = Number(userData?.balance || 0)
  if (balance < bet_amount) {
    throw new APIError('Insufficient balance', 400)
  }

  // Check if user already has a bet on this market
  const { data: existingBet } = await supabase
    .from('bets_nah')
    .select('id')
    .eq('creator_id', user.id)
    .eq('market_id', market_id)
    .eq('status', 'active')
    .single()

  if (existingBet) {
    throw new APIError('You already have an active bet on this market', 400)
  }

  // Start transaction to place bet and update market
  console.log('💰 Creating bet record...')
  const betData = {
    title: `${position.toUpperCase()}: ${market.title}`,
    creator_id: user.id,
    market_id: market_id,
    arbitrator_type: 'ai', // Default for now
    bet_amount: bet_amount,
    status: 'active',
    resolved: false,
    cancelled: false,
  }
  console.log('📋 Bet data to insert:', betData)

  const { data: bet, error: betError } = await supabase
    .from('bets_nah')
    .insert(betData)
    .select('id')
    .single()

  if (betError) {
    console.error('❌ Bet creation error:', betError)
    console.error('❌ Full error details:', JSON.stringify(betError, null, 2))
    throw new APIError(`Failed to place bet: ${betError.message}`, 500)
  }
  
  console.log('✅ Bet created successfully:', bet)

  // Update user balance and record transaction
  const newBalance = balance - bet_amount
  
  const { error: balanceUpdateError } = await supabase
    .from('users')
    .update({ balance: newBalance })
    .eq('id', user.id)

  if (balanceUpdateError) {
    console.error('Balance update error:', balanceUpdateError)
    // Note: In a real app, you'd want to rollback the bet here
    throw new APIError('Failed to update balance', 500)
  }

  // Record credit transaction (debit) for history
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

  // Update market totals
  const currentTotalFor = position === 'yes' ? bet_amount : 0
  const currentTotalAgainst = position === 'no' ? bet_amount : 0

  const { error: marketUpdateError } = await supabase
    .rpc('update_market_totals', {
      p_market_id: market_id,
      p_amount_for: currentTotalFor,
      p_amount_against: currentTotalAgainst
    })

  // If RPC doesn't exist, update manually
  if (marketUpdateError) {
    console.log('RPC not available, updating manually...')
    
    // Get current totals
    const { data: currentMarket } = await supabase
      .from('markets')
      .select('total_pool_for, total_pool_against, total_pool')
      .eq('id', market_id)
      .single()

    if (currentMarket) {
      const newTotalFor = Number(currentMarket.total_pool_for || 0) + currentTotalFor
      const newTotalAgainst = Number(currentMarket.total_pool_against || 0) + currentTotalAgainst
      const newTotal = Number(currentMarket.total_pool || 0) + bet_amount

      const { error: manualUpdateError } = await supabase
        .from('markets')
        .update({
          total_pool_for: newTotalFor,
          total_pool_against: newTotalAgainst,
          total_pool: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', market_id)

      if (manualUpdateError) {
        console.error('Market update error:', manualUpdateError)
        // Continue anyway - bet was placed successfully
      }
    }
  }

  return createSuccessResponse({ 
    bet_id: bet.id,
    market_id: market_id,
    position: position,
    amount: bet_amount,
    new_balance: newBalance,
    message: 'Bet placed successfully'
  })
})
