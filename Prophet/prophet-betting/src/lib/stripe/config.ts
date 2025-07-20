import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Create Stripe instance lazily to avoid import-time errors
let stripeInstance: Stripe | null = null

export const getServerStripe = (): Stripe => {
  if (!stripeInstance) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    
    if (!stripeSecretKey) {
      console.error('Environment variables:', {
        STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
        NODE_ENV: process.env.NODE_ENV
      })
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }

    stripeInstance = new Stripe(stripeSecretKey, {
      apiVersion: '2025-06-30.basil',
      typescript: true,
    })
  }
  
  return stripeInstance
}

// For backward compatibility, export stripe that calls getServerStripe
export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    const stripeInstance = getServerStripe()
    return stripeInstance[prop as keyof Stripe]
  }
})

// Client-side Stripe instance
export const getStripe = () => {
  const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
  
  if (!stripePublicKey) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLIC_KEY environment variable is not set')
  }
  
  return loadStripe(stripePublicKey)
}

// Credit packages configuration
export const CREDIT_PACKAGES = [
  { id: 'credits_100', credits: 100, price: 10, popular: false },
  { id: 'credits_500', credits: 500, price: 40, popular: true },
  { id: 'credits_1000', credits: 1000, price: 75, popular: false },
  { id: 'credits_2500', credits: 2500, price: 175, popular: false },
] as const

export type CreditPackage = typeof CREDIT_PACKAGES[number] 