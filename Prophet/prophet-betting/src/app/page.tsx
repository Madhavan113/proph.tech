'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Simple centered content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo */}
          <h1 className="font-display text-6xl md:text-8xl font-bold mb-6 tracking-tight">
            Prophet
          </h1>
          
          {/* Tagline */}
          <p className="text-xl md:text-2xl mb-12 text-muted">
            Bet on everything
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-primary px-8 py-3 rounded-full text-base"
              >
                Get Started
              </motion.button>
            </Link>

            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-secondary px-8 py-3 rounded-full text-base"
              >
                Sign In
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Subtle accent */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute -bottom-20 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-px h-20 bg-gradient-to-b from-border to-transparent" />
        </motion.div>
      </div>

      {/* Glass overlay elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 glass rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-20 right-10 w-96 h-96 glass rounded-full blur-3xl opacity-20" />
      </div>
    </div>
  )
}
