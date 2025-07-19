'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useState } from 'react'

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
    minimum_stake?: number
  }
  index?: number
}

export default function BetCard({ bet, index = 0 }: BetCardProps) {
  console.log('🎲 BetCard rendered for market:', bet.id, bet.title)
  
  const deadlineDate = new Date(bet.deadline)
  const isExpired = deadlineDate < new Date()
  const daysLeft = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const hoursLeft = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60))
  
  // Mock probability for demo (in real app, calculate from bets)
  const yesPercentage = bet.yes_percentage || Math.floor(Math.random() * 80) + 10

  // State for bet input
  const [activeInput, setActiveInput] = useState<'yes' | 'no' | null>(null)
  const [betAmount, setBetAmount] = useState(bet.minimum_stake || 10)
  const [isPlacingBet, setIsPlacingBet] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debug state changes
  console.log('🎲 BetCard state:', { activeInput, betAmount, isPlacingBet, error })

  const placeBet = async (position: 'yes' | 'no', amount: number) => {
    console.log('🎯 placeBet function called!', { position, amount, marketId: bet.id })
    console.log('📊 Current state before bet:', { activeInput, betAmount, isPlacingBet })
    
    try {
      console.log('🔄 Setting isPlacingBet to true...')
      setIsPlacingBet(true)
      setError(null)

      const requestBody = {
        market_id: bet.id,
        position: position,
        bet_amount: amount
      }

      console.log('🚀 About to make API call with data:', requestBody)
      console.log('🌐 Fetch URL: /api/place-bet')

      console.log('🌐 Making fetch request to: /api/place-bet-debug')
      const response = await fetch('/api/place-bet-authenticated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('📡 Response received!')
      console.log('📡 Response status:', response.status)
      console.log('📡 Response OK:', response.ok)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

      const responseText = await response.text()
      console.log('📄 Raw response:', responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError)
        throw new Error('Invalid response from server')
      }

      if (!response.ok) {
        console.error('❌ API Error:', data)
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      console.log('✅ Bet placed successfully:', data)
      
      // Reset form
      setActiveInput(null)
      setBetAmount(bet.minimum_stake || 10)
      
      // Show success message with new balance
      alert(`${position.toUpperCase()} bet of ${amount} placed successfully! New balance: ${data.new_balance}`)
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR in placeBet:', error)
      console.error('❌ Error type:', typeof error)
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error')
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      setError(error instanceof Error ? error.message : 'Failed to place bet')
    } finally {
      console.log('🔄 Setting isPlacingBet to false...')
      setIsPlacingBet(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <div className={cn(
        "prophet-card rounded-lg p-6 h-full",
        "transition-all duration-300",
        "relative overflow-hidden",
        "flex flex-col"
      )}>
        {/* Clickable overlay for navigation - temporarily disabled */}
        {!activeInput && (
          <div 
            className="absolute inset-0 z-10 cursor-pointer" 
            onClick={() => {
              // TODO: Implement market detail page
              console.log('Market detail page coming soon for:', bet.id)
            }}
          />
        )}
          {/* Minimum bet display */}
          <div className="absolute top-4 right-4 text-right">
            <div className="text-xs text-muted">Min Bet</div>
            <div className="text-sm font-semibold text-foreground">
              {bet.minimum_stake || 10}
            </div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex flex-col h-full">
            {/* Title */}
            <h3 className="text-lg font-medium mb-4 line-clamp-2 pr-20 min-h-[3.5rem] flex items-start">
              {bet.title}
            </h3>

            {/* Probability Display */}
            <div className="mb-6 min-h-[6rem] flex flex-col justify-center">
              {!bet.resolved ? (
                <>
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
                </>
              ) : null}
            </div>

            {/* Resolved outcome - integrated into probability section */}
            {bet.resolved && bet.outcome !== null && (
              <div className="mb-6 min-h-[6rem] flex flex-col justify-center">
                <div className={cn(
                  "text-3xl font-bold",
                  bet.outcome ? "text-prophet-green" : "text-foreground"
                )}>
                  {bet.outcome ? "YES" : "NO"}
                </div>
                <span className="text-sm text-muted">Final outcome</span>
              </div>
            )}

            {/* Flexible spacer */}
            <div className="flex-grow"></div>

            {/* Error display */}
            {error && (
              <div className="mb-3 p-2 bg-red-900/20 text-red-400 text-xs rounded border border-red-800">
                {error}
              </div>
            )}

            {/* Buy buttons (always visible) */}
            {!bet.resolved && !isExpired && (
              <div className="mb-4 relative z-20 betting-controls">
                <div className="flex gap-3">
                  {activeInput === 'yes' ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="number"
                        min={bet.minimum_stake || 10}
                        max="1000000"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            placeBet('yes', betAmount)
                          } else if (e.key === 'Escape') {
                            setActiveInput(null)
                          }
                        }}
                        onBlur={(e) => {
                          // Only close if clicking outside the betting area
                          const relatedTarget = e.relatedTarget as HTMLElement
                          if (!relatedTarget || !relatedTarget.closest('.betting-controls')) {
                            setTimeout(() => setActiveInput(null), 100)
                          }
                        }}
                        autoFocus
                        className="flex-1 px-3 py-2 text-sm border-2 border-prophet-green rounded-full bg-background text-center focus:outline-none focus:ring-2 focus:ring-prophet-green/50"
                      />
                      <button
                        onClick={(e) => {
                          console.log('✅ YES checkmark clicked!', { betAmount, isPlacingBet })
                          e.preventDefault()
                          e.stopPropagation()
                          

                          placeBet('yes', betAmount)
                        }}
                        disabled={isPlacingBet}
                        className="px-4 py-2 btn btn-yes btn-bet rounded-full text-xs disabled:opacity-50"
                      >
                        {isPlacingBet ? '...' : '✓'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setActiveInput(null)
                        }}
                        className="px-2 py-2 text-xs text-gray-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        console.log('💚 Buy YES clicked!')
                        e.preventDefault()
                        e.stopPropagation()
                        setActiveInput('yes')
                        setBetAmount(bet.minimum_stake || 10)
                      }}
                      className="flex-1 btn btn-yes btn-bet rounded-full py-3 font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    >
                      Buy YES
                    </button>
                  )}

                  {activeInput === 'no' ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="number"
                        min={bet.minimum_stake || 10}
                        max="1000000"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            placeBet('no', betAmount)
                          } else if (e.key === 'Escape') {
                            setActiveInput(null)
                          }
                        }}
                        onBlur={(e) => {
                          // Only close if clicking outside the betting area  
                          const relatedTarget = e.relatedTarget as HTMLElement
                          if (!relatedTarget || !relatedTarget.closest('.betting-controls')) {
                            setTimeout(() => setActiveInput(null), 100)
                          }
                        }}
                        autoFocus
                        className="flex-1 px-3 py-2 text-sm border-2 border-foreground rounded-full bg-background text-center focus:outline-none focus:ring-2 focus:ring-foreground/50"
                      />
                      <button
                        onClick={(e) => {
                          console.log('❌ NO checkmark clicked!', { betAmount, isPlacingBet })
                          e.preventDefault()
                          e.stopPropagation()
                          

                          placeBet('no', betAmount)
                        }}
                        disabled={isPlacingBet}
                        className="px-4 py-2 btn btn-no btn-bet rounded-full text-xs disabled:opacity-50"
                      >
                        {isPlacingBet ? '...' : '✓'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setActiveInput(null)
                        }}
                        className="px-2 py-2 text-xs text-gray-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        console.log('🔴 Buy NO clicked!')
                        e.preventDefault()
                        e.stopPropagation()
                        setActiveInput('no')
                        setBetAmount(bet.minimum_stake || 10)
                      }}
                      className="flex-1 btn btn-no btn-bet rounded-full py-3 font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    >
                      Buy NO
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Bottom info section - always at bottom */}
            <div className="mt-auto pt-4 border-t border-border">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted">Traders</div>
                  <div className="font-medium">
                    {bet.participant_count || 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">
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
                <div className="text-right">
                  <div className="text-xs text-muted">Total Volume</div>
                  <div className="text-lg font-bold text-foreground">
                    {bet.total_pool?.toFixed(0) || 0}
                  </div>
                </div>
              </div>
              {bet.creator && (
                <div className="mt-2 text-xs text-muted">
                  by {bet.creator.username || bet.creator.full_name || 'Anonymous'}
                </div>
              )}
            </div>
          </div>
        </div>
    </motion.div>
  )
}
