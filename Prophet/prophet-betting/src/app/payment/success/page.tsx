'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { useBalance } from '@/hooks/useBalance'

export default function PaymentSuccessPage() {
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { balance, refetch } = useBalance()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Refetch balance to show updated credits
    refetch()
    setLoading(false)
  }, [refetch])

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-lg p-8"
        >
          <div className="text-6xl mb-4">✅</div>
          <h1 className="font-display text-3xl font-bold mb-4">
            Payment Successful!
          </h1>
          <p className="text-muted mb-6">
            Your credits have been added to your account
          </p>
          
          <div className="bg-prophet-green/10 border border-prophet-green/20 rounded-lg p-4 mb-6">
            <div className="text-sm text-muted mb-1">Current Balance</div>
            <div className="text-2xl font-bold text-prophet-green">
              {loading ? '...' : `${balance?.toFixed(0) || '0'} Credits`}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/feed')}
              className="flex-1 btn btn-primary py-3 rounded-full"
            >
              Start Betting
            </button>
            <button
              onClick={() => router.push('/credits')}
              className="flex-1 btn btn-secondary py-3 rounded-full"
            >
              Buy More
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 