'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Market {
  id: string
  title: string
  description?: string
  deadline: string
  status: string
  resolved: boolean
  outcome?: string | null
  total_pool_for: number
  total_pool_against: number
  total_pool: number
  minimum_stake: number
}

interface UserBet {
  id: string
  market_id: string
  title: string
  bet_amount: number
  total_bets: number
  position: string
  created_at: string
  latest_bet_at: string
  arbitrator_type: string
  resolved: boolean
  resolved_at?: string | null
  cancelled: boolean
  status: string
  market: Market | null
  individual_bets?: any[]
}

interface BetStats {
  total_positions: number
  total_bets: number
  active_positions: number
  resolved_positions: number
  won_positions: number
  total_wagered: number
  win_rate: number
}

interface BetCardProps {
  bet: UserBet
  index: number
}

function MyBetCard({ bet, index }: BetCardProps) {
  const deadlineDate = bet.market?.deadline ? new Date(bet.market.deadline) : null
  const betDate = new Date(bet.created_at)
  const isExpired = deadlineDate ? deadlineDate < new Date() : false
  const daysLeft = deadlineDate ? Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0
  
  // Position is now a single string from the API
  const position = bet.position
  
  // Determine bet status
  const getBetStatus = () => {
    if (bet.cancelled) {
      return 'Cancelled'
    } else if (bet.resolved) {
      // Check if user won by comparing bet position with market outcome
      if (!bet.market?.outcome) return 'Resolved'
      const betPosition = position.toLowerCase()
      const marketOutcome = bet.market.outcome.toLowerCase()
      return betPosition === marketOutcome ? 'Won' : 'Lost'
    } else if (isExpired) {
      return 'Expired'
    } else {
      return 'Active'
    }
  }

  const status = getBetStatus()
  const statusColor = {
    'Won': 'text-green-500 bg-green-500/10',
    'Lost': 'text-red-500 bg-red-500/10',
    'Active': 'text-blue-500 bg-blue-500/10',
    'Expired': 'text-orange-500 bg-orange-500/10',
    'Cancelled': 'text-gray-500 bg-gray-500/10',
    'Resolved': 'text-purple-500 bg-purple-500/10'
  }[status] || 'text-gray-500 bg-gray-500/10'

  const positionColor = position === 'YES' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="prophet-card rounded-lg p-6 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="font-medium text-lg mb-2 line-clamp-2">
            {bet.market?.title || 'N/A'}
          </h3>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", positionColor)}>
              {position}
            </span>
            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColor)}>
              {status}
            </span>
            {bet.total_bets > 1 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                {bet.total_bets} bets
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">
            {bet.bet_amount}
          </div>
          <div className="text-xs text-muted">
            Total Wagered
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm border-t border-border pt-4">
        <div>
          <div className="text-muted text-xs">First Bet</div>
          <div className="font-medium">
            {betDate.toLocaleDateString()}
          </div>
        </div>
        <div>
          <div className="text-muted text-xs">
            {bet.resolved ? 'Resolved' : isExpired ? 'Expired' : 'Deadline'}
          </div>
          <div className="font-medium">
            {bet.resolved && bet.resolved_at 
              ? new Date(bet.resolved_at).toLocaleDateString()
              : deadlineDate 
                ? deadlineDate.toLocaleDateString()
                : 'N/A'
            }
          </div>
        </div>
      </div>

      {bet.market?.description && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-sm text-muted line-clamp-2">
            {bet.market.description}
          </p>
        </div>
      )}
    </motion.div>
  )
}

export default function MyBetsPage() {
  const [bets, setBets] = useState<UserBet[]>([])
  const [stats, setStats] = useState<BetStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      fetchMyBets()
    }
    checkAuth()
  }, [filter, router, supabase])

  const fetchMyBets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: filter,
        limit: '50',
        sort: 'created_at',
        order: 'desc'
      })

      const response = await fetch(`/api/user/bets?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch bets')
      }

      const data = await response.json()
      setBets(data.bets || [])
      setStats(data.stats || null)
      setError(null)
    } catch (error) {
      console.error('Error fetching bets:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch bets')
    } finally {
      setLoading(false)
    }
  }

  const filterOptions = [
    { value: 'all', label: 'All Bets' },
    { value: 'active', label: 'Active' },
    { value: 'resolved', label: 'Resolved' }
  ]

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="font-display text-5xl font-bold mb-4">
            My Bets
          </h1>
          <p className="text-xl text-muted">
            Track your betting history and performance
          </p>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="glass rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-prophet-green">{stats.total_positions}</div>
              <div className="text-sm text-muted">Total Positions</div>
            </div>
            <div className="glass rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.active_positions}</div>
              <div className="text-sm text-muted">Active</div>
            </div>
            <div className="glass rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-500">{stats.total_wagered}</div>
              <div className="text-sm text-muted">Total Wagered</div>
            </div>
            <div className="glass rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-500">{stats.win_rate}%</div>
              <div className="text-sm text-muted">Win Rate</div>
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4 mb-8"
        >
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value as 'all' | 'active' | 'resolved')}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer",
                filter === option.value
                  ? "bg-prophet-green text-prophet-black"
                  : "border border-border hover:border-prophet-green"
              )}
            >
              {option.label}
            </button>
          ))}
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-lg p-6 mb-8 border-l-4 border-red-500"
          >
            <div className="text-red-600 font-medium">Error</div>
            <div className="text-red-500 text-sm">{error}</div>
          </motion.div>
        )}

        {/* Bets List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="prophet-card rounded-lg h-48 skeleton"
              />
            ))}
          </div>
        ) : bets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="glass rounded-lg p-12 max-w-md mx-auto">
              <h3 className="font-display text-2xl font-semibold mb-4">
                No positions found
              </h3>
              <p className="text-muted mb-8">
                {filter === 'all' 
                  ? "You haven't placed any bets yet" 
                  : `No ${filter} positions found`
                }
              </p>
              <a href="/feed" className="btn btn-primary px-6 py-2 rounded-full">
                Browse Markets
              </a>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bets.map((bet, index) => (
              <MyBetCard key={bet.id} bet={bet} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 