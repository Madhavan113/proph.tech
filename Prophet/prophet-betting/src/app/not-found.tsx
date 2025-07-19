'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 404 Icon */}
          <div className="mb-8">
            <div className="text-6xl font-bold text-prophet-green mb-4">404</div>
            <div className="w-16 h-1 bg-prophet-green mx-auto rounded-full"></div>
          </div>

          {/* Content */}
          <h1 className="font-display text-3xl font-bold mb-4 text-foreground">
            Page Not Found
          </h1>
          
          <p className="text-lg text-muted mb-8 leading-relaxed">
            The market you're looking for doesn't exist or may have been removed.
          </p>

          {/* Actions */}
          <div className="space-y-4">
            <Link 
              href="/feed"
              className="block w-full bg-prophet-green text-prophet-black py-3 px-6 rounded-full font-semibold hover:bg-prophet-green-dark transition-colors"
            >
              Browse Markets
            </Link>
            
            <Link 
              href="/create"
              className="block w-full border-2 border-border text-foreground py-3 px-6 rounded-full font-semibold hover:border-prophet-green hover:text-prophet-green transition-colors"
            >
              Create a Market
            </Link>
          </div>

          {/* Help text */}
          <p className="text-sm text-muted mt-8">
            Need help? Check out our{' '}
            <Link href="/feed" className="text-prophet-green hover:underline">
              active markets
            </Link>
            {' '}or{' '}
            <Link href="/create" className="text-prophet-green hover:underline">
              start a new prediction
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
} 