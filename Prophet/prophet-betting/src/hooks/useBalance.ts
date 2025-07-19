'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useBalance() {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchBalance = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/balance')
      
      if (!response.ok) {
        throw new Error('Failed to fetch balance')
      }
      
      const data = await response.json()
      setBalance(data.balance)
      setError(null)
    } catch (err) {
      console.warn('Balance fetch failed:', err instanceof Error ? err.message : 'Unknown error')
      setError(err instanceof Error ? err.message : 'Failed to fetch balance')
      setBalance(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()

    // Set up real-time subscription to users table for balance changes
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const channel = supabase
          .channel('balance-changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'users',
              filter: `id=eq.${user.id}`
            },
            () => {
              // Refetch balance when user balance changes
              fetchBalance()
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      }
    }

    const cleanup = setupSubscription()
    
    return () => {
      cleanup?.then(cleanupFn => cleanupFn?.())
    }
  }, [supabase])

  return { balance, loading, error, refetch: fetchBalance }
}
