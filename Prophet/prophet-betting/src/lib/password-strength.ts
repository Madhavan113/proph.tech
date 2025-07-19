export interface PasswordRequirement {
  id: string
  label: string
  met: boolean
}

export interface PasswordStrength {
  score: number // 0-100
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong'
  requirements: PasswordRequirement[]
  isStrong: boolean
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const requirements: PasswordRequirement[] = [
    {
      id: 'length',
      label: 'At least 8 characters',
      met: password.length >= 8
    },
    {
      id: 'uppercase',
      label: 'Contains uppercase letter',
      met: /[A-Z]/.test(password)
    },
    {
      id: 'lowercase',
      label: 'Contains lowercase letter',
      met: /[a-z]/.test(password)
    },
    {
      id: 'number',
      label: 'Contains number',
      met: /\d/.test(password)
    },
    {
      id: 'special',
      label: 'Contains special character (!@#$%^&*)',
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    },
    {
      id: 'no-common',
      label: 'Not a common password',
      met: !isCommonPassword(password)
    }
  ]

  const metCount = requirements.filter(req => req.met).length
  const score = Math.round((metCount / requirements.length) * 100)

  let level: PasswordStrength['level']
  if (score < 20) level = 'very-weak'
  else if (score < 40) level = 'weak'
  else if (score < 60) level = 'fair'
  else if (score < 80) level = 'good'
  else level = 'strong'

  // Password is considered strong if it meets at least 5/6 requirements
  // and includes the basic length requirement
  const isStrong = metCount >= 5 && requirements[0].met

  return {
    score,
    level,
    requirements,
    isStrong
  }
}

function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password',
    '123456',
    '123456789',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
    'master',
    'shadow',
    'football',
    'baseball',
    'superman',
    'princess',
    'sunshine',
    'trustno1',
    'iloveyou'
  ]

  return commonPasswords.includes(password.toLowerCase())
}

export function getStrengthColor(level: PasswordStrength['level']): string {
  switch (level) {
    case 'very-weak':
      return 'bg-red-500'
    case 'weak':
      return 'bg-orange-500'
    case 'fair':
      return 'bg-yellow-500'
    case 'good':
      return 'bg-blue-500'
    case 'strong':
      return 'bg-green-500'
    default:
      return 'bg-gray-500'
  }
}

export function getStrengthText(level: PasswordStrength['level']): string {
  switch (level) {
    case 'very-weak':
      return 'Very Weak'
    case 'weak':
      return 'Weak'
    case 'fair':
      return 'Fair'
    case 'good':
      return 'Good'
    case 'strong':
      return 'Strong'
    default:
      return 'Unknown'
  }
} 