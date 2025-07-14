'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function ConfirmationPending() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="form-container text-center">
          {/* Header */}
          <div className="mb-8">
            <Link href="/">
              <h1 className="text-4xl font-bold mb-2 cursor-pointer text-black hover:text-prophet-green transition-colors">
                Prophet
              </h1>
            </Link>
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Check Your Email
            </h2>
            <p className="text-gray-600">
              We've sent you a confirmation link to complete your account setup.
            </p>
          </div>

          {/* Instructions */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <strong>Next steps:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Check your email inbox</li>
                <li>Click the confirmation link</li>
                <li>You'll be automatically logged in</li>
              </ol>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="mb-8">
            <details className="group">
              <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                Didn't receive the email?
              </summary>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                <ul className="space-y-1">
                  <li>• Check your spam/junk folder</li>
                  <li>• Make sure you entered the correct email address</li>
                  <li>• Try signing up again if needed</li>
                </ul>
              </div>
            </details>
          </div>

          {/* Action buttons */}
          <div className="space-y-4">
            <Link href="/login" className="btn btn-primary w-full py-3 text-base font-medium">
              Go to Login
            </Link>
            <Link href="/signup" className="btn btn-secondary w-full py-3 text-base font-medium">
              Try Again
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-6">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 