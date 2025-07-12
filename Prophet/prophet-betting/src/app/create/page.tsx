'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function CreatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    arbitratorType: 'ai',
    arbitratorEmail: '',
    minimumStake: '10'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error('Title is required')
      }
      if (!formData.deadline) {
        throw new Error('Deadline is required')
      }
      if (!formData.minimumStake || parseFloat(formData.minimumStake) <= 0) {
        throw new Error('Valid minimum stake is required')
      }

      const deadlineDate = new Date(formData.deadline)
      // Add a small buffer (1 minute) to avoid edge cases with datetime-local input
      const now = new Date()
      const oneMinuteFromNow = new Date(now.getTime() + 60000)
      
      if (deadlineDate < now) {
        throw new Error('Deadline must be in the future')
      }
      
      if (deadlineDate < oneMinuteFromNow) {
        throw new Error('Deadline must be at least 1 minute in the future')
      }

      const response = await fetch('/api/create-market', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          deadline: deadlineDate.toISOString(),
          arbitrator_type: formData.arbitratorType,
          arbitrator_email: formData.arbitratorType === 'friend' ? formData.arbitratorEmail : null,
          stake_amount: parseFloat(formData.minimumStake)
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create bet')
      }

      const data = await response.json()
      router.push(`/bet/${data.bet_id}`)
    } catch (error) {
      console.error('Error creating bet:', error)
      alert(error instanceof Error ? error.message : 'Failed to create bet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <div className="mb-12">
            <h1 className="font-display text-5xl font-bold mb-4">
              Create Market
            </h1>
            <p className="text-xl text-muted">
              Set up a new prediction market
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Market Question */}
            <div className="prophet-card rounded-lg p-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-medium mb-3">
                  Market Question
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input w-full px-4 py-3 rounded-lg"
                  placeholder="Will Bitcoin reach $100k by end of 2025?"
                  required
                />
                <p className="mt-3 text-sm text-muted">
                  Frame as a yes/no question that can be definitively resolved
                </p>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8"
              >
                <label className="block text-sm font-medium mb-3">
                  Resolution Criteria (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full px-4 py-3 rounded-lg resize-none"
                  rows={3}
                  placeholder="Specify exact conditions for YES resolution..."
                />
              </motion.div>
            </div>

            {/* Market Settings */}
            <div className="prophet-card rounded-lg p-8">
              <h3 className="font-display text-2xl font-semibold mb-6">Settings</h3>
              
              {/* Deadline */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium mb-3">
                  Resolution Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  className="input w-full px-4 py-3 rounded-lg"
                  required
                />
              </motion.div>

              {/* Minimum Stake */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6"
              >
                <label className="block text-sm font-medium mb-3">
                  Minimum Trade Amount
                </label>
                <input
                  type="number"
                  value={formData.minimumStake}
                  onChange={(e) => setFormData({ ...formData, minimumStake: e.target.value })}
                  className="input w-full px-4 py-3 rounded-lg"
                  min="1"
                  step="1"
                  required
                />
              </motion.div>
            </div>

            {/* Arbitrator Selection */}
            <div className="prophet-card rounded-lg p-8">
              <h3 className="font-display text-2xl font-semibold mb-6">Resolution Method</h3>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'creator', label: 'Self', desc: 'You resolve' },
                    { value: 'friend', label: 'Trusted', desc: 'Friend resolves' },
                    { value: 'ai', label: 'AI Judge', desc: 'AI resolves' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, arbitratorType: option.value })}
                      className={cn(
                        "p-4 rounded-lg text-center transition-all duration-200",
                        formData.arbitratorType === option.value
                          ? "bg-prophet-green text-prophet-black"
                          : "border border-border hover:border-prophet-green"
                      )}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm mt-1 opacity-80">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Friend Email */}
              {formData.arbitratorType === 'friend' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6"
                >
                  <label className="block text-sm font-medium mb-3">
                    Arbitrator&apos;s Email
                  </label>
                  <input
                    type="email"
                    value={formData.arbitratorEmail}
                    onChange={(e) => setFormData({ ...formData, arbitratorEmail: e.target.value })}
                    className="input w-full px-4 py-3 rounded-lg"
                    placeholder="trusted@friend.com"
                    required
                  />
                </motion.div>
              )}
            </div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full btn btn-primary py-4 rounded-full text-lg font-medium",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {loading ? 'Creating Market...' : 'Create Market'}
              </button>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center"
            >
              <p className="text-sm text-muted">
                Markets are binding • Trades cannot be reversed • Resolution is final
              </p>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
