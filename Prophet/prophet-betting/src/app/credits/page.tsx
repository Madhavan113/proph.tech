'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { CREDIT_PACKAGES, getStripe } from '@/lib/stripe/config'
import type { CreditPackage } from '@/lib/stripe/config'
import { useBalance } from '@/hooks/useBalance'

export default function CreditsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { balance } = useBalance()

  const handlePurchase = async (packageId: string) => {
    try {
      setLoading(packageId)
      setError(null)

      // Create checkout session
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionId } = await response.json()

      // Redirect to Stripe checkout
      const stripe = await getStripe()
      const { error: stripeError } = await stripe!.redirectToCheckout({
        sessionId,
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

    } catch (error) {
      console.error('Purchase error:', error)
      setError(error instanceof Error ? error.message : 'Purchase failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-background via-background to-background/95">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="font-display text-6xl font-bold mb-6 bg-gradient-to-r from-prophet-green via-white to-prophet-green bg-clip-text text-transparent">
            Purchase Credits
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Fuel your predictions with credits. Choose the perfect package for your betting strategy.
          </p>
          
          {/* Current Balance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-3 bg-black/20 backdrop-blur-sm border border-white/10 rounded-full px-6 py-3"
          >
            <div className="w-2 h-2 bg-prophet-green rounded-full animate-pulse"></div>
            <span className="text-muted-foreground text-sm">Current Balance:</span>
            <span className="text-2xl font-bold text-prophet-green">
              {balance?.toFixed(0) || '0'}
            </span>
            <span className="text-sm text-muted-foreground">Credits</span>
          </motion.div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 max-w-md mx-auto"
          >
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl p-4 text-red-400 text-center">
              {error}
            </div>
          </motion.div>
        )}

        {/* Credit Packages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
        >
          {CREDIT_PACKAGES.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className={cn(
                "relative group",
                "bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8",
                "hover:border-prophet-green/50 hover:bg-black/60 transition-all duration-300",
                pkg.popular && "border-prophet-green/50 bg-black/50"
              )}
            >
              {pkg.popular && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                >
                  <div className="bg-gradient-to-r from-prophet-green to-green-400 text-black px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
                    Popular Choice
                  </div>
                </motion.div>
              )}

              <div className="text-center">
                {/* Credits Amount */}
                <div className="mb-6">
                  <div className="text-5xl font-bold text-white mb-2 group-hover:text-prophet-green transition-colors duration-300">
                    {pkg.credits.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground uppercase tracking-wider">Credits</div>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-3xl font-bold text-white">${pkg.price}</span>
                    <span className="text-sm text-muted-foreground">USD</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${(pkg.price / pkg.credits).toFixed(3)} per credit
                  </div>
                </div>

                {/* Purchase Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading === pkg.id}
                  className={cn(
                    "w-full py-4 px-6 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all duration-300",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    pkg.popular
                      ? "bg-gradient-to-r from-prophet-green to-green-400 text-black hover:from-prophet-green/90 hover:to-green-400/90 shadow-lg shadow-prophet-green/25"
                      : "bg-white/5 text-white border border-white/20 hover:bg-white/10 hover:border-white/30"
                  )}
                >
                  {loading === pkg.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      Processing
                    </div>
                  ) : (
                    'Purchase Now'
                  )}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center"
        >
          <div className="max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Payments are processed securely through Stripe. Credits are added to your account instantly upon successful payment.
              <br />
              <span className="text-prophet-green">Start predicting the future today.</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 