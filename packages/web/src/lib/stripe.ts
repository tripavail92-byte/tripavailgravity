import { loadStripe, type Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null

// Initialize Stripe with publishable key from environment
export function getStripe() {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined
    if (!key) {
      // Returning a resolved null keeps the callsites simple.
      stripePromise = Promise.resolve(null)
    } else {
      stripePromise = loadStripe(key)
    }
  }

  return stripePromise
}
