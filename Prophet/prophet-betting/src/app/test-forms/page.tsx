'use client'

import { useState } from 'react'

export default function TestFormsPage() {
  const [formData, setFormData] = useState({
    text: '',
    email: '',
    password: '',
    textarea: '',
    number: '',
    date: '',
    select: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Form submitted successfully! All inputs are working.')
    console.log('Form data:', formData)
  }

  const handleReset = () => {
    setFormData({
      text: '',
      email: '',
      password: '',
      textarea: '',
      number: '',
      date: '',
      select: ''
    })
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="form-container">
          <h1 className="text-3xl font-bold mb-6 text-black">
            Form Input Test Page
          </h1>
          <p className="text-gray-600 mb-8">
            Test all form inputs to verify they're working correctly with the Prophet design system.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="form-label">
                Text Input
              </label>
              <input
                type="text"
                value={formData.text}
                onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                className="input w-full"
                placeholder="Type something here..."
              />
              <p className="text-sm text-gray-500 mt-1">Current value: "{formData.text}"</p>
            </div>

            <div className="form-group">
              <label className="form-label">
                Email Input
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="input w-full"
                placeholder="test@example.com"
              />
              <p className="text-sm text-gray-500 mt-1">Current value: "{formData.email}"</p>
            </div>

            <div className="form-group">
              <label className="form-label">
                Password Input
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="input w-full"
                placeholder="Enter password..."
              />
              <p className="text-sm text-gray-500 mt-1">Password length: {formData.password.length} characters</p>
            </div>

            <div className="form-group">
              <label className="form-label">
                Number Input
              </label>
              <input
                type="number"
                value={formData.number}
                onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                className="input w-full"
                placeholder="Enter a number..."
                min="0"
                max="1000"
              />
              <p className="text-sm text-gray-500 mt-1">Current value: "{formData.number}"</p>
            </div>

            <div className="form-group">
              <label className="form-label">
                Date Input
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="input w-full"
              />
              <p className="text-sm text-gray-500 mt-1">Current value: "{formData.date}"</p>
            </div>

            <div className="form-group">
              <label className="form-label">
                Select Dropdown
              </label>
              <select
                value={formData.select}
                onChange={(e) => setFormData(prev => ({ ...prev, select: e.target.value }))}
                className="select w-full"
              >
                <option value="">Choose an option...</option>
                <option value="option1">Option 1</option>
                <option value="option2">Option 2</option>
                <option value="option3">Option 3</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">Selected: "{formData.select}"</p>
            </div>

            <div className="form-group">
              <label className="form-label">
                Textarea
              </label>
              <textarea
                value={formData.textarea}
                onChange={(e) => setFormData(prev => ({ ...prev, textarea: e.target.value }))}
                className="textarea w-full"
                placeholder="Enter multiple lines of text..."
                rows={4}
              />
              <p className="text-sm text-gray-500 mt-1">Character count: {formData.textarea.length}</p>
            </div>

            <div className="form-group">
              <label className="form-label">
                Disabled Input (Test)
              </label>
              <input
                type="text"
                value="This input is disabled"
                className="input w-full"
                disabled
              />
              <p className="text-sm text-gray-500 mt-1">This input should be disabled and styled accordingly</p>
            </div>

            <div className="form-group">
              <label className="form-label">
                Error State Input (Test)
              </label>
              <input
                type="text"
                value="This has an error"
                className="input input-error w-full"
                readOnly
              />
              <p className="form-error">This is what error text looks like</p>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                className="btn btn-primary flex-1"
              >
                Submit Form
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary flex-1"
              >
                Reset Form
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2 text-black">Form Data Preview:</h3>
            <pre className="text-sm text-gray-700 overflow-x-auto">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
} 