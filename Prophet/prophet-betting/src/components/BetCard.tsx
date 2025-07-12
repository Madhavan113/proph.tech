'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface BetCardProps {
  bet: {
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
  index?: number
}

export default function BetCard({ bet, index = 0 }: BetCardProps) {
  const deadlineDate = new Date(bet.deadline)
  const isExpired = deadlineDate < new Date()
  const daysLeft = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const hoursLeft = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60))
  
  // Mock probability for demo (in real app, calculate from bets)
  const yesPercentage = bet.yes_percentage || Math.floor(Math.random() * 80) + 10

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Link href={`/bet/${bet.id}`}>
        <div className={cn(
          "prophet-card rounded-lg p-6 h-full",
          "transition-all duration-300",
          "relative overflow-hidden"
        )}>
          {/* Market status badge */}
          <div className="absolute top-4 right-4">
            {bet.resolved ? (
              <span className="badge badge-default">Resolved</span>
            ) : isExpired ? (
              <span className="badge badge-default">
                Pending
              </span>
            ) : (
              <span className="badge badge-active">Active</span>
            )}
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            {/* Title */}
            <h3 className="text-lg font-medium mb-4 line-clamp-2 pr-20">
              {bet.title}
            </h3>

            {/* Probability Display */}
            {!bet.resolved && (
              <div className="mb-6">
                <div className="flex justify-between items-baseline mb-3">
                  <div className="flex items-baseline gap-6">
                    <div>
                      <span className="text-3xl font-bold">{yesPercentage}%</span>
                      <span className="text-sm text-muted ml-2">YES</span>
                    </div>
                    <div>
                      <span className="text-3xl font-bold text-muted">{100 - yesPercentage}%</span>
                      <span className="text-sm text-muted ml-2">NO</span>
                    </div>
                  </div>
                </div>
                
                {/* Probability bar */}
                <div className="probability-bar">
                  <div 
                    className="probability-fill"
                    style={{ width: `${yesPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Resolved outcome */}
            {bet.resolved && bet.outcome !== null && (
              <div className="mb-6">
                <div className={cn(
                  "text-3xl font-bold",
                  bet.outcome ? "text-prophet-green" : "text-foreground"
                )}>
                  {bet.outcome ? "YES" : "NO"}
                </div>
                <span className="text-sm text-muted">Final outcome</span>
              </div>
            )}

            {/* Market stats */}
            <div className="flex gap-6 mb-6 text-sm">
              <div>
                <div className="text-muted mb-1">Volume</div>
                <div className="font-medium">
                  {bet.total_pool?.toFixed(0) || 0}
                </div>
              </div>
              <div>
                <div className="text-muted mb-1">Traders</div>
                <div className="font-medium">
                  {bet.participant_count || 0}
                </div>
              </div>
              <div>
                <div className="text-muted mb-1">
                  {bet.resolved ? 'Ended' : 'Ends in'}
                </div>
                <div className="font-medium">
                  {bet.resolved ? (
                    new Date(bet.deadline).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })
                  ) : hoursLeft < 48 ? (
                    `${hoursLeft}h`
                  ) : (
                    `${daysLeft}d`
                  )}
                </div>
              </div>
            </div>

            {/* Quick bet buttons (show on hover) */}
            {!bet.resolved && !isExpired && (
              <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    // In real app, this would open a bet modal
                  }}
                  className="flex-1 btn btn-yes btn-bet rounded-full py-2"
                >
                  Buy YES
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    // In real app, this would open a bet modal
                  }}
                  className="flex-1 btn btn-no btn-bet rounded-full py-2"
                >
                  Buy NO
                </button>
              </div>
            )}

            {/* Creator info */}
            {bet.creator && (
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-sm text-muted">
                  by {bet.creator.username || bet.creator.full_name || 'Anonymous'}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
