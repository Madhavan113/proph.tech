import { 
  requireAuth, 
  createSuccessResponse, 
  withErrorHandling
} from '@/lib/api-utils'

export const GET = withErrorHandling(async () => {
  const { user, supabase } = await requireAuth()

  // First, check if credit_transactions table exists and has data
  const { data: transactions, error: balanceError } = await supabase
    .from('credit_transactions')
    .select('amount')
    .eq('user_id', user.id)

  if (balanceError) {
    console.error('Balance query error:', balanceError)
    // If table doesn't exist or other error, return default balance
    return createSuccessResponse({
      balance: 100, // Default starting balance
      recent_transactions: [],
      active_bets: [],
      stats: {
        total_transactions: 0,
        active_bets_count: 0
      }
    })
  }

  const currentBalance = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 100

  // Get recent transactions
  const { data: recentTransactions } = await supabase
    .from('credit_transactions')
    .select(`
      id,
      amount,
      transaction_type,
      description,
      created_at,
      bet_id
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get active bets (bets user has participated in that are not resolved)
  const { data: activeBets } = await supabase
    .from('bet_participants')
    .select(`
      id,
      stake_amount,
      prediction,
      created_at,
      bet:bets!inner(
        id,
        title,
        deadline,
        resolved
      )
    `)
    .eq('user_id', user.id)
    .eq('bet.resolved', false)
    .order('created_at', { ascending: false })

  // Calculate stats
  const activeBetsCount = activeBets?.length || 0
  const totalStaked = activeBets?.reduce((sum, bet) => sum + Number(bet.stake_amount), 0) || 0

  return createSuccessResponse({
    balance: currentBalance,
    recent_transactions: recentTransactions || [],
    active_bets: activeBets || [],
    stats: {
      total_transactions: transactions?.length || 0,
      active_bets_count: activeBetsCount,
      total_staked: totalStaked
    }
  })
})
