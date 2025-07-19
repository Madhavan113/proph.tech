'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
    setError(null)

    try {
      // Client-side validation
      if (!formData.title.trim()) {
        throw new Error('Title is required')
      }
      if (formData.title.length < 3 || formData.title.length > 200) {
        throw new Error('Title must be between 3 and 200 characters')
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required')
      }
      if (formData.description.length < 10 || formData.description.length > 1000) {
        throw new Error('Description must be between 10 and 1000 characters')
      }
      if (!formData.deadline) {
        throw new Error('Deadline is required')
      }
      const deadlineDate = new Date(formData.deadline)
      const now = new Date()
      if (deadlineDate <= now) {
        throw new Error('Deadline must be in the future')
      }
      if (!formData.minimumStake || parseFloat(formData.minimumStake) <= 0) {
        throw new Error('Valid minimum stake is required')
      }
      if (formData.arbitratorType === 'friend' && !formData.arbitratorEmail.trim()) {
        throw new Error('Arbitrator email is required when selecting a friend')
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
        throw new Error(errorData.error || 'Failed to create market')
      }

      const data = await response.json()
      router.push(`/bet/${data.bet_id}`)
    } catch (error) {
      console.error('Error creating market:', error)
      setError(error instanceof Error ? error.message : 'Failed to create market')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-black">
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 text-white">
            Create Market
          </h1>
          <p className="text-xl text-gray-400">
            Set up a new prediction market
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Market Question */}
          <div className="bg-black border border-gray-800 rounded-lg p-8 shadow-lg">
            <div>
              <label className="block text-sm font-medium mb-3 text-gray-300">
                Market Question
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-900 text-white placeholder-gray-500"
                placeholder="Will Bitcoin reach $100k by end of 2025?"
                required
                disabled={loading}
                maxLength={200}
              />
              <p className="mt-3 text-sm text-gray-500">
                Frame as a yes/no question that can be definitively resolved (3-200 characters)
              </p>
            </div>

            {/* Description */}
            <div className="mt-8">
              <label className="block text-sm font-medium mb-3 text-gray-300">
                Resolution Criteria
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-900 text-white placeholder-gray-500 resize-none"
                rows={4}
                placeholder="Specify exact conditions for YES resolution..."
                required
                disabled={loading}
                maxLength={1000}
              />
              <p className="mt-2 text-sm text-gray-500">
                Detailed description of how this market will be resolved (10-1000 characters)
              </p>
            </div>
          </div>

          {/* Market Settings */}
          <div className="bg-black border border-gray-800 rounded-lg p-8 shadow-lg">
            <h3 className="text-2xl font-semibold mb-6 text-white">Settings</h3>
            
            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium mb-3 text-gray-300">
                Resolution Date
              </label>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-900 text-white"
                required
                disabled={loading}
              />
            </div>

            {/* Minimum Stake */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-3 text-gray-300">
                Minimum Trade Amount
              </label>
              <input
                type="number"
                value={formData.minimumStake}
                onChange={(e) => handleInputChange('minimumStake', e.target.value)}
                className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-900 text-white"
                min="1"
                step="1"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Arbitrator Selection */}
          <div className="bg-black border border-gray-800 rounded-lg p-8 shadow-lg">
            <h3 className="text-2xl font-semibold mb-6 text-white">Resolution Method</h3>
            
            <div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'creator', label: 'Self', desc: 'You resolve' },
                  { value: 'friend', label: 'Trusted', desc: 'Friend resolves' },
                  { value: 'ai', label: 'AI Judge', desc: 'AI resolves' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange('arbitratorType', option.value)}
                    className={`p-4 rounded-lg text-center transition-all duration-200 cursor-pointer border-2 ${
                      formData.arbitratorType === option.value
                        ? "bg-green-600 text-black border-green-600"
                        : "border-gray-700 hover:border-green-500 bg-gray-900 text-white"
                    }`}
                    disabled={loading}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm mt-1 opacity-80">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Friend Email */}
            {formData.arbitratorType === 'friend' && (
              <div className="mt-6">
                <label className="block text-sm font-medium mb-3 text-gray-300">
                  Arbitrator's Email
                </label>
                <input
                  type="email"
                  value={formData.arbitratorEmail}
                  onChange={(e) => handleInputChange('arbitratorEmail', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-900 text-white placeholder-gray-500"
                  placeholder="trusted@friend.com"
                  required
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 text-red-400 p-4 rounded-lg border border-red-800">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-black py-4 px-6 rounded-lg text-lg font-medium hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {loading ? 'Creating Market...' : 'Create Market'}
            </button>
          </div>

          {/* Info */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Markets are binding • Trades cannot be reversed • Resolution is final
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
