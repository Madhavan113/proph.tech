'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import BetCard from '@/components/BetCard'
import { cn } from '@/lib/utils'

interface Bet {
  id: string
  title: string
  description?: string
  deadline: string
  creator?: {
    username?: string
    full_name?: string
  }
  participant_count?: number
  total_pool?: number
  resolved?: boolean
  outcome?: boolean | null
  yes_percentage?: number
}

export default function FeedPage() {
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all')

  useEffect(() => {
    fetchBets()
  }, [filter])

  const fetchBets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: filter,
        limit: '20',
        sort: 'created_at',
        order: 'desc'
      })

      const response = await fetch(`/api/bets?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch bets')
      }

      const data = await response.json()
      setBets(data.bets || [])
    } catch (error) {
      console.error('Error fetching bets:', error)
      setBets([])
    } finally {
      setLoading(false)
    }
  }

  const filterOptions = [
    { value: 'all', label: 'All Markets' },
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
            Markets
          </h1>
          <p className="text-xl text-muted">
            Trade on the outcome of future events
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-4 mb-12"
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

        {/* Markets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="prophet-card rounded-lg h-64 skeleton"
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
                No markets found
              </h3>
              <p className="text-muted mb-8">
                Be the first to create a prediction market
              </p>
              <a href="/create" className="btn btn-primary px-6 py-2 rounded-full">
                Create Market
              </a>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bets.map((bet, index) => (
              <BetCard key={bet.id} bet={bet} index={index} />
            ))}
          </div>
        )}

        {/* Load More */}
        {bets.length >= 20 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <button className="btn btn-secondary px-8 py-3 rounded-full cursor-pointer">
              Load More
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
