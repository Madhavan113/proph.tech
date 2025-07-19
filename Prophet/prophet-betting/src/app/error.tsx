'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Error Icon */}
          <div className="mb-8">
            <div className="text-6xl mb-4">⚠️</div>
            <div className="w-16 h-1 bg-red-500 mx-auto rounded-full"></div>
          </div>

          {/* Content */}
          <h1 className="font-display text-3xl font-bold mb-4 text-foreground">
            Something went wrong
          </h1>
          
          <p className="text-lg text-muted mb-8 leading-relaxed">
            We encountered an unexpected error. This might be a temporary issue.
          </p>

          {/* Error details (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <div className="text-sm font-mono text-red-800 break-all">
                {error.message}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={reset}
              className="block w-full bg-prophet-green text-prophet-black py-3 px-6 rounded-full font-semibold hover:bg-prophet-green-dark transition-colors"
            >
              Try Again
            </button>
            
            <Link 
              href="/feed"
              className="block w-full border-2 border-border text-foreground py-3 px-6 rounded-full font-semibold hover:border-prophet-green hover:text-prophet-green transition-colors"
            >
              Go to Markets
            </Link>
          </div>

          {/* Help text */}
          <p className="text-sm text-muted mt-8">
            If this problem persists, try refreshing the page or{' '}
            <Link href="/feed" className="text-prophet-green hover:underline">
              return to the markets
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
} 