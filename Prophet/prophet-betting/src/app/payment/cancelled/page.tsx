'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function PaymentCancelledPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-lg p-8"
        >
          <div className="text-6xl mb-4">❌</div>
          <h1 className="font-display text-3xl font-bold mb-4">
            Payment Cancelled
          </h1>
          <p className="text-muted mb-8">
            Your payment was cancelled. No charges were made to your account.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/credits')}
              className="flex-1 btn btn-primary py-3 rounded-full"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/feed')}
              className="flex-1 btn btn-secondary py-3 rounded-full"
            >
              Browse Markets
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 