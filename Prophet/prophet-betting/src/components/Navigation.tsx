'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useBalance } from '@/hooks/useBalance'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { balance } = useBalance()
  const [user, setUser] = useState<User | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const navItems = [
    { href: '/feed', label: 'Markets' },
    { href: '/create', label: 'Create' },
    { href: '/my-bets', label: 'My Bets' },
  ]

  if (!user) return null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="font-display text-2xl font-bold"
            >
              Prophet
            </motion.div>
          </Link>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-prophet-green"
                        : "text-muted hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </motion.div>
                </Link>
              )
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-6">
            {/* Balance Display */}
            <div className="text-sm">
              <span className="text-muted">Balance: </span>
              <span className="font-medium text-prophet-green">
                {balance?.toFixed(0) || '0'}
              </span>
            </div>

            {/* User Menu */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={cn(
                  "w-8 h-8 rounded-full",
                  "bg-prophet-green text-prophet-black",
                  "flex items-center justify-center",
                  "text-sm font-bold ui-sans cursor-pointer"
                )}
              >
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </motion.button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg overflow-hidden"
                >
                  <div className="p-3 border-b border-border">
                    <p className="text-xs text-muted">Signed in as</p>
                    <p className="text-sm truncate">{user?.email}</p>
                  </div>
                  <Link href="/my-bets">
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                    >
                      My Bets
                    </button>
                  </Link>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut()
                      setShowUserMenu(false)
                      router.push('/')
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-muted hover:text-foreground cursor-pointer">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
