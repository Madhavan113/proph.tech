import { NextRequest } from 'next/server'
import { 
  requireAuth,
  createSuccessResponse,
  withErrorHandling,
  APIError
} from '@/lib/api-utils'

// GET /api/user/bets - Get user's betting history (consolidated by market)
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user, supabase } = await requireAuth()

  const url = new URL(request.url)
  const status = url.searchParams.get('status') // 'active', 'resolved', 'all'
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const sort = url.searchParams.get('sort') || 'created_at'
  const order = url.searchParams.get('order') || 'desc'

  // First, get all user's bets with market information
  let query = supabase
    .from('bets')
    .select(`
      id,
      title,
      bet_amount,
      created_at,
      arbitrator_type,
      resolved,
      resolved_at,
      cancelled,
      status,
      market_id,
      market:markets(
        id,
        title,
        description,
        deadline,
        status,
        resolved,
        outcome,
        total_pool_for,
        total_pool_against,
        total_pool,
        minimum_stake
      )
    `)
    .eq('creator_id', user.id)
    .order('created_at', { ascending: order === 'asc' })

  // Filter by status if provided
  if (status && status !== 'all') {
    if (status === 'active') {
      query = query.eq('resolved', false).eq('cancelled', false)
    } else if (status === 'resolved') {
      query = query.eq('resolved', true)
    }
  }

  const { data: allBets, error } = await query

  if (error) {
    console.error('Get user bets error:', error)
    throw new APIError('Failed to fetch user bets', 500)
  }

  // Group bets by market_id AND position and aggregate data
  const positionGroups = new Map()
  
  allBets?.forEach(bet => {
    const marketId = bet.market_id
    if (!marketId) return

    // Extract position from bet title
    const position = bet.title.toLowerCase().includes('yes') ? 'YES' : 'NO'
    const groupKey = `${marketId}-${position}` // Group by market + position
    
    if (!positionGroups.has(groupKey)) {
      positionGroups.set(groupKey, {
        market_id: marketId,
        position: position,
        market: bet.market,
        bets: [],
        total_amount: 0,
        earliest_bet: bet.created_at,
        latest_bet: bet.created_at,
        resolved: bet.resolved,
        cancelled: bet.cancelled,
        status: bet.status,
        resolved_at: bet.resolved_at
      })
    }

    const group = positionGroups.get(groupKey)
    group.bets.push(bet)
    group.total_amount += Number(bet.bet_amount)
    
    // Update timestamps
    if (bet.created_at < group.earliest_bet) {
      group.earliest_bet = bet.created_at
    }
    if (bet.created_at > group.latest_bet) {
      group.latest_bet = bet.created_at
    }
    
    // Update status (if any bet is resolved, mark as resolved)
    if (bet.resolved) {
      group.resolved = true
      if (bet.resolved_at) {
        group.resolved_at = bet.resolved_at
      }
    }
    if (bet.cancelled) {
      group.cancelled = true
    }
  })

  // Convert map to array and create consolidated bet objects
  const consolidatedBets = Array.from(positionGroups.values()).map(group => ({
    id: `${group.market_id}-${group.position}`, // Unique ID for the consolidated bet
    market_id: group.market_id,
    title: `${group.position} bet`, // e.g., "YES bet" or "NO bet"
    bet_amount: group.total_amount,
    total_bets: group.bets.length,
    position: group.position,
    created_at: group.earliest_bet,
    latest_bet_at: group.latest_bet,
    arbitrator_type: group.bets[0].arbitrator_type,
    resolved: group.resolved,
    resolved_at: group.resolved_at,
    cancelled: group.cancelled,
    status: group.status,
    market: group.market,
    individual_bets: group.bets // Include individual bets for detailed view if needed
  }))

  // Apply pagination to consolidated results
  const paginatedBets = consolidatedBets.slice(offset, offset + limit)

  // Calculate statistics
  const totalPositions = consolidatedBets.length
  const activePositions = consolidatedBets.filter(bet => !bet.resolved && !bet.cancelled).length
  const resolvedPositions = consolidatedBets.filter(bet => bet.resolved).length
  const totalWagered = consolidatedBets.reduce((sum, bet) => sum + Number(bet.bet_amount), 0)

  // For resolved positions, determine wins based on market outcome
  const wonPositions = consolidatedBets.filter(bet => {
    if (!bet.resolved || !bet.market?.outcome) return false
    const marketOutcome = bet.market.outcome.toLowerCase()
    const userPosition = bet.position.toLowerCase()
    return userPosition === marketOutcome
  }).length

  return createSuccessResponse({ 
    bets: paginatedBets,
    pagination: {
      total: totalPositions,
      limit,
      offset,
      has_more: totalPositions > offset + limit
    },
    stats: {
      total_positions: totalPositions,
      total_bets: allBets?.length || 0,
      active_positions: activePositions,
      resolved_positions: resolvedPositions,
      won_positions: wonPositions,
      total_wagered: totalWagered,
      win_rate: resolvedPositions > 0 ? Math.round((wonPositions / resolvedPositions) * 100) : 0
    }
  })
}) 