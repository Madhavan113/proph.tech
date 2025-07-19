import { useMemo } from 'react'
import { 
  evaluatePasswordStrength, 
  getStrengthColor, 
  getStrengthText,
  type PasswordStrength 
} from '@/lib/password-strength'

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

export default function PasswordStrengthIndicator({ 
  password, 
  className = '' 
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => evaluatePasswordStrength(password), [password])

  // Don't show anything if password is empty
  if (!password) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Password Strength</span>
          <span className={`text-sm font-medium ${getStrengthTextColor(strength.level)}`}>
            {getStrengthText(strength.level)}
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(strength.level)}`}
            style={{ width: `${strength.score}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-300 mb-2">Password Requirements:</p>
        {strength.requirements.map((requirement) => (
          <div key={requirement.id} className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
              requirement.met 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-600 border border-gray-500'
            }`}>
              {requirement.met && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${
              requirement.met ? 'text-green-400' : 'text-gray-400'
            }`}>
              {requirement.label}
            </span>
          </div>
        ))}
      </div>

      {/* Strong Password Badge */}
      {strength.isStrong && (
        <div className="flex items-center space-x-2 p-2 bg-green-900/20 border border-green-800 rounded-lg">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm text-green-400 font-medium">
            Great! Your password is strong enough.
          </span>
        </div>
      )}
    </div>
  )
}

function getStrengthTextColor(level: PasswordStrength['level']): string {
  switch (level) {
    case 'very-weak':
      return 'text-red-400'
    case 'weak':
      return 'text-orange-400'
    case 'fair':
      return 'text-yellow-400'
    case 'good':
      return 'text-blue-400'
    case 'strong':
      return 'text-green-400'
    default:
      return 'text-gray-400'
  }
} 