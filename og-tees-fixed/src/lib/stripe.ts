import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
})

export const PRINT_PRICE_PER_SIDE = 8.00
export const PRINT_MARKUP = parseFloat(process.env.PRINT_MARKUP_PERCENTAGE || '40') / 100

export function calculateOrderTotal(
  items: Array<{ unitPrice: number; printPrice: number; quantity: number }>,
  shippingCost: number
) {
  const subtotal = items.reduce(
    (sum, item) => sum + (item.unitPrice + item.printPrice) * item.quantity,
    0
  )
  const tax = subtotal * 0.08
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    shipping: shippingCost,
    tax: Math.round(tax * 100) / 100,
    total: Math.round((subtotal + shippingCost + tax) * 100) / 100,
  }
}

export function calculateShipping(quantity: number): number {
  if (quantity <= 6) return 8.99
  if (quantity <= 12) return 12.99
  if (quantity <= 24) return 16.99
  return 24.99
}

export function calculatePrintPrice(sides: number = 1): number {
  return PRINT_PRICE_PER_SIDE * sides * (1 + PRINT_MARKUP)
}
