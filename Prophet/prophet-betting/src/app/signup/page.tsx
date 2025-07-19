'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setError('Check your email to confirm your account!')
        setTimeout(() => router.push('/login'), 3000)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-black">
      <div className="w-full max-w-md">
        <div className="bg-black border border-gray-800 rounded-lg p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/">
              <h1 className="font-bold text-4xl mb-2 cursor-pointer text-white hover:scale-105 transition-transform duration-200">
                Prophet
              </h1>
            </Link>
            <p className="text-gray-400">
              Create your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Display Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-900 text-white placeholder-gray-500"
                placeholder="Your name"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-900 text-white placeholder-gray-500"
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-900 text-white placeholder-gray-500"
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
              />
              <p className="mt-2 text-sm text-gray-500">
                Minimum 6 characters
              </p>
            </div>

            {error && (
              <div className={`text-sm text-center p-3 rounded-lg ${
                error.includes('Check your email') 
                  ? "bg-green-900/20 text-green-400 border border-green-800" 
                  : "bg-red-900/20 text-red-400 border border-red-800"
              }`}>
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-black py-3 px-4 rounded-lg font-medium hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>

          {/* Terms */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By signing up, you agree to our Terms and Privacy Policy
            </p>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-gray-500">Already have an account?</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <Link
              href="/login"
              className="text-green-500 hover:text-green-400 font-medium"
            >
              Sign in instead
            </Link>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Start with 1000 credits • Create unlimited markets • Trade on anything
          </p>
        </div>
      </div>
    </div>
  )
}
